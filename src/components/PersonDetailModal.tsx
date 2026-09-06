'use client';

import React, { useEffect, useState } from 'react';
import { Film } from '@/data/cinemaData';

interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string | null;
  onSelectFilm: (filmId: string, film?: Film) => void;
}

interface PersonData {
  id: number;
  name: string;
  department: string;
  profilePath: string | null;
  knownFor: Film[];
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  isOpen,
  onClose,
  personName,
  onSelectFilm,
}) => {
  const [person, setPerson] = useState<PersonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !personName) return;

    setIsLoading(true);
    fetch(`/api/movies?type=person&name=${encodeURIComponent(personName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setPerson(data);
        } else {
          setPerson(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [isOpen, personName]);

  if (!isOpen || !personName) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1150,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: '#1b2228',
          borderRadius: '8px',
          border: '1px solid #333f4d',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#14181c',
            borderBottom: '1px solid #242c34',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
            FILMOGRAFI & SINEAS
          </span>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8899a6',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Scrollable */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#8899a6' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  margin: '0 auto 12px',
                  border: '3px solid #2c3642',
                  borderTopColor: '#00e054',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '12px' }}>Memuat profil {personName}...</span>
            </div>
          ) : person ? (
            <>
              {/* Profile Card Top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '2px solid #00e054',
                    backgroundColor: '#212932',
                  }}
                >
                  {person.profilePath ? (
                    <img
                      src={person.profilePath}
                      alt={person.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#212932' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {person.name}
                  </h2>
                  <div style={{ fontSize: '12px', color: '#00e054', fontWeight: 600, marginTop: '2px' }}>
                    {person.department === 'Directing' ? 'Sutradara Sinema' : 'Aktor / Pemeran Utama'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8899a6', marginTop: '4px' }}>
                    Terdaftar dengan {person.knownFor.length} karya film populer di TMDB.
                  </div>
                </div>
              </div>

              {/* Works Grid */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8899a6', fontWeight: 700, marginBottom: '12px' }}>
                  Karya Film Terpopuler
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                  {person.knownFor.map((film) => (
                    <div
                      key={film.id}
                      onClick={() => {
                        onSelectFilm(film.id, film);
                        onClose();
                      }}
                      className="tix-card-holder"
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
                        <img
                          src={film.posterUrl}
                          alt={film.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '6px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.92) 100%)',
                            fontSize: '10px',
                            color: '#00e054',
                            fontWeight: 700,
                          }}
                        >
                          ★ {film.rating}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px', backgroundColor: '#1b2228' }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {film.title}
                        </div>
                        <div style={{ fontSize: '10px', color: '#8899a6', marginTop: '2px' }}>
                          {film.year}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#8899a6' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#212932', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2c3642', margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Profil Tidak Ditemukan
              </div>
              <p style={{ fontSize: '12px', color: '#677b8c', marginTop: '4px' }}>
                Tidak ada data filmografi tambahan untuk {personName}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
