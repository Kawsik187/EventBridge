import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { useAuth } from '../../context/AuthContext';
import { volunteerService } from '../../services/volunteerService';
import StatusBadge from '../../components/common/StatusBadge';
import CapacityBar from '../../components/events/CapacityBar';
import RegistrationModal from '../../components/events/RegistrationModal';
import CertificateCard from '../../components/certificates/CertificateCard';
import RoundTimeline from '../../components/events/RoundTimeline';
import { Calendar, Clock, MapPin, UserCheck, ShieldCheck, Mail, Phone, ArrowLeft, CheckCircle, X, CalendarPlus, Award } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../../utils/calendarUtils';
import useEscapeKey from '../../hooks/useEscapeKey';
import { getEventImage } from '../../utils/bannerPresets';

const EventDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isEaswariStudent } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [preferredRole, setPreferredRole] = useState('Registration Desk');
  const [volunteerTask, setVolunteerTask] = useState('');
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [volunteerMessage, setVolunteerMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');

  // Close open modals when Escape key is pressed
  useEscapeKey(() => {
    if (showCertModal) setShowCertModal(false);
    if (showVolunteerModal) {
      setShowVolunteerModal(false);
      setVolunteerMessage({ type: '', text: '' });
    }
  }, showCertModal || showVolunteerModal);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEventById(id);
      setEvent(data);

      if (isAuthenticated) {
        // Check if current student is registered
        const myRegs = await registrationService.getMyRegistrations();
        const found = myRegs.find((r) => r.eventId?._id === id || r.eventId === id);
        if (found) {
          setUserRegistration(found);
        }
      }
    } catch (err) {
      setError('Event not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content"><div className="empty-state"><div className="loading-spinner" /></div></div>;
  if (error || !event) return <div className="main-content"><div className="empty-state"><h3>{error || 'Event not found'}</h3><Link to="/" className="btn btn-secondary">Back to Discover</Link></div></div>;

  const eventImageSrc = getEventImage(event);

  const isFinished = event?.status === 'completed' || (event?.date && (() => {
    const time = event.endTime && /^\d{1,2}:\d{2}$/.test(event.endTime) ? event.endTime : '23:59';
    const endD = new Date(`${event.date}T${time}:00`);
    return !isNaN(endD.getTime()) && new Date() > endD;
  })());

  const isDeadlinePassed = !isFinished && event?.registrationDeadline && (() => {
    const str = String(event.registrationDeadline).trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T23:59:59.999`) : new Date(str);
    return !isNaN(d.getTime()) && new Date() > d;
  })();

  const effectiveStatus = userRegistration
    ? 'registered'
    : isFinished
    ? 'completed'
    : isDeadlinePassed || event?.status === 'closed'
    ? 'closed'
    : event?.status;

  return (
    <div className="main-content">
      <div className="content-wrap">
        <Link to="/" className="btn btn-secondary btn-sm" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Events
        </Link>

        {/* Hero Banner */}
        <div className="event-details-hero">
          <img
            src={eventImageSrc}
            alt={event.title}
            className="event-details-banner-img"
            onError={(e) => {
              const fallback = getEventImage(event);
              if (e.target.src !== fallback) {
                e.target.src = fallback;
              }
            }}
          />
        </div>

        <div className="event-details-layout">
          {/* Main Content Info Column */}
          <div>
            <div className="event-main-info">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                <span className="event-card-category">{event.category}</span>
                <StatusBadge status={effectiveStatus} />
              </div>

              <h1 style={{ fontSize: '2.1rem', marginBottom: '12px', lineHeight: '1.2' }}>{event.title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
                Organized by <strong>{event.organizerName || 'Campus Event Club'}</strong> ({event.organizerId?.department || 'College Department'})
              </p>

              {/* Unstop-style Verified Certificate Showcase */}
              {userRegistration?.certificate && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '18px 22px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🎓 Official Verified Credential Available
                    </span>
                    <h3 style={{ margin: '4px 0', fontSize: '1.25rem', color: '#166534', fontWeight: '800' }}>
                      Certificate of {userRegistration.certificate.certificateType}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#14532d' }}>
                      Issued to <strong>{user?.name}</strong> • Certificate ID: <code style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{userRegistration.certificate.certificateId}</code>
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCertModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#16a34a', borderColor: '#16a34a', fontWeight: '700' }}
                  >
                    <Award size={18} /> View & Download Certificate
                  </button>
                </div>
              )}

              {/* Multi-Stage Hackathon Rounds Timeline */}
              <RoundTimeline
                event={event}
                userRegistration={userRegistration}
                onSubmissionSuccess={fetchEventDetails}
              />

              {/* Description */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>About This Event</h3>
                <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {event.description}
                </p>
              </div>

              {/* Eligibility */}
              <div style={{ marginBottom: '32px', background: 'var(--bg-subtle)', padding: '18px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px' }}>Eligibility & Prerequisites</h4>
                <p style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>{event.eligibility}</p>
              </div>

              {/* Rules & Guidelines */}
              {event.rules && event.rules.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Event Rules & Guidelines</h3>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {event.rules.map((rule, idx) => (
                      <li key={idx} style={{ color: 'var(--text-main)', fontSize: '14.5px' }}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Schedule Timeline */}
              {event.schedule && event.schedule.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Event Schedule</h3>
                  <div className="schedule-timeline">
                    {event.schedule.map((item, sIdx) => (
                      <div key={sIdx} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-time">{item.time}</div>
                        <div className="timeline-title">{item.title}</div>
                        {item.description && <div className="timeline-desc">{item.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Organizer Contact</h3>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px', color: 'var(--text-muted)' }}>
                  {event.contactInfo?.name && <span>Contact: <strong>{event.contactInfo.name}</strong></span>}
                  {event.contactInfo?.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {event.contactInfo.phone}</span>}
                  {event.contactInfo?.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {event.contactInfo.email}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Action Card */}
          <div>
            <div className="event-sidebar-card">
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Registration Status
                </span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={userRegistration ? 'registered' : event.status} />
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <CapacityBar current={event.currentRegistrations || 0} max={event.maxParticipants || 100} />

              <div className="event-meta-grid">
                <div className="meta-block">
                  <Calendar size={18} className="meta-icon" />
                  <div>
                    <div className="meta-label">Date</div>
                    <div className="meta-value">{event.date}</div>
                  </div>
                </div>

                <div className="meta-block">
                  <Clock size={18} className="meta-icon" />
                  <div>
                    <div className="meta-label">Time</div>
                    <div className="meta-value">{event.startTime} – {event.endTime}</div>
                  </div>
                </div>

                <div className="meta-block">
                  <MapPin size={18} className="meta-icon" />
                  <div>
                    <div className="meta-label">Venue</div>
                    <div className="meta-value">{event.venueId?.name || 'Campus Hall'} ({event.venueId?.location})</div>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              {userRegistration ? (
                <div>
                  {isFinished ? (
                    <div>
                      <div style={{ background: '#ecfdf5', border: '1.5px solid #059669', padding: '14px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                        <span style={{ color: '#065f46', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '15px' }}>
                          <CheckCircle size={18} style={{ color: '#059669' }} /> Event Concluded • Participated
                        </span>
                        <span style={{ fontSize: '12px', color: '#047857', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                          Ticket ID: {userRegistration.registrationId}
                        </span>
                      </div>

                      {userRegistration.certificate ? (
                        <div style={{ background: '#fefce8', border: '1.5px solid #eab308', borderRadius: '10px', padding: '14px', marginBottom: '12px', textAlign: 'center' }}>
                          <Award size={26} style={{ color: '#ca8a04', margin: '0 auto 6px', display: 'block' }} />
                          <strong style={{ fontSize: '13.5px', color: '#854d0e', display: 'block' }}>
                            Certificate Available!
                          </strong>
                          <span style={{ fontSize: '12px', color: '#a16207', display: 'block', marginTop: '2px' }}>
                            ID: {userRegistration.certificate.certificateId}
                          </span>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowCertModal(true)}
                            style={{ width: '100%', marginTop: '10px', gap: '6px', background: '#ca8a04', borderColor: '#ca8a04', fontWeight: '700' }}
                          >
                            <Award size={15} /> View & Download Certificate
                          </button>
                        </div>
                      ) : (
                        <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', marginBottom: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                          🎓 <strong>Certificate Status:</strong> The organizer will issue participation certificates after attendee check-in audits.
                        </div>
                      )}

                      <Link to="/my-events" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                        View in My Events History
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div style={{ background: '#dcfce7', border: '1.5px solid #166534', padding: '14px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                        <span style={{ color: '#14532d', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '15px' }}>
                          <CheckCircle size={18} style={{ color: '#14532d' }} /> Registered
                        </span>
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600', marginTop: '4px', display: 'block' }}>Ticket ID: {userRegistration.registrationId}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link to="/my-events" className="btn btn-registered" style={{ width: '100%', justifyContent: 'center' }}>
                          View My QR Pass
                        </Link>
                        <a
                          href={generateGoogleCalendarUrl(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <CalendarPlus size={15} style={{ color: 'var(--primary)' }} /> Add to Google Calendar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {isFinished ? (
                    <div>
                      <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        This campus event concluded on <strong>{event.date}</strong>. Registration is closed.
                      </div>
                      <button className="btn btn-secondary btn-lg" style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }} disabled>
                        Event Concluded
                      </button>
                    </div>
                  ) : isDeadlinePassed || event.status === 'closed' ? (
                    <div>
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', color: '#991b1b', fontSize: '13px' }}>
                        The registration deadline for this event was <strong>{event.registrationDeadline}</strong>. Registrations are now closed.
                      </div>
                      <button className="btn btn-secondary btn-lg" style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }} disabled>
                        Registration Closed
                      </button>
                    </div>
                  ) : event.currentRegistrations >= event.maxParticipants ? (
                    <button className="btn btn-secondary btn-lg" style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }} disabled>
                      Event Full
                    </button>
                  ) : isAuthenticated ? (
                    <button
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={!['open', 'approved'].includes(event.status)}
                      onClick={() => setShowRegModal(true)}
                    >
                      Register Now
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                      Log in to Register
                    </Link>
                  )}
                </div>
              )}

              {/* Volunteer Application Option (Strictly restricted to Easwari Engineering College students) */}
              {isAuthenticated && isEaswariStudent && !isFinished && !isDeadlinePassed && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Interested in organizing & assisting at this event?
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => setShowVolunteerModal(true)}
                  >
                    <UserCheck size={15} /> Apply as Student Volunteer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <RegistrationModal
          event={event}
          onClose={() => setShowRegModal(false)}
          onSuccess={() => {
            setShowRegModal(false);
            fetchEventDetails();
          }}
        />
      )}

      {/* Volunteer Application Modal */}
      {showVolunteerModal && isEaswariStudent && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVolunteerModal(false);
              setVolunteerMessage({ type: '', text: '' });
            }
          }}
        >
          <div className="modal-card" style={{ maxWidth: '520px', background: '#ffffff', color: '#0f172a' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '1.2rem' }}>
                  <UserCheck size={22} style={{ color: 'var(--primary)' }} /> Apply as Event Volunteer
                </h3>
                <span style={{ fontSize: '11px', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', marginTop: '4px', display: 'inline-block' }}>
                  Easwari Engineering College Students Only
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowVolunteerModal(false); setVolunteerMessage({ type: '', text: '' }); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                title="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!isEaswariStudent) {
                setVolunteerMessage({ type: 'error', text: 'Volunteer applications are strictly restricted to students of Easwari Engineering College.' });
                return;
              }
              setVolunteerSubmitting(true);
              setVolunteerMessage({ type: '', text: '' });
              try {
                await volunteerService.applyForVolunteer(event._id, preferredRole, volunteerTask);
                setVolunteerMessage({ type: 'success', text: 'Volunteer application submitted successfully! The organizer will review your application.' });
                setTimeout(() => {
                  setShowVolunteerModal(false);
                  setVolunteerMessage({ type: '', text: '' });
                }, 2000);
              } catch (err) {
                setVolunteerMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit volunteer application' });
              } finally {
                setVolunteerSubmitting(false);
              }
            }}>
              <div className="modal-body" style={{ background: '#ffffff', color: '#0f172a' }}>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '18px', lineHeight: '1.5' }}>
                  Volunteers help manage attendee check-ins, technical support, stage setup, hospitality, and crowd control for <strong style={{ color: '#0f172a' }}>{event.title}</strong>.
                </p>

                {volunteerMessage.text && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '18px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: volunteerMessage.type === 'error' ? '#fef2f2' : '#dcfce7',
                    color: volunteerMessage.type === 'error' ? '#dc2626' : '#14532d',
                    border: `1px solid ${volunteerMessage.type === 'error' ? '#fecaca' : '#166534'}`,
                  }}>
                    {volunteerMessage.text}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                    Preferred Volunteer Role
                  </label>
                  <select
                    className="form-select"
                    value={preferredRole}
                    onChange={(e) => setPreferredRole(e.target.value)}
                    style={{ background: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', height: '42px', fontSize: '14px' }}
                  >
                    <option value="Registration Desk">Registration & QR Desk</option>
                    <option value="Technical Support">Technical & AV Support</option>
                    <option value="Stage Management">Stage & Speaker Management</option>
                    <option value="Hospitality">Hospitality & Refreshments</option>
                    <option value="Crowd Management">Crowd Management & Security</option>
                    <option value="Photography">Photography & Media</option>
                    <option value="Logistics">Venue Logistics & Setup</option>
                    <option value="Certificate Distribution">Certificate Distribution Desk</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                    Motivation / Relevant Skills (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Describe any prior event organization experience or skills..."
                    value={volunteerTask}
                    onChange={(e) => setVolunteerTask(e.target.value)}
                    style={{ background: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', fontSize: '14px', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowVolunteerModal(false)}
                  disabled={volunteerSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={volunteerSubmitting}
                >
                  {volunteerSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verified Certificate Modal (Unstop style) */}
      {showCertModal && userRegistration?.certificate && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <Award size={20} /> Verified Event Certificate
              </h3>
              <button onClick={() => setShowCertModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <CertificateCard certificate={userRegistration.certificate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
