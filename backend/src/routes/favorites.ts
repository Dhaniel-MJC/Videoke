/**
 * Favorites Routes - Phase 4 YouTube Integration
 * GET    /api/users/:userId/favorites
 * POST   /api/users/:userId/favorites/:songId
 * DELETE /api/users/:userId/favorites/:songId
 */

import { Router, Request, Response } from 'express';
import pool from '../db/client';

const router = Router();

/**
 * GET /api/users/:userId/favorites
 * Listar todas as músicas favoritas do usuário
 */
router.get('/:userId/favorites', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    // Verificar se usuário existe
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Buscar favoritos
    const result = await pool.query(
      `SELECT s.id, s.youtube_id, s.title, s.artist, s.duration,
              s.thumbnail_url, s.view_count, s.use_count, uf.added_at
       FROM user_favorites uf
       JOIN songs s ON uf.song_id = s.id
       WHERE uf.user_id = $1
       ORDER BY uf.added_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limitNum, offsetNum]
    );

    // Contar total
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM user_favorites WHERE user_id = $1',
      [userId]
    );

    res.json({
      songs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      error: 'Failed to fetch favorites',
    });
  }
});

/**
 * POST /api/users/:userId/favorites/:songId
 * Marcar música como favorita
 */
router.post('/:userId/favorites/:songId', async (req: Request, res: Response) => {
  try {
    const { userId, songId } = req.params;

    // Verificar se usuário existe
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verificar se música existe
    const songResult = await pool.query(
      'SELECT id FROM songs WHERE id = $1',
      [songId]
    );

    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Inserir (ou ignorar se já existe)
    const result = await pool.query(
      `INSERT INTO user_favorites (user_id, song_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, song_id) DO NOTHING
       RETURNING *`,
      [userId, songId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: 'Song already in favorites',
      });
    }

    res.status(201).json({
      message: 'Song added to favorites',
      favorite: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      error: 'Failed to add to favorites',
    });
  }
});

/**
 * DELETE /api/users/:userId/favorites/:songId
 * Remover música dos favoritos
 */
router.delete('/:userId/favorites/:songId', async (req: Request, res: Response) => {
  try {
    const { userId, songId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND song_id = $2 RETURNING *',
      [userId, songId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Favorite not found',
      });
    }

    res.json({ message: 'Song removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      error: 'Failed to remove from favorites',
    });
  }
});

/**
 * GET /api/users/:userId/favorites/check/:songId
 * Verificar se uma música está nos favoritos do usuário
 */
router.get('/:userId/favorites/check/:songId', async (req: Request, res: Response) => {
  try {
    const { userId, songId } = req.params;

    const result = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND song_id = $2',
      [userId, songId]
    );

    res.json({
      isFavorite: result.rows.length > 0,
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      error: 'Failed to check favorite',
    });
  }
});

export default router;
