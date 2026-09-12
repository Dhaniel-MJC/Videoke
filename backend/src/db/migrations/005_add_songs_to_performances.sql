-- Migration 005: Link Songs to Performances
-- Integração Phase 3 (performances) com Phase 4 (songs)

ALTER TABLE performances
ADD COLUMN IF NOT EXISTS song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL;

-- Índices para consultas de histórico por música
CREATE INDEX IF NOT EXISTS idx_performances_song_id ON performances(song_id);

-- Índice composto: rápidas consultas de performances por música e usuário
CREATE INDEX IF NOT EXISTS idx_performances_song_user ON performances(song_id, user_id);
