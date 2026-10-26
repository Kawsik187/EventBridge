import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  User,
  X,
  Search,
  RefreshCw,
} from 'lucide-react';

const OrganizerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Conflict / Replace confirmation modal
  const [conflictModal, setConflictModal] = useState({ open: false, request: null, conflictData: null });
  const [rejectModal, setRejectModal] = useState({ open: false, request: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrganizerRequests({ status: statusFilter });
      setRequests(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching organizer requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (req, replaceCurrent = false) => {
    try {
      setActionLoading(true);
      setError('');
      const res = await adminService.approveOrganizerRequest(req._id, replaceCurrent);
      setSuccessMsg(res.message);
      setConflictModal({ open: false, request: null, conflictData: null });
      fetchRequests();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requiresReplacementConfirmation) {
        setConflictModal({
          open: true,
          request: req,
          conflictData: err.response.data,
        });
      } else {
        setError(err.response?.data?.message || 'Error approving organizer request');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.request) return;

    try {
      setActionLoading(true);
      setError('');
      const res = await adminService.rejectOrganizerRequest(rejectModal.request._id, rejectModal.reason);
      setSuccessMsg(res.message);
      setRejectModal({ open: false, request: null, reason: '' });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
            Organizer Access Requests
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Review, verify, and approve faculty and department organizer permissions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13.5px',
              fontWeight: '600',
              background: '#ffffff',
            }}
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={fetchRequests}
            style={{
              padding: '8px 14px',
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
          <Clock size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#334155', margin: '0 0 6px' }}>No Organizer Requests Found</h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
            {statusFilter === 'PENDING' ? 'No pending requests awaiting approval.' : 'No requests matching the selected filter.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: '700', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 18px' }}>Applicant</th>
                  <th style={{ padding: '14px 18px' }}>Official Email & Phone</th>
                  <th style={{ padding: '14px 18px' }}>Target Department</th>
                  <th style={{ padding: '14px 18px' }}>Date</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <div>{req.name}</div>
                          {req.collegeId && <div style={{ fontSize: '11.5px', color: '#64748b' }}>ID: {req.collegeId}</div>}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{req.email}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{req.phone}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ background: '#eff6ff', color: '#1c4980', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', marginRight: '6px' }}>
                        {req.departmentCode}
                      </span>
                      <span style={{ color: '#334155', fontWeight: '600' }}>{req.departmentName}</span>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12.5px' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          display: 'inline-block',
                          background:
                            req.status === 'APPROVED' ? '#ecfdf5' : req.status === 'REJECTED' ? '#fef2f2' : '#fef3c7',
                          color:
                            req.status === 'APPROVED' ? '#065f46' : req.status === 'REJECTED' ? '#991b1b' : '#92400e',
                        }}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(req, false)}
                            disabled={actionLoading}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#10b981',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, request: req, reason: '' })}
                            disabled={actionLoading}
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
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Reviewed {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conflict / Replace Modal */}
      {conflictModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={24} color="#d97706" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Department Has Active Organizer
              </h3>
            </div>

            <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '16px' }}>
              <strong>{conflictModal.request?.departmentName}</strong> currently has an active organizer:
              <br />
              <span style={{ color: '#0f172a', fontWeight: '700' }}>
                {conflictModal.conflictData?.currentOrganizer?.name} ({conflictModal.conflictData?.currentOrganizer?.email})
              </span>
            </p>

            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#92400e', marginBottom: '20px' }}>
              By approving <strong>{conflictModal.request?.name}</strong>, the previous organizer will be automatically{' '}
              <strong>DEACTIVATED</strong>, and an audit record will be logged.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConflictModal({ open: false, request: null, conflictData: null })}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprove(conflictModal.request, true)}
                disabled={actionLoading}
                style={{ flex: 1.5, padding: '10px', borderRadius: '8px', border: 'none', background: '#d97706', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
              >
                {actionLoading ? 'Replacing...' : 'Replace Active Organizer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Reject Organizer Request
              </h3>
              <button onClick={() => setRejectModal({ open: false, request: null, reason: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Reason for Rejection
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Please verify identity with department HOD or submit official appointment order"
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, request: null, reason: '' })}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerRequests;
