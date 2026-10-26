import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import AnnouncementCard from '../../components/announcements/AnnouncementCard';
import { Bell, Send } from 'lucide-react';

const AnnouncementsManager = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadAnnouncements(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await eventService.getAllEvents({ organizerId: user._id, status: '' });
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnnouncements = async (eventId) => {
    try {
      const data = await announcementService.getEventAnnouncements(eventId);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await announcementService.createAnnouncement({
        eventId: selectedEventId,
        title,
        message,
      });
      setTitle('');
      setMessage('');
      loadAnnouncements(selectedEventId);
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1>Broadcast Announcements</h1>
            <p style={{ color: 'var(--text-muted)' }}>Send real-time updates and venue notifications to registered students.</p>
          </div>

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

        {/* Post Announcement Form */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>New Broadcast Announcement</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Announcement Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Check-in Desk Location Moved to Innovation Lab"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message Details</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Write your announcement text..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={15} /> {loading ? 'Broadcasting...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Broadcasts */}
        <h3>Published Broadcasts</h3>
        <div style={{ marginTop: '12px' }}>
          {announcements.length === 0 ? (
            <div className="empty-state"><p>No announcements published for this event yet.</p></div>
          ) : (
            announcements.map((ann) => (
              <AnnouncementCard key={ann._id} announcement={ann} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
