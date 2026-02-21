const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    updateInterests,
    toggleFollowOrganizer,
    getOrganizers,
    getOrganizerById,
    changePassword
} = require('../controllers/participantController');

// All routes are protected and for participants only
router.use(protect, authorize('participant'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/interests', updateInterests);
router.put('/follow/:organizerId', toggleFollowOrganizer);
router.get('/organizers', getOrganizers);
router.get('/organizers/:id', getOrganizerById);
router.put('/change-password', changePassword);

module.exports = router;
