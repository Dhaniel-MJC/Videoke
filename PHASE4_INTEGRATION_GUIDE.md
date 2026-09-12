# 🔌 Phase 4 - Integration Guide
**Status:** Backend Pronto para Testar  
**Data:** 2026-09-12

---

## ✅ O Que Já Foi Feito

### Backend Setup Completo ✅
- ✅ YouTubeService com cache Redis
- ✅ 16 Endpoints implementados (songs, playlists, favorites)
- ✅ 4 Migration files criados
- ✅ Schema SQL atualizado
- ✅ Routes integradas no Express (`index.ts`)
- ✅ systemCheck atualizado para Phase 4

---

## 🔧 Próximo Passo: Setup Local

### 1. Configurar Variáveis de Ambiente

Adicionar ao arquivo `.env`:

```env
# YouTube API (obrigatório para Phase 4)
YOUTUBE_API_KEY=AIzaSy_YOUR_KEY_HERE

# Redis (já deve estar configurado)
REDIS_URL=redis://redis:6379

# Database (já deve estar configurado)
DATABASE_URL=postgresql://postgres:videoke_dev@localhost:5432/videoke
```

**Como obter YouTube API Key:**

1. Abrir https://console.cloud.google.com
2. Create Project (ex: "Videoke")
3. Search: "YouTube Data API v3"
4. Click "Enable"
5. Credentials → Create API Key
6. Copy a chave para `.env`

---

### 2. Aplicar Migrations

```bash
cd backend
npm run migrate
```

Resultado esperado:
```
✅ Migration 001_add_phase3_metrics.sql applied
✅ Migration 002_add_songs_table.sql applied
✅ Migration 003_add_playlists_table.sql applied
✅ Migration 004_add_user_favorites_table.sql applied
✅ Migration 005_add_songs_to_performances.sql applied
```

---

### 3. Verificar Sistema

```bash
npm run check
```

Esperado:
```
✅ Database Connection
✅ Phase 3 Columns (performances)
✅ Performance Feedback Table
✅ Phase 4 Tables (songs, playlists, etc)
✅ Database Indexes
✅ ENV: DATABASE_URL
✅ ENV: YOUTUBE_API_KEY
✅ FILE: backend/src/services/youtubeService.ts
✅ FILE: backend/src/routes/songs.ts
... etc

🟢 SISTEMA PRONTO - Phase 3 + Phase 4 totalmente configurado!
```

---

### 4. Iniciar Backend

```bash
npm run dev
```

Esperado:
```
🎤 Videoke server running on port 3000 (development)
Redis adapter connected
✅ Performance events registrados
```

---

## 🧪 Testar Endpoints (com cURL/Postman)

### GET - Buscar Música

```bash
curl "http://localhost:3000/api/songs/search?q=bohemian&limit=5"
```

**Resposta esperada:**
```json
[
  {
    "youtubeId": "fJ9rUzIMt7o",
    "title": "Bohemian Rhapsody - Queen",
    "artist": "Queen",
    "duration": 354,
    "thumbnailUrl": "https://i.ytimg.com/...",
    "alreadySaved": false
  },
  ...
]
```

---

### POST - Adicionar Música ao Catálogo

```bash
curl -X POST http://localhost:3000/api/songs \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeId": "fJ9rUzIMt7o",
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "duration": 354,
    "thumbnailUrl": "https://i.ytimg.com/..."
  }'
```

**Resposta esperada:**
```json
{
  "id": 1,
  "youtube_id": "fJ9rUzIMt7o",
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "duration": 354,
  "thumbnail_url": "https://...",
  "source": "youtube",
  "added_at": "2026-09-12T10:30:00Z"
}
```

---

### POST - Criar Playlist

```bash
curl -X POST http://localhost:3000/api/playlists \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Rock Clássico",
    "description": "Minhas músicas de rock",
    "isPublic": false
  }'
```

---

### POST - Adicionar Música à Playlist

```bash
curl -X POST http://localhost:3000/api/playlists/1/songs/1
```

---

### GET - Listar Músicas da Playlist

```bash
curl "http://localhost:3000/api/playlists/1/songs"
```

---

### POST - Marcar como Favorito

```bash
curl -X POST http://localhost:3000/api/users/1/favorites/1
```

---

### GET - Listar Favoritos

```bash
curl "http://localhost:3000/api/users/1/favorites"
```

---

## 📊 Fluxo de Teste Manual

### Teste Completo: Buscar → Adicionar → Cantar

**1. Buscar música no YouTube**
```bash
curl "http://localhost:3000/api/songs/search?q=bohemian&limit=1"
```
→ Copiar `youtubeId`, `title`, `artist`, `duration`, `thumbnailUrl`

