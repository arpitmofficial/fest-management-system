const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    registerForEvent,
    purchaseMerchandise,
    getMyTickets,
    getTicketById,
    cancelRegistration,
    updatePaymentStatus,
    markAttendance,
    verifyTicket
} = require('../controllers/ticketController');

// Participant routes
router.post('/register/:eventId', protect, authorize('participant'), registerForEvent);
router.post('/purchase/:eventId', protect, authorize('participant'), purchaseMerchandise);
router.get('/my-tickets', protect, authorize('participant'), getMyTickets);
router.get('/:id', protect, getTicketById);
router.delete('/:id', protect, authorize('participant'), cancelRegistration);

// Organizer routes
router.put('/:id/payment', protect, authorize('organizer'), updatePaymentStatus);
router.put('/:id/attend', protect, authorize('organizer'), markAttendance);
router.post('/verify', protect, authorize('organizer'), verifyTicket);

module.exports = router;
