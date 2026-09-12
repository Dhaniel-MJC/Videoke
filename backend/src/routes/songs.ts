/**
 * Songs Routes - Phase 4 YouTube Integration
 * GET  /api/songs/search?q=bohemian&limit=10
 * GET  /api/songs/:songId
 * POST /api/songs (adicionar música ao catálogo)
 */

import { Router, Request, Response } from 'express';
import pool from '../db/client';
import youtubeService from '../services/youtubeService';

const router = Router();

/**
 * GET /api/songs/search
 * Busca músicas no YouTube
 * Query params: q (obrigatório), limit (default 10)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50);

    // Buscar no YouTube (com cache)
    const results = await youtubeService.searchSongs(q, limitNum);

    // Verificar quais já estão no banco
    if (results.length > 0) {
      const youtubeIds = results.map((r) => r.youtubeId);
      const existingResult = await pool.query(
        'SELECT youtube_id FROM songs WHERE youtube_id = ANY($1)',
        [youtubeIds]
      );
      const existingIds = new Set(
        existingResult.rows.map((r) => r.youtube_id)
      );

      // Marcar quais já existem
      const enrichedResults = results.map((r) => ({
        ...r,
        alreadySaved: existingIds.has(r.youtubeId),
      }));

      return res.json(enrichedResults);
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({
      error: 'Failed to search songs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/songs/:songId
 * Detalhes de uma música
 */
router.get('/:songId', async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;

    const result = await pool.query(
      `SELECT id, youtube_id, title, artist, duration, thumbnail_url,
              source, view_count, use_count, added_at
       FROM songs WHERE id = $1`,
      [songId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({
      error: 'Failed to fetch song',
    });
  }
});

/**
 * POST /api/songs
 * Adicionar música ao catálogo (a partir de YouTube search result)
 * Body: { youtubeId, title, artist, duration, thumbnailUrl }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { youtubeId, title, artist, duration, thumbnailUrl } = req.body;

    if (!youtubeId || !title) {
      return res.status(400).json({
        error: 'youtubeId and title are required',
      });
    }

    // Verificar se já existe
    const existingResult = await pool.query(
      'SELECT id FROM songs WHERE youtube_id = $1',
      [youtubeId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        error: 'Song already exists',
        songId: existingResult.rows[0].id,
      });
    }

    // Inserir nova música
    const result = await pool.query(
      `INSERT INTO songs (youtube_id, title, artist, duration, thumbnail_url, source)
       VALUES ($1, $2, $3, $4, $5, 'youtube')
       RETURNING id, youtube_id, title, artist, duration, thumbnail_url, added_at`,
      [youtubeId, title, artist, duration || 0, thumbnailUrl || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({
      error: 'Failed to create song',
    });
  }
});

/**
 * GET /api/songs
 * Listar músicas do catálogo (com paginação)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0', orderBy = 'use_count' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    let orderClause = 'use_count DESC';
    if (orderBy === 'added') {
      orderClause = 'added_at DESC';
    } else if (orderBy === 'title') {
      orderClause = 'title ASC';
    } else if (orderBy === 'duration') {
      orderClause = 'duration ASC';
    }

    const result = await pool.query(
      `SELECT id, youtube_id, title, artist, duration, thumbnail_url,
              source, view_count, use_count, added_at
       FROM songs
       ORDER BY ${orderClause}
       LIMIT $1 OFFSET $2`,
      [limitNum, offsetNum]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM songs');

    res.json({
      songs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({
      error: 'Failed to fetch songs',
    });
  }
});

/**
 * PUT /api/songs/:songId
 * Atualizar contadores (use_count, view_count)
 */
router.put('/:songId', async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const { incrementUseCount = false, viewCount } = req.body;

    let query =
      'UPDATE songs SET updated_at = NOW()';
    const params: any[] = [];
    let paramIndex = 1;

    if (incrementUseCount) {
      query += `, use_count = use_count + 1`;
    }

    if (viewCount !== undefined) {
      query += `, view_count = $${paramIndex}`;
      params.push(viewCount);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(songId);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({
      error: 'Failed to update song',
    });
  }
});

export default router;
