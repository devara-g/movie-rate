'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, getReviewComments, addReviewComment } from '@/lib/supabase';
import { ReviewComment } from '@/types/database';
import { Review } from '@/data/cinemaData';

interface ReviewCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onCommentCountUpdated?: (reviewId: string, count: number) => void;
}

export const ReviewCommentsModal: React.FC<ReviewCommentsModalProps> = ({
  isOpen,
  onClose,
  review,
  currentUser,
  onOpenAuthModal,
  onCommentCountUpdated,
}) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !review) return;

    setIsLoading(true);
    getReviewComments(review.id)
      .then((data) => {
        setComments(data);
        if (onCommentCountUpdated) onCommentCountUpdated(review.id, data.length);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, review]);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addReviewComment(
        {
          review_id: review.id,
          comment_text: inputText.trim(),
        },
        currentUser
      );

      if (res.success && res.comment) {
        const updated = [...comments, res.comment];
        setComments(updated);
        setInputText('');
        if (onCommentCountUpdated) onCommentCountUpdated(review.id, updated.length);
      }
    } catch {
      // Handled gracefully
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
          maxWidth: '580px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
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
              DISKUSI ULASAN FILM
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', marginTop: '4px', margin: 0 }}>
              Komentar & Pandangan Penonton
            </h3>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn-cinema"
            title="Tutup (Esc)"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Highlighted Review Snippet */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(27, 34, 42, 0.65)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={review.authorAvatar}
                alt={review.authorName}
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                {review.authorName}
              </span>
              <span style={{ fontSize: '11px', color: '#8899a6' }}>
                mengulas <strong style={{ color: '#ffffff' }}>{review.filmTitle}</strong>
              </span>
            </div>
            <span style={{ color: '#00e054', fontSize: '11px', fontWeight: 800 }}>
              ★ {review.rating}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#9ab0c2', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            "{review.content.length > 140 ? `${review.content.slice(0, 140)}...` : review.content}"
          </p>
        </div>

        {/* Comments Feed */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '160px', maxHeight: '300px' }}>
          {isLoading ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#8899a6', fontSize: '12px' }}>
              Memuat komentar diskusi...
            </div>
          ) : comments.length === 0 ? (
            <div
              style={{
                padding: '30px 20px',
                textAlign: 'center',
                color: '#8899a6',
                border: '1px dashed #333f4d',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            >
              Belum ada komentar pada ulasan ini. Jadilah yang pertama memberikan tanggapan!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#212932',
                  borderRadius: '6px',
                  border: '1px solid #2c3642',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={comment.user_avatar || 'https://image.tmdb.org/t/p/w200/avatar.jpg'}
                      alt={comment.user_name}
                      style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      {comment.user_name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#00e054', fontWeight: 600 }}>
                      @{comment.user_username}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#677b8c' }}>
                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : 'Baru saja'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#ccd6e0', lineHeight: 1.5, margin: 0, paddingLeft: '28px' }}>
                  {comment.comment_text}
                </p>
              </div>
            ))
          )}
        </div>
        </div>

        {/* Comment Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(18, 23, 29, 0.95)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={currentUser ? 'Tulis tanggapan atau argumen film Anda...' : 'Masuk akun untuk menulis komentar...'}
            disabled={!currentUser && false}
            className="form-input-cinema"
          />
          <button
            type="submit"
            disabled={isSubmitting || !inputText.trim()}
            className="form-btn-primary"
            style={{ padding: '10px 20px', flexShrink: 0 }}
          >
            {isSubmitting ? 'MENGIRIM...' : 'KIRIM →'}
          </button>
        </form>
      </div>
    </div>
  );
};
