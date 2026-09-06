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
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          padding: '0 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        {/* Brand & Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button
            onClick={() => setActiveTab('discover')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {/* Letterboxd-style iconic triple dot logo with ambient glow */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff8000', boxShadow: '0 0 8px rgba(255,128,0,0.6)' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00e054', boxShadow: '0 0 8px rgba(0,224,84,0.6)' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#40bcf4', boxShadow: '0 0 8px rgba(64,188,244,0.6)' }} />
            </div>
            <span
              style={{
                fontSize: '18px',
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
          <nav style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenSearch}
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

          {/* + LOG Button (Letterboxd Style Green) */}
          <button
            onClick={() => onOpenLogModal()}
            className="btn-primary"
            style={{ padding: '7px 16px', fontSize: '11px' }}
          >
            + LOG
          </button>

          {/* Activity Notification Bell */}
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

          {/* Realtime Direct Messages Chat */}
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

          <NotificationModal
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            onMarkAllRead={() => {
              if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
            }}
          />

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
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.username}
                </span>
              </button>

              <button
                onClick={onLogout}
                title="Keluar dari akun"
                className="btn-secondary"
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
                style={{ padding: '5px 12px', fontSize: '11px' }}
              >
                MASUK
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="btn-primary"
                style={{ padding: '5px 12px', fontSize: '11px' }}
              >
                DAFTAR
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
