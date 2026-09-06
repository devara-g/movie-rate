'use client';

import React from 'react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filmTitle: string;
  youtubeKey: string | null;
  isLoading?: boolean;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  isOpen,
  onClose,
  filmTitle,
  youtubeKey,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
          maxWidth: '860px',
          backgroundColor: '#1b2228',
          borderRadius: '8px',
          border: '1px solid #333f4d',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ff4060',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
              TRAILER RESMI BIOSKOP
            </span>
            <span style={{ color: '#445566' }}>•</span>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {filmTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup trailer"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8899a6',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8899a6')}
          >
            ✕
          </button>
        </div>

        {/* 16:9 Video Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9 Aspect Ratio
            backgroundColor: '#0a0d0f',
          }}
        >
          {isLoading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#8899a6',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #2c3642',
                  borderTopColor: '#00e054',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '12px' }}>Menghubungkan ke pemutar bioskop...</span>
            </div>
          ) : youtubeKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`${filmTitle} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#8899a6',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#212932', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2c3642' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Trailer Belum Tersedia
              </span>
              <p style={{ fontSize: '12px', color: '#677b8c', maxWidth: '300px', textAlign: 'center' }}>
                Cuplikan resmi untuk film ini belum terdaftar di database TMDB.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
