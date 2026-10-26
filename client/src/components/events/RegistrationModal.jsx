import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registrationService } from '../../services/registrationService';
import teamService from '../../services/teamService';
import { X, CheckCircle, Users, User, KeyRound, Copy, Check } from 'lucide-react';
import QRCodeCard from '../qr/QRCodeCard';
import useEscapeKey from '../../hooks/useEscapeKey';

const RegistrationModal = ({ event, onClose, onSuccess }) => {
  const { user, updateProfile } = useAuth();
  useEscapeKey(onClose);

  const allowsTeam = event?.registrationType !== 'individual_only';
  const allowsSolo = event?.registrationType !== 'team_only';

  const [regMode, setRegMode] = useState(allowsSolo ? 'individual' : 'create_team');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdTeamData, setCreatedTeamData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'Computer Science & Engineering',
    year: user?.year || '3rd Year',
    phone: user?.phone || '',
    collegeId: user?.collegeId || '',
  });

  const [customResponses, setCustomResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedRegistration, setConfirmedRegistration] = useState(null);

  const handleCustomChange = (label, val) => {
    setCustomResponses((prev) => ({ ...prev, [label]: val }));
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check deadline
      if (event?.registrationDeadline) {
        const str = String(event.registrationDeadline).trim();
        const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T23:59:59.999`) : new Date(str);
        if (!isNaN(d.getTime()) && new Date() > d) {
          setError('Registration deadline has passed for this event. Registration is now closed.');
          setLoading(false);
          return;
        }
      }

      // Check event conclusion
      if (
        event?.status === 'completed' ||
        (event?.date &&
          (() => {
            const time = event.endTime && /^\d{1,2}:\d{2}$/.test(event.endTime) ? event.endTime : '23:59';
            const endD = new Date(`${event.date}T${time}:00`);
            return !isNaN(endD.getTime()) && new Date() > endD;
          })())
      ) {
        setError('This event has already concluded. Registration is permanently closed.');
        setLoading(false);
        return;
      }

      // Update student profile with latest phone / collegeId if modified
      if (
        (formData.phone && formData.phone !== user?.phone) ||
        (formData.collegeId && formData.collegeId !== user?.collegeId) ||
        (formData.department && formData.department !== user?.department)
      ) {
        try {
          await updateProfile({
            phone: formData.phone,
            collegeId: formData.collegeId,
            department: formData.department,
            year: formData.year,
          });
        } catch (profileErr) {
          console.warn('Profile sync optional warning:', profileErr);
        }
      }

      if (regMode === 'create_team') {
        if (!teamName || teamName.trim().length < 3) {
          setError('Please provide a team name with at least 3 characters.');
          setLoading(false);
          return;
        }
        const res = await teamService.createTeam(event._id, teamName.trim());
        if (res.success) {
          setCreatedTeamData(res.data);
          const regInfo = {
            registrationId: `REG-${event._id.toString().slice(-4).toUpperCase()}-${res.data.team._id.toString().slice(-4).toUpperCase()}`,
            ticketQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${res.data.inviteCode}`,
          };
          setConfirmedRegistration(regInfo);
          if (onSuccess) onSuccess(regInfo);
        }
      } else if (regMode === 'join_team') {
        if (!inviteCode || inviteCode.trim().length === 0) {
          setError('Please enter a valid team invite code.');
          setLoading(false);
          return;
        }
        const res = await teamService.joinTeam(inviteCode.trim().toUpperCase());
        if (res.success) {
          const regInfo = {
            registrationId: `REG-${event._id.toString().slice(-4).toUpperCase()}-JOIN`,
            ticketQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${inviteCode}`,
          };
          setConfirmedRegistration(regInfo);
          if (onSuccess) onSuccess(regInfo);
        }
      } else {
        // Individual Registration
        const registration = await registrationService.registerForEvent(event._id, customResponses);
        setConfirmedRegistration(registration);
        if (onSuccess) onSuccess(registration);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check eligibility or team capacity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3
              style={{
                fontSize: '1.2rem',
                color: confirmedRegistration ? '#14532d' : 'var(--primary)',
                fontWeight: '800',
              }}
            >
              {confirmedRegistration ? "✓ You're Registered!" : `Register for ${event.title}`}
            </h3>
            <p className="form-help">
              {event.venueId?.name || (event.format === 'online' ? '🌐 Online Event' : 'Campus Venue')} • {event.date}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div
              className="form-error"
              style={{ marginBottom: '16px', padding: '10px', background: '#fee2e2', borderRadius: '6px' }}
            >
              {error}
            </div>
          )}

          {confirmedRegistration ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ color: '#14532d', marginBottom: '12px' }}>
                <CheckCircle size={48} style={{ margin: '0 auto', color: '#14532d' }} />
              </div>
              <h4 style={{ fontSize: '1.3rem', marginBottom: '4px', color: '#14532d', fontWeight: '800' }}>
                Registration Confirmed!
              </h4>

              {createdTeamData && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '16px',
                    margin: '16px auto',
                    maxWidth: '400px',
                  }}
                >
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                    YOUR TEAM INVITE CODE
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: '#15803d',
                        letterSpacing: '2px',
                      }}
                    >
                      {createdTeamData.inviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(createdTeamData.inviteCode)}
                      style={{
                        background: '#fff',
                        border: '1px solid #86efac',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: copied ? '#15803d' : '#374151',
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#166534' }}>
                    Share this code with up to {event.maxTeamSize - 1} teammates to complete your roster.
                  </p>
                </div>
              )}

              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Pass ID:{' '}
                <strong style={{ color: '#14532d', fontFamily: 'monospace' }}>
                  {confirmedRegistration.registrationId}
                </strong>
              </p>

              <QRCodeCard registration={confirmedRegistration} event={event} />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Format selection tabs (Unstop style) */}
              {allowsTeam && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    backgroundColor: '#f1f5f9',
                    padding: '4px',
                    borderRadius: '8px',
                  }}
                >
                  {allowsSolo && (
                    <button
                      type="button"
                      onClick={() => setRegMode('individual')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        backgroundColor: regMode === 'individual' ? '#fff' : 'transparent',
                        color: regMode === 'individual' ? 'var(--primary)' : '#64748b',
                        boxShadow: regMode === 'individual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <User size={16} /> Solo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRegMode('create_team')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: regMode === 'create_team' ? '#fff' : 'transparent',
                      color: regMode === 'create_team' ? 'var(--primary)' : '#64748b',
                      boxShadow: regMode === 'create_team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <Users size={16} /> Create Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegMode('join_team')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: regMode === 'join_team' ? '#fff' : 'transparent',
                      color: regMode === 'join_team' ? 'var(--primary)' : '#64748b',
                      boxShadow: regMode === 'join_team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <KeyRound size={16} /> Join Team
                  </button>
                </div>
              )}

              {/* Team Mode Inputs */}
              {regMode === 'create_team' && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Team Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Code Crusaders, Matrix Ninjas"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                  <span className="form-help">
                    Team limit: {event.minTeamSize || 1} to {event.maxTeamSize || 4} members. An invite code will be
                    generated for you.
                  </span>
                </div>
              )}

              {regMode === 'join_team' && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Team Invite Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. EB-A8F2K"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
                  />
                  <span className="form-help">Ask your team leader for the 6-character code.</span>
                </div>
              )}

              {/* User credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">College Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">University / College</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.department}
                    placeholder="e.g. Stanford / MIT / IIT Delhi"
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year of Study</label>
                  <select
                    className="form-select"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 700 }}
                  disabled={loading}
                >
                  {loading
                    ? 'Processing...'
                    : regMode === 'create_team'
                    ? 'Create Team & Generate Pass'
                    : regMode === 'join_team'
                    ? 'Join Team via Code'
                    : 'Confirm Registration'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
