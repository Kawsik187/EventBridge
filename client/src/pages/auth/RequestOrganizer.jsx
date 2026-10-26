import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import BrandLogo from '../../components/common/BrandLogo';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Building2 } from 'lucide-react';

const RequestOrganizer = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    collegeId: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await authService.getDepartments();
        setDepartments(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: data[0]._id }));
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.requestOrganizerAccess(formData);
      setSubmittedRequest(res.request);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting organizer access request');
    } finally {
      setLoading(false);
    }
  };

  if (submittedRequest) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '32px 16px' }}>
        <div style={{ maxWidth: '520px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '36px', border: '1.5px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Request Submitted Successfully
          </h2>

          <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '4px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
            STATUS: PENDING CAMPUS ADMIN REVIEW
          </div>

          <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
            Thank you, <strong>{submittedRequest.name}</strong>. Your request to serve as Department Organizer for{' '}
            <strong>{submittedRequest.departmentName} ({submittedRequest.departmentCode})</strong> has been logged in the system.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '24px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Official Email:</span>
              <span style={{ fontWeight: '600' }}>{submittedRequest.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Department:</span>
              <span style={{ fontWeight: '600' }}>{submittedRequest.departmentCode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Submitted On:</span>
              <span style={{ fontWeight: '600' }}>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              to="/login"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: '#1c4980',
                color: '#ffffff',
                fontWeight: '700',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Go to Sign In
            </Link>
            <Link
              to="/"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontWeight: '700',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Browse Campus Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '32px 16px' }}>
      <div style={{ maxWidth: '540px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '36px', border: '1.5px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <BrandLogo size="lg" layout="vertical" link={false} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            Request Organizer Access
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Official portal for Faculty and Student Chapter Department Organizers
          </p>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
          <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
            <strong>Institutional Verification:</strong> Each department is represented by 1 verified primary organizer. Requests require official college email and Campus Admin authorization.
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#b91c1c', fontSize: '13.5px', marginBottom: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Full Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Dr. Anita Roy or Vikram Seth"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Official College Email <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="faculty@srmeaswari.ac.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Must match your institution domain (@srmeaswari.ac.in)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Phone Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="tel"
                required
                className="form-input"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Employee / Student ID
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="FAC-CSE-012"
                value={formData.collegeId}
                onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Target Department <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              required
              className="form-input"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            >
              {Array.isArray(departments) && departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}

            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Portal Password <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#1c4980',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Submitting Request...' : 'Submit Organizer Request'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', fontSize: '13.5px', color: '#64748b' }}>
          Already have an active account?{' '}
          <Link to="/login" style={{ color: '#1c4980', fontWeight: '700', textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RequestOrganizer;
