import React, { useState, useEffect } from 'react';
import { certificateService } from '../../services/certificateService';
import CertificateCard from '../../components/certificates/CertificateCard';
import { Award, Download } from 'lucide-react';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await certificateService.getMyCertificates();
      setCertificates(data);
      if (data.length > 0) {
        setSelectedCert(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="content-wrap">
        <div className="no-print" style={{ marginBottom: '24px' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={28} style={{ color: 'var(--primary)' }} /> Your Event Certificates
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Verified certificates of participation and achievement issued for attended campus events.</p>
        </div>

        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : certificates.length === 0 ? (
          <div className="empty-state">
            <h3>No certificates issued yet</h3>
            <p>Attend registered campus events to earn official completion certificates.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '28px' }}>
            {/* List of Certificates */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Available Certificates</h3>
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  onClick={() => setSelectedCert(cert)}
                  style={{
                    background: selectedCert?._id === cert._id ? 'var(--primary-light)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedCert?._id === cert._id ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {cert.certificateType}
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', marginTop: '2px' }}>
                    {cert.eventId?.title || 'Campus Event'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '2026'}
                  </div>
                </div>
              ))}
            </div>

            {/* Certificate Preview Card */}
            <div>
              {selectedCert && <CertificateCard certificate={selectedCert} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
