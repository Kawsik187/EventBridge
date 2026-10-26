import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Check,
  X,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Building2,
  Users,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

const REJECTION_PRESETS = [
  'Venue schedule conflict with another scheduled campus event',
  'Proposed attendance exceeds approved venue seating capacity',
  'Incomplete event description or missing faculty advisor details',
  'Duplicate event submission for this department',
  'Event dates conflict with university exam or convocation window',
  'Budget or external guest speaker permissions not yet cleared',
];

const CATEGORIES = [
  'ALL',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Hackathon',
  'Seminar',
  'Conference',
  'General',
];

const Approvals = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores event ID being actioned
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    loadPendingEvents();
  }, []);

  const loadPendingEvents = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setErrorMsg('');
      const data = await adminService.getPendingEvents();
      setPendingEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error fetching pending events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (event) => {
    try {
      setActionLoading(event._id);
      setErrorMsg('');
      const res = await adminService.approveEvent(event._id);
      setSuccessMsg(res?.message || `Event "${event.title}" has been successfully approved!`);
      await loadPendingEvents(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error approving event');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (event) => {
    setRejectingEvent(event);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectingEvent(null);
    setRejectReason('');
  };

  const handleApplyPreset = (presetText) => {
    setRejectReason((prev) => (prev ? `${prev}. ${presetText}` : presetText));
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingEvent) return;
    if (!rejectReason.trim()) {
      setErrorMsg('Please specify a valid rejection reason.');
      return;
    }

    try {
      setActionLoading(rejectingEvent._id);
      setErrorMsg('');
      const res = await adminService.rejectEvent(rejectingEvent._id, rejectReason.trim());
      setSuccessMsg(res?.message || `Event "${rejectingEvent.title}" has been rejected.`);
      closeRejectModal();
      await loadPendingEvents(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error rejecting event');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered pending events
  const filteredEvents = useMemo(() => {
    return pendingEvents.filter((evt) => {
      // Category filter
      if (categoryFilter !== 'ALL' && evt.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = evt.title?.toLowerCase().includes(q);
      const descMatch = evt.description?.toLowerCase().includes(q);
      const orgName = (evt.organizerName || evt.organizerId?.name || '').toLowerCase();
      const orgDept = (evt.organizerId?.department || evt.departmentCode || evt.departmentId?.code || '').toLowerCase();
      const venueName = (evt.venueId?.name || '').toLowerCase();

      return titleMatch || descMatch || orgName.includes(q) || orgDept.includes(q) || venueName.includes(q);
    });
  }, [pendingEvents, categoryFilter, searchQuery]);

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Event Approvals Desk
              </h1>
              <span
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {pendingEvents.length} Pending
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>
              Review, verify venue capacity, and approve submitted campus events prior to student registration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => loadPendingEvents(true)}
              disabled={refreshing || loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh approvals queue"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* In-app Notification Banners */}
        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#065f46',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle size={18} color="#059669" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={18} color="#dc2626" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            />
            <input
              type="text"
              placeholder="Search by event title, organizer, department or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                background: 'var(--bg-page)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                fontWeight: '600',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading pending events queue...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px' }}>
              {pendingEvents.length === 0 ? 'Approvals Queue Is Clear' : 'No Events Match Filter'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
              {pendingEvents.length === 0
                ? 'All submitted campus events have been thoroughly reviewed and processed.'
                : 'Try adjusting your search keywords or category filters above.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredEvents.map((evt) => {
              const isActioning = actionLoading === evt._id;
              const isExpanded = expandedIds.has(evt._id);
              const venueCapacity = evt.venueId?.capacity || 0;
              const requestedCapacity = evt.maxParticipants || 0;
              const isOverCapacity = venueCapacity > 0 && requestedCapacity > venueCapacity;
              const deptCode = evt.departmentCode || evt.departmentId?.code || evt.organizerId?.department;

              return (
                <div
                  key={evt._id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* Card Header & Controls */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className="event-card-category" style={{ fontWeight: '700' }}>
                          {evt.category || 'General'}
                        </span>
                        {deptCode && (
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <Building2 size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
                            {deptCode}
                          </span>
                        )}
                        <StatusBadge status={evt.status} />

                        {isOverCapacity && (
                          <span
                            style={{
                              background: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Max requested participants (${requestedCapacity}) exceeds venue capacity (${venueCapacity})`}
                          >
                            <AlertTriangle size={12} />
                            Capacity Exceeds Venue Limit ({requestedCapacity} &gt; {venueCapacity})
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
                        {evt.title}
                      </h3>

                      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                        Organized by:{' '}
                        <strong style={{ color: 'var(--text-main)' }}>
                          {evt.organizerName || evt.organizerId?.name || 'Department Faculty'}
                        </strong>{' '}
                        {evt.organizerId?.email && <span>({evt.organizerId.email})</span>}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApprove(evt)}
                        disabled={isActioning}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '700',
                          padding: '8px 16px',
                        }}
                      >
                        <Check size={16} />
                        {isActioning ? 'Approving...' : 'Approve Event'}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openRejectModal(evt)}
                        disabled={isActioning}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--danger)',
                          borderColor: '#fecaca',
                          background: '#fff5f5',
                          fontWeight: '700',
                          padding: '8px 14px',
                        }}
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Description preview */}
                  <div style={{ fontSize: '14.5px', color: 'var(--text-body)', margin: '12px 0', lineHeight: '1.6' }}>
                    {isExpanded ? (
                      <div>{evt.description}</div>
                    ) : (
                      <div>
                        {evt.description?.length > 220
                          ? `${evt.description.substring(0, 220)}...`
                          : evt.description}
                      </div>
                    )}
                  </div>

                  {/* Expandable Custom Questions & Details */}
                  {isExpanded && (
                    <div
                      style={{
                        background: 'var(--bg-page)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px 18px',
                        marginBottom: '14px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13.5px',
                      }}
                    >
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} color="var(--primary)" /> Custom Registration Schema & Requirements:
                      </div>
                      {Array.isArray(evt.customFields) && evt.customFields.length > 0 ? (
                        <ul style={{ margin: '0 0 8px 20px', color: 'var(--text-body)' }}>
                          {evt.customFields.map((f, i) => (
                            <li key={i}>
                              <strong>{f.label || f.fieldName}</strong> ({f.fieldType || 'text'})
                              {f.required ? ' - Required' : ' - Optional'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                          Standard participant fields only (No custom questionnaires added).
                        </p>
                      )}

                      {evt.registrationDeadline && (
                        <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                          Registration Deadline: <strong>{new Date(evt.registrationDeadline).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Meta Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '13.5px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--primary)" />
                        Date: <strong>{evt.date}</strong> ({evt.startTime} - {evt.endTime})
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--primary)" />
                        Venue: <strong>{evt.venueId?.name || 'Selected Campus Venue'}</strong>
                        {evt.venueId?.location && <span style={{ color: 'var(--text-light)' }}>({evt.venueId.location})</span>}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="var(--primary)" />
                        Max Participants: <strong>{requestedCapacity}</strong>
                        {venueCapacity > 0 && <span style={{ color: 'var(--text-light)' }}>(Venue cap: {venueCapacity})</span>}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleExpand(evt._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isExpanded ? (
                        <>
                          Less details <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Full specifications <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced Rejection Reason Modal with Presets */}
        {rejectingEvent && (
          <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}>
            <div className="modal-card" style={{ maxWidth: '580px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
                    Reject Event Proposal
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                    Provide explicit constructive feedback to the organizer for "{rejectingEvent.title}".
                  </p>
                </div>
                <button
                  onClick={closeRejectModal}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit}>
                <div className="modal-body" style={{ padding: '20px 24px' }}>
                  
                  {/* Preset Feedback Chips */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                      Quick Rejection Reasons:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {REJECTION_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            color: '#334155',
                            cursor: 'pointer',
                            fontWeight: '500',
                            textAlign: 'left',
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Formal Rejection Reason & Recommendations (Mandatory)
                    </label>
                    <textarea
                      className="form-textarea"
                      rows="4"
                      placeholder="Explain what must be revised before re-submitting (e.g. adjust venue capacity, clear date conflicts, or update event description)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{
                        width: '100%',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px',
                        fontSize: '13.5px',
                        border: '1.5px solid var(--border-color)',
                      }}
                      required
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                      This feedback will be recorded in the system audit log and displayed to the organizer.
                    </span>
                  </div>
                </div>

                <div
                  className="modal-footer"
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: '#f8fafc',
                    borderBottomLeftRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: 'var(--radius-lg)',
                  }}
                >
                  <button type="button" className="btn btn-secondary" onClick={closeRejectModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={!rejectReason.trim() || actionLoading === rejectingEvent._id}
                    style={{ fontWeight: '700' }}
                  >
                    {actionLoading === rejectingEvent._id ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Approvals;
