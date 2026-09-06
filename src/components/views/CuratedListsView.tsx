'use client';

import React, { useState, useEffect } from 'react';
import { CURATED_LISTS } from '@/data/cinemaData';
import { CustomList } from '@/types/database';
import { UserProfile } from '@/lib/supabase';
import { ListDetailModal, DisplayListModel } from '@/components/ListDetailModal';

interface CuratedListsViewProps {
  onSelectFilm: (filmId: string) => void;
  onOpenLogModal?: (filmId: string) => void;
  customLists?: CustomList[];
  onOpenCreateList?: () => void;
  currentUser: UserProfile | null;
  onDeleteCustomList?: (listId: string) => void;
  onOpenPublicProfile?: (usernameOrId: string) => void;
}

export const CuratedListsView: React.FC<CuratedListsViewProps> = ({
  onSelectFilm,
  onOpenLogModal = () => {},
  customLists = [],
  onOpenCreateList,
  currentUser,
  onDeleteCustomList,
  onOpenPublicProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my_lists'>('all');
  const [selectedListForDetail, setSelectedListForDetail] = useState<DisplayListModel | null>(null);
  const [editorialLists, setEditorialLists] = useState(CURATED_LISTS);

  useEffect(() => {
    fetch('/api/movies?type=trending')
      .then((res) => res.json())
      .then((tmdbFilms) => {
        if (Array.isArray(tmdbFilms) && tmdbFilms.length >= 8) {
          setEditorialLists((prev) => [
            {
              ...prev[0],
              films: tmdbFilms.slice(0, 4),
            },
            {
              ...prev[1],
              films: tmdbFilms.slice(4, 8),
            },
            {
              ...prev[2],
              films: tmdbFilms.slice(8, 12),
            },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const myCustomLists = currentUser
    ? customLists.filter((l) => l.user_id === currentUser.id)
    : customLists.filter((l) => l.user_id === 'guest');

  const openCustomDetail = (cl: CustomList) => {
    setSelectedListForDetail({
      id: cl.id,
      title: cl.title,
      description: cl.description || 'Daftar kurasi film oleh komunitas CineHearth.',
      curatorName: cl.user_name || 'Cinephile',
      curatorAvatar: cl.user_avatar || 'https://image.tmdb.org/t/p/w200/avatar.jpg',
      curatorUsername: cl.user_username || cl.user_id,
      films: (cl.films || []).map((f) => ({
        id: `tmdb-${f.tmdb_id}`,
        title: f.film_title,
        year: f.film_year,
        posterUrl: f.film_poster,
      })),
    });
  };

  const openEditorialDetail = (list: typeof editorialLists[0]) => {
    setSelectedListForDetail({
      id: list.id,
      title: list.title,
      description: list.description,
      curatorName: list.curator,
      curatorAvatar: list.curatorAvatar,
      curatorUsername: list.curator.toLowerCase().replace(/\s+/g, '_'),
      films: list.films.map((f) => ({
        id: f.id,
        title: f.title,
        year: f.year,
        posterUrl: f.posterUrl,
        rating: f.rating,
      })),
    });
  };

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
      {/* Header & Create List Action */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
            KOLEKSI & DAFTAR PILIHAN
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0' }}>
            Daftar Kurasi Film
          </h1>
          <p style={{ fontSize: '13px', color: '#8899a6', margin: '4px 0 0' }}>
            Koleksi tematik terbaik yang disusun oleh kurator sinema dan komunitas cinephile.
          </p>
        </div>

        <button
          onClick={onOpenCreateList}
          className="btn-primary"
          style={{ padding: '9px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          BUAT DAFTAR BARU
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #242c34', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeTab === 'all' ? '#212932' : 'transparent',
            color: activeTab === 'all' ? '#00e054' : '#8899a6',
            cursor: 'pointer',
          }}
        >
          SEMUA DAFTAR ({editorialLists.length + customLists.length})
        </button>
        <button
          onClick={() => setActiveTab('my_lists')}
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeTab === 'my_lists' ? '#212932' : 'transparent',
            color: activeTab === 'my_lists' ? '#00e054' : '#8899a6',
            cursor: 'pointer',
          }}
        >
          DAFTAR SAYA ({myCustomLists.length})
        </button>
      </div>

      {/* Grid of Lists */}
      {activeTab === 'my_lists' && myCustomLists.length === 0 ? (
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
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Anda Belum Membuat Daftar Film
          </h3>
          <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
            Buat daftar bertema pilihan Anda sendiri, tambahkan film favorit via pencarian TMDB, dan bagikan dengan komunitas penonton film.
          </p>
          <button
            onClick={onOpenCreateList}
            className="btn-primary"
            style={{ padding: '8px 22px', fontSize: '12px', marginTop: '6px' }}
          >
            + BUAT DAFTAR PERTAMA
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* User Custom Lists */}
          {(activeTab === 'all' ? customLists : myCustomLists).map((customList) => (
            <div
              key={customList.id}
              className="tix-card-holder tactile-card"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#1b2228',
                borderRadius: '8px',
                border: '1px solid #2c3642',
              }}
            >
              <div>
                {/* 4 Poster Showcase Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  {customList.films && customList.films.length > 0 ? (
                    customList.films.slice(0, 4).map((f) => (
                      <div
                        key={f.id || f.tmdb_id}
                        onClick={() => onSelectFilm(`tmdb-${f.tmdb_id}`)}
                        title={f.film_title}
                        style={{
                          aspectRatio: '2/3',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid #2c3642',
                          cursor: 'pointer',
                          backgroundColor: '#212932',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={f.film_poster}
                          alt={f.film_title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: 'span 4', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#212932', borderRadius: '4px', color: '#677b8c', fontSize: '11px' }}>
                      Belum ada film di daftar ini
                    </div>
                  )}
                </div>

                <div
                  onClick={() => openCustomDetail(customList)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0, transition: 'color 0.15s ease' }}>
                      {customList.title}
                    </h2>
                    <span className="badge-pill badge-pill-green" style={{ fontSize: '9px' }}>
                      {customList.films?.length || 0} FILMS
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#8899a6', lineHeight: 1.55, margin: 0 }}>
                    {customList.description || 'Daftar kurasi film oleh komunitas CineHearth.'}
                  </p>

                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00e054', fontWeight: 600 }}>
                    <span>Lihat Daftar Lengkap</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
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
                  onClick={() => {
                    if (onOpenPublicProfile) {
                      onOpenPublicProfile(customList.user_username || customList.user_id);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: onOpenPublicProfile ? 'pointer' : 'default' }}
                >
                  <img
                    src={customList.user_avatar || 'https://image.tmdb.org/t/p/w200/avatar.jpg'}
                    alt={customList.user_name || 'User'}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span>
                    Oleh <strong style={{ color: '#ffffff' }}>{customList.user_name || 'Cinephile'}</strong>
                  </span>
                </div>

                {onDeleteCustomList && (currentUser?.id === customList.user_id || customList.user_id === 'guest') && (
                  <button
                    onClick={() => onDeleteCustomList(customList.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff4060',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    title="Hapus daftar ini"
                  >
                    Hapus Daftar
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Editorial Lists (Show in 'all' tab) */}
          {activeTab === 'all' &&
            editorialLists.map((list) => (
              <div
                key={list.id}
                className="tix-card-holder tactile-card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: '#1b2228',
                  borderRadius: '8px',
                  border: '1px solid #2c3642',
                }}
              >
                <div>
                  {/* 4 Poster Showcase Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    {list.films.slice(0, 4).map((film) => (
                      <div
                        key={film.id}
                        onClick={() => onSelectFilm(film.id)}
                        title={film.title}
                        style={{
                          aspectRatio: '2/3',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid #2c3642',
                          cursor: 'pointer',
                          backgroundColor: '#212932',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={film.posterUrl}
                          alt={film.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    onClick={() => openEditorialDetail(list)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                        {list.title}
                      </h2>
                      <span className="badge-pill badge-pill-green" style={{ fontSize: '9px' }}>
                        {list.filmCount} FILMS
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: '#8899a6', lineHeight: 1.55, margin: 0 }}>
                      {list.description}
                    </p>

                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00e054', fontWeight: 600 }}>
                      <span>Lihat Daftar Lengkap</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={list.curatorAvatar}
                      alt={list.curator}
                      style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span>
                      Oleh <strong style={{ color: '#ffffff' }}>{list.curator}</strong>
                    </span>
                  </div>

                  <span style={{ color: '#ff4060', fontWeight: 600, fontSize: '12px' }}>
                    ♥ {list.likesCount}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Interactive List Detail Modal */}
      {selectedListForDetail && (
        <ListDetailModal
          isOpen={!!selectedListForDetail}
          onClose={() => setSelectedListForDetail(null)}
          list={selectedListForDetail}
          onSelectFilm={onSelectFilm}
          onOpenLogModal={onOpenLogModal}
          onOpenPublicProfile={onOpenPublicProfile}
        />
      )}
    </div>
  );
};

