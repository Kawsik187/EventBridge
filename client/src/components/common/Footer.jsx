import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Footer = () => {
  return (
    <footer style={{ background: '#ffffff', borderTop: '1.5px solid var(--primary-border)', padding: '40px 0 32px', marginTop: 'auto' }}>
      <div className="content-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <div style={{ marginBottom: '8px' }}>
            <BrandLogo size="md" />
          </div>
          <p style={{ fontSize: '13.5px', color: '#475569', fontWeight: '500' }}>
            Unlocking Campus Opportunities, Hackathons, Fests & Competitions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: '600', color: 'var(--primary)', flexWrap: 'wrap' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={14} /> Discover Opportunities</Link>
          <Link to="/events">Competitions & Fests</Link>
          <Link to="/verify">Verify Credentials</Link>
          <Link to="/login">Student Portal</Link>
          <Link to="/request-organizer">Host Opportunities</Link>
        </div>
      </div>

      <div className="content-wrap" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
        <p>© {new Date().getFullYear()} EventBridge Opportunity Portal. All rights reserved.</p>
        <Link to="/verify" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-text)', fontWeight: '600', background: 'var(--success-light)', padding: '4px 12px', borderRadius: '9999px', textDecoration: 'none', transition: 'all 0.2s' }}>
          <ShieldCheck size={14} /> 100% Verified Campus Opportunities & Certificates
        </Link>
      </div>
    </footer>
  );
};

export default Footer;

