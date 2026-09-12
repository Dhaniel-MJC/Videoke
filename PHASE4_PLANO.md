# 🎬 Phase 4 - YouTube Integration & Song Catalog

**Status:** 🟢 Iniciando  
**Escopo:** YouTube API + Song Database + Playlists  
**Duração Estimada:** Phase 4 + Phase 5

---

## 🎯 Objetivo Phase 4

Integrar YouTube como fonte de músicas e criar um catálogo dinâmico que funcione com Phase 3.

**Resultado Final:** Usuário pode buscar qualquer música no YouTube, reproduzir, e fazer Karaokê com análise Phase 3.

---

## 📋 Arquitetura Phase 4

### 1. YouTube Integration Layer
```
Frontend (SearchSongs.tsx)
    ↓
useYouTubeSearch Hook
    ↓
Backend /api/songs/search
    ↓
YouTube Data API v3
    ↓
Cache em Redis (para performance)
```

### 2. Song Database Schema

```sql
-- Tabela: songs (catálogo de músicas)
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  youtube_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  duration INT,                    -- segundos
  thumbnail_url TEXT,
  source 'youtube' | 'local',
  added_at TIMESTAMP DEFAULT NOW(),
  view_count INT DEFAULT 0,
  use_count INT DEFAULT 0          -- quantas vezes foi usada
);

-- Tabela: playlists
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: playlist_songs (many-to-many)
CREATE TABLE playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  position INT,                    -- ordem na playlist
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

-- Tabela: favorites (músicas favoritas do usuário)
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);
```

### 3. Frontend Components

```
SearchSongs.tsx
├── Input busca
├── Grid de resultados
├── Favorito ♡
└── Adicionar a playlist

PlaylistManager.tsx
├── Minhas playlists
├── Criar nova
├── Ver canciones
└── Compartilhar

SongDetail.tsx
├── Info: título, artista, duração
├── Thumbnail YouTube
├── Playcount (vezes usada)
└── Adicionar ao favorito
```

### 4. Backend Routes

```
GET  /api/songs/search?q=bohemian&limit=10
     → Busca YouTube

GET  /api/songs/:songId
     → Detalhes da música

POST /api/playlists
     → Criar playlist

GET  /api/playlists/:playlistId/songs
     → Músicas da playlist

POST /api/playlists/:playlistId/songs/:songId
     → Adicionar música à playlist

GET  /api/users/:userId/favorites
     → Músicas favoritas

POST /api/users/:userId/favorites/:songId
     → Marcar como favorito
```

---

## 🔑 API Keys & Config

**YouTube Data API v3:**
```env
YOUTUBE_API_KEY=AIzaSy...
YOUTUBE_API_QUOTA=10000  # Diária (1 busca = 100 quota)
```

**Estratégia de Cache:**
- Busca YouTube → Redis cache por 7 dias
- Resultados populares reutilizados
- Reduz quota usage e melhora performance

---

## 📊 Fluxo de Dados

### Buscar Música

```
Usuário digita "Bohemian Rhapsody"
    ↓
Frontend: useYouTubeSearch('Bohemian Rhapsody')
    ↓
Requisição: GET /api/songs/search?q=bohemian
    ↓
Backend verifica Redis cache
    ↓
Se em cache: retorna cache
Se não: chama YouTube API
    ↓
Salva resultado em Redis (7 dias)
    ↓
Retorna [{ youtubeId, title, artist, duration, thumbnail }]
    ↓
Frontend exibe grid de 10 resultados
```

### Reproduzir & Cantar

```
Usuário clica "Cantar" em uma música YouTube
    ↓
Sistema verifica/salva música em DB (se nova)
    ↓
RoomPage carrega MusicPlayer com youtubeUrl
    ↓
useYouTubePlayer reproduz vídeo
    ↓
Phase 3 analisa audio (igual ao antes)
    ↓
Performance salva com reference a songs.id
```

---

## 🛠️ Implementação Step-by-Step

### Step 1: Database Schema (Hoje)
- [ ] Criar migrations para tabelas songs, playlists, playlist_songs, user_favorites
- [ ] Adicionar índices

