import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

const volunteerRoles = [
  'Registration Desk',
  'Technical Support',
  'Stage Management',
  'Hospitality',
  'Crowd Management',
  'Photography',
  'Logistics',
  'Certificate Distribution',
  'Venue Support',
  'Certificate Desk',
];

const Volunteers = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [roleName, setRoleName] = useState('Registration Desk');
  const [taskDetails, setTaskDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadVolunteers(selectedEventId);
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

  const loadVolunteers = async (eventId) => {
    setLoading(true);
    try {
      const res = await api.get(`/volunteers/events/${eventId}/volunteers`);
      setVolunteers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/volunteers/events/${selectedEventId}/volunteers`, {
        eventId: selectedEventId,
        userEmail,
        roleName,
        task: taskDetails || 'General event coordination',
      });
      setUserEmail('');
      setTaskDetails('');
      loadVolunteers(selectedEventId);
    } catch (err) {
      setError(err.response?.data?.message || 'Error assigning volunteer');
    }
  };

  const handleUpdateStatus = async (id, status, newRole, newTask) => {
    try {
      await api.put(`/volunteers/volunteers/${id}`, {
        status,
        roleName: newRole,
        task: newTask,
      });
      loadVolunteers(selectedEventId);
    } catch (err) {
      alert('Error updating volunteer status');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this volunteer assignment?')) return;
    try {
      await api.delete(`/volunteers/volunteers/${id}`);
      loadVolunteers(selectedEventId);
    } catch (err) {
      alert('Error removing volunteer');
    }
  };

  const applications = volunteers.filter((v) => v.status === 'applied');
  const activeVolunteers = volunteers.filter((v) => v.status !== 'applied');

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Volunteer Management</h1>
            <p style={{ color: 'var(--text-muted)' }}>Review applications, assign roles & tasks, and manage event volunteers.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Select Event:</span>
            <select
              className="form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ width: '280px' }}
            >
              {events.map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assign Volunteer Form */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: 'var(--primary)' }} /> Directly Assign Volunteer by Student Email
            </h3>
            <span style={{ fontSize: '12px', color: '#1e40af', background: '#dbeafe', padding: '3px 10px', borderRadius: '12px', fontWeight: '700' }}>
              🏛️ Easwari Engineering College Only
            </span>
          </div>
          {error && <div className="form-error" style={{ marginBottom: '12px' }}>{error}</div>}

          <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 140px', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Student Email (@srmeaswari.ac.in)</label>
              <input
                type="email"
                className="form-input"
                placeholder="student@srmeaswari.ac.in"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              >
                {volunteerRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Task Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Stage management & microphone checks"
                value={taskDetails}
                onChange={(e) => setTaskDetails(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
              <Plus size={16} /> Assign
            </button>
          </form>
        </div>

        {/* Student Volunteer Applications Section */}
        {applications.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-dark, #b45309)' }}>
              <Clock size={20} /> Pending Volunteer Applications ({applications.length})
            </h3>
            <div className="table-container" style={{ marginTop: '12px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Requested Role</th>
                    <th>Notes / Skills</th>
                    <th>Applied Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <strong>{app.userId?.name || 'Student'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.userId?.email} • {app.userId?.department}</div>
                      </td>
                      <td><span className="badge badge-pending">{app.roleName}</span></td>
                      <td>{app.task || 'General assistance'}</td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateStatus(app._id, 'accepted', app.roleName, app.task)}
                          >
                            <CheckCircle size={14} /> Accept
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateStatus(app._id, 'rejected', app.roleName, app.task)}
                          >
                            <XCircle size={14} style={{ color: 'var(--danger)' }} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assigned Volunteers Roster */}
        <h3>Assigned Volunteer Roster</h3>
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : activeVolunteers.length === 0 ? (
          <div className="empty-state"><p>No active volunteers assigned for this event yet.</p></div>
        ) : (
          <div className="table-container" style={{ marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer Name</th>
                  <th>Department & Contact</th>
                  <th>Role</th>
                  <th>Task Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeVolunteers.map((vol) => (
                  <tr key={vol._id}>
                    <td>
                      <strong>{vol.userId?.name || 'Student'}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{vol.userId?.email}</div>
                    </td>
                    <td>{vol.userId?.department} ({vol.userId?.phone || 'No phone'})</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={vol.roleName}
                        onChange={(e) => handleUpdateStatus(vol._id, vol.status, e.target.value, vol.task)}
                        style={{ fontSize: '13px', padding: '4px 8px' }}
                      >
                        {volunteerRoles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        defaultValue={vol.task || ''}
                        onBlur={(e) => {
                          if (e.target.value !== vol.task) {
                            handleUpdateStatus(vol._id, vol.status, vol.roleName, e.target.value);
                          }
                        }}
                        style={{ fontSize: '13px', padding: '4px 8px' }}
                      />
                    </td>
                    <td>
                      <span className={`badge ${vol.status === 'accepted' || vol.status === 'assigned' ? 'badge-open' : vol.status === 'completed' ? 'badge-approved' : 'badge-rejected'}`}>
                        {vol.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRemove(vol._id)}>
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Volunteers;
