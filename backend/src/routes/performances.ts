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

// Get performances by room
router.get('/room/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar_url
       FROM performances p
       JOIN users u ON p.user_id = u.id
       WHERE p.room_id = $1
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [roomId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get performances error:', error);
    res.status(500).json({ error: 'Failed to fetch performances' });
  }
});

// Get performance by ID with ratings
router.get('/:performanceId', async (req: Request, res: Response) => {
  try {
    const { performanceId } = req.params;

    const perfResult = await pool.query(
      `SELECT
        p.id,
        p.song_id,
        s.title as song_title,
        s.artist as song_artist,
        p.overall_score,
        p.pitch as pitch_accuracy,
        p.energy as energy_consistency,
        p.vibrato,
        p.timing,
        p.beat_strength,
        p.rhythm_accuracy,
        p.tempo_consistency,
        p.started_at as performance_start,
        p.duration_seconds,
        u.username,
        u.avatar_url
       FROM performances p
       LEFT JOIN songs s ON p.song_id = s.id
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [performanceId]
    );

    if (perfResult.rows.length === 0) {
      return res.status(404).json({ error: 'Performance not found' });
    }

    const ratingsResult = await pool.query(
      `SELECT pr.*, u.username, u.avatar_url
       FROM performance_ratings pr
       JOIN users u ON pr.rated_by_user_id = u.id
       WHERE pr.performance_id = $1
       ORDER BY pr.created_at DESC`,
      [performanceId]
    );

    res.json({
      ...perfResult.rows[0],
      ratings: ratingsResult.rows,
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

// Get user performances
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar_url, r.name as room_name
       FROM performances p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN rooms r ON p.room_id = r.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user performances error:', error);
    res.status(500).json({ error: 'Failed to fetch performances' });
  }
});

// Get leaderboard for room (Phase 3: uses new score column)
router.get('/room/:roomId/leaderboard', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url,
              COUNT(p.id) as performance_count,
              ROUND(AVG(p.score)::numeric, 2) as avg_score,
              MAX(p.score) as best_score
       FROM users u
       LEFT JOIN performances p ON u.id = p.user_id AND p.room_id = $1
       LEFT JOIN room_members rm ON u.id = rm.user_id AND rm.room_id = $1
       WHERE rm.user_id IS NOT NULL
       GROUP BY u.id, u.username, u.avatar_url
       ORDER BY avg_score DESC, performance_count DESC`,
      [roomId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get global leaderboard (Phase 3: uses new score column)
router.get('/global/top', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url,
              COUNT(p.id) as performance_count,
              ROUND(AVG(p.score)::numeric, 2) as avg_score,
              MAX(p.score) as best_score
       FROM users u
       LEFT JOIN performances p ON u.id = p.user_id
       WHERE p.id IS NOT NULL
       GROUP BY u.id, u.username, u.avatar_url
       ORDER BY avg_score DESC, performance_count DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
