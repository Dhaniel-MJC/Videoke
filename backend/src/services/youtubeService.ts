/**
 * YouTube Integration Service
 * Busca de músicas, cache com Redis, gerenciamento de quota
 */

import axios, { AxiosError } from 'axios';
import { createClient } from 'redis';

interface YouTubeSearchResult {
  youtubeId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
}

export class YouTubeService {
  private apiKey: string;
  private redis: ReturnType<typeof createClient> | null = null;
  private readonly CACHE_TTL = 7 * 24 * 60 * 60; // 7 dias em segundos
  private readonly YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  YOUTUBE_API_KEY não configurada - busca YouTube desabilitada');
    }

    // Tentar conectar ao Redis, mas não falhar se não conseguir
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://redis:6379',
      });
      this.redis.connect().catch((err) => {
        console.warn('⚠️  Redis indisponível, usando busca sem cache:', err.message);
        this.redis = null;
      });
    } catch (error) {
      console.warn('⚠️  Redis não disponível, usando busca sem cache');
      this.redis = null;
    }
  }

  /**
   * Busca música no YouTube com cache Redis
   * @param query - Termo de busca (ex: "bohemian rhapsody")
   * @param limit - Número de resultados (default: 10)
   * @returns Array de resultados da busca
   */
  async searchSongs(query: string, limit: number = 10): Promise<YouTubeSearchResult[]> {
    try {
      // Tentar obter do cache primeiro
      if (this.redis) {
        const cacheKey = `youtube_search:${query}:${limit}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          console.log(`✅ Cache hit: ${query}`);
          return JSON.parse(cached);
        }
      }

      // Se não estiver em cache, buscar no YouTube
      console.log(`🔍 Buscando no YouTube: ${query}`);
      const results = await this.searchYouTube(query, limit);

      // Salvar em cache
      if (this.redis && results.length > 0) {
        const cacheKey = `youtube_search:${query}:${limit}`;
        await this.redis.setEx(
          cacheKey,
          this.CACHE_TTL,
          JSON.stringify(results)
        );
        console.log(`💾 Salvo em cache: ${query}`);
      }

      return results;
    } catch (error) {
      console.error('Erro na busca:', error);
      return [];
    }
  }

  /**
   * Busca diretamente no YouTube API
   * @private
   */
  private async searchYouTube(
    query: string,
    limit: number
  ): Promise<YouTubeSearchResult[]> {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API Key não configurada');
      }

      const response = await axios.get(`${this.YOUTUBE_API_URL}/search`, {
        params: {
          key: this.apiKey,
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults: limit,
          videoCategoryId: '10', // Música
          order: 'relevance',
        },
        timeout: 5000,
      });

      const items = response.data.items || [];
      const results: YouTubeSearchResult[] = [];

      for (const item of items) {
        try {
          // Obter duração do vídeo
          const duration = await this.getVideoDuration(item.id.videoId);

          results.push({
            youtubeId: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle || 'Desconhecido',
            duration: duration,
            thumbnailUrl: item.snippet.thumbnails.medium?.url || '',
          });
        } catch (err) {
          console.warn(`Erro ao processar vídeo ${item.id.videoId}:`, err);
          continue;
        }
      }

      return results;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 403) {
        console.error('❌ Quota YouTube excedida ou API desabilitada');
      } else {
        console.error('Erro YouTube API:', axiosError.message);
      }
      throw error;
    }
  }

  /**
   * Obtém duração do vídeo em segundos
   * @private
   */
  private async getVideoDuration(videoId: string): Promise<number> {
    try {
      if (!this.apiKey) {
        return 0;
      }

      const response = await axios.get(`${this.YOUTUBE_API_URL}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'contentDetails',
        },
        timeout: 5000,
      });

      const duration = response.data.items[0]?.contentDetails?.duration;
      if (!duration) return 0;

      // Converter ISO 8601 duration (PT5M30S) para segundos
      return this.parseDuration(duration);
    } catch (error) {
      console.warn(`Erro ao obter duração de ${videoId}:`, error);
      return 0;
    }
  }

  /**
   * Converte duration ISO 8601 para segundos
   * PT1H30M45S → 5445
   * @private
   */
  private parseDuration(duration: string): number {
    const match = duration.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Limpar cache de busca
   */
  async clearCache(): Promise<void> {
    if (this.redis) {
      const keys = await this.redis.keys('youtube_search:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
        console.log(`🗑️  Cache limpo: ${keys.length} entradas deletadas`);
      }
    }
  }

  /**
   * Fechar conexão Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default new YouTubeService();
