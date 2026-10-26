import Venue from '../models/Venue.js';
import { checkVenueConflict } from '../utils/venueConflict.js';

export const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find({}).sort({ name: 1 });
    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venues' });
  }
};

export const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json(venue);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching venue' });
  }
};

export const createVenue = async (req, res) => {
  try {
    const { name, code, location, capacity, amenities } = req.body;

    const existingCode = await Venue.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Venue code already exists' });
    }

    const venue = await Venue.create({
      name,
      code: code.toUpperCase(),
      location,
      capacity,
      amenities: amenities || [],
    });

    res.status(201).json(venue);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating venue' });
  }
};

export const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    venue.name = req.body.name || venue.name;
    venue.location = req.body.location || venue.location;
    venue.capacity = req.body.capacity || venue.capacity;
    venue.amenities = req.body.amenities || venue.amenities;
    venue.status = req.body.status || venue.status;

    const updatedVenue = await venue.save();
    res.json(updatedVenue);
  } catch (error) {
    res.status(500).json({ message: 'Error updating venue' });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { venueId, date, startTime, endTime, excludeEventId } = req.query;

    if (!venueId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'venueId, date, startTime, and endTime are required' });
    }

    const conflictResult = await checkVenueConflict(venueId, date, startTime, endTime, excludeEventId);

    if (conflictResult.hasConflict) {
      return res.json({
        available: false,
        conflict: conflictResult.conflictingEvent,
        message: `Venue conflict detected with event "${conflictResult.conflictingEvent.title}" (${conflictResult.conflictingEvent.startTime} - ${conflictResult.conflictingEvent.endTime})`,
      });
    }

    res.json({ available: true, message: 'Venue is available' });
  } catch (error) {
    res.status(500).json({ message: 'Error checking venue availability' });
  }
};
