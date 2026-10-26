import React, { useState, useEffect, useMemo } from 'react';
import { venueService } from '../../services/venueService';
import StatusBadge from '../../components/common/StatusBadge';
import {
  MapPin,
  Plus,
  Edit2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  Users,
  Wrench,
  Check,
  Building2,
} from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';

const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [createModal, setCreateModal] = useState(false);
  const [editVenue, setEditVenue] = useState(null);

  // Close modals on Escape key
  useEscapeKey(() => {
    if (createModal) setCreateModal(false);
    if (editVenue) setEditVenue(null);
  }, !!(createModal || editVenue));

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    capacity: 100,
    amenitiesText: 'Projector, AC, High-speed Wi-Fi',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    capacity: 100,
    amenitiesText: '',
    status: 'active',
  });

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      setErrorMsg('');
      const data = await venueService.getVenues();
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error fetching campus venues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const amenities = formData.amenitiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await venueService.createVenue({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
        amenities,
      });

      setSuccessMsg(`Venue "${formData.name}" added successfully.`);
      setCreateModal(false);
      setFormData({ name: '', code: '', location: '', capacity: 100, amenitiesText: '' });
      await loadVenues(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating venue');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (v) => {
    setEditVenue(v);
    setEditFormData({
      name: v.name || '',
      location: v.location || '',
      capacity: v.capacity || 100,
      amenitiesText: Array.isArray(v.amenities) ? v.amenities.join(', ') : '',
      status: v.status || 'active',
    });
  };

  const handleUpdateVenue = async (e) => {
    e.preventDefault();
    if (!editVenue) return;

    setActionLoading(true);
    setErrorMsg('');

    try {
      const amenities = editFormData.amenitiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await venueService.updateVenue(editVenue._id, {
        name: editFormData.name.trim(),
        location: editFormData.location.trim(),
        capacity: Number(editFormData.capacity),
        amenities,
        status: editFormData.status,
      });

      setSuccessMsg(`Venue "${editFormData.name}" updated successfully.`);
      setEditVenue(null);
      await loadVenues(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating venue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (v) => {
    const nextStatus = v.status === 'active' ? 'maintenance' : 'active';
    try {
      setErrorMsg('');
      await venueService.updateVenue(v._id, { status: nextStatus });
      setSuccessMsg(`Venue "${v.name}" status updated to ${nextStatus}.`);
      await loadVenues(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating venue status');
    }
  };

  // Filtered venues list
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      if (statusFilter !== 'ALL' && v.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = v.name?.toLowerCase().includes(q);
      const codeMatch = v.code?.toLowerCase().includes(q);
      const locMatch = v.location?.toLowerCase().includes(q);
      const amenitiesMatch = Array.isArray(v.amenities) && v.amenities.some((a) => a.toLowerCase().includes(q));

      return nameMatch || codeMatch || locMatch || amenitiesMatch;
    });
  }, [venues, statusFilter, searchQuery]);

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Campus Venues & Facilities
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
                {venues.length} Facilities
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>
              Manage auditoriums, seminar halls, computer labs, and open grounds for event bookings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => loadVenues(true)}
              disabled={refreshing || loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh venues"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Campus Venue
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

        {/* Search & Filter Toolbar */}
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
              placeholder="Search by venue name, code (AUD-01), building, or amenities..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading campus venues...</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Building2 size={36} color="var(--primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px' }}>
              No Venues Found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              {venues.length === 0
                ? 'No venues configured in the system yet. Click "Add Campus Venue" to create one.'
                : 'No venues match your current search criteria.'}
            </p>
          </div>
        ) : (
          <div className="event-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredVenues.map((v) => {
              const isMaintenance = v.status === 'maintenance';

              return (
                <div
                  key={v._id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1.5px solid ${isMaintenance ? '#fde68a' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Header: Code & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--primary-border)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {v.code}
                      </span>
                      <StatusBadge status={v.status} />
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
                      {v.name}
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 14px' }}>
                      <MapPin size={14} color="var(--primary)" /> {v.location}
                    </p>

                    {/* Capacity Badge */}
                    <div
                      style={{
                        background: 'var(--bg-page)',
                        border: '1px solid var(--border-color)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={15} color="var(--primary)" /> Seating Capacity
                      </span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{v.capacity} seats</strong>
                    </div>

                    {/* Amenities Tag Cloud */}
                    {Array.isArray(v.amenities) && v.amenities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {v.amenities.map((a, aIdx) => (
                          <span
                            key={aIdx}
                            style={{
                              fontSize: '11px',
                              background: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-color)',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggleStatus(v)}
                      style={{
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={isMaintenance ? 'Set to Active' : 'Set to Maintenance'}
                    >
                      {isMaintenance ? (
                        <>
                          <Check size={13} color="#059669" /> Activate
                        </>
                      ) : (
                        <>
                          <Wrench size={13} color="#d97706" /> Maintenance
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(v)}
                      style={{
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Edit2 size={13} /> Edit Venue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create Venue */}
        {createModal && (
          <div
            className="modal-overlay"
            style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setCreateModal(false); }}
          >
            <div className="modal-card" style={{ maxWidth: '540px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
                    Add Campus Venue
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                    Register a new hall, lab, or outdoor ground for event bookings.
                  </p>
                </div>
                <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateVenue}>
                <div className="modal-body" style={{ padding: '20px 24px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Venue Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. APJ Abdul Kalam Auditorium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                        Venue Code (Unique)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="AUD-01"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                        Max Seating Capacity
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Location / Campus Block
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Main Academic Block - 3rd Floor"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Amenities (Comma separated)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Projector, High-speed Wi-Fi, AC, Audio Rig, Podium"
                      value={formData.amenitiesText}
                      onChange={(e) => setFormData({ ...formData, amenitiesText: e.target.value })}
                    />
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
                  <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ fontWeight: '700' }}>
                    {actionLoading ? 'Creating...' : 'Create Venue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Venue */}
        {editVenue && (
          <div
            className="modal-overlay"
            style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditVenue(null); }}
          >
            <div className="modal-card" style={{ maxWidth: '540px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px' }}>
                    Edit Venue: {editVenue.code}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                    Update facilities, seating capacity, or operational status.
                  </p>
                </div>
                <button onClick={() => setEditVenue(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateVenue}>
                <div className="modal-body" style={{ padding: '20px 24px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Venue Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                        Max Seating Capacity
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={editFormData.capacity}
                        onChange={(e) => setEditFormData({ ...editFormData, capacity: Number(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                        Operational Status
                      </label>
                      <select
                        className="form-input"
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Location / Campus Block
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '13.5px' }}>
                      Amenities (Comma separated)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.amenitiesText}
                      onChange={(e) => setEditFormData({ ...editFormData, amenitiesText: e.target.value })}
                    />
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
                  <button type="button" className="btn btn-secondary" onClick={() => setEditVenue(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ fontWeight: '700' }}>
                    {actionLoading ? 'Saving...' : 'Save Changes'}
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

export default Venues;
