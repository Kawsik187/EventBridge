import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'registered':
        return 'badge-registered';
      case 'open':
      case 'approved':
      case 'checked_in':
        return 'badge-open';
      case 'almost full':
        return 'badge-almost-full';
      case 'closed':
      case 'rejected':
      case 'cancelled':
        return 'badge-closed';
      case 'pending':
        return 'badge-pending';
      case 'draft':
        return 'badge-draft';
      case 'completed':
        return 'badge-completed';
      case 'live':
        return 'badge-live';
      default:
        return 'badge-open';
    }
  };

  const formatText = (st) => {
    if (!st) return 'Registration Open';
    if (st === 'open') return 'Registration Open';
    if (st === 'closed') return 'Registration Closed';
    if (st === 'completed') return 'Event Concluded';
    if (st === 'registered') return '✓ Registered';
    if (st === 'checked_in') return '✓ Checked In';
    if (st === 'live') return '⚡ Live Now';
    return st.replace('_', ' ');
  };

  return <span className={`badge ${getBadgeClass(status)}`}>{formatText(status)}</span>;
};

export default StatusBadge;

