-- Migration: Add Phase 3 Advanced Scoring Metrics
-- Date: 2026-09-12
-- Description: Add columns for advanced audio analysis metrics
--              (BPM, beat strength, rhythm accuracy, tempo consistency, etc.)

-- Add Phase 3 metric columns to performances table
ALTER TABLE performances
ADD COLUMN IF NOT EXISTS score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pitch FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS energy FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vibrato FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS timing FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS beat_strength FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rhythm_accuracy FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_consistency FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bpm INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;

-- Create a performance_feedback table to store detailed feedback
CREATE TABLE IF NOT EXISTS performance_feedback (
  id SERIAL PRIMARY KEY,
  performance_id INTEGER REFERENCES performances(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for performance_feedback queries
CREATE INDEX IF NOT EXISTS idx_performance_feedback_performance_id
ON performance_feedback(performance_id);

-- Add index for phase 3 metrics queries (for leaderboard sorting)
CREATE INDEX IF NOT EXISTS idx_performances_score
ON performances(score DESC);
CREATE INDEX IF NOT EXISTS idx_performances_room_user
ON performances(room_id, user_id);
