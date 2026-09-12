import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import pool from '../db/client';
import { PerformanceHandler } from './performanceHandler';
import { registerPerformanceEvents } from '../events/performanceEvents';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

export function setupWebSocketHandlers(io: Server) {
  // Initialize Performance Handler for Phase 3
  const performanceHandler = new PerformanceHandler(pool);

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoom: string;
    let currentUserId: number;

    // Join room event
    socket.on('join_room', async (data) => {
      try {
        const { roomId, userId } = data;
        currentRoom = `room:${roomId}`;
        currentUserId = userId;

        socket.join(currentRoom);

        // Get room info
        const roomResult = await pool.query(
          'SELECT * FROM rooms WHERE id = $1',
          [roomId]
        );

        if (roomResult.rows.length === 0) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Add user to room members
        await pool.query(
          'INSERT INTO room_members (room_id, user_id, joined_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING',
          [roomId, userId]
        );

        // Get all users in room
        const membersResult = await pool.query(
          `SELECT rm.user_id, u.username, u.avatar_url
           FROM room_members rm
           JOIN users u ON rm.user_id = u.id
           WHERE rm.room_id = $1`,
          [roomId]
        );

        // Notify all users in room
        io.to(currentRoom).emit('user_joined', {
          userId,
          timestamp: Date.now(),
          roomMembers: membersResult.rows,
        });

        // Send room state to new user
        socket.emit('room_joined', {
          roomId,
          roomInfo: roomResult.rows[0],
          members: membersResult.rows,
        });

        console.log(`User ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ═════════════════════════════════════════════════════════════════
    // PHASE 3: Advanced Scoring - Performance Events
    // ═════════════════════════════════════════════════════════════════
    registerPerformanceEvents(socket, performanceHandler);

    // Rate performance event
    socket.on('rate_performance', async (data) => {
      try {
        const { performanceId, rating, comment, roomId } = data;

        if (rating < 1 || rating > 10) {
          socket.emit('error', { message: 'Rating must be between 1 and 10' });
          return;
        }

        // Insert rating
        await pool.query(
          `INSERT INTO performance_ratings (performance_id, rated_by_user_id, rating, comment)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (performance_id, rated_by_user_id)
           DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
          [performanceId, currentUserId, rating, comment]
        );

        // Update total votes count
        const votesResult = await pool.query(
          'SELECT COUNT(*) as count FROM performance_ratings WHERE performance_id = $1',
          [performanceId]
        );

        const avgRatingResult = await pool.query(
          'SELECT AVG(rating) as avg_rating FROM performance_ratings WHERE performance_id = $1',
          [performanceId]
        );

        const avgRating = avgRatingResult.rows[0].avg_rating || 0;

        // Update performance with final score
        await pool.query(
          `UPDATE performances
           SET total_votes = $1,
               final_score = (overall_score * 0.6 + $2 * 0.4)
           WHERE id = $3`,
          [votesResult.rows[0].count, avgRating, performanceId]
        );

        // Broadcast update to room
        io.to(currentRoom).emit('rating_added', {
          performanceId,
          userId: currentUserId,
          rating,
          avgRating: Math.round(avgRating * 100) / 100,
          totalRatings: votesResult.rows[0].count,
          timestamp: Date.now(),
        });

        console.log(`Performance ${performanceId} rated ${rating} by user ${currentUserId}`);
      } catch (error) {
        console.error('Error rating performance:', error);
        socket.emit('error', { message: 'Failed to rate performance' });
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      try {
        if (currentRoom) {
          io.to(currentRoom).emit('user_left', {
            userId: currentUserId,
            timestamp: Date.now(),
          });

          // Remove user from room members
          await pool.query(
            'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
            [parseInt(currentRoom.split(':')[1]), currentUserId]
          );
        }
        console.log(`User disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    });
  });
}

async function computeAggregatedScore(performanceId: number): Promise<number> {
  try {
    const key = `perf:${performanceId}:metrics`;
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

    const metricsData = await redis.zrange(key, 0, -1);

    if (metricsData.length === 0) return 0;

    let totalConfidence = 0;
    for (const metricJson of metricsData) {
      const metric = JSON.parse(metricJson);
      totalConfidence += metric.confidence || 0;
    }

    return Math.round((totalConfidence / metricsData.length) * 100);
  } catch (error) {
    console.error('Error computing score:', error);
    return 0;
  }
}
