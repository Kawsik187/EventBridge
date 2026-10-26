import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Award, Download, Printer, ShieldCheck, ExternalLink, CheckCircle } from 'lucide-react';
import { downloadCertificateAsImage } from '../../utils/certificateDownloader';

const CertificateCard = ({ certificate }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const studentName = certificate.studentId?.name || 'Student Participant';
  const eventTitle = certificate.eventId?.title || 'Campus Event';
  const dateStr = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'October 2026';
  const certId = certificate.certificateId || 'CERT-2026-X000';
  const certType = certificate.certificateType || 'Completion';

  const collegeName = certificate.studentId?.collegeName;
  const dept = certificate.studentId?.department;
  let institutionText = '';
  if (collegeName && dept) {
    institutionText = `${collegeName} — ${dept}`;
  } else if (collegeName) {
    institutionText = collegeName;
  } else if (dept) {
    institutionText = dept;
  } else {
    institutionText = 'Participant Scholar';
  }

  const verifyUrl = `${window.location.origin}/verify/${certId}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [certId, verifyUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = async () => {
    try {
      setDownloading(true);
      await downloadCertificateAsImage(certificate);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="certificate-preview-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Corner Flairs */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          width: '28px',
          height: '28px',
          borderTop: '3px solid #d97706',
          borderLeft: '3px solid #d97706',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '28px',
          height: '28px',
          borderTop: '3px solid #d97706',
          borderRight: '3px solid #d97706',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          width: '28px',
          height: '28px',
          borderBottom: '3px solid #d97706',
          borderLeft: '3px solid #d97706',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          width: '28px',
          height: '28px',
          borderBottom: '3px solid #d97706',
          borderRight: '3px solid #d97706',
        }}
      />

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: '800', letterSpacing: '0.04em', fontSize: '13px' }}>
          <ShieldCheck size={22} style={{ color: '#16a34a' }} />
          <span>EVENTBRIDGE OFFICIAL VERIFIED CREDENTIAL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: '#1e3a8a', background: '#eff6ff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
            ID: {certId}
          </span>
          <Link
            to={`/verify/${certId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm no-print"
            style={{ fontSize: '12px', padding: '4px 10px', gap: '4px' }}
            title="Verify this certificate online"
          >
            <ExternalLink size={12} /> Verify
          </Link>
        </div>
      </div>

      {/* Main Diploma / Certificate Body */}
      <div style={{ margin: '24px 0 32px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#d97706', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Academic & Technical Council
        </div>
        <h2
          className="certificate-title"
          style={{
            fontSize: '2.1rem',
            color: '#1e3a8a',
            fontWeight: '900',
            letterSpacing: '0.04em',
            margin: '0 0 14px 0',
            textTransform: 'uppercase',
          }}
        >
          Certificate of {certType}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', marginBottom: '16px' }}>
          This is proudly conferred upon
        </p>

        <h3
          style={{
            fontSize: '2rem',
            color: '#0f172a',
            fontWeight: '800',
            borderBottom: '2.5px solid #d97706',
            display: 'inline-block',
            paddingBottom: '6px',
            marginBottom: '16px',
          }}
        >
          {studentName}
        </h3>

        <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155', marginBottom: '16px' }}>
          of <span style={{ color: '#1e3a8a' }}>{institutionText}</span>
        </div>

        <p style={{ fontSize: '14.5px', color: '#475569', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
          for successful participation, high technical accomplishment, and completing all competitive rounds in{' '}
          <strong style={{ color: '#0f172a' }}>"{eventTitle}"</strong>.
        </p>
      </div>

      {/* Certificate Footer: Date, Scannable QR Code, Signatures */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px dashed #cbd5e1',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {/* Left: Date of Issue */}
        <div style={{ textAlign: 'left', minWidth: '140px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>
            Date of Issuance
          </span>
          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{dateStr}</strong>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CheckCircle size={12} /> Cryptographically Signed
          </div>
        </div>

        {/* Center: Real scannable QR Code */}
        {qrDataUrl && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={qrDataUrl}
              alt="Scan to Verify"
              style={{ width: '84px', height: '84px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px', background: '#ffffff' }}
            />
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginTop: '4px', letterSpacing: '0.04em' }}>
              SCAN TO VERIFY
            </span>
          </div>
        )}

        {/* Right: Authorized Signature */}
        <div style={{ textAlign: 'right', minWidth: '160px' }}>
          <div style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive, Georgia', fontSize: '20px', color: '#1e3a8a', marginBottom: '2px' }}>
            Dr. Ramesh Sundaram
          </div>
          <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '4px' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Dean of Student Affairs</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Platform Academic Council</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Hidden in Print */}
      <div
        className="certificate-actions no-print"
        style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={handleDownloadFile}
          disabled={downloading}
          style={{ gap: '7px', fontWeight: '700', padding: '10px 22px' }}
          title="Directly download high-resolution official certificate file (PNG)"
        >
          <Download size={16} /> {downloading ? 'Generating Certificate...' : 'Download Certificate (PNG)'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handlePrint}
          style={{ gap: '7px', fontWeight: '700', padding: '10px 22px' }}
          title="Open printer dialog to save directly as PDF (Print to PDF)"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>

        <Link
          to={`/verify/${certId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ gap: '6px', fontSize: '13px', padding: '10px 18px' }}
        >
          <ShieldCheck size={16} style={{ color: '#16a34a' }} /> Public Verification Link
        </Link>
      </div>
    </div>
  );
};

export default CertificateCard;
