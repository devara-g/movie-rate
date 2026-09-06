'use client';

import React, { useEffect } from 'react';
import { cleanPosterUrl, getSafeAvatar } from '@/lib/supabase';
import { Film } from '@/data/cinemaData';

export interface DisplayListModel {
  id: string;
  title: string;
  description?: string;
  curatorName: string;
  curatorAvatar?: string;
  curatorUsername?: string;
  isPrivate?: boolean;
  films: {
    id?: string | number;
    tmdb_id?: number;
    title: string;
    posterUrl: string;
    year?: number | string;
    rating?: number | string;
  }[];
}

interface ListDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: DisplayListModel | null;
  onSelectFilm: (filmId: string, film?: Film) => void;
  onOpenLogModal: (filmId: string) => void;
  onOpenPublicProfile?: (usernameOrId: string) => void;
  onShowToast?: (msg: string) => void;
}

export const ListDetailModal: React.FC<ListDetailModalProps> = ({
  isOpen,
  onClose,
  list,
  onSelectFilm,
  onOpenLogModal,
  onOpenPublicProfile,
  onShowToast,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !list) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      if (onShowToast) onShowToast('Tautan daftar film disalin ke papan klip!');
    }
  };

  return (
    <div
      className="modal-backdrop-cinematic"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-surface-cinema custom-modal-scrollbar"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 23, 29, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 224, 84, 0.12)',
                border: '1px solid rgba(0, 224, 84, 0.28)',
                color: '#00e054',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00e054' }} />
              DAFTAR KURASI
            </span>
            <span style={{ fontSize: '12px', color: '#677b8c' }}>•</span>
            <span style={{ fontSize: '12px', color: '#8899a6', fontWeight: 600 }}>
              {list.films.length} Judul Film
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleShare}
              className="form-btn-secondary"
              style={{ padding: '6px 14px', fontSize: '11px' }}
              title="Salin tautan daftar"
            >
              Bagikan
            </button>
            <button
              onClick={onClose}
              className="modal-close-btn-cinema"
              title="Tutup (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* List Meta Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.3 }}>
              {list.title}
            </h1>

            {list.description && (
              <p style={{ fontSize: '13px', color: '#9ab0c2', lineHeight: 1.6, margin: 0 }}>
                {list.description}
              </p>
            )}

            {/* Curator Tag */}
            <div
              onClick={() => {
                if (onOpenPublicProfile && list.curatorUsername) {
                  onClose();
                  onOpenPublicProfile(list.curatorUsername);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                cursor: onOpenPublicProfile ? 'pointer' : 'default',
                width: 'fit-content',
              }}
            >
              <img
                src={getSafeAvatar(list.curatorAvatar, list.curatorName)}
                alt={list.curatorName}
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '12px', color: '#8899a6' }}>
                Disusun oleh <strong style={{ color: '#ffffff' }}>{list.curatorName}</strong>
              </span>
            </div>
          </div>

          {/* Film Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '16px',
            }}
          >
            {list.films.map((film, index) => {
              const effectiveFilmId = film.tmdb_id ? `tmdb-${film.tmdb_id}` : String(film.id || '');
              return (
                <div
                  key={index}
                  className="tactile-card tix-card-holder"
                  style={{
                    backgroundColor: '#1b2228',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid #2c3642',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    onClick={() => {
                      onClose();
                      onSelectFilm(effectiveFilmId);
                    }}
                    style={{ position: 'relative', aspectRatio: '2/3', cursor: 'pointer', overflow: 'hidden' }}
                  >
                    <img
                      src={cleanPosterUrl(film.posterUrl, film.title)}
                      alt={film.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        backgroundColor: 'rgba(20,24,28,0.85)',
                        color: '#00e054',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      #{index + 1}
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div
                      onClick={() => {
                        onClose();
                        onSelectFilm(effectiveFilmId);
                      }}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                      }}
                      title={film.title}
                    >
                      {film.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#8899a6' }}>
                      <span>{film.year || ''}</span>
                      {film.rating ? (
                        <span style={{ color: '#00e054', fontWeight: 700 }}>
                          ★ {film.rating}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLogModal(effectiveFilmId);
                      }}
                      className="btn-primary"
                      style={{ padding: '4px 0', fontSize: '10px', marginTop: 'auto' }}
                    >
                      + LOG TIKET
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
