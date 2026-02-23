const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getMessages,
    getReplies,
    postMessage,
    deleteMessage,
    togglePin,
    reactToMessage
} = require('../controllers/discussionController');

// All routes require authentication
router.use(protect);

// Get messages for an event (participants + organizer)
router.get('/:eventId', getMessages);

// Get replies to a specific message
router.get('/:eventId/replies/:messageId', getReplies);

// Post a new message
router.post('/:eventId', postMessage);

// Delete a message (organizer moderation or own message)
router.delete('/:eventId/:messageId', deleteMessage);

// Pin/unpin a message (organizer only)
router.put('/:eventId/:messageId/pin', togglePin);

// React to a message
router.put('/:eventId/:messageId/react', reactToMessage);

module.exports = router;
