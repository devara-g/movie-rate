'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FilmsCatalogView } from '@/components/views/FilmsCatalogView';
import { FilmDetailView } from '@/components/views/FilmDetailView';
import { MemberProfileView } from '@/components/views/MemberProfileView';
import { CuratedListsView } from '@/components/views/CuratedListsView';
import { JournalView } from '@/components/views/JournalView';
import dynamic from 'next/dynamic';
import { Toast } from '@/components/Toast';
import { REVIEWS, Review, FILMS, Film } from '@/data/cinemaData';

const DiscoverView = dynamic(
  () => import('@/components/views/DiscoverView').then((mod) => mod.DiscoverView),
  { ssr: false }
);

import {
  saveMovieLogInDb,
  getRecentLogsFromDb,
  getActiveUserProfile,
  signOutUser,
  getUserLogsFromDb,
  updateUserProfile,
  getUserWatchlistFromDb,
  toggleWatchlistInDb,
  getCustomLists,
  deleteCustomList,
  getUserNotifications,
  markNotificationsAsRead,
  UserProfile,
  WatchlistItem,
  getSafeAvatar,
  generateCinemaAvatar,
  supabase,
  subscribeToRealtimeChat,
} from '@/lib/supabase';
import { MovieLog, CustomList, AppNotification } from '@/types/database';
import type { TicketData } from '@/components/TicketStubModal';

const CinemaIntroCurtain = dynamic(
  () => import('@/components/CinemaIntroCurtain').then((mod) => mod.CinemaIntroCurtain),
  { ssr: false }
);

const DirectChatModal = dynamic(
  () => import('@/components/DirectChatModal').then((mod) => mod.DirectChatModal),
  { ssr: false }
);

const LogReviewModal = dynamic(
  () => import('@/components/LogReviewModal').then((mod) => mod.LogReviewModal),
  { ssr: false }
);

const SearchModal = dynamic(
  () => import('@/components/SearchModal').then((mod) => mod.SearchModal),
  { ssr: false }
);

