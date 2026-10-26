/**
 * Calendar and Ticket Pass Utilities for EventBridge
 */

// Helper to format Date + time string (HH:mm) into UTC string YYYYMMDDTHHmmssZ
const formatToUtcString = (dateStr, timeStr) => {
  if (!dateStr) return '';
  
  // Parse time
  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[3]?.toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }
  }

  // Create Date object
  const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
  if (!year || !month || !day) return '';

  const localDate = new Date(year, month - 1, day, hours, minutes, 0);
  return localDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Builds a direct Google Calendar web link
 */
export const generateGoogleCalendarUrl = (event) => {
  if (!event) return '#';

  const title = event.title || 'Campus Event';
  const description = `${event.description ? event.description.slice(0, 300) : ''}\n\nCategory: ${event.category || 'Event'}\nOrganized via EventBridge Campus Platform.`;
  const venue = event.venueId?.name ? `${event.venueId.name} (${event.venueId.location || 'Campus'})` : (event.venueName || 'Main Campus');

  const startUtc = formatToUtcString(event.date, event.startTime);
  // Default end time to 2 hours after start if missing
  let endUtc = formatToUtcString(event.date, event.endTime);
  if (!endUtc && startUtc) {
    const d = new Date(event.date);
    d.setHours(d.getHours() + 2);
    endUtc = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  const datesParam = startUtc && endUtc ? `${startUtc}/${endUtc}` : '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: description,
    location: venue,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generates an RFC-5545 compliant .ics file and initiates client download
 */
export const downloadIcsFile = (event) => {
  if (!event) return;

  const title = (event.title || 'Campus Event').replace(/[\r\n]+/g, ' ');
  const description = (event.description || 'College Event organized via EventBridge').replace(/[\r\n]+/g, '\\n');
  const venue = event.venueId?.name ? `${event.venueId.name}, ${event.venueId.location || 'Campus'}` : 'Campus Venue';
  const startUtc = formatToUtcString(event.date, event.startTime) || '20261015T090000Z';
  const endUtc = formatToUtcString(event.date, event.endTime) || '20261015T120000Z';
  const uid = `eventbridge-${event._id || Date.now()}@campus.edu`;
  const nowUtc = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventBridge//College Event Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${venue}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'event'}.ics`;

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

/**
 * Downloads the QR Ticket image directly to student's device
 */
export const downloadQrImage = (qrCodeDataUrl, registrationId = 'TICKET') => {
  if (!qrCodeDataUrl) return;

  const link = document.createElement('a');
  link.href = qrCodeDataUrl;
  link.download = `CampusPass-${registrationId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
