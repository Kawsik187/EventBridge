import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';
import { AlertCircle, Building2, GraduationCap, CheckCircle } from 'lucide-react';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState(searchParams.get('type') === 'host' ? 'host' : 'student');
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    password: '',
    collegeName: '',
    department: '',
    yearOfStudy: '1st Year',
    studentRollNumber: '',
    phone: '',
  });

  const [hostData, setHostData] = useState({
    adminName: '',
    officialEmail: '',
    password: '',
    institutionName: '',
    institutionType: 'college',
    designation: 'Faculty Coordinator / Club Lead',
    city: '',
    state: '',
    website: '',
    officialPhone: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, registerHost } = useAuth();
  const navigate = useNavigate();

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!studentData.collegeName || !studentData.department) {
      setError('College Name and Department are required.');
      setLoading(false);
      return;
    }

    try {
      await register({
        ...studentData,
        year: studentData.yearOfStudy,
        collegeId: studentData.studentRollNumber,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Participant registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleHostSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!hostData.institutionName || !hostData.city || !hostData.state) {
      setError('Institution Name, City, and State are mandatory.');
      setLoading(false);
      return;
    }

    try {
      await registerHost(hostData);
      setSuccessMsg('Host onboarding submitted! Awaiting Platform Super Admin verification.');
      setTimeout(() => {
        navigate('/host/pending-approval');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Host registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="main-content"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '85vh',
        padding: '36px 16px',
      }}
    >
      <div className="content-wrap" style={{ maxWidth: '580px', width: '100%' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <BrandLogo size="lg" layout="vertical" link={false} style={{ margin: '0 auto 14px' }} />
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
              Join the Inter-College Arena
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
              Compete, form cross-college teams, or publish verified campus fests globally.
            </p>
          </div>

          {/* Account Type Selector Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '4px',
              background: '#f1f5f9',
              borderRadius: '10px',
              marginBottom: '22px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAccountType('student');
                setError('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: accountType === 'student' ? '#ffffff' : 'transparent',
                color: accountType === 'student' ? '#0f172a' : '#64748b',
                boxShadow: accountType === 'student' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <GraduationCap size={18} color={accountType === 'student' ? '#1c4980' : '#64748b'} />
              <span>Participant / Student</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType('host');
                setError('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: accountType === 'host' ? '#ffffff' : 'transparent',
                color: accountType === 'host' ? '#0f172a' : '#64748b',
                boxShadow: accountType === 'host' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Building2 size={18} color={accountType === 'host' ? '#0066ff' : '#64748b'} />
              <span>Host / College Club</span>
            </button>
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                color: '#b91c1c',
                fontSize: '13.5px',
                marginBottom: '18px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                color: '#166534',
                fontSize: '13.5px',
                marginBottom: '18px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {accountType === 'student' ? (
            /* STUDENT REGISTRATION FORM */
            <div>


              <form onSubmit={handleStudentSubmit}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Aditi Verma"
                    value={studentData.name}
                    onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    Email Address * (Any Provider Allowed)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="aditi@gmail.com, student@university.edu"
                    value={studentData.email}
                    onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    College / University Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SRM Institute, IIT Madras, Anna University"
                    value={studentData.collegeName}
                    onChange={(e) => setStudentData({ ...studentData, collegeName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Department / Stream *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science, IT, ECE"
                      value={studentData.department}
                      onChange={(e) => setStudentData({ ...studentData, department: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Year of Study *
                    </label>
                    <select
                      className="form-input"
                      value={studentData.yearOfStudy}
                      onChange={(e) => setStudentData({ ...studentData, yearOfStudy: e.target.value })}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Roll / Student ID (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="RA2111003010123"
                      value={studentData.studentRollNumber}
                      onChange={(e) => setStudentData({ ...studentData, studentRollNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={studentData.phone}
                      onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    value={studentData.password}
                    onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '11px', fontSize: '14.5px', fontWeight: '700' }}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register as Participant'}
                </button>
              </form>
            </div>
          ) : (
            /* COLLEGE / HOST ONBOARDING FORM */
            <div>
              <form onSubmit={handleHostSubmit}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    Institution / University / Club Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Birla Institute of Technology / ACM Student Chapter"
                    value={hostData.institutionName}
                    onChange={(e) => setHostData({ ...hostData, institutionName: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Lead Coordinator Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Dr. Rajesh Kumar"
                      value={hostData.adminName}
                      onChange={(e) => setHostData({ ...hostData, adminName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Organization Type
                    </label>
                    <select
                      className="form-input"
                      value={hostData.institutionType}
                      onChange={(e) => setHostData({ ...hostData, institutionType: e.target.value })}
                    >
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="tech_club">Tech Club / Society</option>
                      <option value="autonomous_institute">Autonomous Institute</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    Official Administrative Email *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="events@college.edu or hackathonlead@gmail.com"
                    value={hostData.officialEmail}
                    onChange={(e) => setHostData({ ...hostData, officialEmail: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Bengaluru"
                      value={hostData.city}
                      onChange={(e) => setHostData({ ...hostData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Karnataka"
                      value={hostData.state}
                      onChange={(e) => setHostData({ ...hostData, state: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Designation
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Hacker Club Lead / Faculty"
                      value={hostData.designation}
                      onChange={(e) => setHostData({ ...hostData, designation: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://college.edu"
                      value={hostData.website}
                      onChange={(e) => setHostData({ ...hostData, website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: '700' }}>
                    Set Secure Password *
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    value={hostData.password}
                    onChange={(e) => setHostData({ ...hostData, password: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '14.5px',
                    fontWeight: '700',
                    background: '#0066ff',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Submitting Credentials...' : 'Submit Host Onboarding'}
                </button>
              </form>
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#1c4980', fontWeight: '700', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
