import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { venueService } from '../../services/venueService';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [vList, evt] = await Promise.all([
        venueService.getVenues(),
        eventService.getEventById(id),
      ]);
      setVenues(vList);
      setFormData({
        title: evt.title,
        category: evt.category,
        description: evt.description,
        venueId: evt.venueId?._id || evt.venueId,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        registrationDeadline: evt.registrationDeadline,
        maxParticipants: evt.maxParticipants,
        eligibility: evt.eligibility,
        rulesText: evt.rules ? evt.rules.join('\n') : '',
        status: evt.status,
      });
    } catch (err) {
      setError('Error loading event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const rules = formData.rulesText.split('\n').filter((r) => r.trim() !== '');
      await eventService.updateEvent(id, { ...formData, rules });
      navigate('/organizer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating event');
    }
  };

  if (loading || !formData) return <div className="main-content"><div className="empty-state"><div className="loading-spinner" /></div></div>;

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '750px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          <h2>Edit Event Details</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Update event settings, venue, or schedule.</p>

          {error && <div className="form-error" style={{ marginBottom: '16px', padding: '10px', background: '#fee2e2', borderRadius: '6px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="open">Registration Open</option>
                  <option value="closed">Registration Closed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <select
                  className="form-select"
                  value={formData.venueId}
                  onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                >
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
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

            <div className="modal-footer" style={{ background: 'none', padding: '16px 0 0' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/organizer/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Event Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
