-- Migration 002: Add Songs Table
-- Catálogo dinâmico de músicas do YouTube

CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  youtube_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  duration INT,                         -- duração em segundos
  thumbnail_url TEXT,
  source VARCHAR(50) DEFAULT 'youtube', -- 'youtube' ou 'local'
  added_at TIMESTAMP DEFAULT NOW(),
  view_count INT DEFAULT 0,
  use_count INT DEFAULT 0               -- quantas vezes foi usada em performances
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_songs_youtube_id ON songs(youtube_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_use_count ON songs(use_count DESC);
