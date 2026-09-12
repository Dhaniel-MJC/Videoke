import express, { Request, Response } from 'express';
import pool from '../db/client';
import { authMiddleware } from './auth';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

// Create room
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, maxParticipants } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const result = await pool.query(
      'INSERT INTO rooms (name, created_by, max_participants) VALUES ($1, $2, $3) RETURNING *',
      [name, userId, maxParticipants || 10]
    );

    const room = result.rows[0];

    // Add creator as room member and host
    await pool.query(
      'INSERT INTO room_members (room_id, user_id, is_host) VALUES ($1, $2, true)',
      [room.id, userId]
    );

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get all active rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.username as created_by_username,
              COUNT(rm.user_id) as member_count
       FROM rooms r
       JOIN users u ON r.created_by = u.id
       LEFT JOIN room_members rm ON r.id = rm.room_id
       WHERE r.is_active = true
       GROUP BY r.id, u.username
       ORDER BY r.created_at DESC
       LIMIT 50`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by ID
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const roomResult = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const membersResult = await pool.query(
      `SELECT rm.user_id, u.username, u.avatar_url, rm.is_host, rm.joined_at
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1
       ORDER BY rm.is_host DESC, rm.joined_at ASC`,
      [roomId]
    );

    res.json({
      ...roomResult.rows[0],
      members: membersResult.rows,
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Update room
router.put('/:roomId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { name, isActive } = req.body;
    const userId = req.user?.id;

    // Check if user is host
    const roomResult = await pool.query(
      'SELECT created_by FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (roomResult.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Only room creator can update it' });
    }

    const updateResult = await pool.query(
      'UPDATE rooms SET name = COALESCE($1, name), is_active = COALESCE($2, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, isActive, roomId]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:roomId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;

    // Check if user is host
    const roomResult = await pool.query(
      'SELECT created_by FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (roomResult.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'Only room creator can delete it' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);

    res.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
