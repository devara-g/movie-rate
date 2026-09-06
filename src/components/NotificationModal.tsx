'use client';

import React from 'react';
import { AppNotification } from '@/types/database';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1250,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-surface-cinema custom-modal-scrollbar"
        style={{
          position: 'absolute',
          top: '64px',
          right: 'max(20px, calc((100vw - var(--max-width)) / 2 + 20px))',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '480px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 23, 29, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              NOTIFIKASI AKTIVITAS
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#00e054',
                  color: '#14181c',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {unreadCount} BARU
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00e054',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tandai Dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="modal-close-btn-cinema"
              style={{ width: '26px', height: '26px', fontSize: '12px' }}
              title="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#8899a6', fontSize: '12px' }}>
              Belum ada notifikasi aktivitas baru.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid #242c34',
                  backgroundColor: notif.is_read ? 'transparent' : 'rgba(0, 224, 84, 0.04)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Type Icon (Clean Minimalist SVG) */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: notif.type === 'like' ? 'rgba(255, 64, 96, 0.15)' : 'rgba(0, 224, 84, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {notif.type === 'like' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4060" stroke="#ff4060" strokeWidth="1">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  ) : notif.type === 'comment' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                    </svg>
                  ) : notif.type === 'watchlist' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: notif.is_read ? '#ffffff' : '#00e054' }}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00e054' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#8899a6', lineHeight: 1.45, margin: '2px 0 0' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '10px', color: '#677b8c', marginTop: '4px', display: 'inline-block' }}>
                    {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
