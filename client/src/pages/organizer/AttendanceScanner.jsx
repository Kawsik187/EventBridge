import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import QRScannerModal from '../../components/qr/QRScannerModal';
import StatusBadge from '../../components/common/StatusBadge';
import { QrCode, CheckCircle, Users, AlertCircle, Search, Download, CheckCircle2, UserCheck, Clock } from 'lucide-react';

const AttendanceScanner = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'pending', 'checked_in'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await eventService.getAllEvents({ staffUserId: user?._id, status: '' });
      setEvents(data);

      const searchParams = new URLSearchParams(window.location.search);
      const paramEventId = searchParams.get('eventId');
      if (paramEventId && data.some((e) => e._id === paramEventId)) {
        setSelectedEventId(paramEventId);
      } else if (data.length > 0) {
        setSelectedEventId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async (eventId) => {
    setLoading(true);
    try {
      const data = await attendanceService.getEventAttendance(eventId);
      setAttendanceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Check In for students with dead phone battery or manual lookup
  const handleDirectCheckIn = async (reg) => {
    if (!selectedEventId || !reg?.registrationId) return;

    setActionLoadingId(reg._id);
    try {
      const res = await attendanceService.checkIn(selectedEventId, reg.registrationId, 'manual');
      
      // Update local state immediately for instant responsive UI
      setAttendanceData((prev) => {
        if (!prev) return prev;
        const updatedRegs = prev.registrations.map((r) =>
          r._id === reg._id ? { ...r, status: 'checked_in', checkedInAt: new Date().toISOString() } : r
        );
        const newCheckedInCount = updatedRegs.filter((r) => r.status === 'checked_in').length;
        return {
          ...prev,
          registrations: updatedRegs,
          checkedInCount: newCheckedInCount,
          noShowCount: prev.totalRegistered - newCheckedInCount,
        };
      });

      setToastMessage({
        type: 'success',
        text: `✓ ${reg.studentId?.name || 'Student'} successfully checked in!`,
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Check-in failed',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV directly from attendance desk
  const handleExportAttendanceCSV = () => {
    if (!attendanceData?.registrations || attendanceData.registrations.length === 0) return;

    const headers = [
      'Registration ID',
      'Student Name',
      'Email',
      'Department',
      'Year',
      'College Roll ID',
      'Status',
      'Checked In Time',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = attendanceData.registrations.map((r) => [
      escapeCsv(r.registrationId),
      escapeCsv(r.studentId?.name || 'Student'),
      escapeCsv(r.studentId?.email || ''),
      escapeCsv(r.studentId?.department || ''),
      escapeCsv(r.studentId?.year || ''),
      escapeCsv(r.studentId?.collegeId || ''),
      escapeCsv(r.status),
      escapeCsv(r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'Not Checked In'),
    ].join(','));

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const currentTitle = (currentEvent?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const filename = `attendance-desk-${currentTitle}-${new Date().toISOString().slice(0, 10)}.csv`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  };

  const currentEvent = events.find((e) => e._id === selectedEventId);

  // Filter registrations by search and tab
  const filteredRegistrations = (attendanceData?.registrations || []).filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.studentId?.name?.toLowerCase().includes(term) ||
      r.studentId?.email?.toLowerCase().includes(term) ||
      r.registrationId?.toLowerCase().includes(term) ||
      r.studentId?.collegeId?.toLowerCase().includes(term) ||
      r.studentId?.department?.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (statusTab === 'checked_in') return r.status === 'checked_in';
    if (statusTab === 'pending') return r.status !== 'checked_in' && r.status !== 'cancelled';
    return true;
  });

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Attendance Desk & Live Check-in</h1>
            <p style={{ color: 'var(--text-muted)' }}>Scan student QR passes or look up registration IDs and college roll numbers.</p>
            {currentEvent?.isVolunteer && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: '700',
                fontSize: '12px',
                marginTop: '6px',
                border: '1px solid var(--primary-border)',
              }}>
                <span>Volunteer Desk: <strong>{currentEvent.volunteerInfo?.roleName || 'Registration Desk'}</strong> ({currentEvent.volunteerInfo?.task})</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {events.length > 0 && (
              <select
                className="form-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{ width: '280px' }}
              >
                {events.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.isVolunteer ? `[Volunteer] ${e.title}` : e.title}
                  </option>
                ))}
              </select>
            )}

            {currentEvent && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportAttendanceCSV}
                  disabled={!attendanceData?.registrations?.length}
                  title="Export Attendance Sheet to CSV"
                >
                  <Download size={16} /> Export CSV
                </button>

                <button className="btn btn-primary" onClick={() => setShowScanner(true)}>
                  <QrCode size={18} /> Open Scanner Desk
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dismissible Feedback Toast */}
        {toastMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '600',
              fontSize: '14px',
              background: toastMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: toastMessage.type === 'success' ? '#14532d' : '#991b1b',
              border: `1px solid ${toastMessage.type === 'success' ? '#16a34a' : '#ef4444'}`,
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Live Attendance Stats */}
        {attendanceData && (
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div>
                <div className="stat-label">Total Registered</div>
                <div className="stat-val">{attendanceData.totalRegistered}</div>
              </div>
              <div className="stat-icon-wrap"><Users size={22} /></div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">Checked In</div>
                <div className="stat-val" style={{ color: 'var(--primary)' }}>{attendanceData.checkedInCount}</div>
              </div>
              <div className="stat-icon-wrap" style={{ color: 'var(--primary)' }}><CheckCircle size={22} /></div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">No Show / Pending</div>
                <div className="stat-val" style={{ color: 'var(--warning)' }}>{attendanceData.noShowCount}</div>
              </div>
              <div className="stat-icon-wrap" style={{ color: 'var(--warning)' }}><AlertCircle size={22} /></div>
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        {attendanceData && attendanceData.registrations.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search attendee by name, roll ID, or reg code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`category-pill ${statusTab === 'all' ? 'active' : ''}`}
                onClick={() => setStatusTab('all')}
              >
                All ({attendanceData.totalRegistered})
              </button>
              <button
                type="button"
                className={`category-pill ${statusTab === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusTab('pending')}
              >
                Pending Entry ({attendanceData.noShowCount})
              </button>
              <button
                type="button"
                className={`category-pill ${statusTab === 'checked_in' ? 'active' : ''}`}
                onClick={() => setStatusTab('checked_in')}
              >
                Checked In ({attendanceData.checkedInCount})
              </button>
            </div>
          </div>
        )}

        {/* Roster Table */}
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3>No Active Event Desk Assigned</h3>
            <p>You currently do not have any organized events or assigned volunteer roles with check-in privileges.</p>
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Once an organizer assigns you as a volunteer for an event, its attendance scanner desk will appear here automatically.
            </p>
          </div>
        ) : !attendanceData || attendanceData.registrations.length === 0 ? (
          <div className="empty-state">
            <h3>No registrations recorded yet</h3>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <h3>No matching attendees</h3>
            <p>No student records match your search query or filter selection.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Student Name</th>
                  <th>Department & Year</th>
                  <th>College Roll ID</th>
                  <th>Status</th>
                  <th>Checked In Time</th>
                  <th>Desk Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg._id}>
                    <td><strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{reg.registrationId}</strong></td>
                    <td>
                      <strong>{reg.studentId?.name || 'Student'}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{reg.studentId?.email}</div>
                    </td>
                    <td>{reg.studentId?.department} ({reg.studentId?.year})</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {reg.studentId?.collegeId || '—'}
                      </span>
                    </td>
                    <td><StatusBadge status={reg.status} /></td>
                    <td>
                      {reg.checkedInAt ? (
                        <span style={{ color: '#166534', fontWeight: '700', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} />
                          {new Date(reg.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      {reg.status === 'checked_in' ? (
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>✓ Verified</span>
                      ) : reg.status === 'cancelled' ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancelled</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}
                          disabled={actionLoadingId === reg._id}
                          onClick={() => handleDirectCheckIn(reg)}
                          title="Instant desk check-in without scanning"
                        >
                          <UserCheck size={13} />
                          <span>{actionLoadingId === reg._id ? 'Checking...' : 'Check In'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Scanner Modal */}
        {showScanner && currentEvent && (
          <QRScannerModal
            event={currentEvent}
            onClose={() => setShowScanner(false)}
            onCheckInSuccess={() => loadAttendance(selectedEventId)}
          />
        )}
      </div>
    </div>
  );
};

export default AttendanceScanner;
