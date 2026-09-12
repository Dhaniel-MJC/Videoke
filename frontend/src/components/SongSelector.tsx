/**
 * Componente de Seleção de Músicas
 * - Lista de músicas disponíveis
 * - Busca e filtros por artista/gênero
 * - Prévia de informações da música
 * - Integração com YouTube/Áudio local
 */

import { useEffect, useState, useCallback } from 'react';
import { Song } from '../hooks/useSongPlayer';

interface SongSelectorProps {
  songs: Song[];
  onSongSelected: (song: Song) => void;
  isLoading?: boolean;
}

export default function SongSelector({
  songs,
  onSongSelected,
  isLoading = false,
}: SongSelectorProps) {
  const [filteredSongs, setFilteredSongs] = useState<Song[]>(songs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [expandedSong, setExpandedSong] = useState<string | null>(null);

  // Filtrar músicas por busca
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      setFilteredSongs(songs);
      return;
    }

    const filtered = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.lyrics && song.lyrics.some((lyric) =>
          lyric.toLowerCase().includes(query)
        ))
    );

    setFilteredSongs(filtered);
  }, [searchQuery, songs]);

  const handleSongSelect = useCallback(
    (song: Song) => {
      setSelectedSong(song);
      onSongSelected(song);
    },
    [onSongSelected]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Buscar por título ou artista..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Contagem de Resultados */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-gray-400">
          {isLoading ? (
            <>⏳ Carregando...</>
          ) : (
            <>
              {filteredSongs.length} de {songs.length} músicas
              {searchQuery && ` (${searchQuery})`}
            </>
          )}
        </p>
        {filteredSongs.length === 0 && !isLoading && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Lista de Músicas */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-pink-500 rounded-full" />
            </div>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-2">😔 Nenhuma música encontrada</p>
            <p className="text-sm text-gray-500">
              Tente uma busca diferente ou explore todas as músicas
            </p>
          </div>
        ) : (
          filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`rounded-lg p-3 cursor-pointer transition ${
                selectedSong?.id === song.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 ring-2 ring-purple-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => handleSongSelect(song)}
            >
              {/* Informação Principal */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-300 truncate">
                    {song.artist}
                  </p>
                </div>

                {/* Duração */}
                <div className="ml-2 text-right flex-shrink-0">
                  <span className="text-sm text-gray-300">
                    ⏱️ {formatTime(song.duration)}
                  </span>
                </div>
              </div>

              {/* Indicador de Seleção */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                  {song.lyrics && song.lyrics.length > 0 && (
                    <span
                      className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
                      title="Tem letra sincronizada"
                    >
                      📝 Letra
                    </span>
                  )}
                  {song.youtubeId && (
                    <span
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                      title="Disponível no YouTube"
                    >
                      ▶️ YouTube
                    </span>
                  )}
                  {song.audioUrl && (
                    <span
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                      title="Arquivo de áudio"
                    >
                      🎵 Audio
                    </span>
                  )}
                </div>

                {/* Botão de Expandir */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedSong(
                      expandedSong === song.id ? null : song.id
                    );
                  }}
                  className="text-gray-400 hover:text-white transition text-lg"
                >
                  {expandedSong === song.id ? '▼' : '▶'}
                </button>
              </div>

              {/* Detalhes Expandidos */}
              {expandedSong === song.id && (
                <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                  {/* ID da Música */}
                  <div className="text-xs text-gray-400">
                    <span className="font-semibold">ID:</span> {song.id}
                  </div>

                  {/* Amostra de Letras */}
                  {song.lyrics && song.lyrics.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-300 mb-1">
                        Amostra de Letra:
                      </p>
                      <p className="text-xs text-gray-400 italic max-h-16 overflow-hidden">
                        {song.lyrics
                          .slice(0, 3)
                          .join(' ... ')}
                        {song.lyrics.length > 3 && ' ...'}
                      </p>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-2">
                    {song.youtubeId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition"
                      >
                        Ver no YouTube ↗️
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Painel de Música Selecionada */}
      {selectedSong && (
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-4 border-l-4 border-purple-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Música Selecionada</p>
              <h3 className="text-lg font-bold text-white">
                {selectedSong.title}
              </h3>
              <p className="text-sm text-purple-200">
                {selectedSong.artist}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Duração: {formatTime(selectedSong.duration)}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedSong(null);
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Mudar
            </button>
          </div>
        </div>
      )}

      {/* Dica */}
      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
        <p className="text-xs text-blue-200">
          💡 <strong>Dica:</strong> Clique em uma música para selecioná-la.
          Expanda para ver mais detalhes, incluindo amostra de letra e links
          externos.
        </p>
      </div>
    </div>
  );
}
