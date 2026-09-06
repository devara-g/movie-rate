'use client';

import React, { useState, useEffect } from 'react';
import { signInUser, signUpUser, signInWithGoogleOAuth, UserProfile, generateCinemaAvatar } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setShowPassword(false);
  }, [isOpen, initialMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!name.trim() || !username.trim()) {
        setErrorMessage('Mohon isi nama lengkap dan username Anda.');
        setLoading(false);
        return;
      }
      const res = await signUpUser(email, password, name, username);
      setLoading(false);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal mendaftar akun.');
      }
    } else {
      const res = await signInUser(email, password);
      setLoading(false);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.error || 'Email atau password tidak sesuai.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    const res = await signInWithGoogleOAuth();
    if (!res.success) {
      setErrorMessage(res.error || 'Gagal menghubungkan ke Google.');
      setGoogleLoading(false);
    }
  };

  const handleQuickGuestLogin = () => {
    const guestUser: UserProfile = {
      id: 'guest',
      name: 'Tamu Sinema',
      username: 'tamu_sinema',
      avatar_url: generateCinemaAvatar('Tamu Sinema'),
      bio: 'Menikmati sinema pilihan dan menjelajahi karya film bioskop.',
      location: 'Indonesia',
      role: 'Cinephile',
    };
    onAuthSuccess(guestUser);
    onClose();
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
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header Bar with Cinema Tri-Color Glow */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 24, 30, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ff8000', boxShadow: '0 0 6px rgba(255, 128, 0, 0.5)' }} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e054', boxShadow: '0 0 6px rgba(0, 224, 84, 0.5)' }} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#40bcf4', boxShadow: '0 0 6px rgba(64, 188, 244, 0.5)' }} />
            </div>
            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '14px', letterSpacing: '0.08em' }}>
              CINEHEARTH
            </span>
            <span style={{ fontSize: '11px', color: '#8899a6', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              | {mode === 'signin' ? 'Masuk' : 'Pendaftaran'}
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

        {/* Tab Switcher (MASUK vs DAFTAR) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(14, 18, 23, 0.7)',
            padding: '4px 6px',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            style={{
              padding: '10px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: mode === 'signin' ? '#00e054' : '#8899a6',
              borderRadius: '8px',
              background: mode === 'signin' ? 'rgba(0, 224, 84, 0.12)' : 'transparent',
              border: mode === 'signin' ? '1px solid rgba(0, 224, 84, 0.3)' : '1px solid transparent',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            MASUK
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            style={{
              padding: '10px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: mode === 'signup' ? '#00e054' : '#8899a6',
              borderRadius: '8px',
              background: mode === 'signup' ? 'rgba(0, 224, 84, 0.12)' : 'transparent',
              border: mode === 'signup' ? '1px solid rgba(0, 224, 84, 0.3)' : '1px solid transparent',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            DAFTAR AKUN BARU
          </button>
        </div>

        {/* Form Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Official Google OAuth Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '11px 16px',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              fontWeight: 700,
              cursor: googleLoading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            {/* Official Google SVG Logo */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
          </button>

          {/* Elegant Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#2c3744' }} />
            <span style={{ fontSize: '10px', color: '#677b8c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              atau dengan email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#2c3744' }} />
          </div>

          {errorMessage && (
            <div
              className="animate-fade-in"
              style={{
                padding: '11px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 64, 96, 0.12)',
                border: '1px solid rgba(255, 64, 96, 0.4)',
                color: '#ff4060',
                fontSize: '12px',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label className="form-label-cinema">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input-cinema"
                  />
                </div>

                <div>
                  <label className="form-label-cinema">
                    Username Cinephile
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#677b8c', fontSize: '13px', fontWeight: 600 }}>
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="rianfilm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="form-input-cinema"
                      style={{ paddingLeft: '28px' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="form-label-cinema">
                Alamat Email
              </label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input-cinema"
              />
            </div>

            <div>
              <label className="form-label-cinema">
                Kata Sandi
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-cinema"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#8899a6',
                    cursor: 'pointer',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="form-btn-primary"
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                marginTop: '6px',
              }}
            >
              {loading ? 'MEMPROSES...' : mode === 'signin' ? 'MASUK KE CINEHEARTH' : 'BUAT AKUN SEKARANG'}
            </button>
          </form>

          {/* Footer Navigation & Guest Demo Bypass */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #242e38',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#8899a6' }}>
              {mode === 'signin' ? (
                <span>
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    style={{ color: '#00e054', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Daftar di sini
                  </button>
                </span>
              ) : (
                <span>
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                    }}
                    style={{ color: '#00e054', fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Masuk sekarang
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleQuickGuestLogin}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#677b8c',
                fontSize: '11px',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Lanjutkan Sementara Sebagai Tamu (Mode Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
