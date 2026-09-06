'use client';

import React, { useState, useEffect } from 'react';

interface CinemaIntroCurtainProps {
  onFinish?: () => void;
}

export const CinemaIntroCurtain: React.FC<CinemaIntroCurtainProps> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // 1. Trigger graceful dissolve exit after 1.35 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1350);

    // 2. Completely remove from DOM after 1.75 seconds
    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onFinish) onFinish();
    }, 1750);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  // Allow immediate dismissal on user click or keypress
  const handleInstantSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsDone(true);
      if (onFinish) onFinish();
    }, 300);
  };

  if (isDone) return null;

  return (
    <div
      onClick={handleInstantSkip}
      className={`cinema-intro-overlay ${isExiting ? 'cinema-intro-exit' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#070a0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Background Ambient Cinema Projector Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '350px',
          background: 'radial-gradient(ellipse, rgba(0, 224, 84, 0.12) 0%, rgba(64, 188, 244, 0.08) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Horizontal Anamorphic Projector Light Beam Streak */}
      <div className="cinema-projector-beam" />

      {/* Main Studio Emblem Stage */}
      <div
        className="cinema-intro-content"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Iconic 3-Dot Cinema Celluloid Aperture */}
        <div className="cinema-intro-aperture">
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff8000',
              boxShadow: '0 0 16px rgba(255, 128, 0, 0.85)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#00e054',
              boxShadow: '0 0 18px rgba(0, 224, 84, 0.9)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#40bcf4',
              boxShadow: '0 0 16px rgba(64, 188, 244, 0.85)',
              display: 'inline-block',
            }}
          />
        </div>

        {/* Prestigious Brand Title with Tracking Expansion */}
        <h1 className="cinema-intro-title">
          CineHearth
        </h1>

        {/* Editorial Subtitle */}
        <p className="cinema-intro-subtitle">
          AN INTIMATE CINEMA SANCTUARY
        </p>

        {/* Technical Archival Badge */}
        <div className="cinema-intro-specs">
          <span>35MM CELLULOID</span>
          <span>•</span>
          <span>DOLBY ATMOS</span>
          <span>•</span>
          <span>CURATED ARCHIVE</span>
        </div>
      </div>

      {/* Subtle Skip Hint at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255, 255, 255, 0.25)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        Klik di mana saja untuk lewati
      </div>
    </div>
  );
};
