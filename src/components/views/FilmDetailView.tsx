'use client';

import React, { useState, useEffect } from 'react';
import { FILMS, Review, Film } from '@/data/cinemaData';

interface FilmDetailViewProps {
  filmId: string;
  initialFilm?: Film | null;
  onBack: () => void;
  onSelectFilm: (filmId: string, film?: Film) => void;
  onOpenLogModal: (filmId?: string) => void;
  reviews: Review[];
  onToggleReviewLike: (reviewId: string) => void;
  onOpenTrailer: (filmId: string, filmTitle: string) => void;
  onOpenPerson: (personName: string) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (filmId: number, filmTitle: string, filmPoster: string) => void;
  onOpenPublicProfile?: (usernameOrId: string) => void;
  onOpenComments?: (review: Review) => void;
}

export const FilmDetailView: React.FC<FilmDetailViewProps> = ({
  filmId,
  initialFilm,
  onBack,
  onSelectFilm,
  onOpenLogModal,
  reviews,
  onToggleReviewLike,
  onOpenTrailer,
  onOpenPerson,
  isWatchlisted,
  onToggleWatchlist,
  onOpenPublicProfile,
  onOpenComments,
}) => {
  const [film, setFilm] = useState<Film>(() => {
    return initialFilm || FILMS.find((f) => f.id === filmId) || FILMS[0];
  });
  const [similarFilms, setSimilarFilms] = useState<Film[]>([]);
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchProviders, setWatchProviders] = useState<any | null>(null);

  useEffect(() => {
    // 1. Instantly set initial film for immediate smooth rendering without flicker
    if (initialFilm && initialFilm.id === filmId) {
      setFilm(initialFilm);
    } else {
      const localFound = FILMS.find((f) => f.id === filmId);
      if (localFound) {
        setFilm(localFound);
      }
    }

    // 2. Fetch full real details (credits, director, cast, stats) from TMDB
    fetch(`/api/movies?type=detail&id=${filmId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title && !data.error) {
          setFilm(data);
        }
      })
      .catch((err) => console.warn('Film detail fetch error:', err));

    // 3. Fetch real matching recommendations for this film from TMDB
    fetch(`/api/movies?type=recommendations&id=${filmId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSimilarFilms(data.filter((f: Film) => f.id !== filmId).slice(0, 6));
        }
      })
      .catch(() => {});

    // 4. Fetch official watch providers in Indonesia from TMDB
    fetch(`/api/movies?type=providers&id=${filmId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setWatchProviders(data);
        } else {
          setWatchProviders(null);
        }
      })
      .catch(() => setWatchProviders(null));
  }, [filmId, initialFilm]);

  const filmReviews = reviews.filter((r) => r.filmId === film.id);
  const maxDistribution = film.scoreDistribution && film.scoreDistribution.length > 0
    ? Math.max(...film.scoreDistribution)
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: '80px', backgroundColor: '#14181c' }}>
      {/* Top Banner Still with Film Backdrop */}
      <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', backgroundColor: '#1b2228' }}>
        <img
          src={film.backdropUrl}
          alt={film.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(20,24,28,0.2) 0%, rgba(20,24,28,0.85) 65%, #14181c 100%)',
          }}
        />

        {/* Back Navigation Button */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
          }}
        >
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              backgroundColor: 'rgba(20, 24, 28, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
          >
            ← KEMBALI KE KATALOG
          </button>
        </div>
      </div>

      {/* Main Info Container */}
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '-120px auto 0',
          padding: '0 20px',
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          className="tactile-card"
          style={{
            padding: '28px',
            backgroundColor: '#1b2228',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 1fr',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Master Poster & Action Card Holder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '2/3',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              }}
            >
              <img src={film.posterUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                <span className="badge-pill badge-pill-green">
                  {film.filmStock.includes('35mm') ? '35MM PRINT' : '2D CINEMA'}
                </span>
              </div>
            </div>

            {/* Primary Action Button (TIX ID Signature Style) */}
            <button
              onClick={() => onOpenLogModal(film.id)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px 0', fontSize: '12px', letterSpacing: '0.04em' }}
            >
              + LOG FILM INI
            </button>

            {/* Watch Trailer Button */}
            <button
              onClick={() => onOpenTrailer(film.id, film.title)}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '9px 0',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderColor: '#ff4060',
                color: '#ffffff',
                backgroundColor: 'rgba(255, 64, 96, 0.1)',
              }}
            >
              <span style={{ color: '#ff4060', fontSize: '13px' }}>▶</span> TONTON TRAILER RESMI
            </button>

            {/* Secondary Action Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => {
                  const numId = parseInt(film.id.replace('tmdb-', ''), 10) || 0;
                  onToggleWatchlist(numId, film.title, film.posterUrl);
                }}
                className="btn-secondary"
                style={{
                  padding: '8px',
                  fontSize: '11px',
                  color: isWatchlisted ? '#00e054' : '#ffffff',
                  borderColor: isWatchlisted ? '#00e054' : '#333f4d',
                  backgroundColor: isWatchlisted ? 'rgba(0, 224, 84, 0.1)' : 'transparent',
                }}
              >
                {isWatchlisted ? '✓ TERSIMPAN' : '+ WATCHLIST'}
              </button>

              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="btn-secondary"
                style={{
                  padding: '8px',
                  fontSize: '11px',
                  color: isFavorite ? '#ff4060' : '#ffffff',
                  borderColor: isFavorite ? '#ff4060' : '#333f4d',
                }}
              >
                {isFavorite ? '♥ FAVORIT' : '♡ FAVORIT'}
              </button>
            </div>
          </div>

          {/* Right Column: Metadata, Rating Histogram, Specs, Synopsis, Cast */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Title & Director */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8899a6', fontSize: '13px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{film.year}</span>
                <span>•</span>
                <span>{film.runtime} mins</span>
                <span>•</span>
                <span>{film.distribution}</span>
                <span>•</span>
                <span className="badge-pill" style={{ fontSize: '10px' }}>13+</span>
              </div>

              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}>
                {film.title}
              </h1>
              {film.originalTitle && (
                <div style={{ fontSize: '13px', color: '#8899a6', fontStyle: 'italic', marginTop: '2px' }}>
                  {film.originalTitle}
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#8899a6', marginTop: '6px' }}>
                Disutradarai oleh{' '}
                <button
                  type="button"
                  onClick={() => onOpenPerson(film.director)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px',
                  }}
                  title={`Lihat profil dan filmografi ${film.director}`}
                >
                  {film.director}
                </button>
              </div>
            </div>

            {/* Tagline */}
            <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#9ab0c2' }}>
              "{film.tagline}"
            </p>

            {/* Rating Breakdown & Interactive Histogram */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '6px',
                backgroundColor: '#212932',
                border: '1px solid #2c3642',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: '#f5c518', fontSize: '20px', textShadow: '0 0 10px rgba(245, 197, 24, 0.5)' }}>★</span>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff' }}>
                    {film.rating}
                  </span>
                  <span style={{ fontSize: '12px', color: '#8899a6' }}>
                    / 5 ({film.ratingCount.toLocaleString()} penilaian penonton)
                  </span>
                </div>

                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#677b8c', fontWeight: 700 }}>
                  Distribusi Skor
                </span>
              </div>

              {/* Histogram Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '48px' }}>
                {film.scoreDistribution.map((count, idx) => {
                  const ratingScore = ((idx + 1) * 0.5).toFixed(1);
                  const heightPercent = Math.max(10, Math.round((count / maxDistribution) * 100));
                  const isHovered = hoveredBin === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredBin(idx)}
                      onMouseLeave={() => setHoveredBin(null)}
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-24px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '2px 6px',
                            backgroundColor: '#000000',
                            color: '#00e054',
                            borderRadius: '2px',
                            fontSize: '10px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                          }}
                        >
                          {ratingScore} ★ ({count.toLocaleString()})
                        </div>
                      )}
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          backgroundColor: isHovered ? '#ffffff' : '#00e054',
                          borderRadius: '1px 1px 0 0',
                          transition: 'background-color 0.1s',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Specifications 3-Card Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '4px', backgroundColor: '#212932', border: '1px solid #2c3642' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#677b8c', fontWeight: 700 }}>
                  Aspek Rasio
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                  {film.aspectRatio}
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '4px', backgroundColor: '#212932', border: '1px solid #2c3642' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#677b8c', fontWeight: 700 }}>
                  Format Film
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                  {film.filmStock}
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '4px', backgroundColor: '#212932', border: '1px solid #2c3642' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#677b8c', fontWeight: 700 }}>
                  Sinematografi
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                  {film.cinematographer}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, color: '#8899a6', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Sinopsis Film
              </h3>
              <p style={{ fontSize: '14px', color: '#9ab0c2', lineHeight: 1.65 }}>
                {film.synopsis}
              </p>
            </div>

            {/* Cast Members */}
            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, color: '#8899a6', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Pemeran Utama
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {film.cast.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onOpenPerson(c.name)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: '#212932',
                      border: '1px solid #2c3642',
                      fontSize: '12px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2c3642')}
                    title={`Lihat filmografi ${c.name}`}
                  >
                    <strong>{c.name}</strong> <span style={{ color: '#8899a6' }}>sebagai {c.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Where to Watch in Indonesia (Streaming Providers & Bioskop) */}
      <section
        style={{
          maxWidth: 'var(--max-width)',
          margin: '28px auto 0',
          padding: '0 20px',
          width: '100%',
        }}
      >
        <div
          className="tactile-card"
          style={{
            padding: '20px 24px',
            backgroundColor: '#1b2228',
            borderRadius: '8px',
            border: '1px solid #2c3642',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(0, 224, 84, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="15" x="2" y="7" rx="2" ry="2"/>
                  <polyline points="17 2 12 7 7 2"/>
                </svg>
              </div>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e054', fontWeight: 700 }}>
                  TEMPAT MENONTON • INDONESIA
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Platform Streaming & Bioskop Resmi
                </h3>
              </div>
            </div>

            {watchProviders?.link && (
              <a
                href={watchProviders.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px', color: '#00e054', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Cek Info Lengkap di TMDB →
              </a>
            )}
          </div>

          {/* Providers list */}
          {watchProviders && (watchProviders.flatrate?.length > 0 || watchProviders.rent?.length > 0 || watchProviders.buy?.length > 0) ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {watchProviders.flatrate?.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8899a6', fontWeight: 700, marginBottom: '6px' }}>
                    Langganan (Stream)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {Array.from(
                      new Map((watchProviders.flatrate || []).map((p: any) => [p.provider_id, p])).values()
                    ).map((p: any) => (
                      <div
                        key={`flatrate-${p.provider_id ?? p.provider_name}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          backgroundColor: '#212932',
                          borderRadius: '6px',
                          border: '1px solid #333f4d',
                        }}
                        title={p.provider_name}
                      >
                        {p.logo_path && (
                          <img src={p.logo_path} alt={p.provider_name} style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(watchProviders.rent?.length > 0 || watchProviders.buy?.length > 0) && (
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8899a6', fontWeight: 700, marginBottom: '6px' }}>
                    Sewa / Beli Digital
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {Array.from(
                      new Map(
                        [...(watchProviders.rent || []), ...(watchProviders.buy || [])].map((p: any) => [p.provider_id, p])
                      ).values()
                    ).slice(0, 4).map((p: any) => (
                      <div
                        key={`rent-buy-${p.provider_id ?? p.provider_name}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          backgroundColor: '#212932',
                          borderRadius: '6px',
                          border: '1px solid #333f4d',
                        }}
                        title={p.provider_name}
                      >
                        {p.logo_path && (
                          <img src={p.logo_path} alt={p.provider_name} style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#212932',
                  borderRadius: '6px',
                  border: '1px solid #333f4d',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00e054' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  Jaringan Bioskop XXI / CGV / Cinepolis
                </span>
                <span style={{ fontSize: '10px', color: '#8899a6' }}>(Tayang Layar Lebar)</span>
              </div>
              <span style={{ fontSize: '12px', color: '#8899a6' }}>
                Ketersediaan streaming digital untuk wilayah Indonesia akan diperbarui otomatis sesuai jadwal rilis platform.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* User Reviews Section */}
      <section
        style={{
          maxWidth: 'var(--max-width)',
          margin: '36px auto 0',
          padding: '0 20px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
              KATA PENONTON
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
              Ulasan untuk {film.title}
            </h2>
          </div>
          <button
            onClick={() => onOpenLogModal(film.id)}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '11px' }}
          >
            + TULIS ULASAN
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filmReviews.length === 0 ? (
            <div className="tactile-card" style={{ padding: '24px', textAlign: 'center', color: '#677b8c', fontSize: '13px', backgroundColor: '#1b2228' }}>
              Belum ada ulasan untuk film ini. Jadilah yang pertama memberikan ulasan!
            </div>
          ) : (
            filmReviews.map((rev) => (
              <div
                key={rev.id}
                className="tactile-card"
                style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#1b2228', borderRadius: '6px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div
                    onClick={() => {
                      if (onOpenPublicProfile) {
                        onOpenPublicProfile(rev.authorRole?.replace('@', '') || rev.authorName);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: onOpenPublicProfile ? 'pointer' : 'default' }}
                    title={`Lihat profil publik ${rev.authorName}`}
                  >
                    <img
                      src={rev.authorAvatar}
                      alt={rev.authorName}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>
                      {rev.authorName}
                    </span>
                    <span style={{ fontSize: '11px', color: '#677b8c' }}>
                      {rev.date} • Ditonton di format {rev.formatWatched}
                    </span>
                  </div>

                  <span style={{ color: '#00e054', fontSize: '12px', fontWeight: 700 }}>
                    {'★'.repeat(Math.floor(rev.rating))} {rev.rating}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#9ab0c2', lineHeight: 1.6, margin: 0 }}>
                  {rev.content}
                </p>

                {/* Bottom Card Actions: Discussion Comments + Likes */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #242c34' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenComments) onOpenComments(rev);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8899a6',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#00e054')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#8899a6')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                    </svg>
                    Diskusi / Komentar
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleReviewLike(rev.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: rev.isFavorite ? '#ff4060' : '#8899a6',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <span>{rev.isFavorite ? '♥' : '♡'}</span> {rev.likes}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Similar Titles Showcase */}
      {similarFilms.length > 0 && (
        <section
          style={{
            maxWidth: 'var(--max-width)',
            margin: '36px auto 0',
            padding: '0 20px',
            width: '100%',
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
              REKOMENDASI TERKAIT
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              Jika Anda Menyukai {film.title}
            </h2>
            <p style={{ fontSize: '12px', color: '#8899a6', marginTop: '2px' }}>
              Rekomendasi tematik dan sinematik berdasarkan preferensi penonton di database TMDB
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {similarFilms.map((sf) => (
              <div
                key={sf.id}
                onClick={() => onSelectFilm(sf.id, sf)}
                className="tix-card-holder"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                  <img
                    src={sf.posterUrl}
                    alt={sf.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.92) 100%)',
                      color: '#00e054',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                      {sf.title}
                    </span>
                    <span>★ {sf.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
