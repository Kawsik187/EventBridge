import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { venueService } from '../../services/venueService';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle, Plus, Trash2, Calendar, MapPin, Building2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { CATEGORY_BANNERS, getCategoryBanner } from '../../utils/bannerPresets';

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const getFutureDate = (daysAhead = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    description: '',
    venueId: '',
    date: getFutureDate(7),
    startTime: '10:00',
    endTime: '13:00',
    registrationDeadline: getFutureDate(6),
    maxParticipants: 100,
    eligibility: 'Open to all college students',
    rulesText: 'Bring college ID\nFollow dress code',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    bannerUrl: '',
  });

  const [customFields, setCustomFields] = useState([]);
  const [venueCheck, setVenueCheck] = useState({ checked: false, available: true, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const data = await venueService.getVenues();
      setVenues(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, venueId: data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Real-time Venue Conflict Check trigger
  useEffect(() => {
    if (formData.venueId && formData.date && formData.startTime && formData.endTime) {
      verifyVenueAvailability();
    }
  }, [formData.venueId, formData.date, formData.startTime, formData.endTime]);

  const verifyVenueAvailability = async () => {
    try {
      const res = await venueService.checkAvailability(
        formData.venueId,
        formData.date,
        formData.startTime,
        formData.endTime
      );
      setVenueCheck({
        checked: true,
        available: res.available,
        message: res.message,
        conflict: res.conflict,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddField = () => {
    setCustomFields([
      ...customFields,
      { label: '', fieldType: 'text', required: false, options: [] },
    ]);
  };

  const handleRemoveField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const handleSubmit = async (e, submitForApproval = false) => {
    e.preventDefault();
    if (!venueCheck.available) {
      setError('Cannot submit while venue conflict exists. Please select another time or venue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rules = formData.rulesText.split('\n').filter((r) => r.trim() !== '');
      const finalBannerUrl = formData.bannerUrl.trim() || getCategoryBanner(formData.category, formData.title);

      const payload = {
        ...formData,
        bannerUrl: finalBannerUrl,
        rules,
        contactInfo: {
          name: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
        },
        customFields,
        submitForApproval,
      };

      await eventService.createEvent(payload);
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '820px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h1>Create Campus Event</h1>
            <p style={{ color: 'var(--text-muted)' }}>Draft a new event, verify venue schedule availability, and submit for dean approval.</p>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', borderRadius: '6px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Locked Organizing Department Indicator */}
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={20} color="#1c4980" />
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Organizing Department</div>
                <div style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '800' }}>
                  {user?.departmentDetails?.name || user?.department || 'Official College Department'}
                </div>
              </div>
            </div>
            <span style={{ background: '#1c4980', color: '#ffffff', fontSize: '12px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px' }}>
              {user?.departmentDetails?.code || user?.departmentCode || 'BRANCH'}
            </span>
          </div>

          <form onSubmit={(e) => handleSubmit(e, true)}>
            {/* Title & Category */}
            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AI & Robotics Hackathon 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Technical">Technical</option>
                  <option value="Academic">Academic</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Arts">Arts</option>
                  <option value="Innovation">Innovation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Seat Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Event Description</label>
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Detailed event background, objectives, and highlights..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Real Web Banner Image Picker */}
            <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: 'var(--primary)' }} /> Event Banner Image (Real Web Images)
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => setFormData({ ...formData, bannerUrl: getCategoryBanner(formData.category, formData.title) })}
                >
                  <Sparkles size={13} /> Auto-suggest Banner
                </button>
              </div>

              <input
                type="url"
                className="form-input"
                placeholder="Enter custom image URL (https://...) or pick a curated real banner below"
                value={formData.bannerUrl}
                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                style={{ marginBottom: '14px' }}
              />

              {/* Quick Select Real Web Banners */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  CURATED REAL WEB BANNERS ({formData.category || 'Curated'}):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {(CATEGORY_BANNERS[formData.category] || CATEGORY_BANNERS.Hackathon).map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, bannerUrl: preset.url })}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: formData.bannerUrl === preset.url ? '2.5px solid var(--primary)' : '1px solid var(--border-color)',
                        boxShadow: formData.bannerUrl === preset.url ? '0 0 0 2px rgba(28, 73, 128, 0.2)' : 'none',
                        position: 'relative',
                        transition: 'transform 0.15s ease',
                      }}
                      title={preset.title}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        style={{ width: '100%', height: '65px', objectFit: 'cover', display: 'block' }}
                      />
                      <div
                        style={{
                          fontSize: '11px',
                          padding: '4px 6px',
                          background: '#ffffff',
                          color: '#334155',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {preset.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              {formData.bannerUrl && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                    PREVIEW:
                  </div>
                  <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img
                      src={formData.bannerUrl}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = getCategoryBanner(formData.category, formData.title); }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Venue & Time Selection with Conflict Status */}
            <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} /> Venue & Schedule Conflict Verification
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Venue</label>
                  <select
                    className="form-select"
                    value={formData.venueId}
                    onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                    required
                  >
                    {venues.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.location}) — Cap: {v.capacity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Registration Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Venue Conflict Real-Time Status Box */}
              {venueCheck.checked && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: venueCheck.available ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${venueCheck.available ? '#bbf7d0' : '#fecaca'}`,
                    color: venueCheck.available ? '#15803d' : '#991b1b',
                  }}
                >
                  {venueCheck.available ? (
                    <>
                      <CheckCircle size={18} /> <span>✓ Venue is available for this date & time block</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={18} /> <span>⚠ {venueCheck.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Custom Registration Fields Builder */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1rem' }}>Custom Registration Questions (Optional)</h4>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddField}>
                  <Plus size={14} /> Add Question
                </button>
              </div>

              {customFields.map((field, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Team Name or GitHub Link"
                    value={field.label}
                    onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                    required
                  />
                  <select
                    className="form-select"
                    style={{ width: '130px' }}
                    value={field.fieldType}
                    onChange={(e) => handleFieldChange(idx, 'fieldType', e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                    <option value="url">URL</option>
                    <option value="number">Number</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                    /> Required
                  </label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemoveField(idx)}>
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Submit Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || !venueCheck.available}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !venueCheck.available}
              >
                {loading ? 'Submitting...' : 'Submit for Dean Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
