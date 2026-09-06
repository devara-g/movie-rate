'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, cleanPosterUrl, createCustomList } from '@/lib/supabase';
import { CustomList, CustomListFilm } from '@/types/database';

interface CustomListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onListCreated: (list: CustomList) => void;
}

interface SelectedMovie {
  tmdb_id: number;
  film_title: string;
  film_year: number;
  film_poster: string;
  film_rating: number;
}

export const CustomListModal: React.FC<CustomListModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onListCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovie[]>([]);

  // Live search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/movies?type=search&q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data.slice(0, 6));
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setIsPrivate(false);
      setSelectedMovies([]);
      setSearchQuery('');
      setSearchResults([]);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMovie = (film: any) => {
    const rawId = typeof film.id === 'string' ? film.id.replace('tmdb-', '') : String(film.id);
    const tmdbId = parseInt(rawId, 10) || Math.floor(Math.random() * 100000);

    if (selectedMovies.some((m) => m.tmdb_id === tmdbId)) {
      return;
    }

    const movie: SelectedMovie = {
      tmdb_id: tmdbId,
      film_title: film.title,
      film_year: film.year || 2024,
      film_poster: cleanPosterUrl(film.posterUrl || film.poster_path, film.title),
      film_rating: typeof film.rating === 'number' ? film.rating : 4.0,
    };

    setSelectedMovies((prev) => [...prev, movie]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMovie = (tmdbId: number) => {
    setSelectedMovies((prev) => prev.filter((m) => m.tmdb_id !== tmdbId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul daftar wajib diisi.');
      return;
    }
    if (selectedMovies.length === 0) {
      setErrorMsg('Tambahkan minimal 1 film ke dalam daftar.');
      return;
    }

    const user: UserProfile = currentUser || {
      id: 'guest',
      name: 'Kurator Tamu',
      username: 'tamu',
      avatar_url: '',
      bio: '',
      location: 'Indonesia',
      role: 'Cinephile',
    };

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createCustomList(
        {
          title: title.trim(),
          description: description.trim(),
          is_private: isPrivate,
          films: selectedMovies,
        },
        user
      );

      if (res.success && res.list) {
        onListCreated(res.list);
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan daftar.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat membuat daftar.');
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: '660px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 23, 29, 0.95)',
          }}
        >
          <div>
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
              KURASI KOLEKSI SINEMA
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px', margin: 0 }}>
              Buat Daftar Film Kustom Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn-cinema"
            title="Tutup (Esc)"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 64, 96, 0.12)',
              border: '1px solid rgba(255, 64, 96, 0.35)',
              borderRadius: '8px',
              color: '#ff4060',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Title */}
          <div>
            <label className="form-label-cinema">
              Judul Daftar
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Film Sinematografi 35mm Terbaik Sepanjang Masa"
              className="form-input-cinema"
            />
          </div>

          {/* Description */}
          <div>
            <label className="form-label-cinema">
              Deskripsi Kuratorial
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan benang merah atau tema estetika dari kumpulan film ini..."
              className="form-input-cinema"
              style={{ resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Search & Add Films via TMDB */}
          <div>
            <label className="form-label-cinema">
              <span>Cari & Tambahkan Film</span>
              <span style={{ fontSize: '10px', color: '#677b8c', textTransform: 'none', fontWeight: 500 }}>
                Koneksi TMDB Live
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik judul film (misal: Past Lives, Dune, Interstellar)..."
                className="form-input-cinema"
                style={{ paddingRight: isSearching ? '85px' : '14px' }}
              />
              {isSearching && (
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#00e054', fontWeight: 700 }}>
                  Mencari...
                </span>
              )}
            </div>

            {/* Live Search Autocomplete Results */}
            {searchResults.length > 0 && (
              <div
                style={{
                  marginTop: '6px',
                  backgroundColor: 'rgba(18, 23, 29, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
                }}
              >
                {searchResults.map((film) => (
                  <div
                    key={film.id}
                    onClick={() => handleAddMovie(film)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <img
                      src={cleanPosterUrl(film.posterUrl || film.poster_path, film.title)}
                      alt={film.title}
                      style={{ width: '30px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {film.title} <span style={{ color: '#8899a6', fontWeight: 400 }}>({film.year || 2024})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#00e054', fontWeight: 700 }}>
                        ★ {film.rating || '4.0'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#00e054',
                        fontWeight: 800,
                        backgroundColor: 'rgba(0, 224, 84, 0.1)',
                        border: '1px solid rgba(0, 224, 84, 0.3)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      + TAMBAH
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Films Strip */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="form-label-cinema" style={{ marginBottom: 0 }}>
                Film dalam Daftar ({selectedMovies.length})
              </span>
              {selectedMovies.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMovies([])}
                  style={{ background: 'transparent', border: 'none', color: '#ff4060', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Kosongkan Semua
                </button>
              )}
            </div>

            {selectedMovies.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  textAlign: 'center',
                  color: '#8899a6',
                  fontSize: '12px',
                }}
              >
                Belum ada film yang ditambahkan. Gunakan kolom pencarian di atas untuk memasukkan film.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                  gap: '10px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '4px',
                }}
              >
                {selectedMovies.map((movie, idx) => (
                  <div
                    key={movie.tmdb_id}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#12171d',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <img
                      src={movie.film_poster}
                      alt={movie.film_title}
                      style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        backgroundColor: 'rgba(18, 23, 29, 0.9)',
                        color: '#00e054',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 224, 84, 0.3)',
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMovie(movie.tmdb_id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(18, 23, 29, 0.85)',
                        border: '1px solid rgba(255, 64, 96, 0.4)',
                        color: '#ff4060',
                        fontSize: '11px',
                        fontWeight: 900,
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff4060', e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(18, 23, 29, 0.85)', e.currentTarget.style.color = '#ff4060')}
                      title="Hapus film dari daftar"
                    >
                      ✕
                    </button>
                    <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {movie.film_title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'rgba(18, 23, 29, 0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <input
              type="checkbox"
              id="isPrivateCheck"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#00e054', width: '16px', height: '16px' }}
            />
            <label htmlFor="isPrivateCheck" style={{ fontSize: '12px', color: '#ccd6e0', cursor: 'pointer', fontWeight: 500 }}>
              Jadikan Daftar Privat (Hanya Anda yang dapat melihat daftar ini)
            </label>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              className="form-btn-secondary"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="form-btn-primary"
              style={{ flex: 2 }}
            >
              {isSubmitting ? 'Menyimpan Daftar...' : 'Simpan Daftar Film'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
