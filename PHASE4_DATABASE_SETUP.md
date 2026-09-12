# 🎬 Phase 4 - Database Setup
**Status:** ✅ Migrations Criadas  
**Data:** 2026-09-12

---

## 📋 Visão Geral

Phase 4 introduce **YouTube Integration** com 4 novas tabelas:
- `songs` - Catálogo dinâmico (YouTube)
- `playlists` - Playlists do usuário
- `playlist_songs` - Junção playlist ↔ songs
- `user_favorites` - Favoritos do usuário

Além disso, `performances` é atualizada para referenciar `songs.id`.

---

## 🗂️ Estrutura de Tabelas

### 1. Songs (Novo)
```sql
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  youtube_id VARCHAR(255) UNIQUE NOT NULL,  -- ID do vídeo YouTube
  title VARCHAR(255) NOT NULL,              -- Título da música
  artist VARCHAR(255),                      -- Artista
  duration INT,                             -- Duração em segundos
  thumbnail_url TEXT,                       -- Imagem de preview
  source VARCHAR(50) DEFAULT 'youtube',     -- Fonte: 'youtube' ou 'local'
  added_at TIMESTAMP DEFAULT NOW(),         -- Quando foi adicionada
  view_count INT DEFAULT 0,                 -- Views no YouTube
  use_count INT DEFAULT 0                   -- Quantas vezes usada em performances
);
```

**Índices:**
- `idx_songs_youtube_id` - Busca por ID YouTube
- `idx_songs_title` - Busca por título
- `idx_songs_artist` - Busca por artista
- `idx_songs_use_count` - Ordenação por popularidade

---

### 2. Playlists (Novo)
```sql
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,               -- Nome da playlist
  description TEXT,                         -- Descrição
  is_public BOOLEAN DEFAULT FALSE,          -- Público ou privado
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Índices:**
- `idx_playlists_user_id` - Playlists de um usuário
- `idx_playlists_is_public` - Filtro público/privado

---

### 3. Playlist Songs (Novo - Junção)
```sql
CREATE TABLE playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  position INT,                             -- Ordem na playlist
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)              -- Impede duplicatas
);
```

**Índices:**
- `idx_playlist_songs_playlist_id` - Músicas de uma playlist
- `idx_playlist_songs_song_id` - Playlists que contêm essa música
- `idx_playlist_songs_position` - Ordenação por posição

---

### 4. User Favorites (Novo)
```sql
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, song_id)                  -- Cada música apenas 1x por usuário
);
```

**Índices:**
- `idx_user_favorites_user_id` - Favoritos de um usuário
- `idx_user_favorites_song_id` - Usuários que favoritaram essa música

---

### 5. Performances (Modificado)
```sql
-- Alteração: song_id agora referencia songs.id (antes era VARCHAR)
ALTER TABLE performances
ADD COLUMN song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL;
```

**Novo índice:**
- `idx_performances_song_id` - Performances de uma música
- `idx_performances_song_user` - Performances de um usuário por música

---

## 📦 Arquivos de Migração

### 002_add_songs_table.sql
Cria a tabela `songs` com 9 campos e 4 índices.

### 003_add_playlists_table.sql
Cria:
- `playlists` (tabela principal)
- `playlist_songs` (junção)
- Índices associados

### 004_add_user_favorites_table.sql
Cria:
- `user_favorites`
- Índices associados

### 005_add_songs_to_performances.sql
Modifica `performances` para adicionar coluna `song_id` com foreign key.

---

## 🚀 Como Aplicar as Migrações

### Opção 1: Docker (Novo Banco)
```bash
docker-compose down
docker volume rm videoke_postgres_data  # Remove banco antigo
docker-compose up --build
```

Schema + todas as migrations são aplicadas automaticamente. ✅

### Opção 2: Manual (Banco Existente)
```bash
cd backend
npm run migrate
```

Script `migrate.ts` executa arquivos SQL em ordem: 001, 002, 003, 004, 005.

---

## ✅ Verificar Migração

```bash
cd backend
npm run check
```

Esperado:
```
✅ Database Connection
✅ Phase 3 Columns (performances)
✅ Performance Feedback Table
✅ Phase 4: Songs Table
✅ Phase 4: Playlists Tables
✅ Phase 4: User Favorites Table
✅ Database Indexes
✅ ENV: DATABASE_URL

🟢 SISTEMA PRONTO - Phase 3 + Phase 4 totalmente configurado!
```

---

## 🔍 Consultas Úteis

### Ver todas as músicas
```sql
SELECT id, title, artist, duration, use_count, added_at 
FROM songs 
ORDER BY use_count DESC;
```

### Playlists de um usuário
```sql
SELECT p.id, p.name, p.is_public, COUNT(ps.id) as song_count
FROM playlists p
LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
WHERE p.user_id = 123
GROUP BY p.id;
```

### Músicas de uma playlist
```sql
SELECT s.id, s.title, s.artist, s.duration, ps.position
FROM playlist_songs ps
JOIN songs s ON ps.song_id = s.id
WHERE ps.playlist_id = 456
ORDER BY ps.position;
```

### Favoritos de um usuário
```sql
SELECT s.id, s.title, s.artist, s.youtube_id
FROM user_favorites uf
JOIN songs s ON uf.song_id = s.id
WHERE uf.user_id = 123;
```

### Performances com referência à música
```sql
SELECT p.id, s.youtube_id, s.title, p.score, p.user_id, p.created_at
FROM performances p
LEFT JOIN songs s ON p.song_id = s.id
WHERE p.song_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## 🔗 Relacionamentos

```
users (1) ──── (M) playlists
             ──── (M) user_favorites

songs (1) ──── (M) playlist_songs
          ──── (M) user_favorites
          ──── (M) performances

playlists (1) ──── (M) playlist_songs
```

---

## 💡 Estratégia de Cache

YouTube API tem limite de **10.000 quota/dia**. Para cada busca = 100 quota.

**Solução: Redis Cache**
- Resultados de busca armazenados por **7 dias**
- Buscas subsequentes retornam do cache
- Reduz quota usage em ~90%

Implementado em: `backend/src/api/youtubeApi.ts` (próximo passo)

---

## 🎯 Próximo Passo

Após aplicar migrations:

**Step 2: YouTube API Backend**
- Criar `backend/src/api/youtubeApi.ts`
- Implementar busca com cache Redis
- Criar rota `GET /api/songs/search?q=...`

---

**Migrations prontas! 🚀**

Pode executar: `npm run migrate` depois de fazer pull.
