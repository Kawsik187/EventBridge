import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import { volunteerService } from '../../services/volunteerService';
import QRCodeCard from '../../components/qr/QRCodeCard';
import CertificateCard from '../../components/certificates/CertificateCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Calendar, QrCode, MapPin, Clock, Trash2, UserCheck, ShieldCheck, CalendarPlus, Award, Download, ExternalLink } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../../utils/calendarUtils';
import useEscapeKey from '../../hooks/useEscapeKey';

const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [volunteerApps, setVolunteerApps] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [selectedTicketReg, setSelectedTicketReg] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Close modals on Escape key
  useEscapeKey(() => {
    if (selectedTicketReg) setSelectedTicketReg(null);
    if (selectedCertificate) setSelectedCertificate(null);
  }, !!(selectedTicketReg || selectedCertificate));

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [regs, vols] = await Promise.all([
        registrationService.getMyRegistrations(),
        volunteerService.getMyVolunteerApplications().catch(() => []),
      ]);
      setRegistrations(regs);
      setVolunteerApps(vols);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    try {
      await registrationService.cancelRegistration(eventId);
      fetchMyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling registration');
    }
  };

  const isEventPast = (evt) => {
    if (!evt) return false;
    if (evt.status === 'completed') return true;
    if (!evt.date) return false;
    const time = evt.endTime && /^\d{1,2}:\d{2}$/.test(evt.endTime) ? evt.endTime : '23:59';
    const endD = new Date(`${evt.date}T${time}:00`);
    return !isNaN(endD.getTime()) && new Date() > endD;
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (activeTab === 'cancelled') return reg.status === 'cancelled';
    if (reg.status === 'cancelled') return false;
    const isCompleted = isEventPast(reg.eventId);
    if (activeTab === 'past') return isCompleted;
    return !isCompleted;
  });

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div style={{ marginBottom: '24px' }}>
          <h1>My Registered Events & QR Tickets</h1>
          <p style={{ color: 'var(--text-muted)' }}>Access your event passes and entry QR codes.</p>
        </div>

        {/* Tabs */}
        <div className="category-pills-row" style={{ marginBottom: '24px' }}>
          <button
            className={`category-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events ({registrations.filter((r) => r.status !== 'cancelled' && !isEventPast(r.eventId)).length})
          </button>
          <button
            className={`category-pill ${activeTab === 'volunteering' ? 'active' : ''}`}
            onClick={() => setActiveTab('volunteering')}
          >
            <UserCheck size={14} style={{ display: 'inline', marginRight: '4px' }} /> Volunteer Duties ({volunteerApps.length})
          </button>
          <button
            className={`category-pill ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Events & Certificates ({registrations.filter((r) => r.status !== 'cancelled' && isEventPast(r.eventId)).length})
          </button>
          <button
            className={`category-pill ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({registrations.filter((r) => r.status === 'cancelled').length})
          </button>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : activeTab === 'volunteering' ? (
          volunteerApps.length === 0 ? (
            <div className="empty-state">
              <h3>No volunteer duties applied yet</h3>
              <p>Explore events and click "Apply as Student Volunteer" to join event organizing teams.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {volunteerApps.map((vApp) => (
                <div
                  key={vApp._id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-open">{vApp.roleName}</span>
                      <span className={`badge ${vApp.status === 'accepted' || vApp.status === 'assigned' ? 'badge-approved' : vApp.status === 'applied' ? 'badge-pending' : 'badge-rejected'}`}>
                        {vApp.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>
                      {vApp.eventId?.title || 'Campus Event'}
                    </h3>

                    <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--primary)' }}>Assigned Duty Task:</strong>
                      <span>{vApp.task || 'General event coordination & assistance'}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <div className="meta-item"><Calendar size={14} /> <span>Date: {vApp.eventId?.date || 'TBA'}</span></div>
                      <div className="meta-item"><MapPin size={14} /> <span>Venue: {vApp.eventId?.venueId?.name || 'Campus Venue'}</span></div>
                    </div>

                    {(vApp.status === 'assigned' || vApp.status === 'accepted') && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
                        <CheckCircle size={15} /> Confirmed Volunteer Duty
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <h3>No registrations found</h3>
            <p>You haven't registered for any events in this section yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filteredRegistrations.map((reg) => (
              <div
                key={reg._id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {reg.eventId?.category || 'Technical'}
                    </span>
                    <StatusBadge status={reg.status} />
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '10px' }}>
                    {reg.eventId?.title || 'Campus Event'}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <div className="meta-item"><Calendar size={14} /> <span>{reg.eventId?.date}</span></div>
                    <div className="meta-item"><Clock size={14} /> <span>{reg.eventId?.startTime} - {reg.eventId?.endTime}</span></div>
                    <div className="meta-item"><MapPin size={14} /> <span>{reg.eventId?.venueId?.name || 'Main Hall'}</span></div>
                  </div>
                </div>

                  {/* Conditional Action Footer: Past Events vs Upcoming Events */}
                  {activeTab === 'past' ? (
                    <div>
                      {reg.certificate ? (
                        <div style={{ background: '#fefce8', border: '1.5px solid #eab308', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854d0e', fontWeight: '800', fontSize: '13px' }}>
                            <Award size={16} style={{ color: '#ca8a04' }} /> Certificate of {reg.certificate.certificateType}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a16207', marginTop: '3px' }}>
                            ID: <code style={{ background: '#fef08a', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>{reg.certificate.certificateId}</code>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {reg.status === 'checked_in' ? (
                            <span>✓ <strong>Attended:</strong> Certificate is being finalized by organizer.</span>
                          ) : (
                            <span>Event completed on {reg.eventId?.date}.</span>
                          )}
                        </div>
                      )}

                      <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                        {reg.certificate ? (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, gap: '6px', background: '#ca8a04', borderColor: '#ca8a04', fontWeight: '700' }}
                            onClick={() => setSelectedCertificate(reg.certificate)}
                          >
                            <Award size={15} /> View Certificate
                          </button>
                        ) : null}

                        {reg.eventId?._id && (
                          <Link
                            to={`/events/${reg.eventId._id}`}
                            className={`btn btn-secondary btn-sm ${!reg.certificate ? 'style-full' : ''}`}
                            style={{ flex: !reg.certificate ? 1 : 'none', justifyContent: 'center', gap: '6px' }}
                          >
                            <ExternalLink size={14} /> {!reg.certificate ? 'View Event Summary' : 'Details'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-registered btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setSelectedTicketReg(reg)}
                      >
                        <QrCode size={15} /> Show QR Ticket
                      </button>

                      {reg.status !== 'cancelled' && reg.eventId && (
                        <a
                          href={generateGoogleCalendarUrl(reg.eventId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Add to Google Calendar"
                          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                        >
                          <CalendarPlus size={15} style={{ color: 'var(--primary)' }} />
                        </a>
                      )}

                      {reg.status !== 'cancelled' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCancel(reg.eventId?._id)}
                          title="Cancel Registration"
                        >
                          <Trash2 size={15} style={{ color: 'var(--danger)' }} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        {/* QR Ticket Modal */}
        {selectedTicketReg && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTicketReg(null); }}>
            <div className="modal-card" style={{ maxWidth: '420px' }}>
              <div className="modal-header">
                <h3>QR Entry Ticket</h3>
                <button onClick={() => setSelectedTicketReg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <QRCodeCard registration={selectedTicketReg} event={selectedTicketReg.eventId} />
              </div>
            </div>
          </div>
        )}

        {/* Certificate Modal (Unstop style) */}
        {selectedCertificate && (
          <div
            className="modal-overlay"
            style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedCertificate(null); }}
          >
            <div className="modal-card" style={{ maxWidth: '640px', width: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <Award size={20} /> Verified Event Certificate
                </h3>
                <button onClick={() => setSelectedCertificate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                  ✕
                </button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <CertificateCard certificate={selectedCertificate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
