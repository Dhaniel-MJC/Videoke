-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  max_participants INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_host BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, user_id)
);

-- Performances table
CREATE TABLE IF NOT EXISTS performances (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL,
  song_title VARCHAR(255) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_ms INT,
  pitch_accuracy_percent FLOAT,
  timing_accuracy_percent FLOAT,
  timbre_score FLOAT,
  overall_score FLOAT DEFAULT 0,
  total_votes INT DEFAULT 0,
  final_score FLOAT DEFAULT 0,
  -- Phase 3: Advanced Scoring Metrics
  score FLOAT DEFAULT 0,
  pitch FLOAT DEFAULT 0,
  energy FLOAT DEFAULT 0,
  vibrato FLOAT DEFAULT 0,
  timing FLOAT DEFAULT 0,
  beat_strength FLOAT DEFAULT 0,
  rhythm_accuracy FLOAT DEFAULT 0,
  tempo_consistency FLOAT DEFAULT 0,
  bpm INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance ratings table
CREATE TABLE IF NOT EXISTS performance_ratings (
  id SERIAL PRIMARY KEY,
  performance_id INTEGER REFERENCES performances(id) ON DELETE CASCADE,
  rated_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating FLOAT CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(performance_id, rated_by_user_id)
);

-- Performance feedback table (Phase 3: stores detailed feedback from advanced scoring)
CREATE TABLE IF NOT EXISTS performance_feedback (
  id SERIAL PRIMARY KEY,
  performance_id INTEGER REFERENCES performances(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs table (Phase 4: YouTube catalog)
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

-- Playlists table (Phase 4: user playlists)
CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Playlist songs junction table (Phase 4: many-to-many relationship)
CREATE TABLE IF NOT EXISTS playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INT,                          -- ordem na playlist
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

-- User favorites table (Phase 4: saved favorite songs)
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_performances_room_id ON performances(room_id);
CREATE INDEX idx_performances_user_id ON performances(user_id);
CREATE INDEX idx_performances_created_at ON performances(created_at);
CREATE INDEX idx_performances_score ON performances(score DESC);
CREATE INDEX idx_performances_room_user ON performances(room_id, user_id);
CREATE INDEX idx_performances_song_id ON performances(song_id);
CREATE INDEX idx_performances_song_user ON performances(song_id, user_id);
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_performance_ratings_performance_id ON performance_ratings(performance_id);
CREATE INDEX idx_performance_ratings_rated_by ON performance_ratings(rated_by_user_id);
CREATE INDEX idx_performance_feedback_performance_id ON performance_feedback(performance_id);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
-- Phase 4 indexes
CREATE INDEX idx_songs_youtube_id ON songs(youtube_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_use_count ON songs(use_count DESC);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_is_public ON playlists(is_public);
CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_song_id ON playlist_songs(song_id);
CREATE INDEX idx_playlist_songs_position ON playlist_songs(playlist_id, position);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_song_id ON user_favorites(song_id);
