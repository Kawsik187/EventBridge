import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import BrandLogo from './BrandLogo';
import { Calendar, User, LogOut, Bell, Shield, ShieldCheck, Menu, X, PlusCircle, Sparkles, Award, Code, Music, Ticket, Search, QrCode, Users } from 'lucide-react';

const categoriesList = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon', 'Seminar', 'Competition', 'Club Events', 'Academic', 'Arts', 'Innovation'];

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isOrganizer } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [matchingCategories, setMatchingCategories] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const profileMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentCategory = location.pathname === '/events' ? (searchParams.get('category') || 'All') : null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setUserDropdownOpen(false);
    setShowSearchDropdown(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setHeaderSearch(val);

    if (val.trim().length > 0) {
      const matchedCats = categoriesList.filter((c) =>
        c.toLowerCase().includes(val.toLowerCase().trim())
      );
      setMatchingCategories(matchedCats);

      eventService
        .getAllEvents({ search: val.trim() })
        .then((data) => {
          setSearchResults(data.slice(0, 5));
          setShowSearchDropdown(true);
        })
        .catch(() => {});
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
      setMatchingCategories([]);
    }
  };

  const handleHeaderSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSearchDropdown(false);
    const query = headerSearch.trim();

    if (!query) {
      navigate('/events');
      return;
    }

    const catMatch = categoriesList.find((c) => c.toLowerCase() === query.toLowerCase());
    if (catMatch) {
      navigate(`/events?category=${catMatch}`);
    } else {
      navigate(`/events?search=${encodeURIComponent(query)}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="nav-header">
      <div className="content-wrap nav-container">
        {/* Left Side Menu Toggle & Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="left-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            title="Open Side Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <BrandLogo size="md" />
        </div>

        {/* Center Global Search Bar with Direct Search Icon Button & Live Dropdown */}
        <div ref={searchContainerRef} className="header-search-wrapper">
          <form onSubmit={handleHeaderSearchSubmit} className="header-search-bar" style={{ margin: 0 }}>
            <button
              type="submit"
              className="header-search-submit-btn"
              title="Click to search events & categories directly"
            >
              <Search size={16} />
            </button>
            <input
              type="text"
              placeholder="Search campus events..."
              value={headerSearch}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (headerSearch.trim()) setShowSearchDropdown(true);
              }}
            />

            {headerSearch && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setHeaderSearch('');
                  setShowSearchDropdown(false);
                }}
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Live Search Instant Dropdown */}
          {showSearchDropdown && headerSearch.trim().length > 0 && (
            <div className="search-results-dropdown">
              {matchingCategories.length > 0 && (
                <div className="search-dropdown-group">
                  <div className="search-group-label">Matching Categories</div>
                  {matchingCategories.map((cat) => (
                    <div
                      key={cat}
                      className="search-dropdown-item category-item"
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setHeaderSearch('');
                        navigate(`/events?category=${cat}`);
                      }}
                    >
                      <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                      <span>{cat} Opportunities</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length > 0 ? (
                <div className="search-dropdown-group">
                  <div className="search-group-label">Matching Events</div>
                  {searchResults.map((evt) => (
                    <div
                      key={evt._id}
                      className="search-dropdown-item event-item"
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setHeaderSearch('');
                        navigate(`/events/${evt._id}`);
                      }}
                    >
                      <Calendar size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <div className="search-event-info">
                        <span className="search-event-title">{evt.title}</span>
                        <span className="search-event-meta">{evt.category} • {evt.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                matchingCategories.length === 0 && (
                  <div className="search-dropdown-empty">
                    No events or categories found for "{headerSearch}"
                  </div>
                )
              )}

              <div className="search-dropdown-footer" onClick={handleHeaderSearchSubmit}>
                Search all results for "{headerSearch}" →
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Right Actions */}
        <div className="nav-right-actions">
          {/* Updates Bell Icon */}
          <Link to="/announcements" className="nav-bell-btn" title="Updates & Announcements">
            <Bell size={19} />
            <span className="bell-badge" />
          </Link>

          {isAuthenticated && isOrganizer ? (
            <Link to="/organizer/create-event" className="host-event-btn">
              <PlusCircle size={15} /> Host Event
            </Link>
          ) : !isAuthenticated ? (
            <Link to="/login" className="host-event-btn">
              <PlusCircle size={15} /> Host Event
            </Link>
          ) : null}

          {isAuthenticated ? (
            <div className="user-profile-menu" ref={profileMenuRef}>
              <button
                className="user-profile-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                aria-label="Toggle user profile menu"
              >
                <div className="avatar-circle">{user.name ? user.name.charAt(0) : 'U'}</div>
                <div className="user-info-text">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role-pill">{user.role}</span>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{user.name}</p>
                    <p className="dropdown-user-email">{user.email}</p>
                    <p className="dropdown-user-dept">{user.department || 'Campus Student'}</p>
                  </div>

                  <div className="dropdown-divider"></div>

                  {/* Admin Specific Links */}
                  {isAdmin && (
                    <>
                      <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)} style={{ color: 'var(--primary)', fontWeight: '700' }}>
                        <Shield size={16} /> Campus Admin Control
                      </Link>
                      <Link to="/admin/approvals" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Calendar size={16} /> Event Approvals Queue
                      </Link>
                      <Link to="/admin/organizer-requests" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <User size={16} /> Organizer Requests
                      </Link>
                      <Link to="/attendance" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <QrCode size={16} /> Attendance Desk & QR Scanner
                      </Link>
                      <div className="dropdown-divider"></div>
                    </>
                  )}

                  {/* Organizer Specific Links */}
                  {isOrganizer && (
                    <>
                      <Link to="/organizer/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)} style={{ color: 'var(--primary)', fontWeight: '700' }}>
                        <Shield size={16} /> Organizer Dashboard
                      </Link>
                      <Link to="/organizer/create-event" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <PlusCircle size={16} /> Create Department Event
                      </Link>
                      <Link to="/organizer/attendance" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <QrCode size={16} /> Attendance Desk & QR Scanner
                      </Link>
                      <Link to="/organizer/certificates" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Award size={16} /> Certificate Issuer
                      </Link>
                      <Link to="/organizer/evaluations" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Sparkles size={16} /> Round Evaluator
                      </Link>
                      <div className="dropdown-divider"></div>
                    </>
                  )}

                  <Link to="/teams" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <Users size={16} /> My Teams & Rosters
                  </Link>

                  <Link to="/my-events" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <Ticket size={16} /> My Passes & Duties
                  </Link>

                  <Link to="/certificates" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <Award size={16} /> My Certificates
                  </Link>

                  <Link to="/verify" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <ShieldCheck size={16} /> Verify Certificate
                  </Link>

                  <Link to="/profile" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <User size={16} /> Profile Settings
                  </Link>

                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons" style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navbar Category Bar (Unstop Signature) */}
      <div className="sub-nav-strip">
        <div className="content-wrap sub-nav-container">
          <Link to="/events" className={`sub-nav-item ${currentCategory === 'All' ? 'active' : ''}`}><Sparkles size={14} /> All Opportunities</Link>
          <Link to="/teams" className={`sub-nav-item ${location.pathname === '/teams' ? 'active' : ''}`}><Users size={14} /> Team Hub</Link>
          <Link to="/events?category=Hackathon" className={`sub-nav-item ${currentCategory === 'Hackathon' ? 'active' : ''}`}><Code size={14} /> Hackathons</Link>
          <Link to="/events?category=Workshop" className={`sub-nav-item ${currentCategory === 'Workshop' ? 'active' : ''}`}><Sparkles size={14} /> Workshops</Link>
          <Link to="/events?category=Technical" className={`sub-nav-item ${currentCategory === 'Technical' ? 'active' : ''}`}><Code size={14} /> Technical</Link>
          <Link to="/events?category=Cultural" className={`sub-nav-item ${currentCategory === 'Cultural' ? 'active' : ''}`}><Music size={14} /> Cultural Fests</Link>
          <Link to="/events?category=Sports" className={`sub-nav-item ${currentCategory === 'Sports' ? 'active' : ''}`}>🏆 Sports</Link>
          <Link to="/events?category=Competition" className={`sub-nav-item ${currentCategory === 'Competition' ? 'active' : ''}`}>🎯 Competitions</Link>
          <Link to="/events?category=Seminar" className={`sub-nav-item ${currentCategory === 'Seminar' ? 'active' : ''}`}><Award size={14} /> Seminars</Link>
          <Link to="/events?category=Club Events" className={`sub-nav-item ${currentCategory === 'Club Events' ? 'active' : ''}`}>👥 Club Events</Link>
        </div>
      </div>

      {/* Left Side Menu Slide-Over Drawer */}
      {sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="left-sidebar-drawer">
            <div className="sidebar-header">
              <BrandLogo
                size="md"
                variant="light"
                onClick={() => setSidebarOpen(false)}
              />
              <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="sidebar-content">
              {/* User Profile Summary */}
              {isAuthenticated ? (
                <div className="sidebar-user-card">
                  <div className="avatar-circle">{user.name ? user.name.charAt(0) : 'U'}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
                    <span className="user-role-pill">{user.role}</span>
                  </div>
                </div>
              ) : (
                <div className="sidebar-auth-row">
                  <Link to="/login" className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(false)} style={{ flex: 1, textAlign: 'center' }}>Log In</Link>
                  <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setSidebarOpen(false)} style={{ flex: 1, textAlign: 'center' }}>Register</Link>
                </div>
              )}

              {/* Navigation Section */}
              <div>
                <div className="sidebar-section-title">Navigation</div>
                <div className="sidebar-menu-list">
                  <Link to="/" className={`sidebar-menu-item ${isActive('/') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <Sparkles size={18} /> Discover
                  </Link>
                  <Link to="/events" className={`sidebar-menu-item ${isActive('/events') && !currentCategory ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <Calendar size={18} /> Competitions & Fests
                  </Link>
                  <Link to="/verify" className={`sidebar-menu-item ${isActive('/verify') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <ShieldCheck size={18} /> Verify Certificate
                  </Link>
                  
                  {isAuthenticated && (
                    <>
                      <Link to="/my-events" className={`sidebar-menu-item ${isActive('/my-events') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <Ticket size={18} /> My Registrations
                      </Link>
                      <Link to="/announcements" className={`sidebar-menu-item ${isActive('/announcements') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <Bell size={18} /> Updates
                      </Link>
                      <Link to="/certificates" className={`sidebar-menu-item ${isActive('/certificates') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <Award size={18} /> Certificates
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Explore Categories */}
              <div>
                <div className="sidebar-section-title">Explore Categories</div>
                <div className="sidebar-menu-list">
                  <Link to="/events?category=Technical" className={`sidebar-menu-item ${currentCategory === 'Technical' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <Code size={16} /> Hackathons & Tech
                  </Link>
                  <Link to="/events?category=Cultural" className={`sidebar-menu-item ${currentCategory === 'Cultural' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <Music size={16} /> Cultural Fests
                  </Link>
                  <Link to="/events?category=Academic" className={`sidebar-menu-item ${currentCategory === 'Academic' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    <Award size={16} /> Quizzes & Seminars
                  </Link>
                  <Link to="/events?category=Sports" className={`sidebar-menu-item ${currentCategory === 'Sports' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    🏆 Sports Tournaments
                  </Link>
                  <Link to="/events?category=Innovation" className={`sidebar-menu-item ${currentCategory === 'Innovation' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                    💡 Innovation & Startups
                  </Link>
                </div>
              </div>

              {/* Management Tools */}
              {isAuthenticated && (isOrganizer || isAdmin) && (
                <div>
                  <div className="sidebar-section-title">Management Tools</div>
                  <div className="sidebar-menu-list">
                    {isOrganizer && (
                      <>
                        <Link to="/organizer/dashboard" className={`sidebar-menu-item ${location.pathname.startsWith('/organizer') && location.pathname !== '/organizer/attendance' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                          <Shield size={18} /> Organizer Suite
                        </Link>
                        <Link to="/organizer/attendance" className={`sidebar-menu-item ${location.pathname === '/organizer/attendance' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                          <QrCode size={18} /> Attendance Desk & Scanner
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <Link to="/admin/dashboard" className={`sidebar-menu-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                          <Shield size={18} /> Admin Panel
                        </Link>
                        <Link to="/attendance" className={`sidebar-menu-item ${location.pathname === '/attendance' ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                          <QrCode size={18} /> Attendance Desk & Scanner
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}



              {/* Footer Account Actions */}
              {isAuthenticated && (
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Link to="/profile" className="sidebar-menu-item" onClick={() => setSidebarOpen(false)}>
                    <User size={16} /> Profile Settings
                  </Link>
                  <button className="sidebar-menu-item danger" onClick={() => { handleLogout(); setSidebarOpen(false); }} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </header>
  );
};

export default Navbar;