const AuthModal = dynamic(
  () => import('@/components/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

const TrailerModal = dynamic(
  () => import('@/components/TrailerModal').then((mod) => mod.TrailerModal),
  { ssr: false }
);

const TicketStubModal = dynamic(
  () => import('@/components/TicketStubModal').then((mod) => mod.TicketStubModal),
  { ssr: false }
);

const PersonDetailModal = dynamic(
  () => import('@/components/PersonDetailModal').then((mod) => mod.PersonDetailModal),
  { ssr: false }
);

const CustomListModal = dynamic(
  () => import('@/components/CustomListModal').then((mod) => mod.CustomListModal),
  { ssr: false }
);

const PublicProfileModal = dynamic(
  () => import('@/components/PublicProfileModal').then((mod) => mod.PublicProfileModal),
  { ssr: false }
);

const ReviewCommentsModal = dynamic(
  () => import('@/components/ReviewCommentsModal').then((mod) => mod.ReviewCommentsModal),
  { ssr: false }
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('discover');
  const [selectedFilmId, setSelectedFilmId] = useState<string>('past-lives');
  const [selectedFilmData, setSelectedFilmData] = useState<Film | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [logModalFilmId, setLogModalFilmId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userLogs, setUserLogs] = useState<MovieLog[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Watchlist & Feature Modals State
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean;
    filmTitle: string;
    youtubeKey: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    filmTitle: '',
    youtubeKey: null,
    isLoading: false,
  });
  const [ticketModal, setTicketModal] = useState<{
    isOpen: boolean;
    ticket: TicketData | null;
  }>({
    isOpen: false,
    ticket: null,
  });
  const [personModal, setPersonModal] = useState<{
    isOpen: boolean;
    personName: string | null;
  }>({
    isOpen: false,
    personName: null,
  });

  // Custom Lists, Notifications, Comments & Public Profile Modals
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isCreateListOpen, setIsCreateListOpen] = useState<boolean>(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<string | null>(null);
  const [selectedReviewForComments, setSelectedReviewForComments] = useState<Review | null>(null);

  // Realtime Direct Messaging State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatTargetUser, setChatTargetUser] = useState<{
    id: string;
    display_name: string;
    username: string;
    avatar_url: string;
  } | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Google OAuth redirect listener
  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getActiveUserProfile();
        if (profile) {
          setCurrentUser(profile);
          getUserLogsFromDb(profile.id).then(setUserLogs);
          getUserWatchlistFromDb(profile.id).then(setUserWatchlist);
          getUserNotifications(profile.id).then(setNotifications);
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Realtime incoming chat listener (for header badge & toast notifications)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToRealtimeChat(currentUser.id, (incomingMsg) => {
      // If chat modal is not open or not with this sender, show toast & increment badge
      if (!isChatOpen || (chatTargetUser && chatTargetUser.id !== incomingMsg.sender_id)) {
        setUnreadChatCount((prev) => prev + 1);
        const senderName = incomingMsg.sender_profile?.display_name || incomingMsg.sender_name || 'Anggota Bioskop';
        showToast(`Pesan dari ${senderName}: ${incomingMsg.message || 'Rekomendasi film'}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, isChatOpen, chatTargetUser]);

  useEffect(() => {
    // Load custom lists & notifications
    getCustomLists().then(setCustomLists);
    getUserNotifications().then(setNotifications);

    // Check for active Supabase session & user profile on mount
    getActiveUserProfile().then((profile) => {
      if (profile) {
        setCurrentUser(profile);
        getUserLogsFromDb(profile.id).then(setUserLogs);
        getUserWatchlistFromDb(profile.id).then(setUserWatchlist);
        getUserNotifications(profile.id).then(setNotifications);
      } else {
        getUserWatchlistFromDb().then(setUserWatchlist);
      }

      // Load existing community logs from Supabase on mount
      getRecentLogsFromDb().then((dbLogs) => {
        if (dbLogs && dbLogs.length > 0) {
          const mapped: Review[] = dbLogs.map((log) => {
            const isMe = profile && log.user_id === profile.id;
            return {
              id: log.id,
              filmId: `tmdb-${log.tmdb_id}`,
              filmTitle: log.film_title,
              filmYear: log.film_year,
              filmPoster: log.film_poster,
              authorName: isMe ? profile.name : 'Penikmat Film',
              authorRole: isMe ? `@${profile.username}` : '@cinephile',
              authorAvatar: isMe
                ? getSafeAvatar(profile.avatar_url, profile.name)
                : generateCinemaAvatar(log.film_title),
              rating: Number(log.rating),
              date: log.watched_date,
              formatWatched: log.watch_format,
              isRewatch: log.is_rewatch,
              isFavorite: log.is_favorite,
              content: log.review_text || 'Catatan film tersimpan.',
              likes: log.likes_count || 1,
              replies: 0,
            };
          });
          setReviews((prev) => {
            const existingIds = new Set<string>();
            const deduped: Review[] = [];
            for (const r of [...mapped, ...prev]) {
              if (!existingIds.has(r.id)) {
                existingIds.add(r.id);
                deduped.push(r);
              }
            }
            return deduped;
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen && !isLogModalOpen && !isAuthModalOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isLogModalOpen, isAuthModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    showToast(`Selamat datang, ${user.name}!`);
    const logs = await getUserLogsFromDb(user.id);
    setUserLogs(logs);
    const wl = await getUserWatchlistFromDb(user.id);
    setUserWatchlist(wl);
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserLogs([]);
    const guestWl = await getUserWatchlistFromDb();
    setUserWatchlist(guestWl);
    showToast('Anda telah keluar dari akun.');
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const res = await updateUserProfile(currentUser.id, updates);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      showToast('Profil berhasil diperbarui.');
    }
  };

  // --- Official Movie Trailer Modal Handlers ---
  const handleOpenTrailer = async (filmId: string, filmTitle: string) => {
    setTrailerModal({
      isOpen: true,
      filmTitle,
      youtubeKey: null,
      isLoading: true,
    });
    try {
      const tmdbId = filmId.replace('tmdb-', '');
      const queryId = tmdbId || filmTitle;
      const res = await fetch(`/api/movies?type=trailer&id=${encodeURIComponent(queryId)}`);
      const data = await res.json();
      const videoKey = data?.key || data?.youtubeKey || null;
      setTrailerModal((prev) => ({
        ...prev,
        youtubeKey: videoKey,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Failed to load trailer:', err);
      setTrailerModal((prev) => ({
        ...prev,
        youtubeKey: null,
        isLoading: false,
      }));
    }
  };

  const handleCloseTrailer = () => {
    setTrailerModal({
      isOpen: false,
      filmTitle: '',
      youtubeKey: null,
      isLoading: false,
    });
  };

  // --- Cast & Director Modal Handlers ---
  const handleOpenPerson = (personName: string) => {
    setPersonModal({
      isOpen: true,
      personName,
    });
  };

  const handleClosePerson = () => {
    setPersonModal({
      isOpen: false,
      personName: null,
    });
  };

  // --- Virtual Cinema Ticket Stub Modal Handlers ---
  const handleOpenTicketStub = (ticket: TicketData) => {
    setTicketModal({
      isOpen: true,
      ticket,
    });
  };

  const handleCloseTicketStub = () => {
    setTicketModal({
      isOpen: false,
      ticket: null,
    });
  };

  // --- Watchlist Handlers ---
  const handleToggleWatchlist = async (filmId: number, filmTitle: string, filmPoster: string) => {
    const effectiveId = filmId || Math.abs(filmTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const currentStatus = userWatchlist.some(
      (item) => item.tmdb_id === effectiveId || item.film_title.toLowerCase() === filmTitle.toLowerCase()
    );

    // Optimistic UI update
    if (currentStatus) {
      setUserWatchlist((prev) =>
        prev.filter((item) => item.tmdb_id !== effectiveId && item.film_title.toLowerCase() !== filmTitle.toLowerCase())
      );
      showToast(`"${filmTitle}" dihapus dari Watchlist`);
    } else {
      const newItem: WatchlistItem = {
        id: `w-${Date.now()}`,
        user_id: currentUser?.id || 'guest-user',
        tmdb_id: effectiveId,
        film_title: filmTitle,
        film_poster: filmPoster,
        created_at: new Date().toISOString(),
      };
      setUserWatchlist((prev) => [newItem, ...prev]);
      showToast(`"${filmTitle}" ditambahkan ke Watchlist!`);
    }

    try {
      await toggleWatchlistInDb(effectiveId, filmTitle, filmPoster, currentStatus, currentUser?.id);
      const fresh = await getUserWatchlistFromDb(currentUser?.id);
      setUserWatchlist(fresh);
    } catch (err) {
      console.warn('Watchlist toggle error:', err);
    }
  };

  const isSelectedFilmWatchlisted = userWatchlist.some((item) => {
    const numId = parseInt(selectedFilmId.replace('tmdb-', ''), 10);
    return (
      (numId && item.tmdb_id === numId) ||
      (selectedFilmData && item.film_title.toLowerCase() === selectedFilmData.title.toLowerCase())
    );
  });

  const handleSelectFilm = (filmId: string, film?: Film) => {
    setSelectedFilmId(filmId);
    setSelectedFilmData(film || null);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogModal = (filmId?: string) => {
    setLogModalFilmId(filmId || undefined);
    setIsLogModalOpen(true);
  };

  const handleSaveReview = (newReview: Review) => {
    // Optimistic UI update
    setReviews([newReview, ...reviews]);
    showToast(`Logged "${newReview.filmTitle}" to your diary`);

    // Persist to Supabase in background with real user ID if logged in
    saveMovieLogInDb({
      filmId: newReview.filmId,
      filmTitle: newReview.filmTitle,
      filmYear: newReview.filmYear,
      filmPoster: newReview.filmPoster,
      rating: newReview.rating,
      reviewText: newReview.content,
      watchedDate: newReview.date === 'just now' ? new Date().toISOString().split('T')[0] : newReview.date,
      watchFormat: newReview.formatWatched,
      isRewatch: newReview.isRewatch,
      isFavorite: newReview.isFavorite,
    }, currentUser?.id).then(() => {
      if (currentUser?.id) {
        getUserLogsFromDb(currentUser.id).then(setUserLogs);
      }
    });
  };

  const handleToggleReviewLike = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
            ...r,
            isFavorite: !r.isFavorite,
            likes: r.isFavorite ? r.likes - 1 : r.likes + 1,
          }
          : r
      )
    );
  };

  // --- Custom List Handlers ---
  const handleOpenCreateList = () => {
    setIsCreateListOpen(true);
  };

  const handleListCreated = (newList: CustomList) => {
    setCustomLists((prev) => [newList, ...prev]);
    showToast(`Daftar "${newList.title}" berhasil dibuat!`);
  };

  const handleDeleteCustomList = async (listId: string) => {
    const success = await deleteCustomList(listId);
    if (success) {
      setCustomLists((prev) => prev.filter((l) => l.id !== listId));
      showToast('Daftar film berhasil dihapus.');
    }
  };

  // --- Public Profile & Comment Discussion Handlers ---
  const handleOpenPublicProfile = (userIdOrUsername: string) => {
    setSelectedUserForProfile(userIdOrUsername);
  };

  const handleOpenComments = (review: Review) => {
    setSelectedReviewForComments(review);
  };

  const handleMarkAllNotificationsRead = async () => {
    await markNotificationsAsRead(currentUser?.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#14181c', color: '#ffffff' }}>
      {/* Cinematic Studio Opening Splash Animation */}
      <CinemaIntroCurtain />

      {/* Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLogModal={() => handleOpenLogModal()}
        onOpenSearch={() => setIsSearchOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenChat={() => {
          setChatTargetUser(null);
          setIsChatOpen(true);
          setUnreadChatCount(0);
        }}
        unreadChatCount={unreadChatCount}
      />

      {/* Main View Area (offset by 56px header height) */}
      <main style={{ flex: 1, paddingTop: '56px', backgroundColor: '#14181c' }}>
        {activeTab === 'discover' && (
          <div className="animate-fade-in">
            <DiscoverView
              onSelectFilm={handleSelectFilm}
              onOpenLogModal={handleOpenLogModal}
              reviews={reviews}
              onToggleReviewLike={handleToggleReviewLike}
              onOpenTrailer={handleOpenTrailer}
            />
          </div>
        )}

        {activeTab === 'films' && (
          <div className="animate-fade-in">
            <FilmsCatalogView
              onSelectFilm={handleSelectFilm}
              onOpenLogModal={handleOpenLogModal}
            />
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="animate-fade-in">
            <FilmDetailView
              filmId={selectedFilmId}
              initialFilm={selectedFilmData}
              onBack={() => setActiveTab('films')}
              onSelectFilm={handleSelectFilm}
              onOpenLogModal={handleOpenLogModal}
              reviews={reviews}
              onToggleReviewLike={handleToggleReviewLike}
              onOpenTrailer={handleOpenTrailer}
              onOpenPerson={handleOpenPerson}
              isWatchlisted={isSelectedFilmWatchlisted}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenPublicProfile={handleOpenPublicProfile}
              onOpenComments={handleOpenComments}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <MemberProfileView
              currentUser={currentUser}
              onSelectFilm={handleSelectFilm}
              onOpenLogModal={handleOpenLogModal}
              onOpenAuthModal={handleOpenAuthModal}
              onUpdateProfile={handleUpdateProfile}
              userLogs={userLogs}
              watchlist={userWatchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenTicketStub={handleOpenTicketStub}
              customLists={customLists}
              onOpenCreateList={handleOpenCreateList}
              onDeleteCustomList={handleDeleteCustomList}
            />
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="animate-fade-in">
            <CuratedListsView
              onSelectFilm={handleSelectFilm}
              customLists={customLists}
              onOpenCreateList={handleOpenCreateList}
              currentUser={currentUser}
              onDeleteCustomList={handleDeleteCustomList}
              onOpenPublicProfile={handleOpenPublicProfile}
            />
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="animate-fade-in">
            <JournalView
              onSelectFilm={handleSelectFilm}
              currentUser={currentUser}
              onOpenAuth={() => handleOpenAuthModal('signin')}
              onOpenPublicProfile={handleOpenPublicProfile}
            />
          </div>
        )}
      </main>

      {/* Footer - Authentic Letterboxd Style */}
      <footer
        style={{
          borderTop: '1px solid #242c34',
          backgroundColor: '#191f26',
          padding: '36px 20px 28px',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff8000' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00e054' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#40bcf4' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                CINEHEARTH
              </span>
              <span style={{ fontSize: '12px', color: '#677b8c', marginLeft: '8px' }}>
                The social network for film lovers.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: '#8899a6' }}>
              <button onClick={() => setActiveTab('discover')} style={{ color: 'inherit' }}>DISCOVER</button>
              <button onClick={() => setActiveTab('films')} style={{ color: 'inherit' }}>FILMS</button>
              <button onClick={() => setActiveTab('lists')} style={{ color: 'inherit' }}>LISTS</button>
              <button onClick={() => setActiveTab('journal')} style={{ color: 'inherit' }}>JOURNAL</button>
              <button onClick={() => setActiveTab('profile')} style={{ color: 'inherit' }}>PROFILE</button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #242c34',
              fontSize: '11px',
              color: '#677b8c',
            }}
          >
            <span>© 2026 CineHearth. Film data from cinema archives.</span>
            <span>Crafted for film lovers worldwide.</span>
          </div>
        </div>
      </footer>

      {/* Log Modal */}
      <LogReviewModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        preselectedFilmId={logModalFilmId}
        preselectedFilm={logModalFilmId === selectedFilmId ? selectedFilmData : null}
        onSaveReview={handleSaveReview}
        currentUser={currentUser}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectFilm={handleSelectFilm}
        onSelectList={(listId) => {
          setActiveTab('lists');
          setIsSearchOpen(false);
        }}
      />

      {/* Official Movie Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={handleCloseTrailer}
        filmTitle={trailerModal.filmTitle}
        youtubeKey={trailerModal.youtubeKey}
        isLoading={trailerModal.isLoading}
      />

      {/* Retro-Modern Cinema Ticket Stub Modal */}
      <TicketStubModal
        isOpen={ticketModal.isOpen}
        onClose={handleCloseTicketStub}
        ticket={ticketModal.ticket}
      />

      {/* Cast & Director Filmography Modal */}
      <PersonDetailModal
        isOpen={personModal.isOpen}
        onClose={handleClosePerson}
        personName={personModal.personName}
        onSelectFilm={(filmId, film) => {
          handleClosePerson();
          handleSelectFilm(filmId, film);
        }}
      />

      {/* Custom Film List Creation Modal */}
      <CustomListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        currentUser={currentUser}
        onListCreated={handleListCreated}
      />

      {/* Public Member Profile Modal */}
      <PublicProfileModal
        isOpen={!!selectedUserForProfile}
        onClose={() => setSelectedUserForProfile(null)}
        userIdOrUsername={selectedUserForProfile}
        onSelectFilm={(filmId) => {
          setSelectedUserForProfile(null);
          handleSelectFilm(filmId);
        }}
        currentUser={currentUser}
        onOpenChatWithUser={(target) => {
          setChatTargetUser(target);
          setIsChatOpen(true);
          setUnreadChatCount(0);
        }}
      />

      {/* Realtime Direct Messaging Modal */}
      <DirectChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        targetUser={chatTargetUser}
        onSelectFilm={handleSelectFilm}
        onOpenAuth={() => handleOpenAuthModal('signin')}
      />

      {/* Review Discussion Comments Modal */}
      <ReviewCommentsModal
        isOpen={!!selectedReviewForComments}
        onClose={() => setSelectedReviewForComments(null)}
        review={selectedReviewForComments}
        currentUser={currentUser}
        onOpenAuthModal={() => handleOpenAuthModal('signin')}
        onCommentCountUpdated={(reviewId, count) => {
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, replies: count } : r))
          );
        }}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
