const express = require('express');
const router = express.Router();
const { registerParticipant, loginUser } = require('../controllers/authController');

// Route: POST /api/auth/register
// Description: Register a new participant
router.post('/register', registerParticipant);

// Route: POST /api/auth/login
// Description: Login for Admin, Organizer, or Participant
router.post('/login', loginUser);

module.exports = router;