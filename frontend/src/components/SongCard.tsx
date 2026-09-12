/**
 * SongCard - Card individual de música para exibição em grid
 * Mostra: thumbnail, título, artista, duração
 * Botões: Cantar, Adicionar, Favoritar
 */

import React, { useState, useEffect } from 'react';
import styles from './SongCard.module.css';

export interface SongCardProps {
  id?: number;
  youtubeId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  alreadySaved?: boolean;
  onSing?: () => void;
  onAddToPlaylist?: () => void;
  onAddFavorite?: () => void;
  onRemoveFavorite?: () => void;
  isFavorite?: boolean;
  loading?: boolean;
}

/**
 * Converter segundos para formato MM:SS
 */
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const SongCard: React.FC<SongCardProps> = ({
  id,
  youtubeId,
  title,
  artist,
  duration,
  thumbnailUrl,
  alreadySaved = false,
  onSing,
  onAddToPlaylist,
  onAddFavorite,
  onRemoveFavorite,
  isFavorite = false,
  loading = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);

  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorite && onRemoveFavorite) {
      onRemoveFavorite();
      setFavorite(false);
    } else if (!favorite && onAddFavorite) {
      onAddFavorite();
      setFavorite(true);
    }
  };

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnailContainer}>
        <img
          src={thumbnailUrl}
          alt={title}
          className={styles.thumbnail}
        />

        {/* Badge: Já salvo */}
        {alreadySaved && (
          <div className={styles.badge}>✓ Salvo</div>
        )}

        {/* Overlay com botões (aparece no hover) */}
        {isHovering && (
          <div className={styles.overlay}>
            <button
              className={`${styles.btn} ${styles.btnSing}`}
              onClick={onSing}
              disabled={loading}
              title="Começar a cantar"
            >
              🎤 Cantar
            </button>

            <button
              className={`${styles.btn} ${styles.btnPlaylist}`}
              onClick={onAddToPlaylist}
              disabled={loading}
              title="Adicionar à playlist"
            >
              📋 Playlist
            </button>

            <button
              className={`${styles.btn} ${favorite ? styles.btnFavoriteFilled : styles.btnFavorite}`}
              onClick={handleFavoriteClick}
              disabled={loading}
              title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              {favorite ? '❤️ Favoritado' : '🤍 Favoritar'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.artist}>{artist}</p>

        {/* Footer: Duração */}
        <div className={styles.footer}>
          <span className={styles.duration}>
            ⏱️ {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SongCard;
