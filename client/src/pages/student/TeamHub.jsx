import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import teamService from '../../services/teamService';
import { Users, Plus, KeyRound, Copy, Check, ArrowRight, ShieldCheck, AlertCircle, Award } from 'lucide-react';

export default function TeamHub() {
  const { inviteCode: urlCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Join Modal / State
  const [inviteCodeInput, setInviteCodeInput] = useState(urlCode || '');
  const [previewTeam, setPreviewTeam] = useState(null);
  const [joining, setJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    fetchMyTeams();
    if (urlCode) {
      handlePreviewCode(urlCode);
    }
  }, [urlCode]);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const res = await teamService.getMyTeams();
      if (res.success) {
        setTeams(res.data);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCode = async (code) => {
    if (!code || code.trim().length < 4) return;
    try {
      setError('');
      const res = await teamService.getTeamDetails(code.trim().toUpperCase());
      if (res.success) {
        setPreviewTeam(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid team code');
      setPreviewTeam(null);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    try {
      setJoining(true);
      setError('');
      setSuccessMsg('');
      const res = await teamService.joinTeam(inviteCodeInput.trim().toUpperCase());
      if (res.success) {
        setSuccessMsg(res.message || 'Successfully joined team!');
        setInviteCodeInput('');
        setPreviewTeam(null);
        await fetchMyTeams();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', fontFamily: 'inherit' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        color: '#fff',
        borderRadius: '16px',
        padding: '36px 32px',
        marginBottom: '36px',
        boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Users size={32} color="#a5b4fc" />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Inter-College Team Hub</h1>
        </div>
        <p style={{ color: '#c7d2fe', fontSize: '1.05rem', margin: 0, maxWidth: '650px' }}>
          Form rosters, invite teammates across universities with unique access codes, and advance through hackathon rounds together.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action Grid: Join by Code & Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Join by Code Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <KeyRound size={22} color="#4f46e5" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Join a Team with Code</h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            Received an invite code (e.g. <code>EB-XXXXXX</code>) from your team leader? Enter it below:
          </p>
          <form onSubmit={handleJoinTeam}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="e.g. EB-A8F2K"
                value={inviteCodeInput}
                onChange={(e) => {
                  setInviteCodeInput(e.target.value.toUpperCase());
                  handlePreviewCode(e.target.value);
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '1px'
                }}
                required
              />
              <button
                type="submit"
                disabled={joining}
                style={{
                  backgroundColor: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: joining ? 'not-allowed' : 'pointer',
                  opacity: joining ? 0.7 : 1
                }}
              >
                {joining ? 'Joining...' : 'Join Team'}
              </button>
            </div>
          </form>

          {/* Team Preview if available */}
          {previewTeam && (
            <div style={{
              marginTop: '16px',
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Team Preview</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{previewTeam.name}</div>
              <div style={{ fontSize: '0.9rem', color: '#4f46e5', fontWeight: 500 }}>Event: {previewTeam.eventId?.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                Current members: {previewTeam.members?.length} / {previewTeam.eventId?.maxTeamSize || 4}
              </div>
            </div>
          )}
        </div>

        {/* Explore Hackathons Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Award size={22} color="#059669" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Form a New Roster</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
              Want to lead your own team? Browse open hackathons and start a team to get an instant shareable invite code.
            </p>
          </div>
          <Link
            to="/events"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: '#fff',
              textDecoration: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            <span>Explore Open Hackathons</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Active Rosters Section */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
        Your Active Teams ({teams.length})
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading your rosters...</div>
      ) : teams.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '2px dashed #cbd5e1'
        }}>
          <Users size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#334155' }}>No teams joined yet</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '8px auto 20px' }}>
            You haven't formed or joined any hackathon teams yet. Join a team with a code or register for an event.
          </p>
          <Link
            to="/events"
            style={{
              backgroundColor: '#4f46e5',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {teams.map((t) => {
            const isLeader = t.members.find((m) => m.userId?._id === user?._id || m.userId === user?._id)?.role === 'leader';
            return (
              <div
                key={t._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  position: 'relative'
                }}
              >
                {/* Event Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: '#ede9fe',
                    color: '#6d28d9',
                    padding: '4px 10px',
                    borderRadius: '20px'
                  }}>
                    {t.eventId?.category || 'Hackathon'}
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: t.isEliminated ? '#dc2626' : '#059669',
                    backgroundColor: t.isEliminated ? '#fee2e2' : '#d1fae5',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {t.isEliminated ? 'Eliminated' : `Round ${t.currentRoundNumber || 1} Active`}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>
                  {t.name}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.95rem', fontWeight: 500, margin: '0 0 16px 0' }}>
                  {t.eventId?.title}
                </p>

                {/* Invite Code Box */}
                <div style={{
                  backgroundColor: '#f1f5f9',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      Team Invite Code
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>
                      {t.inviteCode}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(t.inviteCode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: copiedCode === t.inviteCode ? '#059669' : '#334155'
                    }}
                  >
                    {copiedCode === t.inviteCode ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedCode === t.inviteCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Member Roster */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                    Team Members ({t.members.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {t.members.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.9rem',
                          padding: '6px 0',
                          borderBottom: idx !== t.members.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={m.userId?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=avatar'}
                            alt="avatar"
                            style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                          />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {m.userId?.name || 'Member'}
                          </span>
                          {m.role === 'leader' && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Leader
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {m.universityName || m.userId?.collegeName || m.userId?.academicProfile?.universityName || 'Campus Institution'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <Link
                  to={`/events/${t.eventId?._id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  View Event Details & Submissions
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
