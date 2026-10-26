import React from 'react';
import { Link } from 'react-router-dom';

/**
 * EventBridge BrandLogo Component
 * Renders the high-resolution event emblem with stylized, responsive typography.
 *
 * @param {'sm'|'md'|'lg'} size - Overall display size
 * @param {'auto'|'light'|'dark'} variant - Color contrast mode ('light' for dark navy/black background)
 * @param {boolean} showTagline - Displays "PLAN • MANAGE • EXPERIENCE"
 * @param {'horizontal'|'vertical'} layout - Layout direction
 * @param {boolean} link - Wraps brand in a React Router Link to '/'
 * @param {string} className - Additional CSS class names
 */
const BrandLogo = ({
  size = 'md',
  variant = 'auto',
  showTagline = true,
  layout = 'horizontal',
  link = true,
  className = '',
  style = {},
  onClick,
}) => {
  const containerClasses = [
    'brand-logo-container',
    `size-${size}`,
    `layout-${layout}`,
    variant === 'light' ? 'variant-light' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <img
        src="/logo-icon.png"
        alt="EventBridge Logo"
        className="brand-emblem"
      />
      <div className="brand-text-block">
        <span className="brand-title">
          <span className="brand-word-event">Event</span>
          <span className="brand-word-bridge">Bridge</span>
        </span>
        {showTagline && (
          <span className="brand-tagline-text">
            PLAN • MANAGE • EXPERIENCE
          </span>
        )}
      </div>
    </>
  );

  if (link) {
    return (
      <Link to="/" onClick={onClick} className={containerClasses} style={style} title="EventBridge — Campus Opportunities">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={containerClasses} style={style}>
      {content}
    </div>
  );
};

export default BrandLogo;
