import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Award, ArrowRight, Zap, Trophy } from 'lucide-react';
import { getEventImage } from '../../utils/bannerPresets';

export default function HeroBannerCarousel({ events = [] }) {
  // Top featured opportunities to display in the banner rotation
  const featured = events.slice(0, 6);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Automatically advance to the next banner after 5 seconds
  useEffect(() => {
    if (featured.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featured.length, currentIndex]);

  if (featured.length === 0) return null;

  const currentEvent = featured[currentIndex] || featured[0];
  const bannerImg = getEventImage(currentEvent);

  const prevSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  const nextSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  return (
    <div className="hero-banner-carousel-container">
      {/* 5-Second Animated Progress Bar */}
      <div className="carousel-progress-track">
        <div key={currentIndex} className="carousel-progress-fill" />
      </div>

      {/* Background Banner with Gradient Overlay */}
      <div
        key={`bg-${currentIndex}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bannerImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.7s ease, transform 1.2s ease',
          opacity: 1,
        }}
      />

      {/* Rich Dark Gradient Vignette for Readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(90deg, rgba(9, 13, 22, 0.95) 0%, rgba(9, 13, 22, 0.85) 45%, rgba(9, 13, 22, 0.45) 80%, rgba(9, 13, 22, 0.25) 100%)',
          zIndex: 1,
        }}
      />

      {/* Slide Content with smooth Fade-In */}
      <div
        key={`content-${currentIndex}`}
        className="carousel-slide-fade"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '44px 50px',
          maxWidth: '720px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '4px 10px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Zap size={13} /> Featured Spotlight
          </span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            {currentEvent.category || 'Campus Opportunity'}
          </span>
          {currentEvent.prizes && currentEvent.prizes.length > 0 && (
            <span
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Trophy size={13} /> ₹{currentEvent.prizes[0].cashAmount?.toLocaleString('en-IN') || 'Prizes'} Prize Pool
            </span>
          )}
        </div>

        <h2
          style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: '12px',
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          {currentEvent.title}
        </h2>

        <p
          style={{
            fontSize: '1rem',
            color: '#e2e8f0',
            lineHeight: 1.55,
            marginBottom: '20px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
          }}
        >
          {currentEvent.description}
        </p>

        {/* Quick Details Badges */}
        <div
          style={{
            display: 'flex',
            gap: '18px',
            alignItems: 'center',
            marginBottom: '24px',
            fontSize: '0.88rem',
            color: '#cbd5e1',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: '#38bdf8' }} />
            <span>{currentEvent.date || 'Upcoming'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} style={{ color: '#38bdf8' }} />
            <span>{currentEvent.venueId?.name || (currentEvent.format === 'online' ? 'Online' : 'Campus Venue')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} style={{ color: '#38bdf8' }} />
            <span>Verified Certificate Included</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Link
            to={`/events/${currentEvent._id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0066ff',
              color: '#ffffff',
              padding: '12px 26px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.96rem',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0, 102, 255, 0.45)',
              transition: 'background 0.2s ease, transform 0.2s ease',
            }}
          >
            Explore & Register Now <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {/* Manual Left/Right Navigation Chevrons */}
      {featured.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s ease',
            }}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={nextSlide}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s ease',
            }}
            aria-label="Next Slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots Indicator with active pill indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              right: '24px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {featured.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                style={{
                  width: idx === currentIndex ? '28px' : '9px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentIndex ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                aria-label={`Jump to banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
