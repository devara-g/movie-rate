'use client';

import React, { useState } from 'react';
import { UserProfile, getSafeAvatar } from '@/lib/supabase';
import { AppNotification } from '@/types/database';
import { NotificationModal } from '@/components/NotificationModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogModal: (filmId?: string) => void;
  onOpenSearch: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onLogout: () => void;
  notifications?: AppNotification[];
  onMarkAllNotificationsRead?: () => void;
  onOpenChat?: () => void;
  unreadChatCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogModal,
  onOpenSearch,
  currentUser,
  onOpenAuthModal,
  onLogout,
  notifications = [],
  onMarkAllNotificationsRead,
  onOpenChat,
  unreadChatCount = 0,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navItems = [
    { id: 'discover', label: 'DISCOVER' },
    { id: 'films', label: 'FILMS' },
    { id: 'lists', label: 'LISTS' },
    { id: 'journal', label: 'JOURNAL' },
    { id: 'profile', label: 'PROFILE' },
  ];

  return (
    <>
      <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        zIndex: 100,
        backgroundColor: 'rgba(14, 18, 23, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div className="header-inner-container">
        {/* Mobile Left Slot (Search Icon) */}
        <div className="header-mobile-left">
          <button
            onClick={onOpenSearch}
            className="header-mobile-search-btn"
            title="Cari Film"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* Brand & Nav (Center on mobile, Left on desktop) */}
        <div className="header-brand-group">
          <button
            onClick={() => setActiveTab('discover')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {/* Letterboxd-style iconic triple dot logo with ambient glow */}
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ff8000', boxShadow: '0 0 6px rgba(255,128,0,0.6)' }} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e054', boxShadow: '0 0 6px rgba(0,224,84,0.6)' }} />
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#40bcf4', boxShadow: '0 0 6px rgba(64,188,244,0.6)' }} />
            </div>
            <span
              style={{
                fontSize: '17px',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              CineHearth
            </span>
          </button>

          {/* Text Navigation with Glowing Underline */}
          <nav className="header-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: isActive ? '#ffffff' : '#8899a6',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: isActive ? '2px solid #00e054' : '2px solid transparent',
                    boxShadow: isActive ? '0 4px 12px -2px rgba(0, 224, 84, 0.6)' : 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '19px 2px 17px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="header-right-actions">

          {/* Desktop Search Field */}
          <button
            onClick={onOpenSearch}
            className="header-desktop-search"
            style={{
              padding: '7px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#8899a6',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              minWidth: '170px',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search films...</span>
            </div>
            <kbd
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              /
            </kbd>
          </button>

          {/* + LOG Button (Desktop Only) */}
          <button
            onClick={() => onOpenLogModal()}
            className="btn-primary header-desktop-search"
            style={{ padding: '7px 16px', fontSize: '11px' }}
          >
            + LOG
          </button>

          {/* Activity Notification Bell (Only for logged in users) */}
          {currentUser && (
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              title="Notifikasi Aktivitas"
              style={{
                position: 'relative',
                backgroundColor: isNotifOpen ? '#212932' : '#1b2228',
                border: isNotifOpen ? '1px solid #00e054' : '1px solid #2c3642',
                borderRadius: '4px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isNotifOpen ? '#00e054' : '#ccd6e0',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#00e054',
                    color: '#14181c',
                    fontSize: '9px',
                    fontWeight: 900,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Realtime Direct Messages Chat (Only for logged in users) */}
          {currentUser && (
            <button
              onClick={() => {
                if (onOpenChat) onOpenChat();
              }}
              title="Pesan Langsung Realtime (Chat)"
              style={{
                position: 'relative',
                backgroundColor: '#1b2228',
                border: '1px solid #2c3642',
                borderRadius: '4px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ccd6e0',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadChatCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#00e054',
                    color: '#14181c',
                    fontSize: '9px',
                    fontWeight: 900,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>
          )}

          {currentUser && (
            <NotificationModal
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              notifications={notifications}
              onMarkAllRead={() => {
                if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
              }}
            />
          )}

          {/* User Auth & Profile Actions */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('profile')}
                title={`Profil @${currentUser.username}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '3px 8px 3px 3px',
                  borderRadius: '20px',
                  backgroundColor: activeTab === 'profile' ? '#212932' : '#1b2228',
                  border: activeTab === 'profile' ? '1px solid #00e054' : '1px solid #2c3642',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={getSafeAvatar(currentUser.avatar_url, currentUser.name || currentUser.username)}
                  alt={currentUser.name}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span className="header-desktop-search" style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.username}
                </span>
              </button>

              <button
                onClick={onLogout}
                title="Keluar dari akun"
                className="btn-secondary header-desktop-search"
                style={{
                  padding: '5px 8px',
                  fontSize: '10px',
                  color: '#8899a6',
                }}
              >
                KELUAR
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onOpenAuthModal('signin')}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                MASUK
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="btn-primary header-desktop-search"
                style={{ padding: '6px 14px', fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                DAFTAR
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Sleek Mobile Bottom Navigation Bar (< 768px) */}
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      {/* Discover Tab */}
      <button
        type="button"
        onClick={() => setActiveTab('discover')}
        className={`mobile-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>Discover</span>
      </button>

      {/* Films Catalog Tab */}
      <button
        type="button"
        onClick={() => setActiveTab('films')}
        className={`mobile-nav-item ${activeTab === 'films' ? 'active' : ''}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
        <span>Films</span>
      </button>

      {/* Center Standout + LOG CTA */}
      <button
        type="button"
        onClick={() => onOpenLogModal()}
        className="mobile-log-cta"
        title="Catat Film Baru"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Curated Lists Tab */}
      <button
        type="button"
        onClick={() => setActiveTab('lists')}
        className={`mobile-nav-item ${activeTab === 'lists' ? 'active' : ''}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        <span>Lists</span>
      </button>

      {/* Profile / Journal Tab */}
      <button
        type="button"
        onClick={() => setActiveTab(currentUser ? 'profile' : 'journal')}
        className={`mobile-nav-item ${activeTab === 'profile' || activeTab === 'journal' ? 'active' : ''}`}
      >
        {currentUser ? (
          <img
            src={getSafeAvatar(currentUser.avatar_url, currentUser.username)}
            alt={currentUser.username}
            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
        <span>{currentUser ? 'Profile' : 'Journal'}</span>
      </button>
    </nav>
  </>
  );
};
