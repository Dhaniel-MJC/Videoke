/**
 * Hook para gerenciar músicas favoritas do usuário
 */

import { useState, useCallback } from 'react';

export interface FavoriteSong {
  id: number;
  youtube_id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail_url: string;
  view_count: number;
  use_count: number;
  added_at: string;
}

interface UseFavoritesReturn {
  favorites: FavoriteSong[];
  loading: boolean;
  error: string | null;
  getFavorites: (userId: number, limit?: number, offset?: number) => Promise<FavoriteSong[]>;
  addFavorite: (userId: number, songId: number) => Promise<boolean>;
  removeFavorite: (userId: number, songId: number) => Promise<boolean>;
  isFavorite: (userId: number, songId: number) => Promise<boolean>;
  clearError: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoriteSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFavorites = useCallback(
    async (
      userId: number,
      limit: number = 50,
      offset: number = 0
    ): Promise<FavoriteSong[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/users/${userId}/favorites?limit=${limit}&offset=${offset}`
        );

        if (!response.ok) {
          throw new Error(`Erro ao carregar favoritos: ${response.statusText}`);
        }

        const data = await response.json();
        setFavorites(data.songs);
        return data.songs;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao carregar favoritos:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addFavorite = useCallback(
    async (userId: number, songId: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/users/${userId}/favorites/${songId}`,
          {
            method: 'POST',
          }
        );

        if (!response.ok) {
          // Status 409 significa que já está nos favoritos
          if (response.status === 409) {
            console.log('Música já está nos favoritos');
            return true;
          }
          throw new Error(`Erro ao adicionar favorito: ${response.statusText}`);
        }

        // Recarregar favoritos
        await getFavorites(userId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao adicionar favorito:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getFavorites]
  );

  const removeFavorite = useCallback(
    async (userId: number, songId: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/users/${userId}/favorites/${songId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao remover favorito: ${response.statusText}`);
        }

        // Recarregar favoritos
        await getFavorites(userId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao remover favorito:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getFavorites]
  );

  const isFavorite = useCallback(
    async (userId: number, songId: number): Promise<boolean> => {
      try {
        const response = await fetch(
          `${API_URL}/users/${userId}/favorites/check/${songId}`
        );

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return data.isFavorite;
      } catch (err) {
        console.error('Erro ao verificar favorito:', err);
        return false;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    favorites,
    loading,
    error,
    getFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearError,
  };
};

export default useFavorites;
