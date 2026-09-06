'use client';

import React, { useState, useEffect } from 'react';
import { ESSAYS, Essay } from '@/data/cinemaData';
import { UserProfile, getJournalEssays, getSafeAvatar } from '@/lib/supabase';
import { JournalEssay } from '@/types/database';
import { WriteEssayModal } from '@/components/WriteEssayModal';

interface JournalViewProps {
  onSelectFilm: (filmId: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenPublicProfile?: (usernameOrId: string) => void;
}

type UnifiedEssay = {
  id: string;
  title: string;
  subtitle: string;
  filmSubject: string;
  leadParagraph: string;
  author: string;
  authorAvatar: string;
  authorUsername?: string;
  publishedDate: string;
  readTime: string;
  bodySections: {
    heading?: string;
    text: string;
    pullQuote?: string;
  }[];
  isCommunity?: boolean;
};

export const JournalView: React.FC<JournalViewProps> = ({
  onSelectFilm,
  currentUser = null,
  onOpenAuth,
  onOpenPublicProfile,
}) => {
  const [selectedEssay, setSelectedEssay] = useState<UnifiedEssay | null>(null);
  const [userEssays, setUserEssays] = useState<JournalEssay[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'editorial' | 'community'>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  useEffect(() => {
    getJournalEssays()
      .then((essays) => setUserEssays(essays))
      .catch(() => {});
  }, []);

  const handleOpenWrite = () => {
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }
    setIsWriteModalOpen(true);
  };

  const handleEssayCreated = (newEssay: JournalEssay) => {
    setUserEssays((prev) => [newEssay, ...prev]);
    // Also auto-open the newly created essay
    setSelectedEssay({
      id: newEssay.id,
      title: newEssay.title,
      subtitle: newEssay.subtitle,
      filmSubject: newEssay.film_subject,
      leadParagraph: newEssay.lead_paragraph,
      author: newEssay.author_name,
      authorAvatar: getSafeAvatar(newEssay.author_avatar, newEssay.author_name),
      authorUsername: newEssay.author_username || 'cinephile',
      publishedDate: 'Hari Ini',
      readTime: newEssay.read_time,
      bodySections: newEssay.body_sections || [{ text: newEssay.lead_paragraph, pullQuote: newEssay.pull_quote }],
      isCommunity: true,
    });
  };

  const normalizedUserEssays: UnifiedEssay[] = userEssays.map((ue) => ({
    id: ue.id,
    title: ue.title,
    subtitle: ue.subtitle,
    filmSubject: ue.film_subject,
    leadParagraph: ue.lead_paragraph,
    author: ue.author_name,
    authorAvatar: getSafeAvatar(ue.author_avatar, ue.author_name),
    authorUsername: ue.author_username || 'cinephile',
    publishedDate: new Date(ue.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    readTime: ue.read_time,
    bodySections: ue.body_sections || [{ text: ue.lead_paragraph, pullQuote: ue.pull_quote }],
    isCommunity: true,
  }));

  const normalizedEditorialEssays: UnifiedEssay[] = ESSAYS.map((e) => ({
    id: e.id,
    title: e.title,
    subtitle: e.subtitle,
    filmSubject: e.filmSubject,
    leadParagraph: e.leadParagraph,
    author: e.author,
    authorAvatar: e.authorAvatar,
    authorUsername: e.author.toLowerCase().replace(/\s+/g, '_'),
    publishedDate: e.publishedDate,
    readTime: e.readTime,
    bodySections: e.bodySections,
    isCommunity: false,
  }));

  const displayedEssays =
    activeTab === 'all'
      ? [...normalizedUserEssays, ...normalizedEditorialEssays]
      : activeTab === 'community'
      ? normalizedUserEssays
      : normalizedEditorialEssays;

  if (selectedEssay) {
    return (
      <div
        style={{
          maxWidth: 'var(--max-width-editorial)',
          margin: '0 auto',
          padding: '28px 20px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: '#14181c',
        }}
      >
        <button
          onClick={() => setSelectedEssay(null)}
          className="btn-secondary"
          style={{ width: 'fit-content', padding: '6px 14px', fontSize: '11px' }}
        >
          ← KEMBALI KE JURNAL
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-pill badge-pill-green" style={{ fontSize: '10px' }}>
              {selectedEssay.filmSubject}
            </span>
            <span style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {selectedEssay.isCommunity ? 'ESAI KOMUNITAS' : 'ESAI SINEMA'} • {selectedEssay.readTime}
            </span>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
            {selectedEssay.title}
          </h1>
          <p style={{ fontSize: '16px', color: '#9ab0c2', lineHeight: 1.6 }}>
            {selectedEssay.subtitle}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '14px',
              borderTop: '1px solid #242c34',
            }}
          >
            <img
              src={selectedEssay.authorAvatar}
              alt={selectedEssay.author}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div
                onClick={() => {
                  if (onOpenPublicProfile && selectedEssay.authorUsername) {
                    onOpenPublicProfile(selectedEssay.authorUsername);
                  }
                }}
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: onOpenPublicProfile ? 'pointer' : 'default',
                }}
              >
                {selectedEssay.author}
              </div>
              <div style={{ fontSize: '12px', color: '#677b8c' }}>
                {selectedEssay.publishedDate} • {selectedEssay.readTime} bacaan
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#ccd6e0', whiteSpace: 'pre-line' }}>
          {selectedEssay.leadParagraph}
        </p>

