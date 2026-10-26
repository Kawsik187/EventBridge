import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { attendanceService } from '../../services/attendanceService';
import { X, QrCode, Camera, CheckCircle2, AlertTriangle, Keyboard } from 'lucide-react';

const QRScannerModal = ({ event, onClose, onCheckInSuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'manual'
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const lastScannedRef = useRef({ code: '', time: 0 });

  const processCheckIn = async (codeToVerify, method = 'manual') => {
    if (!codeToVerify || !codeToVerify.trim()) return;
    const cleanCode = codeToVerify.trim();

    // Prevent duplicate triggers within 3 seconds for the same code
    const now = Date.now();
    if (lastScannedRef.current.code === cleanCode && (now - lastScannedRef.current.time) < 3000) {
      return;
    }
    lastScannedRef.current = { code: cleanCode, time: now };

    setLoading(true);
    setFeedback(null);

    try {
      const res = await attendanceService.checkIn(event._id, cleanCode, method);
      setFeedback({
        type: 'success',
        title: 'Check-in Confirmed!',
        message: res.message || `${res.studentName} has been checked in`,
        studentName: res.studentName,
        department: res.department,
        registrationId: res.registrationId,
        time: res.checkedInAt,
      });
      setInputCode('');
      if (onCheckInSuccess) onCheckInSuccess(res);
    } catch (err) {
      const data = err.response?.data;
      setFeedback({
        type: data?.alreadyCheckedIn ? 'warning' : 'error',
        title: data?.alreadyCheckedIn ? 'Already Checked In' : 'Check-in Failed',
        message: data?.message || 'Invalid registration code or candidate ticket',
        studentName: data?.studentName,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processCheckIn(inputCode, 'manual');
  };

  // Mount HTML5 QR camera scanner when Camera tab is active
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let scannerInstance = null;
    try {
      scannerInstance = new Html5QrcodeScanner(
        'qr-live-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scannerInstance.render(
        (decodedText) => {
          processCheckIn(decodedText, 'camera');
        },
        (error) => {
          // Frame scan error (normal while waiting for QR in view)
        }
      );
    } catch (err) {
      console.error('Failed to initialize camera scanner:', err);
    }

    return () => {
      if (scannerInstance) {
        scannerInstance.clear().catch((e) => console.warn('Scanner clear error', e));
      }
    };
  }, [activeTab, event._id]);

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '800' }}>
              Attendance Desk & QR Scanner
            </h3>
            <p className="form-help">{event.title} • {event.venueId?.name || 'Campus Venue'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('camera'); setFeedback(null); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'camera' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'camera' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'camera' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Camera size={16} /> Live Camera Scanner
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('manual'); setFeedback(null); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'manual' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'manual' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'manual' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Keyboard size={16} /> Barcode Gun / Manual Entry
            </button>
          </div>

          {/* Camera Scanner View */}
          {activeTab === 'camera' && (
            <div style={{ marginBottom: '16px' }}>
              <div
                id="qr-live-reader"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  background: '#000000',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                Point the camera at the student's digital or printed QR ticket. Check-in happens automatically upon detection.
              </p>
            </div>
          )}

          {/* Manual / USB Barcode Gun Scanner Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>
                Registration ID or Handheld Barcode Gun Scanner
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Scan with USB Gun or type REG-2026-XXXX..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    autoFocus
                    required
                  />
                  <QrCode size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Checking...' : 'Check In'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                💡 Tip: Handheld USB scanners act like a keyboard and will automatically type and submit the code.
              </p>
            </form>
          )}

          {/* Feedback Display */}
          {feedback && (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: `1.5px solid ${
                  feedback.type === 'success' ? '#166534' : feedback.type === 'warning' ? '#d97706' : '#dc2626'
                }`,
                background:
                  feedback.type === 'success' ? '#dcfce7' : feedback.type === 'warning' ? '#fffbeb' : '#fef2f2',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                marginTop: '12px',
              }}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={26} style={{ color: '#14532d', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertTriangle size={24} style={{ color: feedback.type === 'warning' ? '#b45309' : '#dc2626', flexShrink: 0 }} />
              )}

              <div>
                <h4 style={{ fontSize: '1rem', color: feedback.type === 'success' ? '#14532d' : 'var(--text-main)', marginBottom: '2px', fontWeight: '800' }}>
                  {feedback.title}
                </h4>
                <p style={{ fontSize: '13.5px', color: feedback.type === 'success' ? '#166534' : 'var(--text-muted)', fontWeight: feedback.type === 'success' ? '600' : 'normal' }}>
                  {feedback.message}
                </p>

                {feedback.type === 'success' && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#14532d', display: 'flex', flexWrap: 'wrap', gap: '14px', background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '6px' }}>
                    <span>Reg ID: <strong>{feedback.registrationId}</strong></span>
                    <span>Student: <strong>{feedback.studentName}</strong></span>
                    {feedback.department && <span>Dept: <strong>{feedback.department}</strong></span>}
                    {feedback.time && <span>Time: <strong>{new Date(feedback.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Done / Close Desk
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
