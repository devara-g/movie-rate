'use client';

import React, { useState } from 'react';
import { UserProfile, createJournalEssay } from '@/lib/supabase';
import { JournalEssay } from '@/types/database';

interface WriteEssayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onEssayCreated: (essay: JournalEssay) => void;
}

export const WriteEssayModal: React.FC<WriteEssayModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onEssayCreated,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [filmSubject, setFilmSubject] = useState('');
  const [filmSearchQuery, setFilmSearchQuery] = useState('');
  const [filmSuggestions, setFilmSuggestions] = useState<{ id: number; title: string; year: string; poster: string }[]>([]);
  const [isSearchingFilm, setIsSearchingFilm] = useState(false);
  const [leadParagraph, setLeadParagraph] = useState('');
  const [pullQuote, setPullQuote] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearchFilm = async (query: string) => {
    setFilmSearchQuery(query);
    if (!query.trim()) {
      setFilmSuggestions([]);
      return;
    }
    setIsSearchingFilm(true);
    try {
      const res = await fetch(`/api/movies?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFilmSuggestions(
          data.slice(0, 5).map((m: { id: number; title: string; release_date?: string; poster_path?: string }) => ({
            id: m.id,
            title: m.title,
            year: m.release_date ? m.release_date.split('-')[0] : '',
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : '',
          }))
        );
      }
    } catch {
      // Ignore
    } finally {
      setIsSearchingFilm(false);
    }
  };

  const handleSelectSuggestion = (film: { id: number; title: string; year: string }) => {
    setFilmSubject(`${film.title}${film.year ? ` (${film.year})` : ''}`);
    setFilmSuggestions([]);
    setFilmSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul esai tidak boleh kosong.');
      return;
    }
    if (!filmSubject.trim()) {
      setErrorMsg('Subjek film esai harus diisi.');
      return;
    }
    if (!leadParagraph.trim() && !bodyText.trim()) {
      setErrorMsg('Tuliskan setidaknya satu paragraf analisis atau ulasan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const wordCount = (leadParagraph + ' ' + bodyText).trim().split(/\s+/).length;
      const minutes = Math.max(2, Math.ceil(wordCount / 180));
      const readTime = `${minutes} min read`;

      const paragraphs = bodyText
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const bodySections = paragraphs.map((p, idx) => ({
        text: p,
        pullQuote: idx === 0 && pullQuote.trim() ? pullQuote.trim() : undefined,
      }));

      // Fallback if no body sections
      if (bodySections.length === 0 && pullQuote.trim()) {
        bodySections.push({ text: leadParagraph, pullQuote: pullQuote.trim() });
      }

      const res = await createJournalEssay({
        user_id: currentUser?.id || 'guest',
        author_name: currentUser?.name || currentUser?.username || 'Guest Cinephile',
        author_avatar: currentUser?.avatar_url || '',
        author_username: currentUser?.username || 'cinephile',
        title: title.trim(),
        subtitle: subtitle.trim() || 'Catatan kritis dan ulasan estetika perfilman.',
        film_subject: filmSubject.trim(),
        read_time: readTime,
        lead_paragraph: leadParagraph.trim() || bodyText.slice(0, 200),
        body_text: bodyText.trim(),
        body_sections: bodySections,
        pull_quote: pullQuote.trim() || undefined,
      });

      if (res.essay) {
        onEssayCreated(res.essay);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mempublikasikan esai.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop-cinematic"
      onClick={onClose}
    >
      <div
        className="modal-surface-cinema custom-modal-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
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
              EDITORIAL DESK
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0' }}>
              Tulis Esai & Analisis Sinema
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 64, 96, 0.12)',
                border: '1px solid rgba(255, 64, 96, 0.3)',
                borderRadius: '6px',
                color: '#ff4060',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Film Subject with live search */}
          <div>
            <label className="form-label-cinema">
              <span>Film Subjek Kajian <span style={{ color: '#00e054' }}>*</span></span>
              <span style={{ fontSize: '10px', color: '#677b8c', textTransform: 'none', fontWeight: 500 }}>Live TMDB Search</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={filmSubject || filmSearchQuery}
                onChange={(e) => {
                  setFilmSubject(e.target.value);
                  handleSearchFilm(e.target.value);
                }}
                placeholder="Ketik judul film (cth. Chungking Express, Blade Runner)..."
                className="form-input-cinema"
                style={{ paddingRight: isSearchingFilm ? '100px' : '14px' }}
              />
              {isSearchingFilm && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#00e054', fontWeight: 700 }}>
                  Mencari TMDB...
                </div>
              )}

              {/* Suggestions Dropdown */}
              {filmSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(18, 23, 29, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    marginTop: '6px',
                    zIndex: 20,
                    maxHeight: '190px',
                    overflowY: 'auto',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                  }}
                >
                  {filmSuggestions.map((film) => (
                    <div
                      key={film.id}
                      onClick={() => handleSelectSuggestion(film)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {film.poster ? (
                        <img src={film.poster} alt={film.title} style={{ width: '28px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <div style={{ width: '28px', height: '40px', backgroundColor: '#2b3644', borderRadius: '4px' }} />
                      )}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{film.title}</div>
                        <div style={{ fontSize: '11px', color: '#8899a6' }}>{film.year || 'Film'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="form-label-cinema">
              Judul Esai <span style={{ color: '#00e054' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Menelisik Sunyi: Melankolia Ruang Urban dalam Karya Wong Kar-wai"
              className="form-input-cinema"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="form-label-cinema">
              Subjudul / Premis Esai
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Satu kalimat ringkasan tentang tesis atau sudut pandang utama Anda"
              className="form-input-cinema"
            />
          </div>

          {/* Lead Paragraph */}
          <div>
            <label className="form-label-cinema">
              Paragraf Pembuka (Lead Paragraph)
            </label>
            <textarea
              rows={3}
              value={leadParagraph}
              onChange={(e) => setLeadParagraph(e.target.value)}
              placeholder="Pengantar bernas yang menarik pembaca masuk ke dalam atmosfir film dan argumen Anda..."
              className="form-input-cinema"
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Pull Quote */}
          <div>
            <label className="form-label-cinema">
              Kutipan Sorotan (Pull Quote - Opsional)
            </label>
            <input
              type="text"
              value={pullQuote}
              onChange={(e) => setPullQuote(e.target.value)}
              placeholder='Contoh: "Kamera tidak sekadar merekam kota, melainkan denyut keterasingan jiwanya."'
              className="form-input-cinema"
              style={{ fontStyle: 'italic' }}
            />
          </div>

          {/* Body Paragraphs */}
          <div>
            <label className="form-label-cinema">
              <span>Isi Analisis & Esai</span>
              <span style={{ fontSize: '10px', color: '#677b8c', textTransform: 'none', fontWeight: 500 }}>Pisahkan paragraf dengan baris kosong</span>
            </label>
            <textarea
              rows={7}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Tuliskan telaah sinematografi, tema, tata suara, perkembangan karakter, atau konteks sosiokultural film ini..."
              className="form-input-cinema"
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '8px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#8899a6' }}>
              Penulis:{' '}
              <strong style={{ color: '#ffffff' }}>
                {currentUser?.name || currentUser?.username || 'Guest Cinephile'}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="form-btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="form-btn-primary"
              >
                {isSubmitting ? (
                  'Menerbitkan...'
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <span>Terbitkan Esai</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
