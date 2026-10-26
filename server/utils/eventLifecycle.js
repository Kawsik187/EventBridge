import Event from '../models/Event.js';

/**
 * Checks if a registration deadline date string has passed.
 * Considers end of day (23:59:59.999) if only a YYYY-MM-DD date is provided.
 */
export const isDeadlinePassed = (deadlineStr) => {
  if (!deadlineStr) return false;
  let deadlineDate;
  const str = String(deadlineStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    deadlineDate = new Date(`${str}T23:59:59.999`);
  } else {
    deadlineDate = new Date(str);
  }
  return !isNaN(deadlineDate.getTime()) && new Date() > deadlineDate;
};

/**
 * Checks if an event has concluded based on date and end time.
 */
export const isEventFinished = (dateStr, endTimeStr) => {
  if (!dateStr) return false;
  const str = String(dateStr).trim();
  const time = endTimeStr && /^\d{1,2}:\d{2}$/.test(String(endTimeStr).trim())
    ? String(endTimeStr).trim()
    : '23:59';
  const endDateTime = new Date(`${str}T${time}:00`);
  return !isNaN(endDateTime.getTime()) && new Date() > endDateTime;
};

/**
 * Automatically synchronizes event statuses in database:
 * 1. Finished events are marked 'completed'
 * 2. Events whose registrationDeadline has passed (and are 'open' or 'approved') are marked 'closed'
 */
export const syncEventStatuses = async () => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    // 1. Mark finished events as 'completed'
    await Event.updateMany(
      {
        status: { $in: ['open', 'approved', 'live', 'closed', 'pending'] },
        $or: [
          { date: { $lt: currentDateStr } },
          { date: currentDateStr, endTime: { $lte: currentTimeStr } },
        ],
      },
      { $set: { status: 'completed' } }
    );

    // 2. Mark deadline-passed events as 'closed'
    await Event.updateMany(
      {
        status: { $in: ['open', 'approved'] },
        $or: [
          { registrationDeadline: { $lt: currentDateStr } },
          { registrationEndDate: { $lt: now } },
        ],
      },
      { $set: { status: 'closed' } }
    );
  } catch (error) {
    console.warn('[EventLifecycle Sync Warning]:', error.message);
  }
};
