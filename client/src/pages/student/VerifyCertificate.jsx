import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { certificateService } from '../../services/certificateService';
import CertificateCard from '../../components/certificates/CertificateCard';
import { ShieldCheck, Search, Award, CheckCircle, AlertTriangle, ExternalLink, Calendar, MapPin, Building, Share2 } from 'lucide-react';

const VerifyCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      setSearchId(id);
      performVerification(id);
    }
  }, [id]);

  const performVerification = async (certIdToVerify) => {
    const cleanId = certIdToVerify.trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const data = await certificateService.verifyCertificate(cleanId);
      setCertificate(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Certificate could not be found or verified. Please confirm the Certificate ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    navigate(`/verify/${searchId.trim().toUpperCase()}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="main-content" style={{ minHeight: '80vh', padding: '40px 0' }}>
      <div className="content-wrap" style={{ maxWidth: '880px' }}>
        {/* Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '12px',
            }}
          >
            <ShieldCheck size={16} /> Official Credential Registry
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            Certificate Verification Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '580px', margin: '0 auto' }}>
            Verify the authenticity of student participation, achievement, and winner certificates issued by EventBridge campus organizers.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '36px',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '40px', fontSize: '15px', fontFamily: 'monospace' }}
                placeholder="Enter Certificate ID (e.g. CERT-2026-XXXXXX)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !searchId.trim()}
              style={{ padding: '0 28px', fontWeight: '700' }}
            >
              {loading ? 'Verifying...' : 'Verify Credential'}
            </button>
          </form>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Querying college verification ledger...</p>
          </div>
        )}

        {/* Error / Not Found Alert */}
        {error && !loading && (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #f87171',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <AlertTriangle size={36} style={{ color: '#dc2626', margin: '0 auto 12px' }} />
            <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Unverified or Invalid Certificate</h3>
            <p style={{ color: '#b91c1c', fontSize: '14px', maxWidth: '520px', margin: '0 auto' }}>{error}</p>
          </div>
        )}

        {/* Verified Credential Result Card */}
        {certificate && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Status Banner */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #22c55e',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    background: '#22c55e',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#15803d', fontSize: '1.15rem' }}>
                    Authentic Verified Credential
                  </div>
                  <div style={{ fontSize: '13px', color: '#166534' }}>
                    Officially issued by SRM Easwari College Campus Event System
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyLink}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Share2 size={14} /> {copied ? 'Link Copied!' : 'Share Verification'}
                </button>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--primary)' }}>
                Credential Record
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Certificate ID</span>
                  <code style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                    {certificate.certificateId}
                  </code>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Award Type</span>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '2px 10px',
                      borderRadius: '4px',
                      fontWeight: '700',
                      fontSize: '13px',
                      marginTop: '2px',
                    }}
                  >
                    Certificate of {certificate.certificateType}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Recipient Name</span>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                    {certificate.studentId?.name || 'Verified Attendee'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Recipient Department</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>
                    {certificate.studentId?.department || 'Department Student'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Event Title</span>
                  <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                    {certificate.eventId?.title || 'Campus Event'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Event Category</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>
                    {certificate.eventId?.category || 'Campus Event'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Issue Date</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>
                    {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '2026'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Verification Status</span>
                  <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '14px' }}>
                    ✓ {certificate.verificationStatus || 'Verified'}
                  </span>
                </div>
              </div>

              {/* Full Certificate Card Visualizer */}
              <div style={{ marginTop: '28px', paddingTop: '28px', borderTop: '1px solid var(--border-color)' }}>
                <CertificateCard certificate={certificate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
