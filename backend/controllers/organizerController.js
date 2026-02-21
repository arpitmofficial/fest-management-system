const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const axios = require('axios');

// @desc    Get organizer profile
// @route   GET /api/organizers/profile
// @access  Private (Organizer)
const getProfile = async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.user._id);
        res.json(organizer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update organizer profile
// @route   PUT /api/organizers/profile
// @access  Private (Organizer)
const updateProfile = async (req, res) => {
    try {
        console.log('Update profile request:', req.body);
        console.log('User ID:', req.user._id);
        
        const { organizerName, category, description, contactEmail, contactNumber, discordWebhook } = req.body;

        // Build update object - only include fields that are provided
        const updateFields = {};
        if (organizerName) updateFields.organizerName = organizerName;
        if (category) updateFields.category = category;
        if (description !== undefined) updateFields.description = description;
        if (contactEmail) updateFields.contactEmail = contactEmail;
        if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
        if (discordWebhook !== undefined) updateFields.discordWebhook = discordWebhook;

        console.log('Update fields:', updateFields);

        const organizer = await Organizer.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true }
        );

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        console.log('Update successful:', organizer);
        res.json(organizer);
    } catch (error) {
        console.error('Update profile error:', error);
        // Handle duplicate key error for organizerName
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Organizer name already exists' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/organizers/dashboard
// @access  Private (Organizer)
const getDashboard = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id });

        const stats = {
            totalEvents: events.length,
            draftEvents: events.filter(e => e.status === 'draft').length,
            publishedEvents: events.filter(e => e.status === 'published').length,
            ongoingEvents: events.filter(e => e.status === 'ongoing').length,
            completedEvents: events.filter(e => e.status === 'completed').length,
            totalRegistrations: events.reduce((sum, e) => sum + e.registrationCount, 0),
            totalViews: events.reduce((sum, e) => sum + e.viewCount, 0)
        };

        res.json({ stats, events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send Discord notification
// @route   POST /api/organizers/discord-notify
// @access  Private (Organizer)
const sendDiscordNotification = async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.user._id);

        if (!organizer.discordWebhook) {
            return res.status(400).json({ message: 'Discord webhook not configured' });
        }

        const { eventId } = req.body;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Send to Discord
        await axios.post(organizer.discordWebhook, {
            embeds: [{
                title: `🎉 New Event: ${event.eventName}`,
                description: event.eventDescription,
                color: 0x5865F2,
                fields: [
                    { name: 'Type', value: event.eventType, inline: true },
                    { name: 'Date', value: new Date(event.eventStartDate).toLocaleDateString(), inline: true },
                    { name: 'Registration Fee', value: event.registrationFee ? `₹${event.registrationFee}` : 'Free', inline: true }
                ],
                footer: { text: `Organized by ${organizer.organizerName}` }
            }]
        });

        res.json({ message: 'Notification sent to Discord' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send Discord notification' });
    }
};

// @desc    Request password reset
// @route   POST /api/organizers/request-password-reset
// @access  Private (Organizer)
const requestPasswordReset = async (req, res) => {
    try {
        const { reason } = req.body;

        // Check for existing pending request
        const existingRequest = await PasswordResetRequest.findOne({
            organizer: req.user._id,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending password reset request' });
        }

        const request = await PasswordResetRequest.create({
            organizer: req.user._id,
            reason
        });

        res.status(201).json({ message: 'Password reset request submitted', request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my password reset requests
// @route   GET /api/organizers/password-reset-requests
// @access  Private (Organizer)
const getMyPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({ organizer: req.user._id })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getDashboard,
    sendDiscordNotification,
    requestPasswordReset,
    getMyPasswordResetRequests
};
