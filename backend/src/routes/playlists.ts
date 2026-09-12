/**
 * Playlists Routes - Phase 4 YouTube Integration
 * POST   /api/playlists (criar)
 * GET    /api/playlists/:playlistId (detalhes)
 * PUT    /api/playlists/:playlistId (editar)
 * DELETE /api/playlists/:playlistId (deletar)
 * GET    /api/playlists/:playlistId/songs (músicas)
 * POST   /api/playlists/:playlistId/songs/:songId (adicionar)
 * DELETE /api/playlists/:playlistId/songs/:songId (remover)
 */

import { Router, Request, Response } from 'express';
import pool from '../db/client';

const router = Router();

/**
 * POST /api/playlists
 * Criar nova playlist
 * Body: { userId, name, description, isPublic }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, name, description, isPublic = false } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        error: 'userId and name are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO playlists (user_id, name, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, name, description, is_public, created_at`,
      [userId, name, description || null, isPublic]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({
      error: 'Failed to create playlist',
    });
  }
});

/**
 * GET /api/playlists/:playlistId
 * Detalhes da playlist
 */
router.get('/:playlistId', async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;

    const result = await pool.query(
      `SELECT id, user_id, name, description, is_public, created_at, updated_at
       FROM playlists WHERE id = $1`,
      [playlistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Contar músicas na playlist
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = $1',
      [playlistId]
    );

    const playlist = {
      ...result.rows[0],
      songCount: parseInt(countResult.rows[0].count),
    };

    res.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({
      error: 'Failed to fetch playlist',
    });
  }
});

/**
 * PUT /api/playlists/:playlistId
 * Editar playlist
 */
router.put('/:playlistId', async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;
    const { name, description, isPublic } = req.body;

    let query = 'UPDATE playlists SET updated_at = NOW()';
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      query += `, name = $${paramIndex}`;
      params.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      query += `, description = $${paramIndex}`;
      params.push(description);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      query += `, is_public = $${paramIndex}`;
      params.push(isPublic);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(playlistId);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({
      error: 'Failed to update playlist',
    });
  }
});

/**
 * DELETE /api/playlists/:playlistId
 * Deletar playlist
 */
router.delete('/:playlistId', async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;

    const result = await pool.query(
      'DELETE FROM playlists WHERE id = $1 RETURNING id',
      [playlistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({
      error: 'Failed to delete playlist',
    });
  }
});

/**
 * GET /api/playlists/:playlistId/songs
 * Listar músicas da playlist
 */
router.get('/:playlistId/songs', async (req: Request, res: Response) => {
  try {
    const { playlistId } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.youtube_id, s.title, s.artist, s.duration,
              s.thumbnail_url, ps.position, ps.added_at
       FROM playlist_songs ps
       JOIN songs s ON ps.song_id = s.id
       WHERE ps.playlist_id = $1
       ORDER BY ps.position ASC`,
      [playlistId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
    res.status(500).json({
      error: 'Failed to fetch playlist songs',
    });
  }
});

/**
 * POST /api/playlists/:playlistId/songs/:songId
 * Adicionar música à playlist
 * Body: { position } (opcional)
 */
router.post('/:playlistId/songs/:songId', async (req: Request, res: Response) => {
  try {
    const { playlistId, songId } = req.params;
    const { position } = req.body;

    // Verificar se música existe
    const songResult = await pool.query(
      'SELECT id FROM songs WHERE id = $1',
      [songId]
    );

    if (songResult.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Verificar se playlist existe
    const playlistResult = await pool.query(
      'SELECT id FROM playlists WHERE id = $1',
      [playlistId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Calcular posição se não fornecida
    let finalPosition = position;
    if (finalPosition === undefined) {
      const countResult = await pool.query(
        'SELECT MAX(position) FROM playlist_songs WHERE playlist_id = $1',
        [playlistId]
      );
      finalPosition =
        (countResult.rows[0].max || 0) + 1;
    }

    // Inserir (ON CONFLICT para lidar com duplicatas)
    const result = await pool.query(
      `INSERT INTO playlist_songs (playlist_id, song_id, position)
       VALUES ($1, $2, $3)
       ON CONFLICT (playlist_id, song_id)
       DO UPDATE SET position = $3
       RETURNING *`,
      [playlistId, songId, finalPosition]
    );

    // Atualizar updated_at da playlist
    await pool.query(
      'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
      [playlistId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({
      error: 'Failed to add song to playlist',
    });
  }
});

/**
 * DELETE /api/playlists/:playlistId/songs/:songId
 * Remover música da playlist
 */
router.delete('/:playlistId/songs/:songId', async (req: Request, res: Response) => {
  try {
    const { playlistId, songId } = req.params;

    const result = await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING *',
      [playlistId, songId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found in playlist' });
    }

    // Reordenar posições
    await pool.query(
      `UPDATE playlist_songs
       SET position = position - 1
       WHERE playlist_id = $1 AND position > $2`,
      [playlistId, result.rows[0].position]
    );

    // Atualizar updated_at da playlist
    await pool.query(
      'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
      [playlistId]
    );

    res.json({ message: 'Song removed from playlist' });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({
      error: 'Failed to remove song from playlist',
    });
  }
});

export default router;
