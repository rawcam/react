// src/components/flow/IconPickerModal.tsx
import React, { useState } from 'react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  currentIcon?: string;
}

const ICON_LIST = [
  // Основные
  'fas fa-microchip',
  'fas fa-server',
  'fas fa-desktop',
  'fas fa-laptop',
  'fas fa-tv',
  'fas fa-video',
  'fas fa-camera',
  'fas fa-volume-up',
  'fas fa-headphones',
  'fas fa-microphone',
  'fas fa-network-wired',
  'fas fa-wifi',
  'fas fa-broadcast-tower',
  'fas fa-satellite',
  'fas fa-hdd',
  'fas fa-database',
  'fas fa-power-off',
  'fas fa-bolt',
  'fas fa-lightbulb',
  'fas fa-cog',
  'fas fa-sliders-h',
  'fas fa-chart-bar',
  'fas fa-chart-line',
  'fas fa-print',
  'fas fa-phone',
  'fas fa-tablet-alt',
  'fas fa-music',
  'fas fa-play',
  'fas fa-stop',
  'fas fa-pause',
  'fas fa-record-vinyl',
  'fas fa-compact-disc',
  'fas fa-usb',
  'fas fa-plug',
  'fas fa-puzzle-piece',
  'fas fa-shield-alt',
  'fas fa-key',
  'fas fa-lock',
  'fas fa-unlock',
  'fas fa-clock',
  'fas fa-hourglass',
  'fas fa-battery-full',
  'fas fa-battery-half',
  'fas fa-battery-quarter',
  'fas fa-sun',
  'fas fa-moon',
  'fas fa-cloud',
  'fas fa-wrench',
  'fas fa-tools',
  'fas fa-hammer',
  'fas fa-screwdriver',
];

const IconPickerModal: React.FC<IconPickerModalProps> = ({ isOpen, onClose, onSelect, currentIcon }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredIcons = ICON_LIST.filter(icon => icon.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)',
          borderRadius: '24px',
          padding: '24px',
          width: '500px',
          maxHeight: '70vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow)',
          color: 'var(--text-primary)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontWeight: 600 }}>Выбор иконки</h3>
        <input
          type="text"
          placeholder="Поиск иконки..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '16px',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            background: 'var(--bg-panel)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {filteredIcons.map(icon => (
            <div
              key={icon}
              onClick={() => { onSelect(icon); onClose(); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 4px',
                background: currentIcon === icon ? 'var(--accent)' : 'var(--card-bg)',
                borderRadius: '12px',
                cursor: 'pointer',
                border: currentIcon === icon ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                color: currentIcon === icon ? 'white' : 'var(--text-primary)',
                transition: 'all 0.1s',
              }}
            >
              <i className={icon} style={{ fontSize: '24px', marginBottom: '6px' }} />
              <span style={{ fontSize: '10px', textAlign: 'center', wordBreak: 'break-word' }}>
                {icon.replace('fas fa-', '')}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default IconPickerModal;
