import React, { useState, useEffect } from 'react';
import { certificateService } from '../../services/certificateService';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { Award, CheckCircle2, ShieldCheck } from 'lucide-react';

const CertificateIssuer = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [certType, setCertType] = useState('Participation');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const params = user?.role === 'admin' ? { status: '' } : { organizerId: user?._id, status: '' };
      const data = await eventService.getAllEvents(params);
      setEvents(data || []);
      if (data && data.length > 0) setSelectedEventId(data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async (eventId) => {
    try {
      const data = await attendanceService.getEventAttendance(eventId);
      setAttendanceData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueCertificates = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await certificateService.generateCertificates(selectedEventId, certType);
      setFeedback({
        type: 'success',
        message: res.message,
        count: res.issuedCount,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error generating certificates',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentEvent = events.find((e) => e._id === selectedEventId);

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1>Certificate Management & Issuance</h1>
            <p style={{ color: 'var(--text-muted)' }}>Generate official verifiable certificates for checked-in event attendees.</p>
          </div>

          <select
            className="form-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ width: '260px' }}
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>
        </div>

        {/* Certificate Generator Tool */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: '28px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '16px' }}>
            <Award size={24} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Certificate Batch Generator</h3>
          </div>

          {attendanceData && (
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Registrations</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{attendanceData.totalRegistered}</div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Checked In (Eligible)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {attendanceData.checkedInCount}
                </div>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Certificate Type</label>
            <select
              className="form-select"
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
            >
              <option value="Participation">Certificate of Participation</option>
              <option value="Completion">Certificate of Completion</option>
              <option value="Winner">Certificate of Excellence (Winner)</option>
              <option value="Runner-up">Certificate of Merit (Runner-up)</option>
            </select>
          </div>

          {feedback && (
            <div
              style={{
                padding: '14px',
                borderRadius: '6px',
                marginBottom: '20px',
                background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: feedback.type === 'success' ? '#15803d' : '#991b1b',
                fontWeight: '600',
              }}
            >
              {feedback.message}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading || !attendanceData || attendanceData.checkedInCount === 0}
            onClick={handleIssueCertificates}
          >
            <ShieldCheck size={20} />
            {loading ? 'Issuing Certificates...' : `Issue Certificates to ${attendanceData?.checkedInCount || 0} Eligible Attendees`}
          </button>
        </div>

        {/* Individual Student Award Issuance */}
        {attendanceData && attendanceData.registrations && attendanceData.registrations.length > 0 && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Individual Winner / Award Certificate</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Attendance Status</th>
                    <th>Award Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.registrations.map((reg) => (
                    <tr key={reg._id}>
                      <td>
                        <strong>{reg.studentId?.name || 'Student'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{reg.studentId?.email} • {reg.studentId?.department}</div>
                      </td>
                      <td>
                        <span className={`badge ${reg.status === 'checked_in' ? 'badge-approved' : 'badge-pending'}`}>
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <select
                          id={`award-type-${reg._id}`}
                          className="form-select form-select-sm"
                          defaultValue="Winner"
                          style={{ fontSize: '13px', padding: '4px 8px' }}
                        >
                          <option value="Winner">Winner (1st Place)</option>
                          <option value="Runner-up">Runner-Up (2nd Place)</option>
                          <option value="Completion">Special Completion</option>
                          <option value="Volunteer">Volunteer Certificate</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            const selectedAward = document.getElementById(`award-type-${reg._id}`)?.value || 'Winner';
                            const studentTargetId = reg.studentId?._id || reg.studentId;
                            try {
                              await certificateService.issueSingleCertificate(selectedEventId, studentTargetId, selectedAward);
                              alert(`Issued ${selectedAward} Certificate to ${reg.studentId?.name || 'student'}!`);
                              await loadAttendance(selectedEventId);
                            } catch (err) {
                              alert(err.response?.data?.message || 'Error issuing certificate');
                            }
                          }}
                        >
                          Issue Award
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateIssuer;
