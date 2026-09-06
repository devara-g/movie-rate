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
  const [currentFilm, setCurrentFilm] = useState<FilmType>(() => {
    if (preselectedFilm) return preselectedFilm;
    const found = FILMS.find((f) => f.id === preselectedFilmId);
    return found || FILMS[0];
  });
  const [availableFilms, setAvailableFilms] = useState<FilmType[]>(FILMS);
  const [isChangingFilm, setIsChangingFilm] = useState<boolean>(false);
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
    if (preselectedFilm) {
      setCurrentFilm(preselectedFilm);
      return;
    }
    if (preselectedFilmId) {
      const found = FILMS.find((f) => f.id === preselectedFilmId);
      if (found) {
        setCurrentFilm(found);
      } else if (preselectedFilmId.startsWith('tmdb-')) {
        fetch(`/api/movies?type=detail&id=${preselectedFilmId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.title && !data.error) setCurrentFilm(data);
          })
          .catch(() => {});
      }
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
        className="modal-surface-cinema custom-modal-scrollbar"
        style={{
          width: '100%',
          maxWidth: '540px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
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
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Film Summary Card */}
          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '12px',
              backgroundColor: 'rgba(27, 34, 42, 0.65)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '90px',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#12171d',
                boxShadow: '0 8px 18px rgba(0, 0, 0, 0.5)',
              }}
            >
              <img
                src={currentFilm.posterUrl}
                alt={currentFilm.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, margin: 0 }}>
                  {currentFilm.title}
                </h2>
                <span style={{ fontSize: '13px', color: '#8899a6', fontWeight: 600 }}>
                  {currentFilm.year}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#9ab0c2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#677b8c' }}>Sutradara:</span>
                <span style={{ fontWeight: 600, color: '#ccd6e0' }}>{currentFilm.director}</span>
              </div>

              {isChangingFilm ? (
                <div style={{ marginTop: '6px' }}>
                  <select
                    value={currentFilm.id}
                    onChange={(e) => {
                      const sel = availableFilms.find((f) => f.id === e.target.value);
                      if (sel) setCurrentFilm(sel);
                      setIsChangingFilm(false);
                    }}
                    className="form-input-cinema"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    {availableFilms.map((f) => (
                      <option key={f.id} value={f.id} style={{ backgroundColor: '#181f26', color: '#ffffff' }}>
                        {f.title} ({f.year})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsChangingFilm(true)}
                  style={{
                    fontSize: '11px',
                    color: '#00e054',
                    textAlign: 'left',
                    marginTop: '4px',
                    padding: 0,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ⇄ Ganti Film Lain
                </button>
              )}
            </div>
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#8899a6', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Rating
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
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
                        color: isFilled ? '#00e054' : '#334150',
                        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
                        cursor: 'pointer',
                        transform: hoverRating === starIdx ? 'scale(1.25)' : 'scale(1)',
                        textShadow: isFilled ? '0 0 10px rgba(0, 224, 84, 0.45)' : 'none',
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
                  color: '#00e054',
                  backgroundColor: 'rgba(0, 224, 84, 0.1)',
                  border: '1px solid rgba(0, 224, 84, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginLeft: '4px',
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
                className="form-btn-primary"
              >
                Simpan Ulasan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