### Step 2: YouTube API Integration (Hoje)
- [ ] Configurar Google Cloud Project
- [ ] Obter API key
- [ ] Criar backend wrapper para YouTube API

### Step 3: Backend Routes (Hoje/Amanhã)
- [ ] GET /api/songs/search
- [ ] POST /api/playlists
- [ ] POST /api/users/favorites

### Step 4: Frontend Search (Amanhã)
- [ ] useYouTubeSearch hook
- [ ] SearchSongs component
- [ ] Grid de resultados com play button

### Step 5: Playlist UI (Amanhã)
- [ ] PlaylistManager component
- [ ] Create/edit/delete playlists
- [ ] Add/remove songs

### Step 6: Integration with Phase 3 (Amanhã)
- [ ] Modificar RoomPage para aceitar YouTube songs
- [ ] useYouTubePlayer para reprodução
- [ ] Salvar performance com reference a YouTube song

---

## 🎬 Sobre Reprodução YouTube

**Opção 1: YouTube IFrame API** ✅ (Recomendado)
```javascript
// Simples, funciona em todos browsers
<iframe 
  src="https://www.youtube.com/embed/{youtubeId}?autoplay=1"
  allow="autoplay"
/>
```

**Opção 2: youtube-dl (Backend)**
```bash
# Download de stream de áudio
youtube-dl -f 'bestaudio' {youtubeUrl}
# Depois reproduz com Web Audio API
```

**Vamos usar Opção 1** - simples, sem server-side processing, funciona no browser.

---

## ⚠️ Limitações YouTube

| Limite | Valor | Solução |
|--------|-------|--------|
| Quota diária | 10.000 | Cache em Redis |
| Busca resultado | 10-20 | Paginação |
| Rate limit | 1 req/s | Throttle no frontend |
| Reprodução | Apenas YT | IFrame embed |

---

## 💾 Migration Files Necessários

```sql
-- 002_add_songs_table.sql
CREATE TABLE songs (...);
CREATE INDEX idx_songs_youtube_id ...;
CREATE INDEX idx_songs_title ...;

-- 003_add_playlists_table.sql
CREATE TABLE playlists (...);
CREATE TABLE playlist_songs (...);
CREATE INDEX idx_playlist_songs_playlist_id ...;

-- 004_add_user_favorites_table.sql
CREATE TABLE user_favorites (...);
CREATE INDEX idx_user_favorites_user_id ...;

-- 005_add_songs_to_performances.sql
ALTER TABLE performances ADD COLUMN song_id INTEGER REFERENCES songs(id);
CREATE INDEX idx_performances_song_id ...;
```

---

## 🎯 Métricas Phase 4

Sucesso quando:
- ✅ Buscar "bohemian rhapsody" retorna resultado correto
- ✅ Reproduzir YouTube video no browser sem erros
- ✅ Criar playlist e adicionar 5 músicas
- ✅ Performance salva referencia corretamente a YouTube song
- ✅ Leaderboard funciona com YouTube songs

---

## 📝 Checklist de Implementação

### Backend
- [ ] Tabelas DB criadas
- [ ] YouTube API configurada
- [ ] GET /api/songs/search implementado
- [ ] POST /api/playlists implementado
- [ ] POST /api/users/favorites implementado
- [ ] Redis cache funcionando

### Frontend
- [ ] useYouTubeSearch hook
- [ ] SearchSongs component
- [ ] PlaylistManager component
- [ ] useYouTubePlayer hook
- [ ] MusicPlayer aceita YouTube IFrames

### Integration
- [ ] Phase 3 funciona com YouTube songs
- [ ] Performance salva referência a songs.id
- [ ] Leaderboard atualiza corretamente

### Testing
- [ ] Buscar música funciona
- [ ] Reproduzir video funciona
- [ ] Áudio capturado durante reprodução
- [ ] Score calculado corretamente

---

## 🚀 Próximo: Phase 5

Após Phase 4 estar estável:

**Phase 5 - Social & Advanced Features:**
- Compartilhar playlists
- Desafios (duelos)
- Colaboração em tempo real
- Comentários em performances
- Badges sociais (melhor dueto, etc)

---

**Começamos agora?** 🎬

Próximo passo: Criar migrations e começar com YouTube API integration.
