# 🎬 Phase 4 - Step 3: Frontend Search Components
**Status:** ✅ Implementado  
**Data:** 2026-09-12

---

## 📦 O Que Foi Criado

### 3 Custom Hooks (React)

#### 1. **useYouTubeSearch** (`hooks/useYouTubeSearch.ts`)
Gerencia busca de músicas no YouTube

```typescript
const { results, loading, error, search, clear } = useYouTubeSearch();

// Usar
const hits = await search("bohemian", 10);
// Retorna array com: youtubeId, title, artist, duration, thumbnailUrl
```

**Funcionalidades:**
- ✅ Busca no backend (`GET /api/songs/search`)
- ✅ State management (results, loading, error)
- ✅ Clear resultados
- ✅ Tratamento de erros

---

#### 2. **usePlaylist** (`hooks/usePlaylist.ts`)
Gerencia playlists do usuário

```typescript
const {
  playlists,
  songs,
  loading,
  error,
  createPlaylist,
  deletePlaylist,
  getPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
} = usePlaylist();

// Usar
const playlist = await createPlaylist(userId, "Rock Clássico");
await addSongToPlaylist(playlist.id, songId);
const songs = await getPlaylistSongs(playlist.id);
```

**Funcionalidades:**
- ✅ CRUD de playlists
- ✅ Adicionar/remover músicas
- ✅ Gerenciar ordem (position)
- ✅ Cachear musicase detalhes

---

#### 3. **useFavorites** (`hooks/useFavorites.ts`)
Gerencia músicas favoritas

```typescript
const {
  favorites,
  loading,
  error,
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
} = useFavorites();

// Usar
await addFavorite(userId, songId);
const isFav = await isFavorite(userId, songId);
const favs = await getFavorites(userId);
```

**Funcionalidades:**
- ✅ Listar favoritos
- ✅ Adicionar/remover
- ✅ Verificar se é favorito
- ✅ Paginação

---

### 2 Componentes React

#### 1. **SongCard** (`components/SongCard.tsx`)
Card individual com thumbnail, info e botões

```typescript
<SongCard
  youtubeId="fJ9rUzIMt7o"
  title="Bohemian Rhapsody"
  artist="Queen"
  duration={354}
  thumbnailUrl="https://..."
  alreadySaved={false}
  isFavorite={true}
  onSing={() => {...}}
  onAddToPlaylist={() => {...}}
  onAddFavorite={() => {...}}
  onRemoveFavorite={() => {...}}
/>
```

**Recursos:**
- ✅ Thumbnail 1:1 aspect ratio
- ✅ Overlay com 3 botões (hover)
- ✅ Badge "Já Salvo"
- ✅ Formatação de duração (MM:SS)
- ✅ Loading state
- ✅ Responsive design

**Botões:**
- 🎤 Cantar - Iniciar performance
- 📋 Playlist - Adicionar à playlist
- ❤️ Favoritar - Marcar como favorito

---

#### 2. **SearchSongs** (`components/SearchSongs.tsx`)
Componente principal de busca

```typescript
<SearchSongs
  userId={123}
  onSingSong={(song) => {...}}
  onAddToPlaylist={(song) => {...}}
/>
```

**Funcionalidades:**
- ✅ Search bar com submit
- ✅ Grid responsivo de SongCards
- ✅ Loading durante busca
- ✅ Error messages
- ✅ Empty states
- ✅ Cache de favoritos
- ✅ Adicionar à DB automaticamente
- ✅ Estados de carregamento

---

## 📁 Estrutura de Arquivos

```
frontend/src/
├── hooks/
│   ├── useYouTubeSearch.ts      ✅ Hook busca
│   ├── usePlaylist.ts            ✅ Hook playlist
│   └── useFavorites.ts           ✅ Hook favoritos
└── components/
    ├── SearchSongs.tsx           ✅ Componente principal
    ├── SearchSongs.module.css    ✅ Estilos principal
    ├── SongCard.tsx              ✅ Card individual
    └── SongCard.module.css       ✅ Estilos card
```

---

## 🎨 Design e UX

### Paleta de Cores
```
Primário:   #667eea (Roxo)
Secundário: #764ba2 (Roxo escuro)
Accent:     #fa709a (Rosa)
Background: #ffffff (Branco)
Text:       #333333 (Escuro)
```

### Componentes Estilizados
- Search bar gradiente (roxo → roxo escuro)
- Grid responsivo (auto-fill minmax)
- Overlay ao passar mouse
- Botões coloridos com gradientes
- Animações suaves (fade, slide)
- Spinner de loading

