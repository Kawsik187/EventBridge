import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    collegeName: user?.collegeName || '',
    phone: user?.phone || '',
    department: user?.department || '',
    year: user?.year || user?.yearOfStudy || '',
    collegeId: user?.collegeId || '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="content-wrap" style={{ maxWidth: '600px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div className="avatar-circle" style={{ width: '54px', height: '54px', fontSize: '24px' }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>{user?.name}</h2>
              <span className="user-role-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary-text)', padding: '2px 8px', borderRadius: '4px' }}>
                {user?.role} Account
              </span>
            </div>
          </div>

          {message && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">College / University Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SRM Easwari Engineering College"
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">College Email (Read Only)</label>
              <input type="email" className="form-input" value={user?.email || ''} disabled style={{ background: 'var(--bg-subtle)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">College Roll / ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.collegeId}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
