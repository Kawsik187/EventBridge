import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import EventCard from '../../components/events/EventCard';
import HeroBannerCarousel from '../../components/events/HeroBannerCarousel';
import { Sparkles, Calendar, Award, Flame, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

const Discover = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      registrationService.getMyRegistrations()
        .then((regs) => {
          const ids = new Set(
            (regs || [])
              .filter((r) => r.status !== 'cancelled')
              .map((r) => r.eventId?._id || r.eventId)
          );
          setRegisteredIds(ids);
        })
        .catch(() => {});
    } else {
      setRegisteredIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group events by section for Discover view
  const trendingEvents = events.filter((e) => e.currentRegistrations > 10 || e.category === 'Technical').slice(0, 3);
  const fests = events.filter((e) => e.category === 'Cultural' || e.category === 'Academic');
  const upcomingEvents = events.slice(0, 6);

  return (
    <div className="main-content" style={{ paddingTop: 0 }}>
      {/* Hero Banner Section */}
      <section className="discover-hero">
        <div className="content-wrap">
          <div className="discover-header-row">
            <div className="discover-title-wrap">
              <h1>Connecting Students with <span>Campus Opportunities</span></h1>
              <p>Explore hackathons, college fests, technical symposia, and certified student workshops all in one platform.</p>
            </div>
            <div>
              <Link to="/events" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
                Browse All Events <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Quick Stats Ticker */}
          <div className="hero-stats-row">
            <div className="stat-ticker-chip">
              <Zap size={14} /> 50+ Active Campus Opportunities
            </div>
            <div className="stat-ticker-chip">
              <ShieldCheck size={14} /> 100% Verified Organizers
            </div>
            <div className="stat-ticker-chip">
              <Award size={14} /> Verified Certificates Included
            </div>
          </div>
        </div>
      </section>

      {/* Main Discover Sections */}
      <div className="content-wrap">
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <p style={{ marginTop: '14px', fontWeight: '600', color: 'var(--primary)' }}>Loading campus opportunities...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <h3>No opportunities found</h3>
            <p>Try adjusting your search criteria or explore other categories.</p>
          </div>
        ) : (
          <>
            {/* Moving Event Banner Carousel (5s Auto-rotation) */}
            <HeroBannerCarousel events={events} />

            {/* Section 1: Hot & Trending Opportunities */}
            <section style={{ marginBottom: '44px' }}>
              <div className="section-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Flame size={24} style={{ color: 'var(--secondary)' }} /> Trending Competitions
                </h2>
                <Link to="/events" className="section-link">View All ({events.length}) <ArrowRight size={15} /></Link>
              </div>

              <div className="event-grid">
                {trendingEvents.map((evt) => (
                  <EventCard key={evt._id} event={evt} isRegistered={registeredIds.has(evt._id)} />
                ))}
              </div>
            </section>

            {/* Section 2: College Fests & Symposia */}
            {fests.length > 0 && (
              <section style={{ marginBottom: '44px' }}>
                <div className="section-header">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={24} style={{ color: 'var(--primary)' }} /> Campus Fests & Highlights
                  </h2>
                </div>
                <div className="event-grid">
                  {fests.map((evt) => (
                    <EventCard key={evt._id} event={evt} isRegistered={registeredIds.has(evt._id)} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: All Upcoming Campus Opportunities */}
            <section style={{ marginBottom: '44px' }}>
              <div className="section-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={24} style={{ color: 'var(--primary)' }} /> Upcoming Campus Events
                </h2>
              </div>
              <div className="event-grid">
                {upcomingEvents.map((evt) => (
                  <EventCard key={evt._id} event={evt} isRegistered={registeredIds.has(evt._id)} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;

