import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { BarChart2, PieChart, Users, CheckCircle } from 'lucide-react';

const OrganizerAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await eventService.getOrganizerAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div className="main-content"><div className="empty-state"><div className="loading-spinner" /></div></div>;
  }

  const { summary, departmentDistribution, categoryDistribution } = analytics;

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div style={{ marginBottom: '24px' }}>
          <h1>Event Analytics & Insights</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analyze student engagement, department participation, and attendance rates.</p>
        </div>

        {/* Summary Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Overall Registrations</div>
              <div className="stat-val">{summary.totalRegistrations}</div>
            </div>
            <div className="stat-icon-wrap"><Users size={22} /></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Checked-In Attendees</div>
              <div className="stat-val" style={{ color: 'var(--primary)' }}>{summary.totalCheckedIn}</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: 'var(--primary)' }}><CheckCircle size={22} /></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Average Attendance Rate</div>
              <div className="stat-val" style={{ color: 'var(--secondary)' }}>{summary.attendanceRate}%</div>
            </div>
            <div className="stat-icon-wrap" style={{ color: 'var(--secondary)' }}><BarChart2 size={22} /></div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Student Department Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {departmentDistribution.map((dept, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '4px' }}>
                    <span>{dept.name}</span>
                    <strong>{dept.count} students</strong>
                  </div>
                  <div className="capacity-progress-bar">
                    <div
                      className="capacity-progress-fill"
                      style={{ width: `${Math.min(dept.count * 20, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Event Category Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categoryDistribution.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '4px' }}>
                    <span>{cat.category}</span>
                    <strong>{cat.count} events</strong>
                  </div>
                  <div className="capacity-progress-bar">
                    <div
                      className="capacity-progress-fill"
                      style={{ width: `${Math.min(cat.count * 25, 100)}%`, backgroundColor: 'var(--secondary)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerAnalytics;
