const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    getDashboard,
    sendDiscordNotification,
    requestPasswordReset,
    getMyPasswordResetRequests
} = require('../controllers/organizerController');

// All routes are protected and for organizers only
router.use(protect, authorize('organizer'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboard);
router.post('/discord-notify', sendDiscordNotification);
router.post('/request-password-reset', requestPasswordReset);
router.get('/password-reset-requests', getMyPasswordResetRequests);

module.exports = router;
