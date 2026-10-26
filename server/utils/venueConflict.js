import Event from '../models/Event.js';

/**
 * Helper to convert "HH:mm" time string into total minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Checks whether a proposed venue booking conflicts with existing approved/published/live/pending events.
 * 
 * @param {string} venueId 
 * @param {string} date - "YYYY-MM-DD"
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @param {string} [excludeEventId] - Event ID to exclude (if editing an existing event)
 * @returns {Promise<{ hasConflict: boolean, conflictingEvent?: object }>}
 */
export const checkVenueConflict = async (venueId, date, startTime, endTime, excludeEventId = null) => {
  const reqStartMins = timeToMinutes(startTime);
  const reqEndMins = timeToMinutes(endTime);

  // Find all events booked for the same venue and date that are active/pending/approved/live/completed
  const query = {
    venueId,
    date,
    status: { $in: ['pending', 'approved', 'open', 'closed', 'live', 'completed'] },
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const existingEvents = await Event.find(query).populate('venueId', 'name code');

  for (const event of existingEvents) {
    const existingStartMins = timeToMinutes(event.startTime);
    const existingEndMins = timeToMinutes(event.endTime);

    // Overlap check: reqStart < existingEnd AND reqEnd > existingStart
    if (reqStartMins < existingEndMins && reqEndMins > existingStartMins) {
      return {
        hasConflict: true,
        conflictingEvent: {
          id: event._id,
          title: event.title,
          venueName: event.venueId?.name || 'Selected Venue',
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status,
        },
      };
    }
  }

  return { hasConflict: false };
};
