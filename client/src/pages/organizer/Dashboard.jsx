import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Calendar,
  Users,
  QrCode,
  PlusCircle,
  CheckCircle,
  Clock,
  Building2,
  Award,
  Layers,
  FileText,
  User,
  Activity,
} from 'lucide-react';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizerEvents();
  }, [user]);

  const fetchOrganizerEvents = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await eventService.getAllEvents({ organizerId: user._id, status: '' });
      setEvents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.currentRegistrations || 0), 0);
  const activeEvents = events.filter((e) => ['open', 'approved', 'live'].includes(e.status)).length;
  const upcomingEvents = events.filter((e) => ['open', 'approved'].includes(e.status)).length;
  const completedEvents = events.filter((e) => e.status === 'completed').length;
  const pendingApprovals = events.filter((e) => e.status === 'pending').length;

  const departmentName = user?.departmentDetails?.name || user?.department || 'Official College Department';
  const departmentCode = user?.departmentDetails?.code || user?.departmentCode || 'DEPT';

  return (
    <div className="dashboard-layout">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="sidebar-title">ORGANIZER DESK</div>
        <Link to="/organizer/dashboard" className="sidebar-item active">
          <Layers size={18} /> Dashboard
        </Link>
        <Link to="/events" className="sidebar-item">
          <Calendar size={18} /> Events
        </Link>
        <Link to="/organizer/create-event" className="sidebar-item">
          <PlusCircle size={18} /> Create Event
        </Link>
        <Link to="/organizer/participants" className="sidebar-item">
          <FileText size={18} /> Registrations
        </Link>
        <Link to="/organizer/volunteers" className="sidebar-item">
          <Users size={18} /> Participants & Staff
        </Link>
        <Link to="/organizer/attendance" className="sidebar-item">
          <QrCode size={18} /> Attendance Desk
        </Link>
        <Link to="/organizer/certificates" className="sidebar-item">
          <Award size={18} /> Certificate Issuer
        </Link>
        <Link to="/organizer/evaluations" className="sidebar-item">
          <Activity size={18} /> Round Evaluator
        </Link>
        <Link to="/organizer/analytics" className="sidebar-item">
          <Layers size={18} /> Analytics & Reports
        </Link>
        <Link to="/organizer/announcements" className="sidebar-item">
          <Clock size={18} /> Announcements
        </Link>
        <Link to="/profile" className="sidebar-item">
          <User size={18} /> Profile
        </Link>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1c4980', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '800', marginBottom: '8px' }}>
              <Building2 size={16} /> Welcome, {departmentCode} Organizer
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
              {departmentName}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Primary Department Organizer Desk: <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>

          <Link to="/organizer/create-event" className="btn btn-primary" style={{ fontWeight: '700' }}>
            <PlusCircle size={16} /> Create Department Event
          </Link>
        </div>

        {/* 5 Required Statistics */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
          {/* 1. Total Events */}
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Events</div>
              <div className="stat-val" style={{ color: '#0f172a' }}>{events.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Department catalog</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: '#1c4980' }}>
              <Calendar size={22} />
            </div>
          </div>

          {/* 2. Upcoming Events */}
          <div className="stat-card">
            <div>
              <div className="stat-label">Upcoming Events</div>
              <div className="stat-val" style={{ color: '#0284c7' }}>{upcomingEvents}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Open for registration</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: '#0284c7' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* 3. Total Registrations */}
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Registrations</div>
              <div className="stat-val" style={{ color: '#059669' }}>{totalRegistrations}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Enrolled students</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: '#059669' }}>
              <Users size={22} />
            </div>
          </div>

          {/* 4. Active Events */}
          <div className="stat-card">
            <div>
              <div className="stat-label">Active Events</div>
              <div className="stat-val" style={{ color: '#7c3aed' }}>{activeEvents}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Live on portal</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: '#7c3aed' }}>
              <Activity size={22} />
            </div>
          </div>

          {/* 5. Completed Events */}
          <div className="stat-card">
            <div>
              <div className="stat-label">Completed Events</div>
              <div className="stat-val" style={{ color: '#64748b' }}>{completedEvents}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Concluded editions</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: '#64748b' }}>
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Department Policy Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#1c4980" />
            <div style={{ fontSize: '13.5px', color: '#334155' }}>
              <strong>Departmental Boundary:</strong> All events created through this desk are locked strictly to <strong>{departmentName}</strong>.
            </div>
          </div>
          <span style={{ fontSize: '12px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', color: '#1c4980' }}>
            BRANCH CODE: {departmentCode}
          </span>
        </div>

        {/* Events Roster */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Department Events Roster
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {events.length} events</span>
          </div>

          {loading ? (
            <div className="empty-state"><div className="loading-spinner" /></div>
          ) : events.length === 0 ? (
            <div className="empty-state" style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '40px' }}>
              <Calendar size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h4>No events created yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '18px' }}>
                Start by creating the first event for {departmentName}.
              </p>
              <Link to="/organizer/create-event" className="btn btn-primary btn-sm">
                Create Event Now
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    <th>Event Title</th>
                    <th>Schedule</th>
                    <th>Venue</th>
                    <th>Status</th>
                    <th>Registrations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt) => (
                    <tr key={evt._id}>
                      <td>
                        <strong>{evt.title}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{evt.category}</div>
                      </td>
                      <td>
                        <div>{evt.date}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{evt.startTime} - {evt.endTime}</div>
                      </td>
                      <td>{evt.venueId?.name || 'TBD'}</td>
                      <td>
                        <StatusBadge status={evt.status} />
                      </td>
                      <td>
                        <strong>{evt.currentRegistrations || 0}</strong> / {evt.maxParticipants}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/events/${evt._id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                            View
                          </Link>
                          <Link to={`/organizer/edit-event/${evt._id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                            Edit
                          </Link>
                          <Link to={`/attendance?eventId=${evt._id}`} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                            Check-in Desk
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
