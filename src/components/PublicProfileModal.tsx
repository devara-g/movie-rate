'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, cleanPosterUrl, getPublicUserProfile } from '@/lib/supabase';
import { MovieLog } from '@/types/database';

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userIdOrUsername: string | null;
  onSelectFilm: (filmId: string) => void;
  currentUser: UserProfile | null;
  onOpenChatWithUser?: (user: { id: string; display_name: string; username: string; avatar_url: string }) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  isOpen,
  onClose,
  userIdOrUsername,
  onSelectFilm,
  currentUser,
  onOpenChatWithUser,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MovieLog[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !userIdOrUsername) return;

    setIsLoading(true);
    getPublicUserProfile(userIdOrUsername).then((res) => {
      if (res) {
        setProfile(res.profile);
        setLogs(res.logs || []);
        setFavorites(res.favorites || []);
      }
      setIsLoading(false);
    });
  }, [isOpen, userIdOrUsername]);

  if (!isOpen || !userIdOrUsername) return null;

  const totalFilms = logs.length;
  const totalReviews = logs.filter((l) => l.review_text && l.review_text.trim()).length;
  const avgRating = logs.length > 0
    ? (logs.reduce((acc, curr) => acc + Number(curr.rating), 0) / logs.length).toFixed(1)
    : '4.2';

  const isSelf = currentUser && profile && (currentUser.id === profile.id || currentUser.username === profile.username);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in tactile-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#1b2228',
          borderRadius: '8px',
          border: '1px solid #333f4d',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Panoramic Banner */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '140px',
            backgroundColor: '#14181c',
            backgroundImage: profile?.banner_url
              ? `url(${profile.banner_url})`
              : 'url(https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(20,24,28,0.2) 0%, rgba(20,24,28,0.85) 100%)',
            }}
          />

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(20,24,28,0.8)',
              border: '1px solid #333f4d',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              zIndex: 10,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '0 24px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#00e054', fontSize: '13px', fontWeight: 700 }}>
              Memuat profil anggota sinema...
            </div>
          ) : profile ? (
            <>
              {/* Identity Header */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-36px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      boxShadow: '0 0 0 3px #14181c, 0 0 0 5px #00e054',
                      backgroundColor: '#14181c',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {profile.name}
                      </h2>
                      <span className="badge-pill" style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {profile.role || 'Cinephile'}
                      </span>
                      {isSelf && (
                        <span className="badge-pill badge-pill-green" style={{ fontSize: '9px', padding: '2px 6px' }}>
                          ANDA
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#00e054', fontWeight: 700, marginTop: '2px' }}>
                      @{profile.username}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#8899a6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {profile.location || 'Indonesia'}
                  </span>

                  {!isSelf && onOpenChatWithUser && (
                    <button
                      onClick={() => {
                        onOpenChatWithUser({
                          id: profile.id,
                          display_name: profile.name,
                          username: profile.username,
                          avatar_url: profile.avatar_url,
                        });
                        onClose();
                      }}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>Kirim Pesan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p style={{ fontSize: '13px', color: '#9ab0c2', lineHeight: 1.55, margin: 0 }}>
                {profile.bio || 'Pencinta karya sinema bioskop dan penjelajah film festival.'}
              </p>

              {/* KPI Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#212932', borderRadius: '6px', border: '1px solid #2c3642', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700 }}>Ditonton</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{totalFilms}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#212932', borderRadius: '6px', border: '1px solid #2c3642', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700 }}>Ulasan</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{totalReviews}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#212932', borderRadius: '6px', border: '1px solid #2c3642', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700 }}>Rata-rata</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f5c518', marginTop: '2px' }}>★ {avgRating}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#212932', borderRadius: '6px', border: '1px solid #2c3642', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700 }}>Jam Sinema</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{Math.round(totalFilms * 1.9)}h</div>
                </div>
              </div>

              {/* 4 Favorite Films */}
              {favorites && favorites.filter(Boolean).length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8899a6', fontWeight: 700, marginBottom: '8px' }}>
                    4 Film Favorit Teratas
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {favorites.map((slot, idx) => {
                      if (!slot) return null;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            onSelectFilm(slot.id || `tmdb-${slot.tmdb_id}`);
                            onClose();
                          }}
                          style={{
                            aspectRatio: '2/3',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: '#212932',
                            cursor: 'pointer',
                            border: '1px solid #2c3642',
                          }}
                        >
                          <img
                            src={cleanPosterUrl(slot.posterUrl, slot.title)}
                            alt={slot.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Logs & Reviews */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8899a6', fontWeight: 700, marginBottom: '8px' }}>
                  Catatan Film Terakhir
                </div>
                {logs.length === 0 ? (
                  <div style={{ padding: '20px', borderRadius: '6px', border: '1px dashed #333f4d', textAlign: 'center', color: '#8899a6', fontSize: '12px' }}>
                    Anggota ini belum mencatat film baru.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {logs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        onClick={() => {
                          onSelectFilm(`tmdb-${log.tmdb_id}`);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          backgroundColor: '#212932',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: '1px solid #2c3642',
                        }}
                      >
                        <img
                          src={cleanPosterUrl(log.film_poster, log.film_title)}
                          alt={log.film_title}
                          style={{ width: '28px', height: '40px', objectFit: 'cover', borderRadius: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                            {log.film_title} <span style={{ color: '#8899a6', fontWeight: 400 }}>({log.film_year})</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                            Ditonton {log.watched_date} • {log.watch_format}
                          </div>
                        </div>
                        <span style={{ color: '#00e054', fontWeight: 800, fontSize: '12px' }}>
                          ★ {log.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
