'use client';

import React, { useState } from 'react';
import { FILMS, Film as FilmType, Review } from '@/data/cinemaData';
import { UserProfile } from '@/lib/supabase';

interface LogReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFilmId?: string;
  preselectedFilm?: FilmType | null;
  onSaveReview: (review: Review) => void;
  currentUser?: UserProfile | null;
}

const POPULAR_TAGS = ['cinema', 'rewatch', 'crying', '35mm', 'favorite', 'midnight'];

export const LogReviewModal: React.FC<LogReviewModalProps> = ({
  isOpen,
  onClose,
  preselectedFilmId,
  preselectedFilm,
  onSaveReview,
  currentUser,
}) => {
  const [currentFilm, setCurrentFilm] = useState<FilmType | null>(() => {
    if (preselectedFilm) return preselectedFilm;
    if (preselectedFilmId) {
      const found = FILMS.find((f) => f.id === preselectedFilmId);
      return found || null;
    }
    return null;
  });
  const [availableFilms, setAvailableFilms] = useState<FilmType[]>(FILMS);
  const [isChangingFilm, setIsChangingFilm] = useState<boolean>(
    () => !preselectedFilm && !preselectedFilmId
  );
  const [filmSearchQuery, setFilmSearchQuery] = useState('');
  const [filmSearchResults, setFilmSearchResults] = useState<FilmType[]>([]);
  const [isSearchingFilms, setIsSearchingFilms] = useState(false);
  const filmSearchRef = React.useRef<HTMLInputElement | null>(null);
  const filmSearchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredAvailableFilms = React.useMemo(() => {
    const fallbackList = Array.isArray(FILMS) ? FILMS : [];
    const baseList = (Array.isArray(availableFilms) && availableFilms.length > 0 ? availableFilms : fallbackList).filter(
      (f): f is FilmType => Boolean(f && f.id && f.title)
    );
    if (!filmSearchQuery.trim()) return baseList.slice(0, 30);
    const q = filmSearchQuery.toLowerCase().trim();
    const local = baseList.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        String(f.year || '').includes(q) ||
        (f.director && typeof f.director === 'string' && f.director.toLowerCase().includes(q)) ||
        (Array.isArray(f.genres) && f.genres.some((g) => typeof g === 'string' && g.toLowerCase().includes(q)))
    );
    const validRemote = (Array.isArray(filmSearchResults) ? filmSearchResults : []).filter(
      (f): f is FilmType => Boolean(f && f.id && f.title)
    );
    const combined = [...local, ...validRemote];
    return Array.from(new Map(combined.map((f) => [f.id, f])).values()).slice(0, 40);
  }, [filmSearchQuery, availableFilms, filmSearchResults]);

  // Debounced TMDB search
  React.useEffect(() => {
    if (!isChangingFilm) return;
    if (filmSearchTimerRef.current) clearTimeout(filmSearchTimerRef.current);
    if (!filmSearchQuery.trim() || filmSearchQuery.trim().length < 2) {
      setFilmSearchResults([]);
      return;
    }
    setIsSearchingFilms(true);
    filmSearchTimerRef.current = setTimeout(() => {
      fetch(`/api/movies?type=search&q=${encodeURIComponent(filmSearchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setFilmSearchResults(data);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearchingFilms(false));
    }, 220);
    return () => {
      if (filmSearchTimerRef.current) clearTimeout(filmSearchTimerRef.current);
    };
  }, [filmSearchQuery, isChangingFilm]);

  // Auto-focus search input when changing film
  React.useEffect(() => {
    if (isChangingFilm && filmSearchRef.current) {
      setTimeout(() => filmSearchRef.current?.focus(), 80);
    }
    if (!isChangingFilm) {
      setFilmSearchQuery('');
      setFilmSearchResults([]);
    }
  }, [isChangingFilm]);
  const [rating, setRating] = useState<number>(5.0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isRewatch, setIsRewatch] = useState<boolean>(false);
  const [watchedDate, setWatchedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reviewContent, setReviewContent] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasSpoilers, setHasSpoilers] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsChangingFilm(false);
      return;
    }
    if (preselectedFilm) {
      setCurrentFilm(preselectedFilm);
      setIsChangingFilm(false);
      return;
    }
    if (preselectedFilmId) {
      const found = FILMS.find((f) => f.id === preselectedFilmId);
      if (found) {
        setCurrentFilm(found);
        setIsChangingFilm(false);
      } else if (preselectedFilmId.startsWith('tmdb-')) {
        fetch(`/api/movies?type=detail&id=${preselectedFilmId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.title && !data.error) {
              setCurrentFilm(data);
              setIsChangingFilm(false);
            }
          })
          .catch(() => {});
      }
    } else {
      // General + LOG: User selects film from scratch
      setCurrentFilm(null);
      setIsChangingFilm(true);
    }
  }, [preselectedFilmId, preselectedFilm, isOpen]);

  React.useEffect(() => {
    fetch('/api/movies?type=now_playing')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableFilms((prev) => {
            const combined = [...data, ...prev];
            return Array.from(new Map(combined.map((f) => [f.id, f])).values());
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFilm) {
      setIsChangingFilm(true);
      return;
    }

    const authorName = currentUser?.name || 'Tamu Sinema';
    const authorRole = currentUser?.username ? `@${currentUser.username}` : '@tamu';
    const authorAvatar = currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      filmId: currentFilm.id,
      filmTitle: currentFilm.title,
      filmYear: currentFilm.year,
      filmPoster: currentFilm.posterUrl,
      authorName,
      authorRole,
      authorAvatar,
      rating,
      date: 'just now',
      formatWatched: selectedTags.includes('35mm') ? '35mm' : 'Cinema',
      isRewatch,
      isFavorite,
      content: reviewContent || 'Logged.',
      likes: 1,
      replies: 0,
      hasSpoilers,
    };

    onSaveReview(newReview);
    onClose();
  };

  const getRatingLabel = (score: number) => {
    if (score >= 5) return 'Masterpiece ★★★★★';
    if (score >= 4) return 'Sangat Bagus ★★★★';
    if (score >= 3) return 'Bagus ★★★';
    if (score >= 2) return 'Cukup ★★';
    if (score >= 1) return 'Kurang ★';
    return 'Belum dinilai';
  };

  return (
    <div
      className="modal-backdrop-cinematic"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-surface-cinema"
        style={{
          width: '100%',
          maxWidth: '540px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 23, 29, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              I WATCHED...
            </span>
            <span style={{ fontSize: '12px', color: '#8899a6', fontWeight: 600 }}>
              Log & Catatan Sinema
            </span>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn-cinema"
            title="Tutup (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Content */}
        <form
          onSubmit={handleSubmit}
          className="custom-modal-scrollbar"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          {/* Film Selection Section (Card + Integrated Searchable Dropdown) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(23, 30, 38, 0.85)',
              borderRadius: '10px',
              border: isChangingFilm || !currentFilm
                ? '1px solid rgba(0, 224, 84, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease',
              flexShrink: 0,
            }}
          >
            {/* When NO film is selected yet (Fresh + LOG flow) */}
            {!currentFilm ? (
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(0, 224, 84, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 224, 84, 0.12)',
                    border: '1px solid rgba(0, 224, 84, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00e054',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="2" y1="7" x2="7" y2="7" />
                    <line x1="2" y1="17" x2="7" y2="17" />
                    <line x1="17" y1="17" x2="22" y2="17" />
                    <line x1="17" y1="7" x2="22" y2="7" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
                    Pilih Film Terlebih Dahulu
                  </div>
                  <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                    Pilih dari katalog di bawah atau ketik judul film apa saja
                  </div>
                </div>
              </div>
            ) : (
              /* Selected Film Header Card */
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '12px',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Poster Thumbnail */}
                <div
                  style={{
                    width: '52px',
                    height: '76px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: '#0e1217',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <img
                    src={currentFilm.posterUrl}
                    alt={currentFilm.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Title & Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, margin: 0 }}>
                      {currentFilm.title}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#8899a6', fontWeight: 600 }}>
                      {currentFilm.year}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ab0c2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#677b8c' }}>Sutradara:</span>
                    <span style={{ fontWeight: 600, color: '#ccd6e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentFilm.director || 'Sinema'}
                    </span>
                  </div>

                  {/* Ganti Film Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsChangingFilm((prev) => !prev)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      marginTop: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: isChangingFilm ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 224, 84, 0.12)',
                      border: isChangingFilm ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(0, 224, 84, 0.3)',
                      color: isChangingFilm ? '#e4e8ec' : '#00e054',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      width: 'fit-content',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isChangingFilm ? (
                      <>✕ Tutup Pilihan Film</>
                    ) : (
                      <>
                        <span>⇄ Ganti Film Lain</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Dropdown Panel - Shown when changing film OR when no film is selected yet */}
            {(isChangingFilm || !currentFilm) && (
              <div
                style={{
                  borderTop: currentFilm ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  backgroundColor: '#12171e',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                }}
              >
                {/* Search Bar */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    flexShrink: 0,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={filmSearchRef}
                    type="text"
                    value={filmSearchQuery}
                    onChange={(e) => setFilmSearchQuery(e.target.value)}
                    placeholder="Ketik judul film atau sutradara..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  />
                  {filmSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFilmSearchQuery('')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      ✕ Reset
                    </button>
                  )}
                  {isSearchingFilms && (
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#00e054',
                        animation: 'spin 0.6s linear infinite',
                      }}
                    />
                  )}
                </div>

                {/* Film List with Posters */}
                <div
                  className="custom-modal-scrollbar"
                  style={{
                    height: '280px',
                    minHeight: '250px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                  }}
                >
                  {isSearchingFilms && filteredAvailableFilms.length === 0 ? (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: '#8899a6',
                        fontSize: '12px',
                      }}
                    >
                      Mencari film di katalog...
                    </div>
                  ) : filteredAvailableFilms.length === 0 ? (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: '#8899a6',
                        fontSize: '12px',
                      }}
                    >
                      Tidak ada film ditemukan untuk "{filmSearchQuery}".
                    </div>
                  ) : (
                    filteredAvailableFilms.map((f) => {
                      const isSelected = Boolean(currentFilm && f.id === currentFilm.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setCurrentFilm(f);
                            setIsChangingFilm(false);
                            setFilmSearchQuery('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            minHeight: '62px',
                            flexShrink: 0,
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(0, 224, 84, 0.12)' : 'transparent',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Poster Image */}
                          <div
                            style={{
                              width: '38px',
                              height: '54px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              backgroundColor: '#0a0d11',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {f.posterUrl ? (
                              <img
                                src={f.posterUrl}
                                alt={f.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  color: '#677b8c',
                                }}
                              >
                                Sinema
                              </div>
                            )}
                          </div>

                          {/* Film Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: isSelected ? '#00e054' : '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {f.title}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#8899a6',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {f.year} {f.director ? `• ${f.director}` : ''}
                            </div>
                          </div>

                          {/* Checkmark or Select tag */}
                          {isSelected ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#00e054',
                                backgroundColor: 'rgba(0, 224, 84, 0.15)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            >
                              TERPILIH
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#00e054',
                                fontWeight: 700,
                                flexShrink: 0,
                                backgroundColor: 'rgba(0, 224, 84, 0.08)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 224, 84, 0.2)',
                              }}
                            >
                              Pilih +
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date Watched & Rewatch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 14px',
              backgroundColor: 'rgba(18, 23, 29, 0.7)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8899a6' }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                Ditonton Pada:
              </span>
              <input
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              />
            </div>

            {/* Rewatch Toggle */}
            <button
              type="button"
              onClick={() => setIsRewatch(!isRewatch)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: isRewatch ? '#101418' : '#8899a6',
                backgroundColor: isRewatch ? '#00e054' : 'rgba(255, 255, 255, 0.05)',
                border: isRewatch ? '1px solid #00e054' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isRewatch ? '0 2px 10px rgba(0, 224, 84, 0.3)' : 'none',
              }}
            >
              {isRewatch ? '✓ REWATCH' : '↺ REWATCH'}
            </button>
          </div>

          {/* Rating Stars & Like */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'rgba(18, 23, 29, 0.7)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#8899a6', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Rating
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isFilled = activeRating >= starIdx;
                  return (
                    <button
                      key={starIdx}
                      type="button"
                      onMouseEnter={() => setHoverRating(starIdx)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(starIdx)}
                      style={{
                        padding: '2px',
                        fontSize: '22px',
                        lineHeight: 1,
                        color: isFilled ? '#f5c518' : '#2a3542',
                        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
                        cursor: 'pointer',
                        transform: hoverRating === starIdx ? 'scale(1.25)' : 'scale(1)',
                        textShadow: isFilled ? '0 0 10px rgba(245, 197, 24, 0.5)' : 'none',
                      }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#f5c518',
                  backgroundColor: 'rgba(245, 197, 24, 0.1)',
                  border: '1px solid rgba(245, 197, 24, 0.28)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {getRatingLabel(activeRating)}
              </span>
            </div>

            {/* Like */}
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: isFavorite ? '#ffffff' : '#8899a6',
                backgroundColor: isFavorite ? '#ff4060' : 'rgba(255, 255, 255, 0.05)',
                border: isFavorite ? '1px solid #ff4060' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isFavorite ? '0 2px 12px rgba(255, 64, 96, 0.35)' : 'none',
              }}
            >
              <span>{isFavorite ? '♥' : '♡'}</span>
              <span>{isFavorite ? 'DISUKAI' : 'SUKAI'}</span>
            </button>
          </div>

          {/* Review Textarea */}
          <div>
            <div className="form-label-cinema">
              <span>Ulasan & Kesan Film</span>
              <span style={{ fontSize: '10px', color: '#677b8c', textTransform: 'none', fontWeight: 500 }}>
                {reviewContent.length} karakter
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Tulis opini, analisis penyutradaraan, atau kesan menonton Anda terhadap film ini..."
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              className="form-input-cinema"
              style={{
                lineHeight: 1.6,
                resize: 'vertical',
                minHeight: '90px',
              }}
            />
          </div>

          {/* Quick Tags Selection */}
          <div>
            <div className="form-label-cinema">
              <span>Tags Sinema</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {POPULAR_TAGS.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: isSelected ? 'rgba(0, 224, 84, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#00e054' : '#8899a6',
                      border: isSelected ? '1px solid rgba(0, 224, 84, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spoilers & Bottom Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '4px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                color: hasSpoilers ? '#ffb020' : '#8899a6',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={hasSpoilers}
                onChange={(e) => setHasSpoilers(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#ff8000', cursor: 'pointer' }}
              />
              <span>Mengandung spoiler</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="form-btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!currentFilm}
                className="form-btn-primary"
                style={{
                  opacity: currentFilm ? 1 : 0.45,
                  cursor: currentFilm ? 'pointer' : 'not-allowed',
                  backgroundColor: currentFilm ? '#00e054' : '#24303c',
                  color: currentFilm ? '#0e1217' : '#8899a6',
                }}
              >
                {currentFilm ? 'Simpan Ulasan' : 'Pilih Film Terlebih Dahulu'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
