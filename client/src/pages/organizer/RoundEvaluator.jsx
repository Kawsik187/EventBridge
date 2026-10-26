import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import submissionService from '../../services/submissionService';
import { Layers, Award, Star, CheckCircle, ExternalLink, ShieldCheck, ChevronRight, Filter } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';

export default function RoundEvaluator() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRound, setSelectedRound] = useState(1);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Evaluation modal state
  const [activeSub, setActiveSub] = useState(null);
  const [scores, setScores] = useState({
    innovation: 85,
    technicalExecution: 80,
    impact: 90,
  });
  const [feedback, setFeedback] = useState('');
  const [shortlistedIds, setShortlistedIds] = useState(new Set());

  // Close evaluation modal on Escape key
  useEscapeKey(() => setActiveSub(null), !!activeSub);

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchSubmissions();
    }
  }, [selectedEventId, selectedRound]);

  const fetchOrganizerEvents = async () => {
    try {
      const data = await eventService.getOrganizerEvents();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await submissionService.getRoundSubmissions(selectedEventId, selectedRound);
      if (res.success) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const currentEvent = events.find((e) => e._id === selectedEventId);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!activeSub) return;

    try {
      const rubricScores = [
        { criterion: 'Innovation & Problem Fit', score: Number(scores.innovation) },
        { criterion: 'Technical Depth & Architecture', score: Number(scores.technicalExecution) },
        { criterion: 'Real-World Impact', score: Number(scores.impact) },
      ];

      await submissionService.evaluateSubmission(activeSub._id, {
        rubricScores,
        feedback,
      });

      setActionMsg({ type: 'success', text: `Evaluation submitted for "${activeSub.submissionData?.title}"!` });
      setActiveSub(null);
      setFeedback('');
      fetchSubmissions();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit score' });
    }
  };

  const toggleShortlist = (teamId) => {
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const handleAdvanceShortlist = async () => {
    if (shortlistedIds.size === 0) {
      alert('Please select at least one team to advance');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to advance ${shortlistedIds.size} teams to Round ${selectedRound + 1}? Non-shortlisted teams will be eliminated.`
      )
    ) {
      return;
    }

    try {
      await submissionService.advanceTeams(
        selectedEventId,
        selectedRound,
        Array.from(shortlistedIds),
        true
      );
      setActionMsg({
        type: 'success',
        text: `Successfully promoted ${shortlistedIds.size} teams to Round ${selectedRound + 1}!`,
      });
      setShortlistedIds(new Set());
      fetchSubmissions();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to advance teams' });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Round Evaluation & Advancement Console
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Review team deliverables, grade with standard rubric criteria, and promote finalists to subsequent stages.
          </p>
        </div>

        {shortlistedIds.size > 0 && (
          <button
            onClick={handleAdvanceShortlist}
            style={{
              backgroundColor: '#059669',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
            }}
          >
            <ShieldCheck size={18} /> Advance {shortlistedIds.size} Teams to Round {selectedRound + 1}
          </button>
        )}
      </div>

      {actionMsg.text && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: actionMsg.type === 'error' ? '#fef2f2' : '#ecfdf5',
            color: actionMsg.type === 'error' ? '#991b1b' : '#065f46',
            border: `1px solid ${actionMsg.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            fontWeight: 600,
          }}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Selectors Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            SELECT HACKATHON / EVENT
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title} ({e.category})
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            COMPETITION ROUND
          </label>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(Number(e.target.value))}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
          >
            {[1, 2, 3, 4].map((r) => (
              <option key={r} value={r}>
                Round {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <Layers size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#334155', margin: 0 }}>No submissions yet for Round {selectedRound}</h3>
          <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>
            Participants and teams will appear here once they upload deliverables.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {submissions.map((sub) => {
            const team = sub.teamId;
            const isShortlisted = team && shortlistedIds.has(team._id);

            return (
              <div
                key={sub._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: isShortlisted ? '2px solid #059669' : '1px solid #e2e8f0',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {team ? `Team: ${team.name}` : `Solo: ${sub.userId?.name}`}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: sub.verdict === 'shortlisted' ? '#dcfce7' : '#f1f5f9',
                          color: sub.verdict === 'shortlisted' ? '#166534' : '#475569',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Status: {sub.verdict?.toUpperCase()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px 0' }}>
                      {sub.submissionData?.title}
                    </h3>
                    <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 12px 0', maxWidth: '800px' }}>
                      {sub.submissionData?.abstract || 'No abstract provided'}
                    </p>

                    {/* Links */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {sub.submissionData?.githubRepoUrl && (
                        <a
                          href={sub.submissionData.githubRepoUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#4f46e5',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={14} /> GitHub Repository
                        </a>
                      )}
                      {sub.submissionData?.liveDemoUrl && (
                        <a
                          href={sub.submissionData.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#059669',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={14} /> Live Demo
                        </a>
                      )}
                      {sub.submissionData?.fileUrl && (
                        <a
                          href={sub.submissionData.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#2563eb',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={14} /> Pitch Deck / Documents
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions & Score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>AVERAGE SCORE</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4f46e5' }}>
                        {sub.averageScore ? `${sub.averageScore}/100` : 'Not Graded'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setActiveSub(sub)}
                        style={{
                          backgroundColor: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        Score Rubric
                      </button>

                      {team && (
                        <button
                          onClick={() => toggleShortlist(team._id)}
                          style={{
                            backgroundColor: isShortlisted ? '#059669' : '#ffffff',
                            color: isShortlisted ? '#ffffff' : '#059669',
                            border: '1.5px solid #059669',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          {isShortlisted ? '✓ Shortlisted' : '+ Shortlist'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rubric Evaluation Modal */}
      {activeSub && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSub(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                Evaluate: {activeSub.submissionData?.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSub(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScoreSubmit} className="modal-body">
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Innovation & Uniqueness</span>
                  <span>{scores.innovation}/100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.innovation}
                  onChange={(e) => setScores({ ...scores, innovation: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Technical Execution & Code Architecture</span>
                  <span>{scores.technicalExecution}/100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.technicalExecution}
                  onChange={(e) => setScores({ ...scores, technicalExecution: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Practical Feasibility & Impact</span>
                  <span>{scores.impact}/100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.impact}
                  onChange={(e) => setScores({ ...scores, impact: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Judge / Evaluator Feedback</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Suggestions, code review feedback, or standout highlights..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px', fontWeight: 700 }}>
                  Save Evaluation
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSub(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
