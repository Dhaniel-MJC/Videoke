/**
 * SearchSongs - Componente principal de busca e exibição de músicas do YouTube
 * Funcionalidades:
 * - Buscar no YouTube
 * - Exibir resultados em grid
 * - Adicionar músicas ao catálogo
 * - Iniciar performance
 */

import React, { useState, useCallback, useEffect } from 'react';
import useYouTubeSearch, { YouTubeSearchResult } from '../hooks/useYouTubeSearch';
import useFavorites from '../hooks/useFavorites';
import SongCard from './SongCard';
import styles from './SearchSongs.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface SearchSongsProps {
  userId: number;
  onSingSong?: (song: YouTubeSearchResult) => void;
  onAddToPlaylist?: (song: YouTubeSearchResult & { id: number }) => void;
}

export const SearchSongs: React.FC<SearchSongsProps> = ({
  userId,
  onSingSong,
  onAddToPlaylist,
}) => {
  const { results, loading, error, search, clear } = useYouTubeSearch();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [favoritesCache, setFavoritesCache] = useState<Map<string, boolean>>(
    new Map()
  );
  const [addingToDb, setAddingToDb] = useState<Set<string>>(new Set());

  // Verificar favoritos quando resultados mudarem
  useEffect(() => {
    const checkFavorites = async () => {
      const newCache = new Map(favoritesCache);
      for (const song of results) {
        if (!newCache.has(song.youtubeId)) {
          const isFav = await isFavorite(userId, -1); // Verificar sem ID da DB
          // Nota: isFavorite precisa ser adaptado para aceitar youtubeId
          // Por enquanto, deixamos como false
          newCache.set(song.youtubeId, false);
        }
      }
      setFavoritesCache(newCache);
    };

    if (results.length > 0) {
      checkFavorites();
    }
  }, [results, userId, isFavorite, favoritesCache]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      setSearching(true);
      await search(query, 10);
      setSearching(false);
    },
    [query, search]
  );

  const handleAddToDatabase = useCallback(
    async (song: YouTubeSearchResult) => {
      if (addingToDb.has(song.youtubeId)) return;

      setAddingToDb((prev) => new Set([...prev, song.youtubeId]));

      try {
        const response = await fetch(`${API_URL}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtubeId: song.youtubeId,
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            thumbnailUrl: song.thumbnailUrl,
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            console.log('Música já existe no catálogo');
            return;
          }
          throw new Error('Erro ao adicionar música');
        }

        const addedSong = await response.json();
        console.log('Música adicionada:', addedSong);

        // Chamar callback se fornecido
        if (onAddToPlaylist) {
          onAddToPlaylist({
            ...song,
            id: addedSong.id,
          });
        }
      } catch (err) {
        console.error('Erro ao adicionar música ao banco:', err);
        alert('Erro ao adicionar música. Tente novamente.');
      } finally {
        setAddingToDb((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.youtubeId);
          return newSet;
        });
      }
    },
    [addingToDb, onAddToPlaylist]
  );

  const handleSing = useCallback(
    async (song: YouTubeSearchResult) => {
      // Se não está no banco, adicionar primeiro
      if (!song.alreadySaved) {
        await handleAddToDatabase(song);
      }

      // Chamar callback
      if (onSingSong) {
        onSingSong(song);
      }
    },
    [handleAddToDatabase, onSingSong]
  );

  const handleFavorite = useCallback(
    async (song: YouTubeSearchResult) => {
      // Nota: Isto precisa de integração melhor com banco de dados
      // Por enquanto, apenas marca localmente
      const newCache = new Map(favoritesCache);
      newCache.set(song.youtubeId, true);
      setFavoritesCache(newCache);

      // Implementar quando tiver song.id do banco
      // await addFavorite(userId, song.id);
    },
    [favoritesCache, userId, addFavorite]
  );

  const handleRemoveFavorite = useCallback(
    async (song: YouTubeSearchResult) => {
      const newCache = new Map(favoritesCache);
      newCache.set(song.youtubeId, false);
      setFavoritesCache(newCache);

      // Implementar quando tiver song.id do banco
      // await removeFavorite(userId, song.id);
    },
    [favoritesCache, userId, removeFavorite]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎵 Buscar Músicas</h1>
        <p>Encontre qualquer música no YouTube e cante!</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Buscar música, artista, banda..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
            disabled={searching}
          />
          <button
            type="submit"
            className={styles.searchBtn}
            disabled={searching || !query.trim()}
          >
            {searching ? '🔍 Buscando...' : '🔍 Buscar'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <span>❌ {error}</span>
          <button onClick={() => clear()}>Limpar</button>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className={styles.resultsContainer}>
          <div className={styles.resultInfo}>
            <h2>📊 {results.length} resultados encontrados</h2>
          </div>

          <div className={styles.grid}>
            {results.map((song) => (
              <SongCard
                key={song.youtubeId}
                {...song}
                isFavorite={favoritesCache.get(song.youtubeId) || false}
                loading={addingToDb.has(song.youtubeId)}
                onSing={() => handleSing(song)}
                onAddToPlaylist={() => handleAddToDatabase(song)}
                onAddFavorite={() => handleFavorite(song)}
                onRemoveFavorite={() => handleRemoveFavorite(song)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          {searching ? (
            <>
              <div className={styles.spinner}></div>
              <p>Buscando músicas...</p>
            </>
          ) : query ? (
            <>
              <p>😕 Nenhum resultado encontrado para "{query}"</p>
              <p className={styles.hint}>Tente com outro termo</p>
            </>
          ) : (
            <>
              <p>🎤 Comece digitando um nome de música ou artista</p>
              <p className={styles.hint}>
                Exemplo: "Bohemian Rhapsody", "The Beatles", etc.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSongs;
