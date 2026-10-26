import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  Building2,
  Users,
  Calendar,
  UserCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  X,
  Search,
} from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [replaceModal, setReplaceModal] = useState({ open: false, dept: null });
  const [assignModal, setAssignModal] = useState({ open: false, dept: null });
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDepartments();
      setDepartments(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDeactivateOrganizer = async (dept) => {
    if (!window.confirm(`Are you sure you want to deactivate the active organizer for ${dept.name}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deactivateOrganizer(dept._id);
      setSuccessMsg(`Organizer for ${dept.name} has been deactivated.`);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deactivating organizer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignOrganizer = async (e) => {
    e.preventDefault();
    if (!assignModal.dept || !organizerEmail) return;

    try {
      setActionLoading(true);
      await adminService.assignOrganizer(assignModal.dept._id, { userEmail: organizerEmail.trim() });
      setSuccessMsg(`Organizer successfully assigned to ${assignModal.dept.name}`);
      setAssignModal({ open: false, dept: null });
      setOrganizerEmail('');
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Error assigning organizer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceOrganizer = async (e) => {
    e.preventDefault();
    if (!replaceModal.dept || !organizerEmail) return;

    try {
      setActionLoading(true);
      await adminService.replaceOrganizer(replaceModal.dept._id, { newUserEmail: organizerEmail.trim() });
      setSuccessMsg(`Organizer successfully replaced for ${replaceModal.dept.name}. Previous organizer deactivated.`);
      setReplaceModal({ open: false, dept: null });
      setOrganizerEmail('');
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Error replacing organizer');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.activeOrganizerId?.name?.toLowerCase().includes(q) ||
      d.activeOrganizerId?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
            Department Management
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Manage the 15 official college departments, primary organizers, and departmental event ownership
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by department or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={fetchDepartments}
            title="Refresh departments"
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', color: '#065f46', fontSize: '13.5px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#991b1b', fontSize: '13.5px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading departments...</div>
      ) : (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: '700', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 18px' }}>Code</th>
                  <th style={{ padding: '14px 18px' }}>Department</th>
                  <th style={{ padding: '14px 18px' }}>Primary Active Organizer</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Events</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map((dept) => {
                  const hasOrganizer = !!dept.activeOrganizerId;
                  const organizer = dept.activeOrganizerId;

                  return (
                    <tr key={dept._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '800', color: '#1c4980' }}>
                        <span style={{ background: '#eff6ff', color: '#1c4980', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {dept.code}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: '600', color: '#1e293b' }}>
                        {dept.name}
                        {dept.description && (
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '400', marginTop: '2px', maxWidth: '300px' }}>
                            {dept.description}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {hasOrganizer ? (
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserCheck size={15} color="#059669" />
                              {organizer.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{organizer.email}</div>
                            {organizer.phone && <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{organizer.phone}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: dept.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                            color: dept.status === 'active' ? '#065f46' : '#64748b',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dept.status === 'active' ? '#10b981' : '#94a3b8' }} />
                          {dept.status.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#334155' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={15} color="#64748b" />
                          {dept.eventsCount || 0}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {hasOrganizer ? (
                            <>
                              <button
                                onClick={() => {
                                  setReplaceModal({ open: true, dept });
                                  setOrganizerEmail('');
                                  setError('');
                                }}
                                title="Replace active organizer with another verified user"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0f172a',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                Replace
                              </button>
                              <button
                                onClick={() => handleDeactivateOrganizer(dept)}
                                title="Deactivate organizer privileges"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #fee2e2',
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                Deactivate
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setAssignModal({ open: true, dept });
                                setOrganizerEmail('');
                                setError('');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#1c4980',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              Assign Organizer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Organizer Modal */}
      {assignModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Assign Primary Organizer
              </h3>
              <button onClick={() => setAssignModal({ open: false, dept: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#475569', fontSize: '13.5px', marginBottom: '18px' }}>
              Assign an official organizer to <strong>{assignModal.dept?.name} ({assignModal.dept?.code})</strong>.
            </p>

            <form onSubmit={handleAssignOrganizer}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  User Official College Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="faculty@srmeaswari.ac.in"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, dept: null })}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#1c4980', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Organizer Modal */}
      {replaceModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#d97706" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Replace Department Organizer
                </h3>
              </div>
              <button onClick={() => setReplaceModal({ open: false, dept: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#92400e', marginBottom: '16px', lineHeight: '1.5' }}>
              <strong>Audit Policy:</strong> Replacing will immediately deactivate current organizer{' '}
              <strong>{replaceModal.dept?.activeOrganizerId?.name} ({replaceModal.dept?.activeOrganizerId?.email})</strong> and activate the new organizer.
            </div>

            <form onSubmit={handleReplaceOrganizer}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  New Organizer Official Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="new.faculty@srmeaswari.ac.in"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReplaceModal({ open: false, dept: null })}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 1.4, padding: '10px', borderRadius: '8px', border: 'none', background: '#d97706', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Replacing...' : 'Replace & Deactivate Old'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
