const express = require('express');
const router = express.Router();
const { registerParticipant, loginUser } = require('../controllers/authController');
const { verifyCaptcha } = require('../middleware/captchaMiddleware');

// Route: POST /api/auth/register
// Description: Register a new participant
router.post('/register', verifyCaptcha, registerParticipant);

// Route: POST /api/auth/login
// Description: Login for Admin, Organizer, or Participant
router.post('/login', verifyCaptcha, loginUser);

module.exports = router;