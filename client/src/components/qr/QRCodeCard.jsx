import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import { CheckCircle2, Download, Calendar, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile, downloadQrImage } from '../../utils/calendarUtils';

const QRCodeCard = ({ registration, event }) => {
  const [copied, setCopied] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  if (!registration) return null;

  const eventData = event || registration.eventId || {};
  const eventTitle = eventData.title || 'Campus Event';
  const venueName = eventData.venueId?.name || 'Main Campus Venue';
  const dateStr = eventData.date || '';
  const timeStr = eventData.startTime ? `${eventData.startTime} - ${eventData.endTime || ''}` : '';

  const isRegisteredOrChecked = ['registered', 'checked_in', 'approved'].includes(registration.status?.toLowerCase());

  const handleCopyId = () => {
    if (registration.registrationId) {
      navigator.clipboard.writeText(registration.registrationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`qr-ticket-card printable-pass ${isRegisteredOrChecked ? 'registered' : ''}`}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          OFFICIAL CAMPUS PASS
        </span>
        <StatusBadge status={registration.status} />
      </div>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <h4 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '4px', fontWeight: '800' }}>{eventTitle}</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{venueName} • {dateStr} {timeStr && `(${timeStr})`}</p>
      </div>

      {registration.qrCodeDataUrl ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={registration.qrCodeDataUrl}
            alt={`QR Ticket for ${registration.registrationId}`}
            className="qr-img"
          />
        </div>
      ) : (
        <div style={{ width: '180px', height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>QR Ticket</span>
        </div>
      )}

      {/* Registration ID with 1-click copy */}
      <div style={{ background: 'var(--bg-subtle)', padding: '8px 14px', borderRadius: '8px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Registration ID</span>
          <p style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', color: 'var(--primary)', margin: 0 }}>
            {registration.registrationId}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyId}
          className="btn btn-secondary btn-sm no-print"
          style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
          title="Copy Registration ID"
        >
          {copied ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Status indicator */}
      {registration.status === 'checked_in' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#14532d', fontWeight: '700', fontSize: '13px' }}>
          <CheckCircle2 size={16} style={{ color: '#14532d' }} />
          <span>Checked In at {registration.checkedInAt ? new Date(registration.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Entrance Desk'}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#14532d', fontWeight: '700', fontSize: '12px' }}>
          <CheckCircle2 size={15} style={{ color: '#14532d' }} />
          <span>Confirmed Registration • Show this QR at entrance</span>
        </div>
      )}

      {/* Offline Actions Toolbar (Hidden on print) */}
      <div className="no-print" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {/* Download QR Image */}
          {registration.qrCodeDataUrl && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ flex: 1, gap: '6px', justifyContent: 'center' }}
              onClick={() => downloadQrImage(registration.qrCodeDataUrl, registration.registrationId)}
              title="Save ticket image to your phone gallery or laptop"
            >
              <Download size={14} /> Save QR Image
            </button>
          )}

          {/* Print / Save PDF */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, gap: '6px', justifyContent: 'center' }}
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>

        {/* Add to Calendar Sync Dropdown */}
        <div style={{ position: 'relative', width: '100%' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', gap: '6px', justifyContent: 'center' }}
            onClick={() => setShowCalendarMenu(!showCalendarMenu)}
          >
            <Calendar size={14} /> Add to Calendar
          </button>

          {showCalendarMenu && (
            <div
              style={{
                position: 'absolute',
                top: '105%',
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                padding: '6px',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <a
                href={generateGoogleCalendarUrl(eventData)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', textDecoration: 'none' }}
                onClick={() => setShowCalendarMenu(false)}
              >
                <ExternalLink size={14} /> Google Calendar
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}
                onClick={() => {
                  downloadIcsFile(eventData);
                  setShowCalendarMenu(false);
                }}
              >
                <Download size={14} /> Apple / Outlook (.ics)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeCard;
