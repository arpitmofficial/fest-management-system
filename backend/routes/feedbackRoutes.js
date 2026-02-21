const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { submitFeedback, getEventFeedback } = require('../controllers/feedbackController');

router.post('/:eventId', protect, authorize('participant'), submitFeedback);
router.get('/:eventId', protect, getEventFeedback); // Allow all authenticated users to view feedback

module.exports = router;
