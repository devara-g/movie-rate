'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FILMS, CURATED_LISTS, Film as FilmType } from '@/data/cinemaData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFilm: (filmId: string, film?: FilmType) => void;
  onSelectList: (listId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectFilm,
  onSelectList,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [trendingFilms, setTrendingFilms] = useState<FilmType[]>([]);
  const [searchResults, setSearchResults] = useState<FilmType[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch('/api/movies?type=trending')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const top = data.slice(0, 8);
          setTrendingFilms(top);
          if (!query.trim()) {
            setSearchResults(top);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(trendingFilms);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      fetch(`/api/movies?type=search&q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSearchResults(data);
          } else {
            // Local fallback filter
            const fallback = FILMS.filter(
              (f) =>
                f.title.toLowerCase().includes(query.toLowerCase()) ||
                f.director.toLowerCase().includes(query.toLowerCase()) ||
                f.genres.some((g) => g.toLowerCase().includes(query.toLowerCase()))
            );
            setSearchResults(fallback);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 280);

    return () => clearTimeout(timeout);
  }, [query, trendingFilms]);

  if (!isOpen) return null;

  const filteredFilms = searchResults;

  return (
    <div
      className="modal-backdrop-cinematic"
      style={{
        alignItems: 'flex-start',
        paddingTop: '70px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-surface-cinema custom-modal-scrollbar"
        style={{
          width: '100%',
          maxWidth: '580px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(18, 23, 29, 0.95)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari film, sutradara, genre, atau aktor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#ffffff',
              outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                color: '#8899a6',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
              }}
            >
              Hapus
            </button>
          )}
          <kbd
            style={{
              padding: '3px 7px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#8899a6',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#677b8c', padding: '8px 12px', letterSpacing: '0.08em' }}>
            Hasil Pencarian ({filteredFilms.length})
          </div>
          {filteredFilms.map((film) => (
            <button
              key={film.id}
              onClick={() => {
                onSelectFilm(film.id, film);
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                gap: '12px',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '48px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#12171d',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <img
                    src={film.posterUrl}
                    alt={film.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {film.title} <span style={{ color: '#8899a6', fontWeight: 400, fontSize: '12px' }}>({film.year})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ab0c2', marginTop: '2px' }}>
                    Dir. {film.director} • {film.genres.join(', ')}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#00e054',
                  backgroundColor: 'rgba(0, 224, 84, 0.1)',
                  border: '1px solid rgba(0, 224, 84, 0.25)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                ★ {film.rating}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
