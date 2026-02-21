const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getMyEvents,
    publishEvent,
    getEventParticipants,
    getEventAnalytics
} = require('../controllers/eventController');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Organizer routes
router.post('/', protect, authorize('organizer'), createEvent);
router.get('/organizer/my-events', protect, authorize('organizer'), getMyEvents);
router.put('/:id', protect, authorize('organizer'), updateEvent);
router.delete('/:id', protect, authorize('organizer'), deleteEvent);
router.put('/:id/publish', protect, authorize('organizer'), publishEvent);
router.get('/:id/participants', protect, authorize('organizer'), getEventParticipants);
router.get('/:id/analytics', protect, authorize('organizer'), getEventAnalytics);

module.exports = router;
