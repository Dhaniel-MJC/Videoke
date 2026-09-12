# 🎬 Phase 4 - Step 2: YouTube API Backend
**Status:** ✅ Implementado  
**Data:** 2026-09-12

---

## 📦 O Que Foi Criado

### 1. YouTubeService (`backend/src/services/youtubeService.ts`)
Serviço responsável por:
- ✅ Buscar músicas no YouTube API
- ✅ Cache Redis (7 dias)
- ✅ Parsing de duração ISO 8601
- ✅ Tratamento de erros e quota

**Métodos principais:**
```typescript
searchSongs(query: string, limit?: number) // Busca com cache
clearCache() // Limpar cache
disconnect() // Fechar conexão
```

---

### 2. Songs Routes (`backend/src/routes/songs.ts`)
```
GET  /api/songs/search?q=bohemian&limit=10   → Buscar no YouTube
GET  /api/songs/:songId                        → Detalhes da música
POST /api/songs                                → Adicionar ao catálogo
GET  /api/songs                                → Listar catálogo (paginado)
PUT  /api/songs/:songId                        → Atualizar contadores
```

---

### 3. Playlists Routes (`backend/src/routes/playlists.ts`)
```
POST   /api/playlists                          → Criar playlist
GET    /api/playlists/:playlistId              → Detalhes
PUT    /api/playlists/:playlistId              → Editar
DELETE /api/playlists/:playlistId              → Deletar
GET    /api/playlists/:playlistId/songs        → Músicas da playlist
POST   /api/playlists/:playlistId/songs/:songId → Adicionar música
DELETE /api/playlists/:playlistId/songs/:songId → Remover música
```

---

### 4. Favorites Routes (`backend/src/routes/favorites.ts`)
```
GET    /api/users/:userId/favorites            → Listar favoritos
POST   /api/users/:userId/favorites/:songId    → Marcar como favorito
DELETE /api/users/:userId/favorites/:songId    → Remover favorito
GET    /api/users/:userId/favorites/check/:songId → Verificar se é favorito
```

---

### 5. Database Updates
- ✅ 4 migration files criados (002-005)
- ✅ schema.sql atualizado com todas as tabelas Phase 4
- ✅ systemCheck.ts atualizado para validar Phase 4

---

## 🔗 Como Integrar no Express App

No arquivo `backend/src/index.ts`, adicione:

```typescript
import songsRoutes from './routes/songs';
import playlistsRoutes from './routes/playlists';
import favoritesRoutes from './routes/favorites';

// ... após definir app ...

// Phase 4 routes
app.use('/api/songs', songsRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/users', favoritesRoutes);

// ... resto do código ...
```

---

## 🔑 Variáveis de Ambiente Necessárias

Adicionar ao `.env`:

```env
# YouTube API
YOUTUBE_API_KEY=AIzaSy_YOUR_KEY_HERE

# Redis (já deve estar configurado do Phase 3)
REDIS_URL=redis://redis:6379
```

**Como obter YouTube API Key:**
1. Google Cloud Console: https://console.cloud.google.com
2. Create Project
3. Enable "YouTube Data API v3"
4. Create API Key (Credentials → API Key)
5. Copiar para .env

---

## 📊 Fluxo de Busca (com Cache)

```
Frontend: usuário digita "bohemian"
    ↓
GET /api/songs/search?q=bohemian
    ↓
YouTubeService.searchSongs("bohemian")
    ↓
Redis cache? Sim → Retorna cache (7 dias)
Redis cache? Não → Chama YouTube API
    ↓
YouTube API retorna resultados
    ↓
Salva em Redis (7 dias)
    ↓
Retorna para frontend
    ↓
Frontend exibe 10 resultados com botão "Adicionar ao Catálogo"
```

---

## 📝 Fluxo Completo: Buscar → Cantar

```
1. Frontend busca "Bohemian Rhapsody"
   GET /api/songs/search?q=bohemian

2. Usuário clica "Adicionar ao Catálogo"
   POST /api/songs { youtubeId, title, artist, ... }
   → Song criada com ID 42

3. Usuário cria playlist "Minhas Favoritas"
   POST /api/playlists { userId, name: "Minhas Favoritas" }
   → Playlist criada com ID 7

4. Usuário adiciona música à playlist
   POST /api/playlists/7/songs/42

5. Usuário marca como favorito
   POST /api/users/123/favorites/42

6. Usuário começa a cantar a música
   → Performance salva com referência a songs.id = 42
   → Phase 3 registra score/pitch/energy
   → Leaderboard atualiza

7. Frontend pode:
   - Mostrar histórico dessa música
   - Comparar com outras performances
   - Sugerir músicas similares
```

---

## 🎯 Próximo Step

**Step 3: Frontend Search Component**

Frontend precisará de:
- ✅ `useYouTubeSearch` Hook
- ✅ `SearchSongs.tsx` Component
- ✅ `PlaylistManager.tsx` Component
- ✅ Grid de resultados com botões "Cantar" / "Adicionar"

---

## ✅ Checklist Integração

- [ ] Adicionar imports das 3 rotas em `index.ts`
- [ ] Registrar rotas no Express app
- [ ] Adicionar `YOUTUBE_API_KEY` ao `.env`
- [ ] Rodar migrations: `npm run migrate`
- [ ] Verificar: `npm run check`
- [ ] Testar: `npm run dev` e fazer requisição GET /api/songs/search?q=test

---

## 🚀 Testes Manuais (via cURL/Postman)

### 1. Buscar música
```bash
GET http://localhost:3000/api/songs/search?q=bohemian&limit=5
```

### 2. Adicionar ao catálogo
```bash
POST http://localhost:3000/api/songs
Content-Type: application/json

{
  "youtubeId": "fJ9rUzIMt7o",
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "duration": 354,
  "thumbnailUrl": "https://..."
}
```

### 3. Criar playlist
```bash
POST http://localhost:3000/api/playlists
Content-Type: application/json

{
  "userId": 1,
  "name": "Rock Clássico",
  "description": "Minhas músicas de rock favoritas"
}
```

### 4. Adicionar música à playlist
```bash
POST http://localhost:3000/api/playlists/1/songs/1
```

---

## 📚 Documentação Relacionada

- `PHASE4_PLANO.md` - Plano completo
- `PHASE4_DATABASE_SETUP.md` - Schema das tabelas
- `PHASE3_QUICK_START.md` - Setup Phase 3

---

**Step 2 Completo! ✅**

Próximo: Integrar rotas no Express e fazer testes básicos.
