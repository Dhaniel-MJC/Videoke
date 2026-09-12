/**
 * Hook para gerenciar playlists do usuário
 * Operações: criar, editar, deletar, adicionar/remover músicas
 */

import { useState, useCallback } from 'react';

export interface Playlist {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  songCount?: number;
}

export interface PlaylistSong {
  id: number;
  youtube_id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail_url: string;
  position: number;
  added_at: string;
}

interface UsePlaylistReturn {
  playlists: Playlist[];
  songs: PlaylistSong[];
  loading: boolean;
  error: string | null;
  createPlaylist: (
    userId: number,
    name: string,
    description?: string,
    isPublic?: boolean
  ) => Promise<Playlist | null>;
  deletePlaylist: (playlistId: number) => Promise<boolean>;
  updatePlaylist: (
    playlistId: number,
    updates: Partial<Playlist>
  ) => Promise<Playlist | null>;
  getPlaylistSongs: (playlistId: number) => Promise<PlaylistSong[]>;
  addSongToPlaylist: (playlistId: number, songId: number, position?: number) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: number, songId: number) => Promise<boolean>;
  clearError: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const usePlaylist = (): UsePlaylistReturn => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlaylist = useCallback(
    async (
      userId: number,
      name: string,
      description?: string,
      isPublic: boolean = false
    ): Promise<Playlist | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/playlists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name,
            description: description || null,
            isPublic,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao criar playlist: ${response.statusText}`);
        }

        const playlist = await response.json();
        setPlaylists((prev) => [...prev, playlist]);
        return playlist;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao criar playlist:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletePlaylist = useCallback(async (playlistId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar playlist: ${response.statusText}`);
      }

      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao deletar playlist:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlaylist = useCallback(
    async (playlistId: number, updates: Partial<Playlist>): Promise<Playlist | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Erro ao atualizar playlist: ${response.statusText}`);
        }

        const updated = await response.json();
        setPlaylists((prev) =>
          prev.map((p) => (p.id === playlistId ? updated : p))
        );
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao atualizar playlist:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPlaylistSongs = useCallback(
    async (playlistId: number): Promise<PlaylistSong[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/playlists/${playlistId}/songs`
        );

        if (!response.ok) {
          throw new Error(
            `Erro ao carregar músicas: ${response.statusText}`
          );
        }

        const data = await response.json();
        setSongs(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao carregar músicas:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addSongToPlaylist = useCallback(
    async (playlistId: number, songId: number, position?: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/playlists/${playlistId}/songs/${songId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: position || undefined }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Erro ao adicionar música: ${response.statusText}`
          );
        }

        // Recarregar músicas da playlist
        await getPlaylistSongs(playlistId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao adicionar música:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getPlaylistSongs]
  );

  const removeSongFromPlaylist = useCallback(
    async (playlistId: number, songId: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/playlists/${playlistId}/songs/${songId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao remover música: ${response.statusText}`);
        }

        // Recarregar músicas da playlist
        await getPlaylistSongs(playlistId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao remover música:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getPlaylistSongs]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    playlists,
    songs,
    loading,
    error,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    getPlaylistSongs,
    addSongToPlaylist,
    removeSongFromPlaylist,
    clearError,
  };
};

export default usePlaylist;
