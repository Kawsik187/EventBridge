import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, Users, Award, ExternalLink } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import CapacityBar from './CapacityBar';
import { getEventImage } from '../../utils/bannerPresets';

const EventCard = ({ event, isRegistered }) => {
  const imageSrc = getEventImage(event);
  const registered = isRegistered || event?.isRegistered;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const isDeadlinePassed = () => {
    if (!event?.registrationDeadline) return false;
    const str = String(event.registrationDeadline).trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T23:59:59.999`) : new Date(str);
    return !isNaN(d.getTime()) && new Date() > d;
  };

  const isFinished = () => {
    if (event?.status === 'completed') return true;
    if (!event?.date) return false;
    const time = event.endTime && /^\d{1,2}:\d{2}$/.test(event.endTime) ? event.endTime : '23:59';
    const endD = new Date(`${event.date}T${time}:00`);
    return !isNaN(endD.getTime()) && new Date() > endD;
  };

  const currentStatus = registered
    ? 'registered'
    : isFinished()
    ? 'completed'
    : isDeadlinePassed() || event?.status === 'closed'
    ? 'closed'
    : event?.status;

  const isOnline = event?.venueId?.name?.toLowerCase().includes('online') || event?.venueId?.name?.toLowerCase().includes('virtual');

  return (
    <div className={`event-card ${registered ? 'event-card-registered' : ''}`}>
      <div className="event-card-banner-wrap">
        <img
          src={imageSrc}
          alt={event?.title || 'Campus Event'}
          className="event-card-banner"
          onError={(e) => {
            const fallback = getEventImage(event);
            if (e.target.src !== fallback) {
              e.target.src = fallback;
            }
          }}
        />
        <div className="event-card-badge-top">
          <StatusBadge status={currentStatus} />
        </div>
        <div className="event-card-mode-badge">
          {isOnline ? 'Online' : 'On-Campus'}
        </div>
      </div>

      <div className="event-card-body">
        <div className="event-host-row">
          <span className="event-host-verified">
            <CheckCircle size={12} style={{ color: 'var(--primary)' }} />
            {event.organizerId?.department || 'Verified Campus Host'}
          </span>
          <span>•</span>
          <span className="event-card-category">{event.category}</span>
        </div>

        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-meta">
          <div className="meta-item">
            <Calendar size={15} />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="meta-item">
            <Clock size={15} />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          <div className="meta-item">
            <MapPin size={15} />
            <span>{event.venueId?.name || 'Central Campus Auditorium'}</span>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <CapacityBar current={event.currentRegistrations || 0} max={event.maxParticipants || 100} />
        </div>

        <div className="event-card-footer-row">
          {registered ? (
            <span className="badge badge-registered">
              <CheckCircle size={13} /> Registered
            </span>
          ) : (
            <span className="perks-badge">
              <Award size={13} /> Free & Certified
            </span>
          )}

          <Link to={`/events/${event._id}`} className={`btn ${registered ? 'btn-registered' : 'btn-primary'} btn-sm`}>
            {registered ? 'View Pass' : 'View Details'} <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;

