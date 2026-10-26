import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Search, Download, Users, CheckCircle2, Clock, X, FileText, AlertCircle } from 'lucide-react';

const Participants = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedResponsesModal, setSelectedResponsesModal] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await eventService.getAllEvents({ organizerId: user._id, status: '' });
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRegistrations = async (eventId) => {
    setLoading(true);
    try {
      const data = await registrationService.getEventRegistrations(eventId);
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // Filtered registrations
  const filteredRegistrations = registrations.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.studentId?.name?.toLowerCase().includes(term) ||
      r.studentId?.email?.toLowerCase().includes(term) ||
      r.registrationId?.toLowerCase().includes(term) ||
      r.studentId?.collegeId?.toLowerCase().includes(term) ||
      r.studentId?.department?.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'checked_in') return r.status === 'checked_in';
    if (statusFilter === 'registered') return r.status === 'registered';
    if (statusFilter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) return;

    // Collect all unique custom question labels if any
    const customKeysSet = new Set();
    registrations.forEach((r) => {
      if (r.customResponses) {
        const respObj = r.customResponses instanceof Map ? Object.fromEntries(r.customResponses) : r.customResponses;
        Object.keys(respObj).forEach((k) => customKeysSet.add(k));
      }
    });
    const customKeys = Array.from(customKeysSet);

    const headers = [
      'Registration ID',
      'Student Name',
      'Email',
      'Department',
      'Year',
      'College Roll ID',
      'Phone',
      'Status',
      'Checked In Time',
      'Registered Date',
      ...customKeys.map((k) => `Question: ${k}`),
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredRegistrations.map((r) => {
      const respObj = r.customResponses instanceof Map ? Object.fromEntries(r.customResponses) : (r.customResponses || {});
      const checkedInStr = r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'Not Checked In';
      const registeredStr = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';

      return [
        escapeCsv(r.registrationId),
        escapeCsv(r.studentId?.name || 'Student'),
        escapeCsv(r.studentId?.email || ''),
        escapeCsv(r.studentId?.department || ''),
        escapeCsv(r.studentId?.year || ''),
        escapeCsv(r.studentId?.collegeId || ''),
        escapeCsv(r.studentId?.phone || ''),
        escapeCsv(r.status || 'registered'),
        escapeCsv(checkedInStr),
        escapeCsv(registeredStr),
        ...customKeys.map((k) => escapeCsv(respObj[k] || '')),
      ].join(',');
    });

    // Add UTF-8 BOM so Microsoft Excel correctly renders all fonts
    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const eventSlug = (selectedEvent?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const filename = `attendance-roster-${eventSlug}-${new Date().toISOString().slice(0, 10)}.csv`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  };

  // Stats calculation
  const totalCount = registrations.length;
  const checkedInCount = registrations.filter((r) => r.status === 'checked_in').length;
  const pendingCount = registrations.filter((r) => r.status === 'registered').length;
  const cancelledCount = registrations.filter((r) => r.status === 'cancelled').length;
  const checkInRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Participant Roster & Verification</h1>
            <p style={{ color: 'var(--text-muted)' }}>Inspect registered students, verified attendees, and custom form responses.</p>
          </div>

          {/* Event Selector & CSV Export */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Event:</label>
              <select
                className="form-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{ width: '260px' }}
              >
                {events.map((e) => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              title="Download official CSV attendance sheet for college credits and OD approval"
            >
              <Download size={16} /> Export Attendance (CSV)
            </button>
          </div>
        </div>

        {/* Attendance Summary Chips */}
        {selectedEvent && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Registered</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>{totalCount}</div>
              </div>
              <Users size={26} style={{ color: 'var(--primary)', opacity: 0.8 }} />
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Checked In</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#14532d', marginTop: '2px' }}>
                  {checkedInCount} <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>({checkInRate}%)</span>
                </div>
              </div>
              <CheckCircle2 size={26} style={{ color: '#166534', opacity: 0.8 }} />
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Pending / Absent</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#b45309', marginTop: '2px' }}>{pendingCount}</div>
              </div>
              <Clock size={26} style={{ color: '#b45309', opacity: 0.8 }} />
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by student name, roll ID, or registration code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`category-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({totalCount})
            </button>
            <button
              className={`category-pill ${statusFilter === 'checked_in' ? 'active' : ''}`}
              onClick={() => setStatusFilter('checked_in')}
            >
              Checked In ({checkedInCount})
            </button>
            <button
              className={`category-pill ${statusFilter === 'registered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('registered')}
            >
              Pending ({pendingCount})
            </button>
            {cancelledCount > 0 && (
              <button
                className={`category-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelled ({cancelledCount})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
            <h3>No participants found</h3>
            <p>No student registrations match your filter criteria or search query.</p>
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
                  <th>Checked In At</th>
                  <th>Custom Answers</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const hasCustom = reg.customResponses && Object.keys(
                    reg.customResponses instanceof Map ? Object.fromEntries(reg.customResponses) : reg.customResponses
                  ).length > 0;

                  return (
                    <tr key={reg._id}>
                      <td>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{reg.registrationId}</strong>
                      </td>
                      <td>
                        <strong>{reg.studentId?.name || 'Student'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{reg.studentId?.email}</div>
                      </td>
                      <td>{reg.studentId?.department || '—'} {reg.studentId?.year ? `(${reg.studentId.year})` : ''}</td>
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
                          <span style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>Pending Entry</span>
                        )}
                      </td>
                      <td>
                        {hasCustom ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                            onClick={() => setSelectedResponsesModal({ student: reg.studentId, responses: reg.customResponses })}
                          >
                            <FileText size={13} /> View Answers
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Standard</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Custom Responses Modal */}
        {selectedResponsesModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', fontWeight: '800' }}>
                    Custom Registration Responses
                  </h3>
                  <p className="form-help" style={{ margin: 0 }}>
                    {selectedResponsesModal.student?.name} ({selectedResponsesModal.student?.department})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedResponsesModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.entries(
                    selectedResponsesModal.responses instanceof Map
                      ? Object.fromEntries(selectedResponsesModal.responses)
                      : selectedResponsesModal.responses || {}
                  ).map(([question, answer], idx) => (
                    <div key={idx} style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        {question}
                      </span>
                      <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>
                        {String(answer) || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedResponsesModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Participants;
