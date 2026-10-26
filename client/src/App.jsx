import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// CSS Imports
import './styles/main.css';
import './styles/navbar.css';
import './styles/discover.css';
import './styles/event-details.css';
import './styles/dashboard.css';
import './styles/responsive.css';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RequestOrganizer from './pages/auth/RequestOrganizer';

// Student Pages
import Discover from './pages/student/Discover';
import EventsList from './pages/student/EventsList';
import EventDetails from './pages/student/EventDetails';
import MyEvents from './pages/student/MyEvents';
import Announcements from './pages/student/Announcements';
import Certificates from './pages/student/Certificates';
import VerifyCertificate from './pages/student/VerifyCertificate';
import Profile from './pages/student/Profile';
import TeamHub from './pages/student/TeamHub';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import Participants from './pages/organizer/Participants';
import Volunteers from './pages/organizer/Volunteers';
import AttendanceScanner from './pages/organizer/AttendanceScanner';
import AnnouncementsManager from './pages/organizer/AnnouncementsManager';
import CertificateIssuer from './pages/organizer/CertificateIssuer';
import OrganizerAnalytics from './pages/organizer/Analytics';
import RoundEvaluator from './pages/organizer/RoundEvaluator';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Approvals from './pages/admin/Approvals';
import Users from './pages/admin/Users';
import Venues from './pages/admin/Venues';
import Departments from './pages/admin/Departments';
import OrganizerRequests from './pages/admin/OrganizerRequests';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const OrganizerRoute = ({ children }) => {
  const { isOrganizer, isCollegeAdmin, isHostApproved, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;

  // If college admin is registered but pending super admin verification
  if (isCollegeAdmin && !isHostApproved) {
    return <Navigate to="/host/pending-approval" replace />;
  }

  return isOrganizer || (isCollegeAdmin && isHostApproved) ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  return isAdmin ? children : <Navigate to="/" />;
};

const StaffRoute = ({ children }) => {
  const { isOrganizer, isAdmin, isCollegeAdmin, isHostApproved, loading } = useAuth();
  if (loading) return <div className="loading-spinner" />;
  if (isCollegeAdmin && !isHostApproved) {
    return <Navigate to="/host/pending-approval" replace />;
  }
  return isOrganizer || isAdmin || (isCollegeAdmin && isHostApproved) ? children : <Navigate to="/" />;
};

function HostPendingApproval() {
  return (
    <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '32px 16px' }}>
      <div style={{ maxWidth: '540px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#d97706', fontSize: '28px' }}>
          ⏳
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          College Host Verification Pending
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Your institution / club host onboarding credentials have been received and are currently under review by the Platform Super Admin. Once verified, your Host Dashboard will unlock.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '13.5px' }}>
            Explore Events
          </Link>
          <Link to="/profile" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13.5px' }}>
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        {/* Public Discovery Routes */}
        <Route path="/" element={<Discover />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:id" element={<VerifyCertificate />} />
        <Route path="/certificates/verify/:id" element={<VerifyCertificate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/request-organizer" element={<RequestOrganizer />} />
        <Route path="/host/pending-approval" element={<HostPendingApproval />} />

        {/* Protected Participant (Student) Routes */}
        <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><TeamHub /></ProtectedRoute>} />
        <Route path="/teams/join/:inviteCode" element={<ProtectedRoute><TeamHub /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Protected Attendance Desk & QR Scanner for Staff (Organizers & Admins) */}
        <Route path="/attendance" element={<StaffRoute><AttendanceScanner /></StaffRoute>} />
        <Route path="/organizer/attendance" element={<StaffRoute><AttendanceScanner /></StaffRoute>} />

        {/* Protected College Host & Organizer Routes */}
        <Route path="/organizer/dashboard" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />
        <Route path="/organizer/create-event" element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
        <Route path="/organizer/edit-event/:id" element={<OrganizerRoute><EditEvent /></OrganizerRoute>} />
        <Route path="/organizer/participants" element={<OrganizerRoute><Participants /></OrganizerRoute>} />
        <Route path="/organizer/volunteers" element={<OrganizerRoute><Volunteers /></OrganizerRoute>} />
        <Route path="/organizer/announcements" element={<OrganizerRoute><AnnouncementsManager /></OrganizerRoute>} />
        <Route path="/organizer/certificates" element={<OrganizerRoute><CertificateIssuer /></OrganizerRoute>} />
        <Route path="/organizer/analytics" element={<OrganizerRoute><OrganizerAnalytics /></OrganizerRoute>} />
        <Route path="/organizer/evaluations" element={<OrganizerRoute><RoundEvaluator /></OrganizerRoute>} />

        {/* Host Dashboard Aliases */}
        <Route path="/host/dashboard" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />
        <Route path="/host/create-event" element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
        <Route path="/host/participants" element={<OrganizerRoute><Participants /></OrganizerRoute>} />

        {/* Protected Platform Super Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/approvals" element={<AdminRoute><Approvals /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/admin/venues" element={<AdminRoute><Venues /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><Departments /></AdminRoute>} />
        <Route path="/admin/organizer-requests" element={<AdminRoute><OrganizerRequests /></AdminRoute>} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[EventBridge Application Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: '500px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '36px 28px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
              The application encountered an unexpected issue while loading data. Please refresh the page to reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#1c4980', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
