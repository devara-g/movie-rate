'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, WatchlistItem, cleanPosterUrl, getSafeAvatar, generateCinemaAvatar } from '@/lib/supabase';
import { MovieLog, CustomList } from '@/types/database';
import { TicketData } from '@/components/TicketStubModal';
import { compressImageToWebP } from '@/lib/imageCompressor';

interface MemberProfileViewProps {
  currentUser: UserProfile | null;
  onSelectFilm: (filmId: string) => void;
  onOpenLogModal: (filmId?: string) => void;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  userLogs: MovieLog[];
  watchlist: WatchlistItem[];
  onToggleWatchlist: (filmId: number, filmTitle: string, filmPoster: string) => void;
  onOpenTicketStub: (ticket: TicketData) => void;
  customLists?: CustomList[];
  onOpenCreateList?: () => void;
  onDeleteCustomList?: (listId: string) => void;
}

export interface FavoriteSlotItem {
  id: string;
  tmdb_id: number;
  title: string;
  posterUrl: string;
  year?: number;
  rating?: number | string;
}

const BANNER_PRESETS = [
  {
    id: 'past-lives',
    label: 'Past Lives (Dusk NYC Ferry)',
    url: 'https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg',
  },
  {
    id: 'perfect-days',
    label: 'Perfect Days (Tokyo Morning)',
    url: 'https://image.tmdb.org/t/p/w1280/hjWxngV6tidwDkfJDEgMjHD2KEz.jpg',
  },
  {
    id: 'portrait',
    label: 'Portrait of a Lady on Fire (Cliff)',
    url: 'https://image.tmdb.org/t/p/w1280/ivJ5UzT6IzucLVfbZwCCwiJJoBz.jpg',
  },
  {
    id: 'in-the-mood',
    label: 'In the Mood for Love (Corridor)',
    url: 'https://image.tmdb.org/t/p/w1280/ffQFnAUm2Uu4RU0nijpjPRf9TBT.jpg',
  },
  {
    id: 'before-sunrise',
    label: 'Before Sunrise (Danube Bridge)',
    url: 'https://image.tmdb.org/t/p/w1280/qA2TyqPldTtoTVY3LKrNIG5g6bH.jpg',
  },
  {
    id: 'blade-runner-2049',
    label: 'Blade Runner 2049 (Orange Ruins)',
    url: 'https://image.tmdb.org/t/p/w1280/sAtoMqDVhNDQBc3QJL3RF6hlxGq.jpg',
  },
  {
    id: 'chungking',
    label: 'Chungking Express (Midnight Snack)',
    url: 'https://image.tmdb.org/t/p/w1280/vuglA60RqvpHK9rIcG8sXaiWw1L.jpg',
  },
  {
    id: 'paris-texas',
    label: 'Paris, Texas (Desert Sunset)',
    url: 'https://image.tmdb.org/t/p/w1280/fWrq3u16gaBJ6nYNWcR3XaOhQPq.jpg',
  },
];

