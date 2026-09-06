'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FILMS, Review, Film } from '@/data/cinemaData';
import { prefetchMovieCard } from '@/lib/prefetch';

interface DiscoverViewProps {
  onSelectFilm: (filmId: string, film?: Film) => void;
  onOpenLogModal: (filmId?: string) => void;
  reviews: Review[];
  onToggleReviewLike: (reviewId: string) => void;
  onOpenTrailer?: (filmId: string, filmTitle: string) => void;
}

const MOOD_FILTERS = [
  { id: 'all', label: 'Semua Mood' },
  { id: 'cozy', label: 'Cozy Cinema' },
  { id: 'melancholy', label: 'Melancholy & Poetic' },
  { id: 'golden-hour', label: 'Golden Hour' },
  { id: 'gems', label: 'Hidden Gems' },
];

const FORMAT_FILTERS = [
  { id: 'all', label: 'Semua Format' },
  { id: '35mm', label: '35mm Celluloid' },
  { id: 'imax', label: 'IMAX' },
  { id: 'dolby', label: 'Dolby Atmos' },
  { id: '4k', label: '4K Restored' },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectFilm,
  onOpenLogModal,
  reviews,
  onToggleReviewLike,
  onOpenTrailer,
}) => {
  const [filmsList, setFilmsList] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);
  const [activeMood, setActiveMood] = useState('all');
  const [activeFormat, setActiveFormat] = useState('all');
  const [cinemaTab, setCinemaTab] = useState<'showing' | 'upcoming' | 'curated'>('showing');
  const [watchlist, setWatchlist] = useState<Record<string, boolean>>({});
  const [isHeroHovered, setIsHeroHovered] = useState<boolean>(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  // 1. Immediately hydrate from localStorage cache on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cinehearth_discover_films');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFilmsList(parsed);
            setIsLoading(false);
          }
        } catch {}
      }
    }
  }, []);

  // 2. Fetch movies based on active tab
  useEffect(() => {
    setIsLoading(true);
    const endpoint =
      cinemaTab === 'upcoming'
        ? '/api/movies?type=trending'
        : cinemaTab === 'curated'
        ? '/api/movies?type=catalog&sort=rating'
        : '/api/movies?type=now_playing';

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        const list: Film[] = Array.isArray(data) ? data : data && data.films ? data.films : [];
        if (Array.isArray(list) && list.length > 0) {
          setFilmsList(list);
          setActiveSpotlightIdx(0);
          if (typeof window !== 'undefined' && cinemaTab === 'showing') {
            localStorage.setItem('cinehearth_discover_films', JSON.stringify(list));
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [cinemaTab]);

  const spotlightFilms = filmsList.slice(0, 4);
  const currentHeroFilm = spotlightFilms[activeSpotlightIdx] || spotlightFilms[0];

  // 3. Smooth Auto-Cycle for Hero Spotlight (paused on user hover)
  useEffect(() => {
    if (isHeroHovered || spotlightFilms.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSpotlightIdx((prev) => (prev + 1) % spotlightFilms.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHeroHovered, spotlightFilms.length]);

  const toggleWatchlist = (filmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => ({ ...prev, [filmId]: !prev[filmId] }));
  };

  const handleNextSpotlight = () => {
    if (spotlightFilms.length > 0) {
      setActiveSpotlightIdx((prev) => (prev + 1) % spotlightFilms.length);
    }
  };

  const handlePrevSpotlight = () => {
    if (spotlightFilms.length > 0) {
      setActiveSpotlightIdx((prev) => (prev - 1 + spotlightFilms.length) % spotlightFilms.length);
    }
  };

  const filteredFilms = filmsList.filter((f) => {
    // 1. Curated Mood Filter with Fallbacks
    if (activeMood !== 'all') {
      const hasMood = f.moods && Array.isArray(f.moods) && f.moods.includes(activeMood);
      if (!hasMood) {
        const g = f.genres || [];
        const matchesCozy = g.some((x) => ['Animation', 'Comedy', 'Family', 'Music', 'Romance'].includes(x));
        const matchesMelancholy = g.some((x) => ['Drama', 'Romance', 'Mystery', 'History', 'War'].includes(x));
        const matchesGoldenHour = g.some((x) => ['Adventure', 'Action', 'Fantasy', 'Sci-Fi', 'Western'].includes(x));
        const matchesGems = f.rating >= 3.8;

        if (activeMood === 'cozy' && !matchesCozy) return false;
        if (activeMood === 'melancholy' && !matchesMelancholy) return false;
        if (activeMood === 'golden-hour' && !matchesGoldenHour) return false;
        if (activeMood === 'gems' && !matchesGems) return false;
      }
    }

    // 2. Format Filter with Fallbacks
    if (activeFormat === '35mm') {
      const is35 = f.filmStock?.toLowerCase().includes('35mm') || f.genres?.some((g) => ['Drama', 'Romance', 'History'].includes(g));
      if (!is35) return false;
    } else if (activeFormat === 'imax') {
      const isImax = f.filmStock?.toLowerCase().includes('imax') || f.genres?.some((g) => ['Action', 'Sci-Fi', 'Adventure'].includes(g));
      if (!isImax) return false;
    } else if (activeFormat === 'dolby') {
      const isDolby = f.filmStock?.toLowerCase().includes('dolby') || f.genres?.some((g) => ['Action', 'Thriller', 'Music', 'Sci-Fi'].includes(g));
      if (!isDolby) return false;
    } else if (activeFormat === '4k') {
      const is4k = f.filmStock?.toLowerCase().includes('4k') || f.rating >= 3.9 || f.year < 2024;
      if (!is4k) return false;
    }

    return true;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        paddingBottom: '90px',
        backgroundColor: 'var(--bg-canvas)',
        position: 'relative',
      }}
    >
      {/* Ambient Cinema Mesh Glow (Atmosphere Enhancer) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '1200px',
          height: '600px',
          background:
            'radial-gradient(ellipse at 70% 20%, rgba(245, 197, 24, 0.08) 0%, rgba(64, 188, 244, 0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* =========================================================================
          1. CINEMA SPOTLIGHT BILLBOARD (Interactive Hero Stage)
         ========================================================================= */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: '16px',
        }}
      >
        <div className="cinema-container">
          {currentHeroFilm ? (
            <div
              className="hero-billboard-stage"
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
            >
              {/* Dynamic Backdrop with High-Fidelity Cinema Vignette */}
              <div
                key={`backdrop-${currentHeroFilm.id}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${currentHeroFilm.backdropUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 28%',
                  opacity: 0.42,
                  filter: 'saturate(1.2) brightness(0.95)',
                  transition: 'background-image 0.5s ease-in-out',
                }}
              />

              {/* Multi-Angle Gradient Masks for Deep Contrast */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, #0e1217 0%, rgba(14, 18, 23, 0.96) 42%, rgba(14, 18, 23, 0.6) 75%, rgba(14, 18, 23, 0.88) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(0deg, #0e1217 0%, rgba(14, 18, 23, 0.3) 40%, transparent 80%)',
                }}
              />

              {/* Subtle Radial Colored Ambient Light Behind Poster */}
              <div
                style={{
                  position: 'absolute',
                  right: '10%',
                  top: '20%',
                  width: '380px',
                  height: '380px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245, 197, 24, 0.18) 0%, transparent 70%)',
                  filter: 'blur(50px)',
                  pointerEvents: 'none',
                }}
              />

              {/* Billboard Content Grid */}
              <div className="hero-billboard-grid">
                {/* Left: Film Details & Cinematic Narrative */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
                  {/* Cinema Specs & Live Spotlight Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div className="badge-editorial-spotlight">
                      <span className="badge-spotlight-dot" />
                      <span>Spotlight of the Week</span>
                    </div>

                    <span className="badge-pill" style={{ fontSize: '10px', color: '#cbd5e1' }}>
                      {currentHeroFilm.filmStock.includes('35mm') ? '35MM CELLULOID' : currentHeroFilm.filmStock.includes('IMAX') ? 'IMAX 70MM' : 'DOLBY ATMOS'}
                    </span>

                    <span className="badge-pill" style={{ fontSize: '10px', color: '#94a3b8' }}>
                      13+
                    </span>

                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.01em' }}>
                      {currentHeroFilm.runtime} mins • {currentHeroFilm.genres.join(', ')}
                    </span>
                  </div>

                  {/* Main Film Title */}
                  <div>
                    <h1
                      style={{
                        fontSize: 'clamp(28px, 4vw, 42px)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        color: '#ffffff',
                        lineHeight: 1.12,
                        letterSpacing: '-0.025em',
                        textShadow: '0 2px 20px rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      {currentHeroFilm.title}
                    </h1>
                    {currentHeroFilm.originalTitle && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#8899a6',
                          fontStyle: 'italic',
                          marginTop: '4px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {currentHeroFilm.originalTitle}
                      </div>
                    )}
                  </div>

                  {/* Director & Editorial Tagline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ fontSize: '13px', color: '#a4b8c9' }}>
                      Directed by{' '}
                      <strong style={{ color: '#ffffff', fontWeight: 700 }}>
                        {currentHeroFilm.director}
                      </strong>
                    </div>
                    {currentHeroFilm.tagline && (
                      <p
                        style={{
                          fontSize: '14px',
                          fontStyle: 'italic',
                          color: '#8899a6',
                          fontFamily: 'var(--font-serif)',
                          lineHeight: 1.5,
                        }}
                      >
                        "{currentHeroFilm.tagline}"
                      </p>
                    )}
                  </div>

                  {/* Rating, Quick Rating Stars & Stats Strip */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginTop: '2px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#f5c518', fontSize: '18px', textShadow: '0 0 10px rgba(245,197,24,0.6)' }}>
                        ★
                      </span>
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          color: '#ffffff',
                        }}
                      >
                        {currentHeroFilm.rating}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8899a6' }}>
                        / 5 ({currentHeroFilm.ratingCount.toLocaleString()} votes)
                      </span>
                    </div>

                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>

                    <span style={{ fontSize: '12px', color: '#a4b8c9', fontWeight: 600, letterSpacing: '0.03em' }}>
                      {currentHeroFilm.logsCount.toLocaleString()} DIARY LOGS
                    </span>

                    {/* Interactive Quick Star Rating Strip */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginLeft: '4px',
                        padding: '3px 8px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                      title="Beri rating langsung untuk film ini"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          onClick={() => onOpenLogModal(currentHeroFilm.id)}
                          style={{
                            color:
                              (hoveredRating !== null ? star <= hoveredRating : star <= Math.round(currentHeroFilm.rating))
                                ? '#f5c518'
                                : '#445566',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons Group */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenLogModal(currentHeroFilm.id)}
                      className="btn-primary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      LOG FILM
                    </button>

                    {/* Play Trailer CTA */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTrailer) {
                          onOpenTrailer(currentHeroFilm.id, currentHeroFilm.title);
                        } else {
                          onSelectFilm(currentHeroFilm.id, currentHeroFilm);
                        }
                      }}
                      className="btn-trailer"
                      title="Putar trailer resmi film ini"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      TRAILER
                    </button>

                    <button
                      type="button"
                      onClick={(e) => toggleWatchlist(currentHeroFilm.id, e)}
                      className="btn-secondary"
                      style={{
                        color: watchlist[currentHeroFilm.id] ? '#f5c518' : '#ffffff',
                        borderColor: watchlist[currentHeroFilm.id] ? 'rgba(245, 197, 24, 0.4)' : undefined,
                      }}
                    >
                      {watchlist[currentHeroFilm.id] ? '✓ TERSIMPAN' : '+ WATCHLIST'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectFilm(currentHeroFilm.id, currentHeroFilm)}
                      className="btn-secondary"
                    >
                      DETAIL →
                    </button>
                  </div>
                </div>

                {/* Right: Featured Physical 3D Poster & Slide Carousel */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  {/* 3D Poster Framing */}
                  <div
                    onClick={() => onSelectFilm(currentHeroFilm.id, currentHeroFilm)}
                    className="hero-poster-3d"
                    title={`Klik untuk melihat detail ${currentHeroFilm.title}`}
                  >
                    <img
                      src={currentHeroFilm.posterUrl}
                      alt={currentHeroFilm.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Floating Top Rating Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 2,
                      }}
                    >
                      <span
                        className="badge-pill badge-pill-amber"
                        style={{ fontSize: '10px', padding: '3px 7px', color: '#f5c518', borderColor: 'rgba(245, 197, 24, 0.4)', backgroundColor: 'rgba(245, 197, 24, 0.12)' }}
                      >
                        ★ {currentHeroFilm.rating}
                      </span>
                    </div>

                    {/* Play Trailer Floating Watermark on Poster */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#ffffff',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {currentHeroFilm.year} • 35MM
                      </span>
                    </div>
                  </div>

                  {/* Interactive Spotlight Carousel Thumbnails */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={handlePrevSpotlight}
                      style={{
                        color: '#8899a6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        width: '24px',
                        height: '24px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Film Sebelumnya"
                    >
                      ‹
                    </button>

                    {spotlightFilms.map((film, idx) => (
                      <button
                        key={film.id}
                        type="button"
                        onClick={() => setActiveSpotlightIdx(idx)}
                        className={`hero-thumb-btn ${activeSpotlightIdx === idx ? 'active' : ''}`}
                        title={film.title}
                      >
                        <img
                          src={film.posterUrl}
                          alt={film.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={handleNextSpotlight}
                      style={{
                        color: '#8899a6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        width: '24px',
                        height: '24px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Film Berikutnya"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="hero-billboard-stage"
              style={{
                minHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ color: '#8899a6', fontSize: '13px', fontWeight: 600 }}>
                Menyiapkan Film Pilihan Sinema...
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          2. CINEMA CURATION NAVIGATOR & CATEGORY BAR
         ========================================================================= */}
      <section
        className="cinema-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Tier 1: Segmented Cinema Program Bar + Format Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Segmented Tab Controller */}
          <div className="segmented-nav-container">
            <button
              onClick={() => setCinemaTab('showing')}
              className={`segmented-nav-btn ${cinemaTab === 'showing' ? 'active' : ''}`}
            >
              Sedang Tayang
            </button>

            <button
              onClick={() => setCinemaTab('upcoming')}
              className={`segmented-nav-btn ${cinemaTab === 'upcoming' ? 'active' : ''}`}
            >
              Akan Datang
            </button>

            <button
              onClick={() => setCinemaTab('curated')}
              className={`segmented-nav-btn ${cinemaTab === 'curated' ? 'active' : ''}`}
            >
              Pilihan Editor
            </button>
          </div>

          {/* Quick Format Filter Strip */}
          <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            {FORMAT_FILTERS.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setActiveFormat(fmt.id)}
                className={`tag-pill ${activeFormat === fmt.id ? 'active' : ''}`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier 2: Curated Mood Chips & Live Title Count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            {MOOD_FILTERS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setActiveMood(mood.id)}
                className={`filter-chip ${activeMood === mood.id ? 'active' : ''}`}
              >
                {mood.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#f5c518',
                boxShadow: '0 0 8px #f5c518',
              }}
            />
            <span style={{ fontSize: '12px', color: '#8899a6', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {filteredFilms.length} Judul Tayang di CineHearth
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CINEMA FILM CARDS GRID
         ========================================================================= */}
      <section className="cinema-container">
        {filteredFilms.length === 0 && isLoading ? (
          <div className="cinema-film-grid">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="tix-card-holder animate-pulse"
                style={{
                  borderRadius: '8px',
                  minHeight: '320px',
                }}
              >
                <div style={{ aspectRatio: '2/3', backgroundColor: '#1e2632' }} />
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '14px', width: '80%', backgroundColor: '#26313f', borderRadius: '4px' }} />
                  <div style={{ height: '10px', width: '50%', backgroundColor: '#26313f', borderRadius: '4px' }} />
                  <div style={{ height: '30px', backgroundColor: '#1e2632', borderRadius: '4px', marginTop: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cinema-film-grid">
            {filteredFilms.map((film) => (
              <div
                key={film.id}
                className="tix-card-holder"
                onClick={() => onSelectFilm(film.id, film)}
                onMouseEnter={() => prefetchMovieCard(film.posterUrl, film.backdropUrl)}
                style={{ cursor: 'pointer' }}
              >
                {/* Poster Container with Floating Badges & Hover Actions */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '2/3',
                    width: '100%',
                    overflow: 'hidden',
                    backgroundColor: '#161d24',
                  }}
                >
                  <img
                    className="poster-img"
                    src={film.posterUrl}
                    alt={film.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />

                  {/* Top-Left Film Format Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      gap: '4px',
                      zIndex: 3,
                    }}
                  >
                    <span className="badge-pill" style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {film.filmStock.includes('35mm') ? '35MM' : '2D'}
                    </span>
                  </div>

                  {/* Top-Right Watchlist Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleWatchlist(film.id, e)}
                    title={watchlist[film.id] ? 'Hapus dari Watchlist' : 'Simpan ke Watchlist'}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(14, 18, 23, 0.85)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: watchlist[film.id] ? '#f5c518' : '#8899a6',
                      fontSize: '13px',
                      fontWeight: 700,
                      zIndex: 3,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {watchlist[film.id] ? '✓' : '+'}
                  </button>

                  {/* Hover Quick Action Buttons Overlay */}
                  <div className="card-quick-actions">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLogModal(film.id);
                      }}
                      className="btn-primary"
                      style={{ width: '100%', padding: '6px 0', fontSize: '11px' }}
                    >
                      + LOG FILM
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenTrailer) {
                          onOpenTrailer(film.id, film.title);
                        } else {
                          onSelectFilm(film.id, film);
                        }
                      }}
                      className="btn-trailer"
                      style={{ width: '100%', padding: '6px 0', fontSize: '11px' }}
                    >
                      ▶ TRAILER
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFilm(film.id, film);
                      }}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '6px 0', fontSize: '11px' }}
                    >
                      DETAIL →
                    </button>
                  </div>

                  {/* Bottom Poster Gradient Scrim with Star Rating */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '20px 10px 8px',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(14, 18, 23, 0.95) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#f5c518', fontSize: '12px', fontWeight: 800 }}>★</span>
                      <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                        {film.rating}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#8899a6' }}>
                      {film.logsCount.toLocaleString()} logs
                    </span>
                  </div>
                </div>

                {/* Card Lower Content Area */}
                <div
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    gap: '12px',
                    backgroundColor: '#141a22',
                  }}
                >
                  {/* Title & Meta Details */}
                  <div>
                    <h3
                      className="line-clamp-2"
                      style={{
                        fontSize: '14px',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.35,
                        minHeight: '38px',
                      }}
                    >
                      {film.title}
                    </h3>

                    <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '5px' }}>
                      {film.genres[0]} • {film.year}
                    </div>

                    <div style={{ fontSize: '11px', color: '#677b8c', marginTop: '2px' }}>
                      Dir. {film.director}
                    </div>
                  </div>

                  {/* Anchored Bottom Action Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLogModal(film.id);
                      }}
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        padding: '7px 0',
                        fontSize: '11px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
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
      </section>

      {/* =========================================================================
          4. COMMUNITY REVIEWS FEED ("KATA PENONTON / ULASAN TERPOPULER")
         ========================================================================= */}
      <section
        style={{
          maxWidth: 'var(--max-width)',
          margin: '12px auto 0',
          padding: '0 20px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#00e054',
                fontWeight: 800,
              }}
            >
              KOMUNITAS & KATA PENONTON
            </span>
            <h2
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                color: '#ffffff',
                marginTop: '2px',
              }}
            >
              Ulasan Film Terpopuler Pekan Ini
            </h2>
          </div>

          <button
            onClick={() => onOpenLogModal()}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '11px' }}
          >
            + TULIS ULASAN
          </button>
        </div>

        {reviews.length > 0 ? (
          <div className="reviews-two-col-grid">
            {reviews.map((rev, idx) => (
              <div
                key={`${rev.id}-${idx}`}
                className="tactile-card"
                style={{
                  padding: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '16px',
                  alignItems: 'start',
                  backgroundColor: 'linear-gradient(180deg, #182029 0%, #13181f 100%)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Poster Thumbnail */}
                <div
                  onClick={() => onSelectFilm(rev.filmId)}
                  style={{
                    width: '60px',
                    aspectRatio: '2/3',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <img
                    src={rev.filmPoster}
                    alt={rev.filmTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Review Body */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Author Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={rev.authorAvatar}
                        alt={rev.authorName}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {rev.authorName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#677b8c' }}>
                        {rev.authorRole}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#f5c518', fontSize: '12px', textShadow: '0 0 6px rgba(245, 197, 24, 0.4)' }}>
                        {'★'.repeat(Math.floor(rev.rating))}
                      </span>
                      <span style={{ fontSize: '11px', color: '#677b8c' }}>• {rev.date}</span>
                    </div>
                  </div>

                  {/* Film Title */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      onClick={() => onSelectFilm(rev.filmId)}
                      style={{
                        fontSize: '15px',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        color: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      {rev.filmTitle}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8899a6' }}>({rev.filmYear})</span>
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: '13px', color: '#a4b8c9', lineHeight: 1.6 }}>
                    {rev.content}
                  </p>

                  {/* Footer Reactions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#8899a6',
                    }}
                  >
                    <button
                      onClick={() => onToggleReviewLike(rev.id)}
                      style={{
                        color: rev.isFavorite ? '#ff4060' : '#8899a6',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {rev.isFavorite ? '♥' : '♡'} {rev.likes} menyukai
                    </button>
                    <span>{rev.replies} balasan</span>
                    <span>Format: {rev.formatWatched}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="tactile-card"
            style={{
              padding: '42px 24px',
              textAlign: 'center',
              backgroundColor: '#161d24',
              borderRadius: '8px',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              Belum Ada Ulasan Komunitas
            </h3>
            <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
              Jadilah penonton pertama yang mencatat dan membagikan ulasan film di CineHearth!
            </p>
            <button
              onClick={() => onOpenLogModal()}
              className="btn-primary"
              style={{ marginTop: '6px', padding: '8px 20px', fontSize: '12px' }}
            >
              + TULIS ULASAN PERTAMA
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