**2. Adicionar ao catálogo**
```bash
curl -X POST http://localhost:3000/api/songs \
  -H "Content-Type: application/json" \
  -d '{ "youtubeId": "...", "title": "...", ... }'
```
→ Pegar `id` da resposta (ex: id = 1)

**3. Criar playlist**
```bash
curl -X POST http://localhost:3000/api/playlists \
  -H "Content-Type: application/json" \
  -d '{ "userId": 1, "name": "Minhas Músicas" }'
```
→ Pegar `id` da resposta (ex: id = 7)

**4. Adicionar música à playlist**
```bash
curl -X POST http://localhost:3000/api/playlists/7/songs/1
```

**5. Marcar como favorito**
```bash
curl -X POST http://localhost:3000/api/users/1/favorites/1
```

**6. Verificar favoritos**
```bash
curl "http://localhost:3000/api/users/1/favorites"
```

→ Deve retornar a música adicionada com `added_at` timestamp

---

## 🎯 Próxima Fase: Frontend

### Componentes Necessários (Step 3)

```typescript
// SearchSongs.tsx - Busca e exibe resultados
const [results, setResults] = useState([]);
const { search } = useYouTubeSearch();

const handleSearch = async (query) => {
  const results = await search(query);
  setResults(results);
}

// PlaylistManager.tsx - Gerenciar playlists
// SongDetail.tsx - Detalhes da música
```

### Hooks Necessários

```typescript
// useYouTubeSearch - Buscar no backend
export const useYouTubeSearch = () => {
  const search = async (query, limit = 10) => {
    const res = await fetch(`/api/songs/search?q=${query}&limit=${limit}`);
    return res.json();
  };
  return { search };
};

// usePlaylist - Gerenciar playlists
export const usePlaylist = () => {
  const create = (userId, name) => {...};
  const addSong = (playlistId, songId) => {...};
  const removeSong = (playlistId, songId) => {...};
  return { create, addSong, removeSong };
};
```

---

## 📋 Checklist Pré-Produção

### Backend
- [ ] `.env` com `YOUTUBE_API_KEY` configurada
- [ ] `npm run migrate` executado com sucesso
- [ ] `npm run check` mostra "SISTEMA PRONTO"
- [ ] `npm run dev` roda sem erros
- [ ] Teste manual GET /api/songs/search funciona
- [ ] Teste manual POST /api/songs funciona
- [ ] Teste manual GET /api/playlists funciona

### Frontend (Próximo)
- [ ] useYouTubeSearch hook criado
- [ ] SearchSongs component criado
- [ ] PlaylistManager component criado
- [ ] Integração com RoomPage

### Integration
- [ ] MusicPlayer aceita YouTube IFrames
- [ ] Performance salva song_id corretamente
- [ ] Leaderboard funciona com YouTube songs

---

## 🐛 Troubleshooting

### Erro: "YOUTUBE_API_KEY not configured"
```
Solução: Adicionar chave ao .env
YOUTUBE_API_KEY=AIzaSy_...
```

### Erro: "YouTube API v3 not enabled"
```
Solução: Google Cloud Console → Search "YouTube Data API v3" → Enable
```

### Erro: "Quota exceeded"
```
Solução: Esperar 24 horas ou usar cache do Redis
Verificar: npm run check (deve mostrar cache OK)
```

### Erro: "PostgreSQL foreign key constraint"
```
Solução: Certifique-se que users.id existe antes de criar playlists
Verificar: SELECT * FROM users;
```

### Erro: "Redis connection refused"
```
Solução: Redis é opcional, backend funciona sem (sem cache)
Verificar: docker ps | grep redis
```

---

## 📚 Documentação Relacionada

- `PHASE4_PLANO.md` - Plano completo com arquitetura
- `PHASE4_DATABASE_SETUP.md` - Schema e migrations
- `PHASE4_STEP2_SUMMARY.md` - Summary técnico Step 2
- `PHASE4_STATUS.md` - Status geral Phase 4
- `PHASE3_QUICK_START.md` - Setup Phase 3 (pré-requisito)

---

## 🚀 Próximo: Frontend Phase 4 (Step 3)

Após confirmar backend funcionando:

1. **Criar hooks:**
   - `useYouTubeSearch` - Buscar músicas
   - `usePlaylist` - Gerenciar playlists
   - `useFavorites` - Gerenciar favoritos

2. **Criar componentes:**
   - `SearchSongs` - Input + grid de resultados
   - `PlaylistManager` - Criar/editar playlists
   - `SongCard` - Card de música com botões

3. **Integrar com Phase 3:**
   - RoomPage aceita YouTube songs
   - MusicPlayer reproduz YouTube IFrame
   - Performance salva song_id

---

**Backend Phase 4 Pronto! ✅**

Próximo passo: Testar endpoints e começar frontend.