const getCinemaAvatarPresets = (name: string) => [
  {
    id: 'initials',
    label: 'Inisial Sinema',
    url: generateCinemaAvatar(name),
  },
  {
    id: 'camera-35mm',
    label: 'Kamera 35mm',
    url: 'https://images.unsplash.com/photo-1512070679279-8988d32161be?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'neon-marquee',
    label: 'Bioskop Neon',
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'projector',
    label: 'Proyektor Vintage',
    url: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'popcorn',
    label: 'Popcorn Bioskop',
    url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'noir-sil',
    label: 'Siluet Sinema',
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'celluloid-reels',
    label: 'Pita Seluloid',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'director-lens',
    label: 'Lensa Sutradara',
    url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=300&q=80',
  },
];

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  currentUser,
  onSelectFilm,
  onOpenLogModal,
  onOpenAuthModal,
  onUpdateProfile,
  userLogs,
  watchlist,
  onToggleWatchlist,
  onOpenTicketStub,
  customLists = [],
  onOpenCreateList,
  onDeleteCustomList,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerTab, setBannerTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [previewBanner, setPreviewBanner] = useState<string>('');

  const [toastText, setToastText] = useState<string | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Active user data
  const profile = currentUser || {
    id: 'guest',
    name: 'Tamu Sinema',
    username: 'tamu',
    avatar_url: generateCinemaAvatar('Tamu Sinema'),
    bio: 'Menikmati sinema pilihan dan menjelajahi karya film bioskop.',
    location: 'Indonesia',
    role: 'Cinephile',
  };

  const currentAvatar = getSafeAvatar(profile.avatar_url, profile.name || profile.username);

  const [editName, setEditName] = useState(profile.name);
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [editLocation, setEditLocation] = useState(profile.location || 'Indonesia');
  const [editAvatar, setEditAvatar] = useState(currentAvatar);
  const [previewAvatar, setPreviewAvatar] = useState(currentAvatar);

  // Synchronize when currentAvatar updates
  useEffect(() => {
    setEditAvatar(currentAvatar);
    setPreviewAvatar(currentAvatar);
  }, [currentAvatar]);

  // Banner backdrop state with reactive sync to profile.id and profile.banner_url
  const [activeBanner, setActiveBanner] = useState<string>(() => {
    if (profile.banner_url) return profile.banner_url;
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem(`cinehearth_banner_${profile.id}`) ||
        localStorage.getItem('cinehearth_banner_guest');
      if (saved) return saved;
    }
    return BANNER_PRESETS[0].url;
  });

  useEffect(() => {
    if (profile.banner_url) {
      setActiveBanner(profile.banner_url);
      return;
    }
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem(`cinehearth_banner_${profile.id}`) ||
        localStorage.getItem('cinehearth_banner_guest');
      if (saved) {
        setActiveBanner(saved);
      }
    }
  }, [profile.id, profile.banner_url]);

  const showNotice = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3200);
  };

  const handleSaveBanner = (url: string) => {
    setActiveBanner(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cinehearth_banner_${profile.id}`, url);
      localStorage.setItem('cinehearth_banner_guest', url);
    }
    onUpdateProfile({ banner_url: url });
    setIsBannerModalOpen(false);
    showNotice('Latar belakang sinema berhasil diperbarui.');
  };

  // Banner file upload handler with WebP compression
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showNotice('Ukuran file maksimal 12MB');
      return;
    }

    try {
      showNotice('Mengompresi banner ke format WebP...');
      const webpBanner = await compressImageToWebP(file, 1920, 800, 0.85);
      setPreviewBanner(webpBanner);
      handleSaveBanner(webpBanner);
    } catch {
      showNotice('Gagal memproses gambar banner');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName,
      username: editUsername,
      bio: editBio,
      location: editLocation,
      avatar_url: editAvatar,
    });
    setIsEditing(false);
    showNotice('Profil berhasil diperbarui.');
  };

  // Avatar file upload handler with WebP compression
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showNotice('Ukuran file maksimal 8MB');
      return;
    }

    try {
      showNotice('Mengompresi foto ke format WebP...');
      const webpAvatar = await compressImageToWebP(file, 400, 400, 0.85);
      setPreviewAvatar(webpAvatar);
      setEditAvatar(webpAvatar);
      onUpdateProfile({ avatar_url: webpAvatar });
      showNotice('Foto profil berhasil diubah (format WebP).');
      setIsAvatarModalOpen(false);
    } catch {
      showNotice('Gagal memproses foto profil');
    }
  };

  const handleShareProfile = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showNotice('Tautan profil berhasil disalin.');
    }
  };

  // Real stats calculation (Zero dummy fallbacks)
  const totalFilms = userLogs.length;
  const totalReviews = userLogs.filter((l) => l.review_text && l.review_text.trim()).length;
  const avgRating =
    userLogs.length > 0
      ? (userLogs.reduce((acc, curr) => acc + Number(curr.rating), 0) / userLogs.length).toFixed(1)
      : '0.0';
  const hoursWatched = Math.round(userLogs.length * 1.9);

  // ---------------------------------------------------------------------------
  // 4 Interactive Favorite Film Slots (Always exactly 4 slots)
  // ---------------------------------------------------------------------------
  const [favoriteSlots, setFavoriteSlots] = useState<(FavoriteSlotItem | null)[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`cinehearth_top4_${profile.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 4) {
            return parsed.map((item) =>
              item
                ? {
                    ...item,
                    posterUrl: cleanPosterUrl(item.posterUrl, item.title),
                  }
                : null
            );
          }
        } catch {}
      }
    }

    // Seed initial slots from userLogs if available
    const initial: (FavoriteSlotItem | null)[] = [null, null, null, null];
    if (userLogs.length > 0) {
      const sorted = [...userLogs].sort(
        (a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0) || Number(b.rating) - Number(a.rating)
      );
      for (let i = 0; i < Math.min(4, sorted.length); i++) {
        const log = sorted[i];
        initial[i] = {
          id: `tmdb-${log.tmdb_id}`,
          tmdb_id: log.tmdb_id,
          title: log.film_title,
          posterUrl: cleanPosterUrl(log.film_poster, log.film_title),
          year: log.film_year,
          rating: log.rating,
        };
      }
    }
    return initial;
  });

  // Re-seed if user logs change and slots were completely empty
  useEffect(() => {
    if (favoriteSlots.every((s) => s === null) && userLogs.length > 0) {
      const updated: (FavoriteSlotItem | null)[] = [null, null, null, null];
      const sorted = [...userLogs].sort(
        (a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0) || Number(b.rating) - Number(a.rating)
      );
      for (let i = 0; i < Math.min(4, sorted.length); i++) {
        const log = sorted[i];
        updated[i] = {
          id: `tmdb-${log.tmdb_id}`,
          tmdb_id: log.tmdb_id,
          title: log.film_title,
          posterUrl: cleanPosterUrl(log.film_poster, log.film_title),
          year: log.film_year,
          rating: log.rating,
        };
      }
      setFavoriteSlots(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cinehearth_top4_${profile.id}`, JSON.stringify(updated));
      }
    }
  }, [userLogs, profile.id]);

  // Picker Modal State for Top 4 Slots
  const [pickingSlotIndex, setPickingSlotIndex] = useState<number | null>(null);
  const [searchPickerQuery, setSearchPickerQuery] = useState('');
  const [searchPickerResults, setSearchPickerResults] = useState<any[]>([]);
  const [isSearchingPicker, setIsSearchingPicker] = useState(false);

  useEffect(() => {
    if (pickingSlotIndex === null) {
      setSearchPickerQuery('');
      setSearchPickerResults([]);
      return;
    }
    if (!searchPickerQuery.trim()) {
      setSearchPickerResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearchingPicker(true);
      fetch(`/api/movies?type=search&query=${encodeURIComponent(searchPickerQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchPickerResults(data.slice(0, 8));
          }
        })
        .catch(() => {})
        .finally(() => setIsSearchingPicker(false));
    }, 280);

    return () => clearTimeout(timer);
  }, [searchPickerQuery, pickingSlotIndex]);

  const handleSetFavoriteSlot = (slotIndex: number, film: FavoriteSlotItem) => {
    setFavoriteSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = film;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cinehearth_top4_${profile.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    setPickingSlotIndex(null);
    showNotice(`"${film.title}" disematkan ke Film Favorit #${slotIndex + 1}.`);
  };

  const handleClearFavoriteSlot = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteSlots((prev) => {
      const updated = [...prev];
      updated[slotIndex] = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cinehearth_top4_${profile.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    showNotice(`Film favorit #${slotIndex + 1} dikosongkan.`);
  };

  // ---------------------------------------------------------------------------
  // Rating Distribution Histogram (0.5 to 5.0 stars)
  // ---------------------------------------------------------------------------
  const ratingDistribution = useMemo(() => {
    const starBins = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    const distribution = starBins.map((star) => {
      const count = userLogs.filter((l) => Math.abs(Number(l.rating) - star) < 0.25).length;
      return { star, count };
    });
    const maxCount = Math.max(...distribution.map((d) => d.count), 1);
    return { distribution, maxCount };
  }, [userLogs]);

  // ---------------------------------------------------------------------------
  // Tabs & Filters
  // ---------------------------------------------------------------------------
  const [activeProfileTab, setActiveProfileTab] = useState<'diary' | 'watchlist' | 'favorites' | 'lists'>('diary');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4plus' | 'rewatch'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'year'>('date');
  const [watchlistSearchQuery, setWatchlistSearchQuery] = useState('');
  const [watchlistSort, setWatchlistSort] = useState<'date' | 'title'>('date');

  const filteredWatchlist = useMemo(() => {
    let list = [...watchlist];
    if (watchlistSearchQuery.trim()) {
      const q = watchlistSearchQuery.toLowerCase();
      list = list.filter((item) => item.film_title.toLowerCase().includes(q));
    }
    if (watchlistSort === 'title') {
      list.sort((a, b) => a.film_title.localeCompare(b.film_title));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [watchlist, watchlistSearchQuery, watchlistSort]);

  const userCustomLists = useMemo(() => {
    return customLists.filter((l) => l.user_id === profile.id || profile.id === 'guest');
  }, [customLists, profile.id]);

  const filteredUserLogs = [...userLogs]
    .filter((log) => {
      if (ratingFilter === '5') return Number(log.rating) === 5;
      if (ratingFilter === '4plus') return Number(log.rating) >= 4;
      if (ratingFilter === 'rewatch') return log.is_rewatch;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
      if (sortBy === 'year') return (b.film_year || 0) - (a.film_year || 0);
      return new Date(b.watched_date).getTime() - new Date(a.watched_date).getTime();
    });

  const favoriteLogs = userLogs.filter((l) => l.is_favorite);

  return (
    <div style={{ backgroundColor: '#14181c', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Toast Notification */}
      {toastText && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 9999,
            backgroundColor: '#00e054',
            color: '#14181c',
            fontWeight: 800,
            fontSize: '12px',
            padding: '10px 18px',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0, 224, 84, 0.4)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {toastText}
        </div>
      )}

      {/* =========================================================================
          1. PANORAMIC CINEMA BACKDROP BANNER
         ========================================================================= */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          overflow: 'hidden',
          backgroundColor: '#1b2228',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${activeBanner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            filter: 'saturate(1.15) brightness(0.82)',
            transform: 'scale(1.02)',
            transition: 'background-image 0.4s ease',
          }}
        />

        {/* Cinematic Vignette Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(20,24,28,0.2) 0%, rgba(20,24,28,0.7) 60%, #14181c 100%)',
          }}
        />

        {/* Banner Action Button (Clean Minimalist SVG, Zero Emojis) */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              setPreviewBanner(activeBanner);
              setIsBannerModalOpen(true);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '4px',
              backgroundColor: 'rgba(20, 24, 28, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #333f4d',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333f4d')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Ganti Banner
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN PROFILE CONTAINER
         ========================================================================= */}
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '-60px auto 0',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          position: 'relative',
          zIndex: 15,
        }}
      >
        {/* Unauthenticated Alert Banner */}
        {!currentUser && (
          <div
            className="tactile-card"
            style={{
              padding: '18px 22px',
              backgroundColor: '#1b2228',
              borderRadius: '8px',
              border: '1px solid #00e054',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e054', fontWeight: 700 }}>
                MODE TAMU • BELUM MASUK
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                Masuk atau Buat Akun untuk Menyimpan Diary Sinema Pribadi Anda
              </h3>
              <p style={{ fontSize: '12px', color: '#8899a6', marginTop: '2px' }}>
                Semua catatan film, rating, dan watchlist Anda akan tersinkronisasi otomatis ke cloud Supabase.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onOpenAuthModal('signin')}
                className="btn-secondary"
                style={{ padding: '7px 16px', fontSize: '11px' }}
              >
                MASUK
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '11px' }}
              >
                DAFTAR AKUN
              </button>
            </div>
          </div>
        )}

        {/* Profile Identity Card (Patron Pro Style) */}
        <div
          className="tactile-card"
          style={{
            padding: '24px 28px',
            backgroundColor: '#1b2228',
            borderRadius: '8px',
            border: '1px solid #2c3642',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}
        >
          {/* Avatar & User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
            {/* Interactive Avatar with Hover Camera Overlay (Zero Emojis) */}
            <div
              onClick={() => {
                setPreviewAvatar(currentAvatar);
                setIsAvatarModalOpen(true);
              }}
              style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '50%',
              }}
              title="Klik untuk mengganti foto profil"
            >
              <img
                src={currentAvatar}
                alt={profile.name}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 0 0 3px #14181c, 0 0 0 5px #00e054, 0 8px 24px rgba(0,224,84,0.3)',
                  display: 'block',
                }}
              />

              {/* Hover Camera Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(20, 24, 28, 0.78)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#00e054', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  GANTI FOTO
                </span>
              </div>

              {/* Verified Star Badge */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#00e054',
                  color: '#14181c',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 900,
                  border: '2px solid #14181c',
                }}
                title="Verified Patron Cinephile"
              >
                ★
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {profile.name}
                </h1>
                <span className="badge-pill badge-pill-green" style={{ fontSize: '10px', padding: '3px 8px' }}>
                  {currentUser ? 'ANGGOTA RESMI' : 'PREVIEW PROFIL'}
                </span>
                <span className="badge-pill" style={{ fontSize: '10px', padding: '3px 8px' }}>
                  PATRON PRO
                </span>
              </div>

              <div style={{ fontSize: '14px', color: '#00e054', fontWeight: 700, marginTop: '2px' }}>
                @{profile.username}
              </div>

              <p style={{ fontSize: '13px', color: '#9ab0c2', marginTop: '6px', maxWidth: '620px', lineHeight: 1.55 }}>
                {profile.bio || 'Pencinta sinema dan penikmat film bioskop.'}
              </p>

              {/* Profile Details Bar (Clean Minimalist SVGs) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#677b8c',
                  marginTop: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {profile.location || 'Indonesia'}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"></rect>
                    <line x1="7" x2="7" y1="2" y2="22"></line>
                    <line x1="17" x2="17" y1="2" y2="22"></line>
                    <line x1="2" x2="22" y1="12" y2="12"></line>
                  </svg>
                  {profile.role || 'Cinephile'}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                  Bergabung 2026
                </span>
                {currentUser?.email && (
                  <>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#8899a6' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                      {currentUser.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setPreviewAvatar(currentAvatar);
                setIsAvatarModalOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Ganti foto profil Anda"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Ganti Foto
            </button>

            <button
              onClick={() => {
                setPreviewBanner(activeBanner);
                setIsBannerModalOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Ganti latar belakang sinema profil Anda"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Ganti Banner
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setEditName(profile.name);
                  setEditUsername(profile.username);
                  setEditBio(profile.bio || '');
                  setEditLocation(profile.location || 'Indonesia');
                  setEditAvatar(currentAvatar);
                  setIsEditing(true);
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Edit Profil
              </button>
            )}

            <button
              onClick={handleShareProfile}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
              title="Salin tautan profil"
            >
              Bagikan
            </button>

            <button
              onClick={() => onOpenLogModal()}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>+</span> LOG FILM BARU
            </button>
          </div>
        </div>

        {/* =========================================================================
            3. STATS STRIP & RATING DISTRIBUTION GRID
           ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Left: 4 Quick KPI Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            <div
              className="tactile-card"
              style={{
                padding: '16px 18px',
                backgroundColor: '#1b2228',
                borderRadius: '6px',
                border: '1px solid #2c3642',
              }}
            >
              <div style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Film Ditonton
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {totalFilms}
              </div>
              <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                {totalFilms === 1 ? '1 film tercatat' : `${totalFilms} film tercatat`}
              </div>
            </div>

            <div
              className="tactile-card"
              style={{
                padding: '16px 18px',
                backgroundColor: '#1b2228',
                borderRadius: '6px',
                border: '1px solid #2c3642',
              }}
            >
              <div style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Ulasan Ditulis
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#00e054', marginTop: '4px' }}>
                {totalReviews}
              </div>
              <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                {totalReviews > 0 ? `${totalReviews} ulasan publik` : 'Belum ada ulasan'}
              </div>
            </div>

            <div
              className="tactile-card"
              style={{
                padding: '16px 18px',
                backgroundColor: '#1b2228',
                borderRadius: '6px',
                border: '1px solid #2c3642',
              }}
            >
              <div style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Jam Menonton
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {hoursWatched}j
              </div>
              <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                Estimasi durasi film
              </div>
            </div>

            <div
              className="tactile-card"
              style={{
                padding: '16px 18px',
                backgroundColor: '#1b2228',
                borderRadius: '6px',
                border: '1px solid #2c3642',
              }}
            >
              <div style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Rata-rata Rating
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#f5c518', marginTop: '4px' }}>
                ★ {avgRating}
              </div>
              <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                Skala 0.5 - 5.0 bintang
              </div>
            </div>
          </div>

          {/* Right: Authentic Letterboxd Rating Distribution Histogram */}
          <div
            className="tactile-card"
            style={{
              padding: '18px 22px',
              backgroundColor: '#1b2228',
              borderRadius: '6px',
              border: '1px solid #2c3642',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#677b8c', fontWeight: 700, letterSpacing: '0.04em' }}>
                Distribusi Rating Pengguna
              </span>
              <span style={{ fontSize: '11px', color: '#00e054', fontWeight: 700 }}>
                {totalFilms} Catatan
              </span>
            </div>

            {/* Bar Chart Bars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '4px',
                height: '70px',
                paddingTop: '8px',
                borderBottom: '1px solid #2c3642',
              }}
            >
              {ratingDistribution.distribution.map((item) => {
                const heightPercent = item.count > 0 ? Math.max((item.count / ratingDistribution.maxCount) * 100, 15) : 6;
                const isHoverable = item.count > 0;
                return (
                  <div
                    key={item.star}
                    title={`★ ${item.star}: ${item.count} film`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      cursor: isHoverable ? 'pointer' : 'default',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        backgroundColor: item.count > 0 ? '#00e054' : '#242c34',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.3s ease, background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (item.count > 0) e.currentTarget.style.backgroundColor = '#40bcf4';
                      }}
                      onMouseLeave={(e) => {
                        if (item.count > 0) e.currentTarget.style.backgroundColor = '#00e054';
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels under histogram */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#677b8c' }}>
              <span>★ 0.5</span>
              <span>★ 2.5</span>
              <span>★ 5.0</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. THE ICONIC LETTERBOXD "4 FILM FAVORIT SEPANJANG MASA" (4 Interactive Slots)
           ========================================================================= */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
                PILIHAN UTAMA
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                4 Film Favorit Sepanjang Masa
              </h2>
            </div>

            <div style={{ fontSize: '12px', color: '#8899a6' }}>
              Klik poster untuk melihat detail, atau klik tombol tambah untuk memilih favorit Anda.
            </div>
          </div>

          {/* 4 Responsive Slots Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
          >
            {favoriteSlots.map((slot, idx) => {
              if (slot) {
                return (
                  <div
                    key={slot.id || idx}
                    className="tix-card-holder group"
                    style={{
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#1b2228',
                      border: '1px solid #2c3642',
                      cursor: 'pointer',
                      aspectRatio: '2/3',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                    }}
                    onClick={() => onSelectFilm(slot.id)}
                  >
                    <img
                      src={cleanPosterUrl(slot.posterUrl, slot.title)}
                      alt={slot.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.25s ease',
                      }}
                    />

                    {/* Bottom Info Gradient */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '10px',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.95) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#ffffff',
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {slot.title}
                        </div>
                        {slot.year && <div style={{ fontSize: '10px', color: '#8899a6' }}>{slot.year}</div>}
                      </div>

                      {slot.rating && (
                        <span style={{ color: '#00e054', fontWeight: 800, fontSize: '11px' }}>
                          ★ {slot.rating}
                        </span>
                      )}
                    </div>

                    {/* Hover Action Strip */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        gap: '4px',
                        zIndex: 5,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickingSlotIndex(idx);
                        }}
                        style={{
                          backgroundColor: 'rgba(20,24,28,0.85)',
                          color: '#ffffff',
                          border: '1px solid #333f4d',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Ganti film favorit ini"
                      >
                        Ganti
                      </button>
                      <button
                        onClick={(e) => handleClearFavoriteSlot(idx, e)}
                        style={{
                          backgroundColor: 'rgba(20,24,28,0.85)',
                          color: '#ff4060',
                          border: '1px solid #333f4d',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Hapus dari Top 4"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              }

              // Empty Slot (Interactive Dashed Letterboxd Slot)
              return (
                <div
                  key={`empty-${idx}`}
                  onClick={() => setPickingSlotIndex(idx)}
                  className="tactile-card"
                  style={{
                    aspectRatio: '2/3',
                    borderRadius: '6px',
                    border: '2px dashed #2c3642',
                    backgroundColor: 'rgba(27,34,40,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00e054';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 224, 84, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2c3642';
                    e.currentTarget.style.backgroundColor = 'rgba(27,34,40,0.4)';
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#212932',
                      border: '1px solid #333f4d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: '#00e054',
                      fontWeight: 700,
                    }}
                  >
                    +
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pilih Favorit #{idx + 1}
                  </div>
                  <span style={{ fontSize: '10px', color: '#677b8c' }}>
                    Klik untuk memilih film
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            5. SUB-NAVIGATION TABS (DIARY, WATCHLIST, FAVORIT)
           ========================================================================= */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #242c34',
              paddingBottom: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveProfileTab('diary')}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  color: activeProfileTab === 'diary' ? '#ffffff' : '#8899a6',
                  backgroundColor: activeProfileTab === 'diary' ? '#212932' : 'transparent',
                  border: activeProfileTab === 'diary' ? '1px solid #333f4d' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                TIKET DIARY ({userLogs.length})
              </button>

              <button
                onClick={() => setActiveProfileTab('watchlist')}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  color: activeProfileTab === 'watchlist' ? '#ffffff' : '#8899a6',
                  backgroundColor: activeProfileTab === 'watchlist' ? '#212932' : 'transparent',
                  border: activeProfileTab === 'watchlist' ? '1px solid #333f4d' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                WATCHLIST ({watchlist.length})
              </button>

              <button
                onClick={() => setActiveProfileTab('favorites')}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  color: activeProfileTab === 'favorites' ? '#ffffff' : '#8899a6',
                  backgroundColor: activeProfileTab === 'favorites' ? '#212932' : 'transparent',
                  border: activeProfileTab === 'favorites' ? '1px solid #333f4d' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                FAVORIT ({favoriteLogs.length})
              </button>

              <button
                onClick={() => setActiveProfileTab('lists')}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  color: activeProfileTab === 'lists' ? '#ffffff' : '#8899a6',
                  backgroundColor: activeProfileTab === 'lists' ? '#212932' : 'transparent',
                  border: activeProfileTab === 'lists' ? '1px solid #333f4d' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                DAFTAR FILM ({userCustomLists.length})
              </button>
            </div>

            {/* Quick Diary Filter & Sort Strip */}
            {activeProfileTab === 'diary' && userLogs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 600 }}>Filter:</span>
                <button
                  onClick={() => setRatingFilter('all')}
                  className={`tag-pill ${ratingFilter === 'all' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Semua
                </button>
                <button
                  onClick={() => setRatingFilter('5')}
                  className={`tag-pill ${ratingFilter === '5' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  ★ 5.0
                </button>
                <button
                  onClick={() => setRatingFilter('4plus')}
                  className={`tag-pill ${ratingFilter === '4plus' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  ★ 4.0+
                </button>
                <button
                  onClick={() => setRatingFilter('rewatch')}
                  className={`tag-pill ${ratingFilter === 'rewatch' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Rewatch
                </button>

                <span style={{ color: '#333f4d', margin: '0 2px' }}>|</span>

                <span style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 600 }}>Urut:</span>
                <button
                  onClick={() => setSortBy('date')}
                  className={`tag-pill ${sortBy === 'date' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Terbaru
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`tag-pill ${sortBy === 'rating' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Rating
                </button>
                <button
                  onClick={() => setSortBy('year')}
                  className={`tag-pill ${sortBy === 'year' ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  Tahun
                </button>
              </div>
            )}
          </div>

          {/* 1. DIARY TAB CONTENT */}
          {activeProfileTab === 'diary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUserLogs.length === 0 ? (
                <div
                  className="tactile-card"
                  style={{
                    padding: '48px 20px',
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
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                    <path d="M13 5v2"></path>
                    <path d="M13 17v2"></path>
                    <path d="M13 11v2"></path>
                  </svg>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {userLogs.length === 0 ? 'Belum Ada Tiket Diary' : 'Tidak Ada Film yang Cocok dengan Filter'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
                    {userLogs.length === 0
                      ? 'Anda belum mencatat film yang telah ditonton. Mulai catat diary sinema Anda sekarang dan kumpulkan karcis tiket digital.'
                      : 'Coba ubah opsi filter rating atau pengurutan untuk melihat catatan film Anda.'}
                  </p>
                  {userLogs.length === 0 ? (
                    <button
                      onClick={() => onOpenLogModal()}
                      className="btn-primary"
                      style={{ padding: '9px 22px', fontSize: '12px', marginTop: '6px' }}
                    >
                      + LOG FILM PERTAMA
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setRatingFilter('all');
                        setSortBy('date');
                      }}
                      className="btn-secondary"
                      style={{ padding: '7px 16px', fontSize: '11px', marginTop: '6px' }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              ) : (
                filteredUserLogs.map((log) => (
                  <div
                    key={log.id}
                    className="tactile-card"
                    style={{
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      backgroundColor: '#1b2228',
                      borderRadius: '6px',
                      border: '1px solid #2c3642',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      onClick={() => onSelectFilm(`tmdb-${log.tmdb_id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1, minWidth: '240px' }}
                    >
                      <div
                        style={{
                          width: '44px',
                          aspectRatio: '2/3',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #2c3642',
                        }}
                      >
                        <img
                          src={cleanPosterUrl(log.film_poster, log.film_title)}
                          alt={log.film_title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                            {log.film_title}
                          </span>
                          <span style={{ fontSize: '12px', color: '#677b8c' }}>({log.film_year})</span>
                          <span className="badge-pill" style={{ fontSize: '9px', padding: '2px 6px' }}>
                            {log.watch_format || 'Cinema'}
                          </span>
                          {log.is_rewatch && (
                            <span className="badge-pill badge-pill-amber" style={{ fontSize: '9px', padding: '2px 6px' }}>
                              REWATCH
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8899a6', marginTop: '3px' }}>
                          Ditonton pada {log.watched_date}
                          {log.review_text && ` • "${log.review_text.slice(0, 70)}${log.review_text.length > 70 ? '...' : ''}"`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ color: '#00e054', fontWeight: 800, fontSize: '14px' }}>
                        ★ {log.rating}
                      </span>
                      {log.is_favorite && (
                        <span style={{ color: '#ff4060', fontSize: '15px' }}>♥</span>
                      )}

                      {/* Shareable Ticket Stub Button (Clean SVG) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTicketStub({
                            filmTitle: log.film_title,
                            filmYear: log.film_year,
                            filmPoster: cleanPosterUrl(log.film_poster, log.film_title),
                            rating: Number(log.rating),
                            watchedDate: log.watched_date,
                            watchFormat: log.watch_format || 'Cinema',
                            userName: profile.name,
                            userUsername: profile.username,
                            reviewText: log.review_text,
                            ticketId: log.id,
                          });
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Unduh karcis bioskop untuk dibagikan"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                        </svg>
                        Bagikan Tiket
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. WATCHLIST TAB CONTENT */}
          {activeProfileTab === 'watchlist' && (
            <div>
              {watchlist.length === 0 ? (
                <div
                  className="tactile-card"
                  style={{
                    padding: '48px 20px',
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
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                  </svg>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Watchlist Masih Kosong
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
                    Anda belum menyimpan film yang ingin ditonton. Jelajahi katalog film bioskop dan tandai film untuk disimpan di sini.
                  </p>
                  <button
                    onClick={() => onSelectFilm('tmdb-969681')}
                    className="btn-primary"
                    style={{ padding: '9px 22px', fontSize: '12px', marginTop: '6px' }}
                  >
                    JELAJAHI FILM BIOSKOP
                  </button>
                </div>
              ) : (
                <>
                  {/* Watchlist Filter & Search Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      backgroundColor: '#1b2228',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #2c3642',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: '1 1 200px',
                        maxWidth: '320px',
                        backgroundColor: '#14181c',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #333f4d',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8899a6" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        placeholder="Cari di watchlist..."
                        value={watchlistSearchQuery}
                        onChange={(e) => setWatchlistSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '12px', outline: 'none', width: '100%' }}
                      />
                      {watchlistSearchQuery && (
                        <button
                          onClick={() => setWatchlistSearchQuery('')}
                          style={{ background: 'none', border: 'none', color: '#8899a6', cursor: 'pointer', fontSize: '11px', padding: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 600 }}>Urutkan:</span>
                      <select
                        value={watchlistSort}
                        onChange={(e) => setWatchlistSort(e.target.value as any)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          backgroundColor: '#212932',
                          border: '1px solid #333f4d',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="date">Terbaru Ditambahkan</option>
                        <option value="title">Judul (A-Z)</option>
                      </select>
                    </div>
                  </div>

                  {filteredWatchlist.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#8899a6', fontSize: '12px' }}>
                      Tidak ada film di watchlist yang cocok dengan pencarian "{watchlistSearchQuery}".
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                      {filteredWatchlist.map((item) => (
                    <div
                      key={item.id || item.tmdb_id}
                      className="tix-card-holder"
                      style={{ backgroundColor: '#1b2228', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2c3642' }}
                    >
                      <div
                        onClick={() => onSelectFilm(`tmdb-${item.tmdb_id}`)}
                        style={{ position: 'relative', aspectRatio: '2/3', cursor: 'pointer' }}
                      >
                        <img
                          src={cleanPosterUrl(item.film_poster, item.film_title)}
                          alt={item.film_title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          {item.film_title}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onOpenLogModal(`tmdb-${item.tmdb_id}`)}
                            className="btn-primary"
                            style={{ flex: 1, padding: '5px 0', fontSize: '10px' }}
                          >
                            + LOG
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleWatchlist(item.tmdb_id, item.film_title, item.film_poster)}
                            className="btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '10px', color: '#ff4060' }}
                            title="Hapus dari watchlist"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

          {/* 3. FAVORITES TAB CONTENT */}
          {activeProfileTab === 'favorites' && (
            <div>
              {favoriteLogs.length === 0 ? (
                <div
                  className="tactile-card"
                  style={{
                    padding: '48px 20px',
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
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Belum Ada Film Favorit
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
                    Tandai film dengan ikon hati saat mencatat ulasan untuk menyematkannya di koleksi favorit Anda.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {favoriteLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => onSelectFilm(`tmdb-${log.tmdb_id}`)}
                      className="tix-card-holder"
                      style={{ backgroundColor: '#1b2228', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #2c3642' }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3' }}>
                        <img
                          src={cleanPosterUrl(log.film_poster, log.film_title)}
                          alt={log.film_title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            color: '#ff4060',
                            backgroundColor: 'rgba(20,24,28,0.85)',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                          }}
                        >
                          ♥
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '6px 8px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.92) 100%)',
                            fontSize: '11px',
                            color: '#00e054',
                            fontWeight: 700,
                          }}
                        >
                          ★ {log.rating}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
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
                          {log.film_title}
                        </div>
                        <div style={{ fontSize: '10px', color: '#8899a6', marginTop: '2px' }}>
                          {log.film_year}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. CUSTOM LISTS TAB CONTENT */}
          {activeProfileTab === 'lists' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Daftar Film Kurasi Anda
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8899a6', margin: '4px 0 0 0' }}>
                    Koleksi daftar bertema dan kurasi sinematik yang Anda buat
                  </p>
                </div>

                {onOpenCreateList && (
                  <button
                    onClick={onOpenCreateList}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>+</span> BUAT DAFTAR BARU
                  </button>
                )}
              </div>

              {userCustomLists.length === 0 ? (
                <div
                  className="tactile-card"
                  style={{
                    padding: '48px 20px',
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
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Belum Ada Daftar Film
                  </h3>
                  <p style={{ fontSize: '12px', color: '#8899a6', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
                    Kumpulkan film-film pilihan Anda ke dalam daftar tematik seperti "Sinema Malam Hari", "Masterpiece Sci-Fi", atau "Marathon Sutradara".
                  </p>
                  {onOpenCreateList && (
                    <button
                      onClick={onOpenCreateList}
                      className="btn-primary"
                      style={{ padding: '9px 22px', fontSize: '12px', marginTop: '6px' }}
                    >
                      BUAT DAFTAR PERTAMA
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {userCustomLists.map((list) => {
                    const previewFilms = list.films?.slice(0, 4) || [];
                    return (
                      <div
                        key={list.id}
                        className="tactile-card"
                        style={{
                          backgroundColor: '#1b2228',
                          borderRadius: '8px',
                          border: '1px solid #2c3642',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        {/* Film Posters Mosaic */}
                        <div
                          style={{
                            height: '130px',
                            backgroundColor: '#14181c',
                            display: 'flex',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {previewFilms.length > 0 ? (
                            previewFilms.map((pf, idx) => (
                              <div
                                key={pf.id || idx}
                                style={{
                                  flex: 1,
                                  height: '100%',
                                  position: 'relative',
                                  borderRight: idx < previewFilms.length - 1 ? '1px solid #14181c' : 'none',
                                }}
                              >
                                <img
                                  src={cleanPosterUrl(pf.film_poster, pf.film_title)}
                                  alt={pf.film_title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#677b8c',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              Belum ada film dalam daftar ini
                            </div>
                          )}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(20,24,28,0.85)',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '3px',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            {list.films?.length || 0} FILM
                          </div>
                        </div>

                        {/* Info & Details */}
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <h4
                              style={{
                                fontSize: '14px',
                                fontWeight: 800,
                                color: '#ffffff',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {list.title}
                            </h4>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '3px',
                                backgroundColor: !list.is_private ? 'rgba(0, 224, 84, 0.12)' : 'rgba(103, 123, 140, 0.15)',
                                color: !list.is_private ? '#00e054' : '#8899a6',
                                textTransform: 'uppercase',
                              }}
                            >
                              {!list.is_private ? 'Publik' : 'Pribadi'}
                            </span>
                          </div>

                          {list.description && (
                            <p
                              style={{
                                fontSize: '11px',
                                color: '#8899a6',
                                margin: 0,
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {list.description}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', color: '#677b8c' }}>
                              {new Date(list.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>

                            {onDeleteCustomList && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus daftar "${list.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
                                    onDeleteCustomList(list.id);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ff4060',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                }}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          6. FAVORITE MOVIE SELECTOR MODAL (TMDB Search for 4 Slots)
         ========================================================================= */}
      {pickingSlotIndex !== null && (
        <div
          className="modal-backdrop-cinematic"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPickingSlotIndex(null);
          }}
        >
          <div
            className="modal-surface-cinema custom-modal-scrollbar"
            style={{
              width: '100%',
              maxWidth: '580px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            <div
              style={{
                padding: '18px 22px',
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
                  SLOT FAVORIT #{pickingSlotIndex + 1}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0' }}>
                  Pilih Film Favorit Anda
                </h3>
              </div>
              <button
                onClick={() => setPickingSlotIndex(null)}
                className="modal-close-btn-cinema"
                title="Tutup (Esc)"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              {/* Live Search Input */}
              <div>
                <input
                  type="text"
                  autoFocus
                  value={searchPickerQuery}
                  onChange={(e) => setSearchPickerQuery(e.target.value)}
                  placeholder="Cari judul film di katalog TMDB (contoh: Past Lives, Oppenheimer)..."
                  className="form-input-cinema"
                />
              </div>

            {/* If Query Typed: Show TMDB Results */}
            {searchPickerQuery.trim() ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700 }}>
                  {isSearchingPicker ? 'Mencari di TMDB...' : `Hasil Pencarian (${searchPickerResults.length})`}
                </div>

                {searchPickerResults.map((m) => (
                  <div
                    key={m.id}
                    onClick={() =>
                      handleSetFavoriteSlot(pickingSlotIndex, {
                        id: m.id,
                        tmdb_id: parseInt(m.id.replace('tmdb-', ''), 10) || 0,
                        title: m.title,
                        posterUrl: cleanPosterUrl(m.posterUrl, m.title),
                        year: m.year,
                        rating: m.rating,
                      })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      backgroundColor: '#212932',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <img
                      src={cleanPosterUrl(m.posterUrl, m.title)}
                      alt={m.title}
                      style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{m.title}</div>
                      <div style={{ fontSize: '11px', color: '#8899a6' }}>
                        {m.year} • {m.director || 'Film Bioskop'}
                      </div>
                    </div>
                    <span style={{ color: '#00e054', fontWeight: 700, fontSize: '12px' }}>
                      ★ {m.rating}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* If No Query: Show Films from User Diary first */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userLogs.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#677b8c', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
                      Dari Diary Film Anda:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {userLogs.map((l) => (
                        <div
                          key={l.id}
                          onClick={() =>
                            handleSetFavoriteSlot(pickingSlotIndex, {
                              id: `tmdb-${l.tmdb_id}`,
                              tmdb_id: l.tmdb_id,
                              title: l.film_title,
                              posterUrl: cleanPosterUrl(l.film_poster, l.film_title),
                              year: l.film_year,
                              rating: l.rating,
                            })
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            backgroundColor: '#212932',
                            cursor: 'pointer',
                            border: '1px solid transparent',
                            transition: 'border-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                        >
                          <img
                            src={cleanPosterUrl(l.film_poster, l.film_title)}
                            alt={l.film_title}
                            style={{ width: '30px', height: '45px', objectFit: 'cover', borderRadius: '3px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{l.film_title}</div>
                            <div style={{ fontSize: '11px', color: '#8899a6' }}>{l.film_year} • Ditonton {l.watched_date}</div>
                          </div>
                          <span style={{ color: '#00e054', fontWeight: 700, fontSize: '12px' }}>
                            ★ {l.rating}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '11px', color: '#8899a6', textAlign: 'center', padding: '8px 0' }}>
                  Ketik judul film apa pun di kolom pencarian di atas untuk menambahkan film favorit Anda.
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. DEDICATED GANTI BANNER MODAL (File Upload WebP, Gallery, URL)
         ========================================================================= */}
      {isBannerModalOpen && (
        <div
          className="modal-backdrop-cinematic"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBannerModalOpen(false);
          }}
        >
          <div
            className="modal-surface-cinema custom-modal-scrollbar"
            style={{
              width: '100%',
              maxWidth: '640px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            <div
              style={{
                padding: '18px 22px',
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
                  PENGATURAN LATAR BELAKANG
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0' }}>
                  Ganti Banner Profil Sinema
                </h3>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="modal-close-btn-cinema"
                title="Tutup (Esc)"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

            {/* Live Banner Preview Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '140px',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#212932',
                border: '1px solid #333f4d',
              }}
            >
              <img
                src={previewBanner || activeBanner}
                alt="Banner Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.7) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                }}
              >
                Pratinjau Banner
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2c3642' }}>
              {(
                [
                  { id: 'presets', label: 'Still Sinematik' },
                  { id: 'upload', label: 'Unggah File (WebP)' },
                  { id: 'url', label: 'Tautan URL' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBannerTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: bannerTab === tab.id ? '#00e054' : '#8899a6',
                    borderBottom: bannerTab === tab.id ? '2px solid #00e054' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Cinematic Stills */}
            {bannerTab === 'presets' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {BANNER_PRESETS.map((p) => {
                  const isSelected = (previewBanner || activeBanner) === p.url;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPreviewBanner(p.url)}
                      style={{
                        position: 'relative',
                        height: '74px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #00e054' : '1px solid #333f4d',
                      }}
                    >
                      <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(20, 24, 28, 0.45)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#ffffff',
                        }}
                      >
                        {p.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Upload File (Automatic WebP) */}
            {bannerTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleBannerFileUpload}
                />
                <div
                  onClick={() => bannerFileInputRef.current?.click()}
                  style={{
                    padding: '30px 20px',
                    borderRadius: '6px',
                    border: '2px dashed #333f4d',
                    backgroundColor: '#212932',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333f4d')}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Pilih Foto Banner dari Komputer atau HP
                    </div>
                    <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '4px' }}>
                      Otomatis dikompresi ke format WebP berkualitas tinggi (Maksimal 12MB)
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 20px', fontSize: '12px', marginTop: '4px' }}
                  >
                    PILIH FILE BANNER
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: URL */}
            {bannerTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8899a6', fontWeight: 700 }}>
                  Tautan URL Banner
                </label>
                <input
                  type="url"
                  value={customBannerUrl}
                  onChange={(e) => {
                    setCustomBannerUrl(e.target.value);
                    if (e.target.value.startsWith('http')) {
                      setPreviewBanner(e.target.value);
                    }
                  }}
                  placeholder="https://image.tmdb.org/t/p/original/...jpg"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#212932',
                    border: '1px solid #333f4d',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customBannerUrl.trim()) setPreviewBanner(customBannerUrl.trim());
                  }}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '11px', alignSelf: 'flex-start' }}
                >
                  Terapkan Tautan URL
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => handleSaveBanner(previewBanner || activeBanner)}
                className="btn-primary"
                style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
              >
                SIMPAN BANNER
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. DEDICATED GANTI FOTO PROFIL MODAL (Upload File WebP, Gallery, URL)
         ========================================================================= */}
      {isAvatarModalOpen && (
        <div
          className="modal-backdrop-cinematic"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAvatarModalOpen(false);
          }}
        >
          <div
            className="modal-surface-cinema custom-modal-scrollbar"
            style={{
              width: '100%',
              maxWidth: '540px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 22px',
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
                  PENGATURAN FOTO PROFIL
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0' }}>
                  Ganti Foto Profil Anda
                </h3>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="modal-close-btn-cinema"
                title="Tutup (Esc)"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

            {/* Current / Live Preview Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                padding: '16px',
                backgroundColor: '#212932',
                borderRadius: '6px',
                border: '1px solid #2c3642',
              }}
            >
              <img
                src={previewAvatar}
                alt="Preview"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 0 0 3px #14181c, 0 0 0 5px #00e054',
                }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  Pratinjau Foto Profil
                </div>
                <div style={{ fontSize: '12px', color: '#8899a6', marginTop: '2px' }}>
                  Foto ini akan tampil di seluruh diary, ulasan, tiket, dan header.
                </div>
              </div>
            </div>

            {/* Method Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2c3642' }}>
              {(
                [
                  { id: 'upload', label: 'Unggah File (WebP)' },
                  { id: 'presets', label: 'Galeri Sinema' },
                  { id: 'url', label: 'Tautan URL' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAvatarTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: avatarTab === tab.id ? '#00e054' : '#8899a6',
                    borderBottom: avatarTab === tab.id ? '2px solid #00e054' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Upload from Computer/Device */}
            {avatarTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFileUpload}
                />
                <div
                  onClick={() => avatarFileInputRef.current?.click()}
                  style={{
                    padding: '30px 20px',
                    borderRadius: '6px',
                    border: '2px dashed #333f4d',
                    backgroundColor: '#212932',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333f4d')}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Pilih Foto dari Perangkat (PC atau HP)
                    </div>
                    <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '4px' }}>
                      Otomatis dikonversi dan dikompresi ke format WebP ringan (Maksimal 8MB)
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 20px', fontSize: '12px', marginTop: '4px' }}
                  >
                    PILIH FILE FOTO
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Curated Cinema Presets */}
            {avatarTab === 'presets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8899a6' }}>
                  Pilih ikon sinema atau inisial nama Anda (bebas dari foto model generik):
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                  }}
                >
                  {getCinemaAvatarPresets(profile.name).map((preset) => {
                    const isSelected = previewAvatar === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setPreviewAvatar(preset.url)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 6px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? 'rgba(0,224,84,0.1)' : '#212932',
                          border: isSelected ? '2px solid #00e054' : '1px solid #2c3642',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: isSelected ? '#00e054' : '#ccd6e0', fontWeight: 600 }}>
                          {preset.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Custom Web URL */}
            {avatarTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8899a6', fontWeight: 700 }}>
                  Tautan URL Foto
                </label>
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => {
                    setCustomAvatarUrl(e.target.value);
                    if (e.target.value.startsWith('http')) {
                      setPreviewAvatar(e.target.value);
                    }
                  }}
                  placeholder="https://contoh-domain.com/foto-anda.jpg"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#212932',
                    border: '1px solid #333f4d',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl.trim()) setPreviewAvatar(customAvatarUrl.trim());
                  }}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '11px', alignSelf: 'flex-start' }}
                >
                  Terapkan Tautan URL
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile({ avatar_url: previewAvatar });
                  setEditAvatar(previewAvatar);
                  setIsAvatarModalOpen(false);
                  showNotice('Foto profil berhasil diperbarui.');
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
              >
                SIMPAN FOTO PROFIL
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8b. BANNER CUSTOMIZER MODAL (WebP + Curated Stills + Local Device Upload)
         ========================================================================= */}
      {isBannerModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBannerModalOpen(false);
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
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
                  PENGATURAN LATAR BELAKANG SINEMA
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  Ganti Banner Profil Anda
                </h3>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#8899a6', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Live Panoramic Banner Preview */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '140px',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#14181c',
                border: '1px solid #2c3642',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${previewBanner || activeBanner})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 35%',
                  filter: 'saturate(1.15) brightness(0.82)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(20,24,28,0.2) 0%, rgba(20,24,28,0.85) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={currentAvatar}
                    alt={profile.name}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #00e054',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{profile.name}</div>
                    <div style={{ fontSize: '11px', color: '#00e054', fontWeight: 600 }}>@{profile.username}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ccd6e0',
                    backgroundColor: 'rgba(20,24,28,0.8)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #333f4d',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Pratinjau Banner
                </span>
              </div>
            </div>

            {/* Method Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2c3642' }}>
              {(
                [
                  { id: 'presets', label: 'Galeri Sinema (8 Pilihan)' },
                  { id: 'upload', label: 'Unggah File (WebP)' },
                  { id: 'url', label: 'Tautan URL' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBannerTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: bannerTab === tab.id ? '#00e054' : '#8899a6',
                    borderBottom: bannerTab === tab.id ? '2px solid #00e054' : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Presets */}
            {bannerTab === 'presets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8899a6' }}>
                  Pilih latar belakang sinematik resolusi tinggi pilihan:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {BANNER_PRESETS.map((preset) => {
                    const isSelected = (previewBanner || activeBanner) === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setPreviewBanner(preset.url)}
                        style={{
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid #00e054' : '1px solid #2c3642',
                          cursor: 'pointer',
                          position: 'relative',
                          aspectRatio: '16/9',
                          backgroundColor: '#14181c',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isSelected ? 'brightness(0.95)' : 'brightness(0.7)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '6px 8px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(20,24,28,0.95) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#00e054' : '#ffffff' }}>
                            {preset.label}
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: '11px', color: '#00e054', fontWeight: 800 }}>✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Upload WebP */}
            {bannerTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleBannerFileUpload}
                />
                <div
                  onClick={() => bannerFileInputRef.current?.click()}
                  style={{
                    padding: '34px 20px',
                    borderRadius: '6px',
                    border: '2px dashed #333f4d',
                    backgroundColor: '#212932',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00e054')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333f4d')}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#677b8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <circle cx="9" cy="9" r="2"></circle>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                  </svg>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Pilih Foto Banner dari Komputer atau HP
                    </div>
                    <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '4px' }}>
                      Otomatis dikonversi dan dikompresi ke format WebP panorama resolusi tinggi (Maksimal 12MB)
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 20px', fontSize: '12px', marginTop: '4px' }}
                  >
                    PILIH FILE GAMBAR
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: URL */}
            {bannerTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8899a6', fontWeight: 700 }}>
                  Tautan URL Gambar Banner
                </label>
                <input
                  type="url"
                  value={customBannerUrl}
                  onChange={(e) => {
                    setCustomBannerUrl(e.target.value);
                    if (e.target.value.startsWith('http')) {
                      setPreviewBanner(e.target.value);
                    }
                  }}
                  placeholder="https://images.unsplash.com/... atau https://image.tmdb.org/..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#212932',
                    border: '1px solid #333f4d',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customBannerUrl.trim()) setPreviewBanner(customBannerUrl.trim());
                  }}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '11px', alignSelf: 'flex-start' }}
                >
                  Terapkan Tautan URL
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveBanner(previewBanner || activeBanner);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '10px 0', fontSize: '12px' }}
              >
                SIMPAN BANNER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. EDIT PROFILE MODAL
         ========================================================================= */}
      {isEditing && (
        <div
          className="modal-backdrop-cinematic"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div
            className="modal-surface-cinema custom-modal-scrollbar"
            style={{
              width: '100%',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 22px',
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
                  PENGATURAN PROFIL
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0' }}>
                  Edit Profil Sinema Anda
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="modal-close-btn-cinema"
                title="Tutup (Esc)"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              {/* Avatar Quick Change Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(18, 23, 29, 0.65)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <img
                  src={editAvatar}
                  alt="Avatar Preview"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: '0 0 0 2px #14181c, 0 0 0 4px #00e054',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Foto Profil</div>
                  <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                    Unggah foto WebP atau pilih dari galeri sinema
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewAvatar(editAvatar);
                    setIsAvatarModalOpen(true);
                  }}
                  className="form-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  Ubah Foto
                </button>
              </div>

              {/* Banner Quick Change Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(18, 23, 29, 0.65)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '38px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundImage: `url(${activeBanner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Banner Sinema</div>
                  <div style={{ fontSize: '11px', color: '#8899a6', marginTop: '2px' }}>
                    Pilih preset atau unggah foto WebP
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewBanner(activeBanner);
                    setIsBannerModalOpen(true);
                  }}
                  className="form-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  Ubah Banner
                </button>
              </div>

              <div>
                <label className="form-label-cinema">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input-cinema"
                />
              </div>

              <div>
                <label className="form-label-cinema">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="form-input-cinema"
                />
              </div>

              <div>
                <label className="form-label-cinema">
                  Bio Singkat
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Ceritakan selera film atau film favorit Anda..."
                  className="form-input-cinema"
                  style={{ resize: 'none', lineHeight: 1.5 }}
                />
              </div>

              <div>
                <label className="form-label-cinema">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Contoh: Jakarta, Indonesia"
                  className="form-input-cinema"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="form-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="form-btn-primary"
                  style={{ flex: 1 }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
