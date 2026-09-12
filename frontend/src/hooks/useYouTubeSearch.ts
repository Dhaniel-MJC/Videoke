/**
 * Hook para buscar músicas no YouTube via backend
 * Integração com YouTubeService (Phase 4)
 */

import { useState, useCallback } from 'react';

export interface YouTubeSearchResult {
  youtubeId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  alreadySaved?: boolean;
}

interface UseYouTubeSearchReturn {
  results: YouTubeSearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string, limit?: number) => Promise<YouTubeSearchResult[]>;
  clear: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useYouTubeSearch = (): UseYouTubeSearchReturn => {
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string, limit: number = 10): Promise<YouTubeSearchResult[]> => {
      if (!query.trim()) {
        setError('Query não pode estar vazia');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/songs/search?q=${encodeURIComponent(query)}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro na busca: ${response.statusText}`);
        }

        const data: YouTubeSearchResult[] = await response.json();
        setResults(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao buscar músicas:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clear,
  };
};

export default useYouTubeSearch;
