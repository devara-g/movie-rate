'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, getDirectMessages, sendDirectMessage, subscribeToRealtimeChat } from '@/lib/supabase';
import { DirectMessage, FilmAttachment } from '@/types/database';

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  targetUser?: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string;
  } | null;
  onSelectFilm: (filmId: string) => void;
  onOpenAuth?: () => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  onSelectFilm,
  onOpenAuth,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFilmAttachment, setSelectedFilmAttachment] = useState<FilmAttachment | null>(null);
  const [showFilmSearch, setShowFilmSearch] = useState(false);
  const [filmSearchQuery, setFilmSearchQuery] = useState('');
  const [filmSearchResults, setFilmSearchResults] = useState<FilmAttachment[]>([]);
  const [isSearchingFilm, setIsSearchingFilm] = useState(false);

  // Active recipient: either passed targetUser or default cinema curator
  const activeRecipient = targetUser || {
    id: 'curator_cinehearth',
    display_name: 'CineHearth Editorial',
    username: 'cinehearth_team',
    avatar_url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#14181c"/><circle cx="50" cy="50" r="46" fill="#00e054" opacity="0.2"/><text x="50%" y="54%" font-size="34" font-weight="900" fill="#00e054" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif">CH</text></svg>`
    )}`,
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setIsLoading(true);
    getDirectMessages(currentUser.id, activeRecipient.id)
      .then((history) => {
        setMessages(history);
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [isOpen, currentUser, activeRecipient.id]);

  // Subscribe to real-time messages via WebSocket / BroadcastChannel
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const unsubscribe = subscribeToRealtimeChat(currentUser.id, (incomingMsg) => {
      // Check if message belongs to this conversation
      const isForThisChat =
        (incomingMsg.sender_id === activeRecipient.id && incomingMsg.receiver_id === currentUser.id) ||
        (incomingMsg.sender_id === currentUser.id && incomingMsg.receiver_id === activeRecipient.id);

      if (isForThisChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
        setTimeout(scrollToBottom, 80);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentUser, activeRecipient.id]);

  // Search TMDB for movie recommendation attachment
  const handleSearchTMDB = async (query: string) => {
    setFilmSearchQuery(query);
    if (!query.trim()) {
      setFilmSearchResults([]);
      return;
    }
    setIsSearchingFilm(true);
    try {
      const res = await fetch(`/api/movies?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFilmSearchResults(
          data.slice(0, 5).map((m: { id: number; title: string; release_date?: string; poster_path?: string; vote_average?: number }) => ({
            tmdb_id: m.id,
            film_title: m.title,
            film_year: m.release_date ? m.release_date.split('-')[0] : '',
            film_poster: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : '',
            rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : undefined,
          }))
        );
      }
    } catch {
      // Ignore
    } finally {
      setIsSearchingFilm(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!inputText.trim() && !selectedFilmAttachment) return;

    const messageText = inputText.trim();
    const attachment = selectedFilmAttachment;

    setInputText('');
    setSelectedFilmAttachment(null);
    setShowFilmSearch(false);
    setIsSending(true);

    try {
      const res = await sendDirectMessage({
        sender: currentUser,
        receiver_id: activeRecipient.id,
        receiver_name: activeRecipient.display_name,
        receiver_avatar: activeRecipient.avatar_url,
        message: messageText,
        film_attachment: attachment || null,
      });

      if (res.message) {
        const sent = res.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        setTimeout(scrollToBottom, 80);
      }
    } catch {
      // Error handling
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 13, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="tactile-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '640px',
          maxHeight: '92vh',
          backgroundColor: '#181f26',
          borderRadius: '14px',
          border: '1px solid #2f3b48',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#14181c',
            borderBottom: '1px solid #242c34',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={activeRecipient.avatar_url}
                alt={activeRecipient.display_name}
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #2c3642' }}
              />
              {/* Online Green Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#00e054',
                  border: '2px solid #14181c',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {activeRecipient.display_name}
                </h3>
                <span style={{ fontSize: '10px', color: '#00e054', fontWeight: 700, backgroundColor: 'rgba(0, 224, 84, 0.12)', padding: '2px 6px', borderRadius: '3px' }}>
                  REALTIME
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#677b8c' }}>
                @{activeRecipient.username}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8899a6',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Guest Warning if not logged in */}
        {!currentUser && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#1b232c',
              borderBottom: '1px solid #283440',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#9ab0c2',
            }}
          >
            <span>Masuk untuk mengirim pesan realtime ke anggota bioskop.</span>
            <button
              onClick={onOpenAuth}
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '11px' }}
            >
              Masuk
            </button>
          </div>
        )}

        {/* Message Thread Body */}
        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#14181c',
          }}
        >
          {isLoading ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#677b8c', fontSize: '12px' }}>
              Memuat percakapan realtime...
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                color: '#677b8c',
                maxWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#1e2630',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00e054',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Mulai Percakapan</div>
              <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                Kirim pesan langsung atau bagikan rekomendasi film favorit dengan tautan interaktif TMDB.
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = currentUser ? msg.sender_id === currentUser.id : false;
              const timeStr = new Date(msg.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      backgroundColor: isMe ? '#0c3820' : '#1f2832',
                      border: isMe ? '1px solid #145932' : '1px solid #2a3746',
                      color: '#ffffff',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {/* Film Attachment Card */}
                    {msg.film_attachment && (
                      <div
                        onClick={() => {
                          onSelectFilm(`tmdb-${msg.film_attachment!.tmdb_id}`);
                          onClose();
                        }}
                        style={{
                          marginBottom: msg.message ? '10px' : '0',
                          padding: '8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(10, 13, 16, 0.65)',
                          border: '1px solid #334354',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        title="Buka detail film"
                      >
                        {msg.film_attachment.film_poster ? (
                          <img
                            src={msg.film_attachment.film_poster}
                            alt={msg.film_attachment.film_title}
                            style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '52px', backgroundColor: '#212932', borderRadius: '4px' }} />
                        )}

                        <div>
                          <div style={{ fontSize: '10px', color: '#00e054', fontWeight: 700, letterSpacing: '0.04em' }}>
                            REKOMENDASI FILM
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                            {msg.film_attachment.film_title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8899a6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{msg.film_attachment.film_year}</span>
                            {msg.film_attachment.rating && (
                              <span style={{ color: '#f5c518' }}>★ {msg.film_attachment.rating}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.message && <div>{msg.message}</div>}
                  </div>

                  <div style={{ fontSize: '10px', color: '#677b8c', marginTop: '3px', padding: '0 4px' }}>
                    {timeStr}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Film Attachment Picker Popover */}
        {showFilmSearch && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#1a222a',
              borderTop: '1px solid #2b3846',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#00e054', fontWeight: 700 }}>
                LAMPIRKAN REKOMENDASI FILM
              </span>
              <button
                onClick={() => {
                  setShowFilmSearch(false);
                  setFilmSearchResults([]);
                }}
                style={{ background: 'transparent', border: 'none', color: '#8899a6', cursor: 'pointer', fontSize: '11px' }}
              >
                Tutup ✕
              </button>
            </div>

            <input
              type="text"
              value={filmSearchQuery}
              onChange={(e) => handleSearchTMDB(e.target.value)}
              placeholder="Cari film di TMDB untuk dilampirkan..."
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#12161b',
                border: '1px solid #334252',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
              }}
            />

            {isSearchingFilm && <div style={{ fontSize: '11px', color: '#677b8c' }}>Mencari TMDB...</div>}

            {filmSearchResults.length > 0 && (
              <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filmSearchResults.map((film) => (
                  <div
                    key={film.tmdb_id}
                    onClick={() => {
                      setSelectedFilmAttachment(film);
                      setShowFilmSearch(false);
                      setFilmSearchResults([]);
                    }}
                    style={{
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#14181c',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {film.film_poster && (
                      <img src={film.film_poster} alt={film.film_title} style={{ width: '20px', height: '28px', objectFit: 'cover', borderRadius: '2px' }} />
                    )}
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                      {film.film_title} <span style={{ color: '#8899a6', fontSize: '11px' }}>({film.film_year})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Attachment Badge preview before sending */}
        {selectedFilmAttachment && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#12251a',
              borderTop: '1px solid #1b4d2b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#00e054' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/>
                <line x1="17" y1="17" x2="22" y2="17"/>
                <line x1="17" y1="7" x2="22" y2="7"/>
              </svg>
              <span>
                Lampiran: <strong>{selectedFilmAttachment.film_title}</strong> ({selectedFilmAttachment.film_year})
              </span>
            </div>
            <button
              onClick={() => setSelectedFilmAttachment(null)}
              style={{ background: 'transparent', border: 'none', color: '#ff4060', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
            >
              Hapus
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '12px 16px',
            backgroundColor: '#14181c',
            borderTop: '1px solid #242c34',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Film Attachment Button */}
          <button
            type="button"
            onClick={() => setShowFilmSearch(!showFilmSearch)}
            title="Lampirkan rekomendasi film"
            style={{
              background: showFilmSearch ? '#00e054' : '#1e2630',
              color: showFilmSearch ? '#14181c' : '#8899a6',
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/>
              <line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/>
              <line x1="17" y1="17" x2="22" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={currentUser ? "Tulis pesan realtime..." : "Masuk untuk mengirim pesan..."}
            disabled={!currentUser || isSending}
            style={{
              flex: 1,
              padding: '9px 14px',
              backgroundColor: '#1b232c',
              border: '1px solid #2e3a47',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={!currentUser || isSending || (!inputText.trim() && !selectedFilmAttachment)}
            className="btn-primary"
            style={{
              padding: '9px 16px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!inputText.trim() && !selectedFilmAttachment) || !currentUser ? 0.4 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
