'use client';

import React, { useRef, useState } from 'react';

export interface TicketData {
  filmTitle: string;
  filmYear: number;
  filmPoster: string;
  director?: string;
  rating: number;
  watchedDate: string;
  watchFormat: string;
  userName: string;
  userUsername: string;
  reviewText?: string | null;
  ticketId?: string;
}

interface TicketStubModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketData | null;
}

export const TicketStubModal: React.FC<TicketStubModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !ticket) return null;

  const serialNumber = ticket.ticketId
    ? `CNH-${ticket.ticketId.slice(0, 8).toUpperCase()}`
    : `CNH-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Use native HTML5 Canvas to draw the ticket stub cleanly
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 360;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas not supported');

      // 1. Draw Ticket Background
      ctx.fillStyle = '#1b2228';
      ctx.roundRect(0, 0, width, height, 16);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2c3642';
      ctx.stroke();

      // Perforated dividing line at x = 540
      ctx.beginPath();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#333f4d';
      ctx.lineWidth = 2;
      ctx.moveTo(540, 20);
      ctx.lineTo(540, 340);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Notches at the top & bottom of perforated line
      ctx.fillStyle = '#14181c';
      ctx.beginPath();
      ctx.arc(540, 0, 16, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(540, 360, 16, Math.PI, 0);
      ctx.fill();

      // 2. Load & Draw Poster Image
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if CORS blocks image
          img.src = ticket.filmPoster;
        });

        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.roundRect(24, 24, 200, 312, 10);
          ctx.clip();
          ctx.drawImage(img, 24, 24, 200, 312);
          ctx.restore();
        } else {
          ctx.fillStyle = '#212932';
          ctx.roundRect(24, 24, 200, 312, 10);
          ctx.fill();
        }
      } catch {}

      // 3. Left Stub Texts
      ctx.fillStyle = '#00e054';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('CINEHEARTH CINEMA ADMIT ONE', 246, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      const title = ticket.filmTitle.length > 22 ? ticket.filmTitle.slice(0, 20) + '...' : ticket.filmTitle;
      ctx.fillText(`${title} (${ticket.filmYear})`, 246, 88);

      ctx.fillStyle = '#8899a6';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Dir. ${ticket.director || 'Theatrical Release'} • Format: ${ticket.watchFormat}`, 246, 116);

      // Star rating
      ctx.fillStyle = '#00e054';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      const stars = '★'.repeat(Math.floor(ticket.rating)) + (ticket.rating % 1 !== 0 ? '½' : '');
      ctx.fillText(`${stars}  ${ticket.rating.toFixed(1)} / 5.0`, 246, 160);

      // Review Quote if exists
      if (ticket.reviewText) {
        ctx.fillStyle = '#9ab0c2';
        ctx.font = 'italic 13px system-ui, -apple-system, sans-serif';
        const quote = ticket.reviewText.length > 70 ? `"${ticket.reviewText.slice(0, 68)}..."` : `"${ticket.reviewText}"`;
        ctx.fillText(quote, 246, 200);
      }

      // Date & Viewer
      ctx.fillStyle = '#677b8c';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Ditonton pada: ${ticket.watchedDate}`, 246, 280);
      ctx.fillText(`Penonton: ${ticket.userName} (@${ticket.userUsername})`, 246, 305);

      // 4. Right Stub Content (Ticket Stub Pass)
      ctx.fillStyle = '#00e054';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('TIKET KOLEKSI', 566, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(serialNumber, 566, 80);

      ctx.fillStyle = '#8899a6';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillText('SEAT: ROW C • SEAT 14', 566, 110);
      ctx.fillText('CINEMA HALL 01', 566, 130);

      // Barcode bars simulation
      ctx.fillStyle = '#ffffff';
      const barX = 566;
      const barY = 160;
      const barPatterns = [3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2];
      let currentX = barX;
      for (const w of barPatterns) {
        ctx.fillRect(currentX, barY, w, 70);
        currentX += w + 4;
      }

      ctx.fillStyle = '#677b8c';
      ctx.font = '10px monospace';
      ctx.fillText('* VERIFIED CINEHEARTH DIARY *', 566, 260);

      // Watermark
      ctx.fillStyle = '#333f4d';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('CINEHEARTH.APP', 566, 310);

      // Trigger download
      const link = document.createElement('a');
      link.download = `tiket-${ticket.filmTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error generating ticket:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    const text = `[TIKET SINEMA CINEHEARTH]\nFilm: ${ticket.filmTitle} (${ticket.filmYear})\nRating: ★ ${ticket.rating}/5.0\nFormat: ${ticket.watchFormat}\nDitonton: ${ticket.watchedDate} oleh @${ticket.userUsername}\nCineHearth - Social Cinema Platform`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '780px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Ticket Modal Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#00e054', fontWeight: 700 }}>
              TIKET DIARY RESMI
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Karcis Kenangan Sinema
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8899a6',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Photorealistic Cinema Ticket Stub */}
        <div
          ref={ticketRef}
          style={{
            position: 'relative',
            backgroundColor: '#1b2228',
            borderRadius: '12px',
            border: '1px solid #333f4d',
            display: 'grid',
            gridTemplateColumns: '1fr 220px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85)',
          }}
        >
          {/* Top & Bottom Perforated Cutout Notches */}
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              right: '210px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#14181c',
              zIndex: 3,
              border: '1px solid #333f4d',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-12px',
              right: '210px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#14181c',
              zIndex: 3,
              border: '1px solid #333f4d',
            }}
          />

          {/* Left Main Stub */}
          <div
            style={{
              padding: '24px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              borderRight: '2px dashed #333f4d',
            }}
          >
            {/* Poster Thumbnail */}
            <div
              style={{
                width: '120px',
                aspectRatio: '2/3',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid #2c3642',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
              }}
            >
              <img
                src={ticket.filmPoster}
                alt={ticket.filmTitle}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge-pill badge-pill-green" style={{ fontSize: '9px' }}>
                  ADMIT ONE
                </span>
                <span className="badge-pill" style={{ fontSize: '9px' }}>
                  {ticket.watchFormat}
                </span>
              </div>

              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {ticket.filmTitle}
                </h2>
                <div style={{ fontSize: '12px', color: '#8899a6', marginTop: '3px' }}>
                  {ticket.filmYear} • Dir. {ticket.director || 'Theatrical Release'}
                </div>
              </div>

              {/* Star Rating */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: '#00e054', fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>
                  {'★'.repeat(Math.floor(ticket.rating))}
                </span>
                <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 800 }}>
                  {ticket.rating.toFixed(1)} / 5.0
                </span>
              </div>

              {ticket.reviewText && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#9ab0c2',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  "{ticket.reviewText}"
                </p>
              )}

              <div style={{ fontSize: '11px', color: '#677b8c', marginTop: '2px' }}>
                Ditonton pada: <strong style={{ color: '#8899a6' }}>{ticket.watchedDate}</strong>
              </div>
            </div>
          </div>

          {/* Right Detachable Pass Stub */}
          <div
            style={{
              padding: '24px 18px',
              backgroundColor: '#191f26',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e054', fontWeight: 700 }}>
                TIKET KOLEKSI
              </span>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', marginTop: '2px' }}>
                {serialNumber}
              </div>
              <div style={{ fontSize: '10px', color: '#677b8c', marginTop: '4px' }}>
                @{ticket.userUsername}
              </div>
            </div>

            {/* Simulated Barcode */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  height: '44px',
                  width: '100%',
                  background: 'repeating-linear-gradient(90deg, #ffffff 0, #ffffff 2px, transparent 2px, transparent 4px, #ffffff 4px, #ffffff 7px, transparent 7px, transparent 9px)',
                  opacity: 0.85,
                }}
              />
              <span style={{ fontSize: '8px', color: '#677b8c', letterSpacing: '2px' }}>
                CINEHEARTH AUTHENTIC
              </span>
            </div>

            <div style={{ fontSize: '9px', color: '#8899a6', fontWeight: 700, letterSpacing: '0.04em' }}>
              CINEHEARTH.APP
            </div>
          </div>
        </div>

        {/* Action Buttons (Zero Emojis, Clean SVGs) */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '9px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            {copied ? '✓ TERSALIN KE CLIPBOARD' : 'SALIN TEKS TIKET'}
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-primary"
            style={{ padding: '9px 22px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {isDownloading ? 'MEMPROSES GAMBAR...' : 'UNDUH TIKET (PNG)'}
          </button>
        </div>
      </div>
    </div>
  );
};
