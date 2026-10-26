import React, { useState } from 'react';
import { Layers, Calendar, Clock, FileCode, CheckCircle2, Upload, AlertCircle, Link as LinkIcon, Send } from 'lucide-react';
import submissionService from '../../services/submissionService';

export default function RoundTimeline({ event, userRegistration, onSubmissionSuccess }) {
  const [activeModalRound, setActiveModalRound] = useState(null);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!event?.rounds || event.rounds.length === 0) {
    return null;
  }

  const handleOpenSubmit = (round) => {
    setActiveModalRound(round);
    setError('');
    setSuccess('');
    setTitle('');
    setAbstract('');
    setGithubRepoUrl('');
    setLiveDemoUrl('');
    setFileUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project/Solution title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await submissionService.submitDeliverable(event._id, activeModalRound.roundNumber, {
        title: title.trim(),
        abstract: abstract.trim(),
        githubRepoUrl: githubRepoUrl.trim(),
        liveDemoUrl: liveDemoUrl.trim(),
        fileUrl: fileUrl.trim(),
      });

      if (res.success) {
        setSuccess('Deliverable successfully submitted for evaluation!');
        setTimeout(() => {
          setActiveModalRound(null);
          if (onSubmissionSuccess) onSubmissionSuccess();
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginBottom: '36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Layers size={22} color="var(--primary)" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
          Competition Stages & Rounds ({event.rounds.length})
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {event.rounds.map((round) => {
          const isCurrent = (event.currentRoundNumber || 1) === round.roundNumber;
          const deadline = round.submissionDeadline ? new Date(round.submissionDeadline).toLocaleDateString() : 'TBA';

          return (
            <div
              key={round.roundNumber}
              style={{
                border: isCurrent ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: isCurrent ? '#f5f3ff' : '#ffffff',
                boxShadow: isCurrent ? '0 4px 12px rgba(79, 70, 229, 0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: isCurrent ? '#4f46e5' : '#e2e8f0',
                        color: isCurrent ? '#ffffff' : '#475569',
                      }}
                    >
                      Round {round.roundNumber}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#6366f1',
                      }}
                    >
                      {round.type?.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 6px 0' }}>
                    {round.title}
                  </h4>
                  <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                    {round.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>SUBMISSION DEADLINE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626' }}>{deadline}</div>
                </div>
              </div>

              {/* Submission requirements pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
                {round.submissionConfig?.requireGithubUrl && (
                  <span style={{ fontSize: '0.8rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    GitHub Repo Required
                  </span>
                )}
                {round.submissionConfig?.requireDemoUrl && (
                  <span style={{ fontSize: '0.8rem', backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Live URL Required
                  </span>
                )}
                {round.submissionConfig?.allowFileUpload && (
                  <span style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Files up to {round.submissionConfig?.maxFileSizeMb || 25}MB
                  </span>
                )}

                {/* Submit button for registered participants */}
                {userRegistration && isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleOpenSubmit(round)}
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Upload size={14} /> Submit Deliverable
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {activeModalRound && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>
                  Submit for Round {activeModalRound.roundNumber}: {activeModalRound.title}
                </h3>
                <p className="form-help">Enter your submission deliverables below for evaluator review</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRound(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {error && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.9rem' }}>
                  {success}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Project / Solution Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. AI-Powered AgriTech Drone System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Executive Abstract / Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Summarize the core problem statement, tech stack, and solution architecture..."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">GitHub Repository URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/team/project-repo"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Live Demo / Deployed Link (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://myproject.vercel.app"
                  value={liveDemoUrl}
                  onChange={(e) => setLiveDemoUrl(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Pitch Deck / Presentation URL (Drive / S3)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontWeight: 700 }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Upload & Submit Solution'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveModalRound(null)}
                  disabled={submitting}
                >
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
