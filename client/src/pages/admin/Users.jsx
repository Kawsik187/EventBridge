import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Search,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Users as UsersIcon,
  Shield,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      setErrorMsg('');
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const data = await adminService.getAllUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error fetching campus users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(true);
  };

  const handleToggleStatus = async (userObj) => {
    const newStatus = userObj.status === 'active' ? 'deactivated' : 'active';
    setActionLoadingId(userObj._id);
    setErrorMsg('');

    try {
      await adminService.updateUserStatus(userObj._id, newStatus);
      setSuccessMsg(`User "${userObj.name}" is now ${newStatus}.`);
      await loadUsers(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (userObj, newRole) => {
    if (userObj.role === newRole) return;
    if (!window.confirm(`Are you sure you want to change ${userObj.name}'s role from ${userObj.role} to ${newRole}?`)) {
      return;
    }

    setActionLoadingId(userObj._id);
    setErrorMsg('');

    try {
      await adminService.updateUserRole(userObj._id, newRole);
      setSuccessMsg(`Role for "${userObj.name}" updated to ${newRole}.`);
      await loadUsers(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Campus Users Directory
              </h1>
              <span
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {users.length} Registered
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>
              Inspect and manage student participants, faculty organizers, and administrator accounts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => loadUsers(true)}
              disabled={refreshing || loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh users"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* In-app Notification Banners */}
        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#065f46',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle size={18} color="#059669" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={18} color="#dc2626" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            />
            <input
              type="text"
              placeholder="Search by student name, official email, or roll ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                background: 'var(--bg-page)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  loadUsers(true);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Role:</span>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <UsersIcon size={36} color="var(--primary)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px' }}>
              No Users Found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              No users matching the selected role or search keywords were located.
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 18px' }}>User Details</th>
                    <th style={{ padding: '14px 18px' }}>Official Email</th>
                    <th style={{ padding: '14px 18px' }}>Department & Roll ID</th>
                    <th style={{ padding: '14px 18px' }}>Access Role</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isProcessing = actionLoadingId === u._id;

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: u.role === 'admin' ? '#fee2e2' : u.role === 'organizer' ? '#fef3c7' : 'var(--bg-subtle)',
                                color: u.role === 'admin' ? '#dc2626' : u.role === 'organizer' ? '#d97706' : 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '13px',
                              }}
                            >
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-main)' }}>{u.name}</strong>
                              {u.role === 'admin' && (
                                <span style={{ marginLeft: '6px', fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>
                                  (Campus Admin)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-body)' }}>{u.email}</td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                          <div>{u.department || 'Not Assigned'}</div>
                          {u.collegeId && <div style={{ fontSize: '11.5px', color: 'var(--text-light)' }}>Roll: {u.collegeId}</div>}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            disabled={isProcessing || u.email === 'admin@campus.edu'}
                            style={{
                              padding: '5px 8px',
                              fontSize: '12.5px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-surface)',
                              color: 'var(--text-main)',
                              fontWeight: '600',
                            }}
                          >
                            <option value="student">Student</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <StatusBadge status={u.status} />
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isProcessing || u.email === 'admin@campus.edu'}
                            style={{
                              fontSize: '12px',
                              padding: '4px 12px',
                            }}
                          >
                            {isProcessing ? 'Saving...' : u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Users;
