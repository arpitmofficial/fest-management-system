const axios = require('axios');

// Verify Google reCAPTCHA v3 token
const verifyCaptcha = async (req, res, next) => {
    const { captchaToken } = req.body;

    // Skip in development if secret not configured
    if (!process.env.RECAPTCHA_SECRET_KEY) {
        console.log('reCAPTCHA not configured — skipping verification');
        return next();
    }

    if (!captchaToken) {
        return res.status(400).json({ message: 'CAPTCHA verification required' });
    }

    try {
        const { data } = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captchaToken
                }
            }
        );

        if (!data.success) {
            return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
        }

        // reCAPTCHA v3 returns a score (0.0 to 1.0)
        // 1.0 = very likely a real user, 0.0 = very likely a bot
        // Threshold of 0.5 is recommended by Google
        if (data.score !== undefined && data.score < 0.5) {
            return res.status(400).json({
                message: 'Suspicious activity detected. Please try again later.'
            });
        }

        // Store score in request for logging/analytics
        req.captchaScore = data.score;
        next();
    } catch (error) {
        console.error('CAPTCHA verification error:', error.message);
        return res.status(500).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }
};

module.exports = { verifyCaptcha };