        {selectedEssay.bodySections.map((sec, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sec.heading && (
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginTop: '12px' }}>
                {sec.heading}
              </h2>
            )}

            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#9ab0c2', whiteSpace: 'pre-line' }}>
              {sec.text}
            </p>

            {sec.pullQuote && (
              <blockquote
                style={{
                  fontSize: '15px',
                  fontStyle: 'italic',
                  color: '#ffffff',
                  padding: '16px 20px',
                  backgroundColor: '#1b2228',
                  borderRadius: '4px',
                  borderLeft: '3px solid #00e054',
                  margin: '8px 0',
                }}
              >
                "{sec.pullQuote}"
              </blockquote>
            )}
          </div>
        ))}
      </div>
    );
  }

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
      {/* Header with Title & Write Essay CTA */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
            EDITORIAL & JURNAL SINEMA
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '4px 0 6px' }}>
            Jurnal Film & Esai Kritis
          </h1>
          <p style={{ fontSize: '13px', color: '#8899a6', margin: 0 }}>
            Analisis mendalam, catatan sutradara, dan ulasan estetika perfilman oleh komunitas cinephile
          </p>
        </div>

        <button
          onClick={handleOpenWrite}
          className="btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>TULIS ESAI</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #242c34', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeTab === 'all' ? '#212932' : 'transparent',
            color: activeTab === 'all' ? '#00e054' : '#8899a6',
            cursor: 'pointer',
          }}
        >
          SEMUA ({normalizedUserEssays.length + normalizedEditorialEssays.length})
        </button>
        <button
          onClick={() => setActiveTab('editorial')}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeTab === 'editorial' ? '#212932' : 'transparent',
            color: activeTab === 'editorial' ? '#00e054' : '#8899a6',
            cursor: 'pointer',
          }}
        >
          EDITORIAL ({normalizedEditorialEssays.length})
        </button>
        <button
          onClick={() => setActiveTab('community')}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeTab === 'community' ? '#212932' : 'transparent',
            color: activeTab === 'community' ? '#00e054' : '#8899a6',
            cursor: 'pointer',
          }}
        >
          KOMUNITAS ({normalizedUserEssays.length})
        </button>
      </div>

      {/* Empty State for Community Tab if none */}
      {activeTab === 'community' && normalizedUserEssays.length === 0 ? (
        <div
          className="tactile-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#1b2228',
            borderRadius: '8px',
            border: '1px dashed #333f4d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Belum Ada Esai Komunitas
          </h3>
          <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
            Jadilah yang pertama mempublikasikan catatan kritis sinema Anda dan berdiskusi dengan para penikmat film lainnya.
          </p>
          <button
            onClick={handleOpenWrite}
            className="btn-primary"
            style={{ padding: '8px 22px', fontSize: '12px', marginTop: '6px' }}
          >
            + TULIS ESAI PERTAMA
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {displayedEssays.map((essay) => (
            <div
              key={essay.id}
              onClick={() => setSelectedEssay(essay)}
              className="tix-card-holder tactile-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                backgroundColor: '#1b2228',
                borderRadius: '8px',
                border: '1px solid #2c3642',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="badge-pill badge-pill-green" style={{ fontSize: '9px' }}>
                    {essay.filmSubject}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {essay.isCommunity && (
                      <span className="badge-pill badge-pill-blue" style={{ fontSize: '8px' }}>
                        KOMUNITAS
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: '#677b8c' }}>
                      {essay.readTime}
                    </span>
                  </div>
                </div>

                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', lineHeight: 1.35, marginBottom: '8px' }}>
                  {essay.title}
                </h2>

                <p style={{ fontSize: '13px', color: '#8899a6', lineHeight: 1.55 }}>
                  {essay.subtitle}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #242c34',
                  fontSize: '11px',
                  color: '#677b8c',
                }}
              >
                <div
                  onClick={(e) => {
                    if (onOpenPublicProfile && essay.authorUsername) {
                      e.stopPropagation();
                      onOpenPublicProfile(essay.authorUsername);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: onOpenPublicProfile ? 'pointer' : 'default' }}
                >
                  <img
                    src={essay.authorAvatar}
                    alt={essay.author}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span>{essay.author}</span>
                </div>

                <span style={{ fontWeight: 700, color: '#00e054' }}>
                  Baca Esai →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Essay Modal */}
      <WriteEssayModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        currentUser={currentUser}
        onEssayCreated={handleEssayCreated}
      />
    </div>
  );
};
