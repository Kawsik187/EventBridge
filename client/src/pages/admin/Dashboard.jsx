import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Departments from './Departments';
import OrganizerRequests from './OrganizerRequests';
import Approvals from './Approvals';
import Users from './Users';
import {
  Shield,
  Calendar,
  Users as UsersIcon,
  MapPin,
  CheckCircle,
  Clock,
  Building2,
  UserCheck,
  ClipboardList,
  AlertCircle,
  Activity,
  Layers,
  QrCode,
} from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  const { summary, departmentDistribution = [] } = analytics;

  return (
    <div className="dashboard-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-title">CAMPUS ADMIN CONTROL</div>

        <button
          onClick={() => setActiveTab('overview')}
          className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Shield size={18} /> System Overview
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`sidebar-item ${activeTab === 'departments' ? 'active' : ''}`}
        >
          <Building2 size={18} /> Departments ({summary.totalDepartments || 15})
        </button>

        <button
          onClick={() => setActiveTab('organizer-requests')}
          className={`sidebar-item ${activeTab === 'organizer-requests' ? 'active' : ''}`}
          style={{ justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} /> Organizer Requests
          </span>
          {summary.pendingOrganizerRequests > 0 && (
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '9999px' }}>
              {summary.pendingOrganizerRequests}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('event-approvals')}
          className={`sidebar-item ${activeTab === 'event-approvals' ? 'active' : ''}`}
          style={{ justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Event Approvals
          </span>
          {summary.pendingApprovals > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '9999px' }}>
              {summary.pendingApprovals}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
        >
          <UsersIcon size={18} /> User Directory
        </button>

        <Link to="/admin/venues" className="sidebar-item">
          <MapPin size={18} /> Campus Venues
        </Link>

        <Link to="/attendance" className="sidebar-item">
          <QrCode size={18} /> Attendance Desk & Scanner
        </Link>
      </aside>

      {/* Main Content Pane */}
      <main className="dashboard-content" style={{ padding: '28px 32px' }}>
        {activeTab === 'overview' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                EventBridge Administration
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', margin: 0 }}>
                Institutional event governance: <strong>ADMIN → DEPARTMENT ORGANIZER → EVENTS → PARTICIPANTS</strong>
              </p>
            </div>

            {/* Required 6 Statistics Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              {/* 1. Total Users */}
              <div className="stat-card">
                <div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-val" style={{ color: '#0f172a' }}>{summary.totalUsers}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {summary.totalStudents} students / participants
                  </div>
                </div>
                <div className="stat-icon-wrap" style={{ color: '#1c4980' }}>
                  <UsersIcon size={22} />
                </div>
              </div>

              {/* 2. Total Organizers */}
              <div className="stat-card">
                <div>
                  <div className="stat-label">Active Organizers</div>
                  <div className="stat-val" style={{ color: '#059669' }}>{summary.totalOrganizers}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    1 primary per department
                  </div>
                </div>
                <div className="stat-icon-wrap" style={{ color: '#059669' }}>
                  <UserCheck size={22} />
                </div>
              </div>

              {/* 3. Total Departments */}
              <div className="stat-card">
                <div>
                  <div className="stat-label">Total Departments</div>
                  <div className="stat-val" style={{ color: '#7c3aed' }}>{summary.totalDepartments || 15}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Official engineering branches
                  </div>
                </div>
                <div className="stat-icon-wrap" style={{ color: '#7c3aed' }}>
                  <Building2 size={22} />
                </div>
              </div>

              {/* 4. Total Events */}
              <div className="stat-card">
                <div>
                  <div className="stat-label">Total Events</div>
                  <div className="stat-val" style={{ color: '#0284c7' }}>{summary.totalEvents}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {summary.activeEvents} active & live
                  </div>
                </div>
                <div className="stat-icon-wrap" style={{ color: '#0284c7' }}>
                  <Calendar size={22} />
                </div>
              </div>

              {/* 5. Total Registrations */}
              <div className="stat-card">
                <div>
                  <div className="stat-label">Registrations</div>
                  <div className="stat-val" style={{ color: '#0d9488' }}>{summary.totalRegistrations}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {summary.attendanceRate}% check-in rate
                  </div>
                </div>
                <div className="stat-icon-wrap" style={{ color: '#0d9488' }}>
                  <ClipboardList size={22} />
                </div>
              </div>

              {/* 6. Pending Organizer Requests */}
              <div className="stat-card">
                <div>
                  <div className="stat-label">Pending Org Requests</div>
                  <div className="stat-val" style={{ color: summary.pendingOrganizerRequests > 0 ? '#d97706' : '#64748b' }}>
                    {summary.pendingOrganizerRequests || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Awaiting admin review
                  </div>
                </div>
                <div className="stat-icon-wrap" style={{ color: '#d97706' }}>
                  <Clock size={22} />
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '28px' }}>
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Building2 size={20} color="#1c4980" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                    Department Management
                  </h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '18px', lineHeight: '1.5' }}>
                  Manage the 15 engineering departments, review assigned organizers, replace inactive leads, and inspect departmental activity.
                </p>
                <button
                  onClick={() => setActiveTab('departments')}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700' }}
                >
                  Manage 15 Departments →
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <UserCheck size={20} color="#059669" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                    Organizer Access Requests
                  </h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '18px', lineHeight: '1.5' }}>
                  Faculty and department chapter organizers submit institutional credentials. Verify and approve access with single active organizer per branch.
                </p>
                <button
                  onClick={() => setActiveTab('organizer-requests')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: '700' }}
                >
                  Review Requests ({summary.pendingOrganizerRequests || 0}) →
                </button>
              </div>
            </div>

            {/* Department Event Distribution Preview */}
            <div style={{ marginTop: '28px', background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Event Count by Engineering Department
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Active & Completed</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {departmentDistribution.slice(0, 15).map((d) => (
                  <div
                    key={d.name}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#1c4980', marginBottom: '4px' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                      {d.count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>events</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'departments' && <Departments />}
        {activeTab === 'organizer-requests' && <OrganizerRequests />}
        {activeTab === 'event-approvals' && <Approvals />}
        {activeTab === 'users' && <Users />}
      </main>
    </div>
  );
};

export default AdminDashboard;
