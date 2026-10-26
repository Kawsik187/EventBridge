import React from 'react';

const CapacityBar = ({ current = 0, max }) => {
  const safeCurrent = Math.max(Number(current) || 0, 0);
  const safeMax = Number(max);

  if (!safeMax || safeMax <= 0) {
    return (
      <div style={{ width: '100%' }}>
        <div className="event-card-capacity">
          <span className="capacity-text">{safeCurrent} registered (Unlimited capacity)</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Open</span>
        </div>
        <div className="capacity-progress-bar">
          <div className="capacity-progress-fill" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  const percentage = Math.min(Math.round((safeCurrent / safeMax) * 100), 100);
  const seatsLeft = Math.max(safeMax - safeCurrent, 0);

  let statusText = `${safeCurrent} / ${safeMax} registered`;
  if (seatsLeft === 0) {
    statusText = 'Full capacity (0 seats left)';
  } else if (seatsLeft <= 15) {
    statusText = `${seatsLeft} seats left (${safeCurrent}/${safeMax})`;
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="event-card-capacity">
        <span className={`capacity-text ${seatsLeft <= 15 && seatsLeft > 0 ? 'urgent' : ''}`}>
          {statusText}
        </span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
          {percentage}%
        </span>
      </div>
      <div className="capacity-progress-bar">
        <div
          className={`capacity-progress-fill ${percentage >= 100 ? 'full' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default CapacityBar;
