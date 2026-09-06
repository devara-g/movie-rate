'use client';

import React from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1200,
        backgroundColor: '#212932',
        border: '1px solid #00e054',
        borderRadius: '3px',
        padding: '10px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <span style={{ color: '#00e054', fontWeight: 800 }}>✓</span>
      <span>{message}</span>
    </div>
  );
};
