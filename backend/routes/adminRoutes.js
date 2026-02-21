const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createOrganizer,
    getOrganizers,
    deleteOrganizer,
    getPasswordResetRequests,
    processPasswordResetRequest,
    getDashboard
} = require('../controllers/adminController');

// All routes are protected and for admin only
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.post('/organizers', createOrganizer);
router.get('/organizers', getOrganizers);
router.delete('/organizers/:id', deleteOrganizer);
router.get('/password-reset-requests', getPasswordResetRequests);
router.put('/password-reset-requests/:id', processPasswordResetRequest);

module.exports = router;