### Breakpoints Responsivos
```
Desktop:  1024px+
Tablet:   768px - 1023px
Mobile:   480px - 767px
Small:    < 480px
```

---

## 🔌 Como Integrar

### 1. No seu componente pai (ex: RoomPage.tsx)

```typescript
import SearchSongs from '../components/SearchSongs';

export default function RoomPage() {
  const { roomId, userId } = useParams();

  const handleSingSong = (song: YouTubeSearchResult) => {
    console.log('Cantar:', song.youtubeId);
    // Iniciar MusicPlayer com YouTube song
  };

  const handleAddToPlaylist = (song) => {
    console.log('Adicionar à playlist:', song.id);
    // Abrir modal de playlist
  };

  return (
    <div>
      <SearchSongs
        userId={userId}
        onSingSong={handleSingSong}
        onAddToPlaylist={handleAddToPlaylist}
      />
    </div>
  );
}
```

---

### 2. Configurar VITE_API_URL

No arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Testar Components

### Teste Manual 1: Buscar Música
1. Abrir página com `<SearchSongs>`
2. Digitar "bohemian"
3. Clicar buscar
4. Ver 10 resultados em grid

### Teste Manual 2: Card Hover
1. Passar mouse sobre um card
2. Ver overlay com 3 botões
3. Botões devem estar clicáveis

### Teste Manual 3: Adicionar à DB
1. Clicar "Cantar" em uma música
2. Deve fazer POST /api/songs
3. Badge "✓ Salvo" deve aparecer

### Teste Manual 4: Favoritar
1. Clicar coração (❤️)
2. Ícone muda para vermelho
3. Coração fica "Favoritado"

---

## 📊 Fluxo Completo: Frontend → Backend

```
1. Usuário digita "Bohemian"
   ↓
2. SearchSongs chama useYouTubeSearch.search()
   ↓
3. Hook faz GET /api/songs/search?q=bohemian
   ↓
4. Backend (YouTubeService):
   - Verifica cache Redis
   - Se não tiver: chama YouTube API
   - Retorna 10 resultados
   ↓
5. SearchSongs recebe results e renderiza grid
   ↓
6. Cada resultado = SongCard com 3 botões
   ↓
7. Usuário clica "Cantar"
   ↓
8. SearchSongs chama handleAddToDatabase()
   ↓
9. POST /api/songs (adiciona ao catálogo)
   ↓
10. Callback onSingSong() dispara
   ↓
11. RoomPage inicia MusicPlayer com YouTube song
   ↓
12. Phase 3 captura áudio e calcula score
   ↓
13. Performance salva com song_id referência
```

---

## 🎯 Próximo: Step 4 - Integration Phase 3

### Modificações Necessárias em RoomPage:
- [ ] Aceitar `youtubeId` do SearchSongs
- [ ] Modificar MusicPlayer para YouTube IFrame
- [ ] Passar `song_id` para performanceHandler
- [ ] Leaderboard trabalhar com songs do BD

### Novo Hook Necessário:
```typescript
const useYouTubePlayer = () => {
  const playVideo = (youtubeId: string) => {...};
  const stopVideo = () => {...};
  const getAudioStream = () => {...};
};
```

### Novo Componente:
```typescript
<YouTubePlayer
  youtubeId={song.youtubeId}
  autoplay={true}
  onAudioAnalysis={(metrics) => {...}}
/>
```

---

## 🚀 Checklist Integração Frontend

- [ ] 3 hooks criados e testados
- [ ] 2 componentes criados e estilizados
- [ ] SearchSongs renderiza corretamente
- [ ] Busca funciona (testa com "test")
- [ ] SongCard mostra thumbnail
- [ ] Hover overlay funciona
- [ ] Botões disparam callbacks
- [ ] Integrado em página pai (RoomPage)
- [ ] VITE_API_URL configurada
- [ ] Backend rodando na porta 3000

---

## 📚 Documentação Relacionada

- `PHASE4_PLANO.md` - Plano geral
- `PHASE4_DATABASE_SETUP.md` - Schema BD
- `PHASE4_STEP2_SUMMARY.md` - Backend
- `PHASE4_INTEGRATION_GUIDE.md` - Setup
- `PHASE4_STATUS.md` - Status geral

---

**Step 3 Completo! ✅**

Frontend 60% pronto. Próximo: Integração Phase 3 e testes e-2-e.
