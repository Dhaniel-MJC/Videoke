import { Router, Request, Response } from 'express';
import pool from '../db/client';

const router = Router();

/**
 * GET /api/users/:userId/performances
 * Buscar todas as performances de um usuário
 */
router.get('/:userId/performances', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    // Query performances com informações da música
    const query = `
      SELECT
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
        p.duration_seconds
      FROM performances p
      LEFT JOIN songs s ON p.song_id = s.id
      WHERE p.user_id = $1
      ORDER BY p.started_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar performances:', error);
    res.status(500).json({ error: 'Erro ao buscar performances' });
  }
});

/**
 * GET /api/users/:userId/performances/summary
 * Buscar resumo de performances (stats)
 */
router.get('/:userId/performances/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT
        COUNT(*) as total_performances,
        ROUND(AVG(overall_score)) as average_score,
        MAX(overall_score) as best_score,
        ROUND(SUM(COALESCE(duration_seconds, 0))) as total_time_singing
      FROM performances
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    const summary = result.rows[0] || {
      total_performances: 0,
      average_score: 0,
      best_score: 0,
      total_time_singing: 0,
    };

    res.json(summary);
  } catch (error) {
    console.error('Erro ao buscar summary:', error);
    res.status(500).json({ error: 'Erro ao buscar summary' });
  }
});

/**
 * GET /api/users/:userId/top-songs
 * Buscar top 5 músicas mais cantadas
 */
router.get('/:userId/top-songs', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT
        s.id as song_id,
        s.title,
        s.artist,
        COUNT(*) as times_sung,
        ROUND(AVG(p.overall_score)) as average_score,
        MAX(p.overall_score) as best_score
      FROM performances p
      LEFT JOIN songs s ON p.song_id = s.id
      WHERE p.user_id = $1
      GROUP BY s.id, s.title, s.artist
      ORDER BY times_sung DESC
      LIMIT 5
    `;

    const result = await pool.query(query, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar top songs:', error);
    res.status(500).json({ error: 'Erro ao buscar top songs' });
  }
});

/**
 * GET /api/users/:userId/leaderboard
 * Buscar leaderboard da sala (todos os usuários, scores recentes)
 */
router.get('/:userId/leaderboard', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.query;

    let query = `
      SELECT
        u.id,
        u.username,
        COUNT(p.id) as total_performances,
        ROUND(AVG(p.overall_score)) as average_score,
        MAX(p.overall_score) as best_score
      FROM users u
      LEFT JOIN performances p ON u.id = p.user_id
    `;

    const params: any[] = [];

    if (roomId) {
      query += ` WHERE p.room_id = $1 OR p.room_id IS NULL`;
      params.push(roomId);
    }

    query += `
      GROUP BY u.id, u.username
      ORDER BY average_score DESC NULLS LAST, total_performances DESC
      LIMIT 10
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ error: 'Erro ao buscar leaderboard' });
  }
});

export default router;
