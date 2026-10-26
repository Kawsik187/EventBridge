import React from 'react';
import { Bell, Calendar } from 'lucide-react';

const AnnouncementCard = ({ announcement }) => {
  const eventTitle = announcement.eventId?.title || 'Campus Event Broadcast';
  const organizerName = announcement.organizerId?.name || 'Event Committee';
  const dateStr = announcement.createdAt
    ? new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Recent Announcement';

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 22px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontWeight: '700', fontSize: '13px' }}>
          <Bell size={16} />
          <span>{eventTitle}</span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dateStr}</span>
      </div>

      <h4 style={{ fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)' }}>
        {announcement.title}
      </h4>

      <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
        {announcement.message}
      </p>

      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-light)' }}>
        Posted by <strong>{organizerName}</strong>
      </div>
    </div>
  );
};

export default AnnouncementCard;
