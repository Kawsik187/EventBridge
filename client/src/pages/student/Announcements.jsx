import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import AnnouncementCard from '../../components/announcements/AnnouncementCard';
import { Bell } from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getStudentAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={28} style={{ color: 'var(--secondary)' }} /> Event Broadcasts & Announcements
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Official updates and venue notices for your registered events.</p>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <h3>No broadcasts yet</h3>
            <p>Announcements from your event organizers will appear here.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <AnnouncementCard key={ann._id} announcement={ann} />
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
