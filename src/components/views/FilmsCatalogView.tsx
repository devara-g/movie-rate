'use client';

import React, { useState } from 'react';
import { FILMS, Film } from '@/data/cinemaData';
import { prefetchMovieCard } from '@/lib/prefetch';

interface FilmsCatalogViewProps {
  onSelectFilm: (filmId: string, film?: Film) => void;
  onOpenLogModal: (filmId?: string) => void;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  pages.push(1);
  if (current > 3) {
    pages.push('...');
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push('...');
  }
  pages.push(total);
  return pages;
}

export const FilmsCatalogView: React.FC<FilmsCatalogViewProps> = ({
  onSelectFilm,
  onOpenLogModal,
}) => {
  const [filmsList, setFilmsList] = useState<Film[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDecade, setSelectedDecade] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'popular' | 'year' | 'logs' | 'title'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'wall' | 'list'>('grid');
  const [watchlist, setWatchlist] = useState<Record<string, boolean>>({});

  const genres = [
    'all',
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Thriller',
  ];

  const decades = [
    { id: 'all', label: 'Semua Periode' },
    { id: '2020s', label: '2020-an' },
    { id: '2010s', label: '2010-an' },
    { id: '2000s', label: '2000-an' },
    { id: '1990s', label: '1990-an' },
    { id: '1980s', label: '1980-an' },
    { id: 'classic', label: 'Klasik (<1980)' },
  ];

  React.useEffect(() => {
    setIsLoading(true);
    fetch(
      `/api/movies?type=catalog&page=${currentPage}&genre=${selectedGenre}&sort=${sortBy}&decade=${selectedDecade}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.films) && data.films.length > 0) {
          setFilmsList(data.films);
          setTotalPages(data.totalPages || 1);
          setTotalResults(data.totalResults || data.films.length);
        } else if (data && Array.isArray(data)) {
          setFilmsList(data);
          setTotalPages(1);
          setTotalResults(data.length);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentPage, selectedGenre, sortBy, selectedDecade]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const toggleWatchlist = (filmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => ({ ...prev, [filmId]: !prev[filmId] }));
  };

  const filteredFilms = filmsList;

  return (
    <div
      style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '28px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: '#14181c',
      }}
    >
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
            KATALOG BIOSKOP
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
            Daftar Film
          </h1>
          <p style={{ fontSize: '13px', color: '#8899a6' }}>
            Menampilkan {filteredFilms.length} judul mahakarya sinematik
          </p>
        </div>

        {/* View Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1b2228',
            padding: '3px',
            borderRadius: '4px',
            border: '1px solid #2c3642',
          }}
        >
          {(
            [
              { id: 'grid', label: 'Grid Tiket' },
              { id: 'wall', label: 'Poster Wall' },
              { id: 'list', label: 'List Tiket' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: viewMode === m.id ? '#ffffff' : '#8899a6',
                backgroundColor: viewMode === m.id ? '#2c3642' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div
        className="tactile-card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: '#1b2228',
          borderRadius: '6px',
        }}
      >
        {/* Decades pills */}
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
          {decades.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDecade(d.id);
                setCurrentPage(1);
              }}
              className={`filter-chip ${selectedDecade === d.id ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#212932',
              border: '1px solid #333f4d',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g === 'all' ? 'Semua Genre' : g}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#212932',
              border: '1px solid #333f4d',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="rating">Rating Tertinggi</option>
            <option value="popular">Paling Populer</option>
            <option value="year">Tahun Rilis</option>
            <option value="logs">Paling Banyak Dilog</option>
            <option value="title">Judul (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 1. TIX ID Card Holders Grid */}
      {viewMode === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredFilms.map((film) => (
            <div
              key={film.id}
              className="tix-card-holder"
              onClick={() => onSelectFilm(film.id, film)}
              onMouseEnter={() => prefetchMovieCard(film.posterUrl, film.backdropUrl)}
              style={{ cursor: 'pointer' }}
            >
              {/* Poster frame with floating badge & watchlist */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  width: '100%',
                  overflow: 'hidden',
                  backgroundColor: '#1b2228',
                }}
              >
                <img
                  src={film.posterUrl}
                  alt={film.title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Floating format badge */}
                <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  <span className="badge-pill" style={{ fontSize: '9px', padding: '2px 5px' }}>
                    {film.filmStock.includes('35mm') ? '35MM' : '2D'}
                  </span>
                </div>

                {/* Watchlist toggle */}
                <button
                  type="button"
                  onClick={(e) => toggleWatchlist(film.id, e)}
                  title={watchlist[film.id] ? 'Tersimpan' : 'Simpan'}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(20, 24, 28, 0.85)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: watchlist[film.id] ? '#00e054' : '#8899a6',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {watchlist[film.id] ? '✓' : '+'}
                </button>

                {/* Rating ribbon */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px 8px 6px',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.92) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#f5c518', fontSize: '11px', fontWeight: 800 }}>★</span>
                    <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 800 }}>
                      {film.rating}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#8899a6' }}>
                    {film.logsCount.toLocaleString()} logs
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  gap: '10px',
                  backgroundColor: '#1b2228',
                }}
              >
                <div>
                  <h3
                    className="line-clamp-2"
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.35,
                      minHeight: '38px',
                    }}
                  >
                    {film.title}
                  </h3>

                  <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '4px' }}>
                    {film.genres[0]} • {film.year} • {film.runtime}m
                  </div>

                  <div style={{ fontSize: '11px', color: '#677b8c', marginTop: '2px' }}>
                    Dir. {film.director}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLogModal(film.id);
                    }}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '7px 0',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      borderRadius: '3px',
                    }}
                  >
                    + LOG FILM
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Poster Wall Mode */}
      {viewMode === 'wall' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px',
          }}
        >
          {filteredFilms.map((film) => (
            <div
              key={film.id}
              onClick={() => onSelectFilm(film.id, film)}
              className="film-poster"
              style={{ cursor: 'pointer', borderRadius: '4px', border: '1px solid #2c3642' }}
            >
              <img src={film.posterUrl} alt={film.title} loading="lazy" />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '6px 8px',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.92) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              >
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                  {film.title}
                </span>
                <span style={{ color: '#f5c518', fontWeight: 700 }}>★ {film.rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Detailed List Mode (Ticket Rows) */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredFilms.map((film) => (
            <div
              key={film.id}
              onClick={() => onSelectFilm(film.id, film)}
              className="tactile-card"
              style={{
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                backgroundColor: '#1b2228',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '42px',
                    aspectRatio: '2/3',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #2c3642',
                  }}
                >
                  <img
                    src={film.posterUrl}
                    alt={film.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                      {film.title}
                    </span>
                    <span style={{ fontSize: '12px', color: '#677b8c' }}>({film.year})</span>
                    <span className="badge-pill" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {film.filmStock.includes('35mm') ? '35MM' : '2D'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8899a6', marginTop: '2px' }}>
                    Sutradara: {film.director} • {film.runtime} mins • {film.genres.join(', ')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#00e054' }}>
                    ★ {film.rating}
                  </div>
                  <div style={{ fontSize: '11px', color: '#677b8c' }}>
                    {film.logsCount.toLocaleString()} logs
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLogModal(film.id);
                  }}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '11px' }}
                >
                  + LOG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Elegant Pagination Control Bar */}
      <div
        style={{
          marginTop: '12px',
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: '#1b2228',
          border: '1px solid #2c3642',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '13px', color: '#8899a6' }}>
          Halaman <strong style={{ color: '#ffffff' }}>{currentPage}</strong> dari{' '}
          <strong style={{ color: '#ffffff' }}>{totalPages}</strong>{' '}
          <span style={{ color: '#677b8c', fontSize: '12px' }}>
            ({totalResults.toLocaleString()} judul film di database TMDB)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              opacity: currentPage <= 1 ? 0.35 : 1,
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← SEBELUMNYA
          </button>

          {/* Numbered Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {getPageNumbers(currentPage, totalPages).map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`dots-${idx}`}
                    style={{ padding: '0 4px', color: '#677b8c', fontSize: '12px', fontWeight: 700 }}
                  >
                    …
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  style={{
                    minWidth: '32px',
                    height: '32px',
                    padding: '0 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: isActive ? '#00e054' : '#212932',
                    color: isActive ? '#14181c' : '#ffffff',
                    border: isActive ? '1px solid #00e054' : '1px solid #2c3642',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || isLoading}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              opacity: currentPage >= totalPages ? 0.35 : 1,
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            SELANJUTNYA →
          </button>
        </div>
      </div>
    </div>
  );
};
