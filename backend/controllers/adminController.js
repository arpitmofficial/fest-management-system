const Organizer = require('../models/Organizer');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate random password
const generatePassword = () => {
    return crypto.randomBytes(8).toString('hex');
};

// @desc    Create new organizer
// @route   POST /api/admin/organizers
// @access  Private (Admin)
const createOrganizer = async (req, res) => {
    try {
        const { organizerName, category, collegeName, description, contactEmail, contactNumber } = req.body;

        // Generate login email and password
        const loginEmail = `${organizerName.toLowerCase().replace(/\s+/g, '_')}@felicity.iiit.ac.in`;
        const generatedPassword = generatePassword();

        // Check if organizer already exists
        const existingOrganizer = await Organizer.findOne({ 
            $or: [{ loginEmail }, { organizerName }] 
        });

        if (existingOrganizer) {
            return res.status(400).json({ message: 'Organizer with this name already exists' });
        }

        const organizer = await Organizer.create({
            loginEmail,
            password: generatedPassword,
            organizerName,
            category,
            collegeName,
            description,
            contactEmail,
            contactNumber
        });

        res.status(201).json({
            message: 'Organizer created successfully',
            organizer: {
                _id: organizer._id,
                organizerName: organizer.organizerName,
                loginEmail: organizer.loginEmail,
                category: organizer.category
            },
            credentials: {
                email: loginEmail,
                password: generatedPassword
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all organizers
// @route   GET /api/admin/organizers
// @access  Private (Admin)
const getOrganizers = async (req, res) => {
    try {
        const organizers = await Organizer.find().select('-password');
        res.json(organizers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete/Disable organizer
// @route   DELETE /api/admin/organizers/:id
// @access  Private (Admin)
const deleteOrganizer = async (req, res) => {
    try {
        const { archive } = req.query; // ?archive=true to archive instead of delete

        const organizer = await Organizer.findById(req.params.id);

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        if (archive === 'true') {
            // Just disable the account (could add an 'active' field to schema)
            // For now, we'll delete
            await organizer.deleteOne();
            res.json({ message: 'Organizer archived' });
        } else {
            await organizer.deleteOne();
            res.json({ message: 'Organizer permanently deleted' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all password reset requests
// @route   GET /api/admin/password-reset-requests
// @access  Private (Admin)
const getPasswordResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find()
            .populate('organizer', 'organizerName loginEmail')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Process password reset request
// @route   PUT /api/admin/password-reset-requests/:id
// @access  Private (Admin)
const processPasswordResetRequest = async (req, res) => {
    try {
        const { status, comment } = req.body; // 'approved' or 'rejected'
        
        const request = await PasswordResetRequest.findById(req.params.id)
            .populate('organizer');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        request.status = status;
        request.adminComment = comment;
        request.processedBy = req.user._id;
        request.processedAt = new Date();

        if (status === 'approved') {
            // Generate new password
            const newPassword = generatePassword();
            
            // Update organizer password
            const organizer = await Organizer.findById(request.organizer._id);
            organizer.password = newPassword;
            await organizer.save();

            request.newPassword = newPassword; // Store temporarily for admin to view

            res.json({
                message: 'Password reset approved',
                newCredentials: {
                    email: organizer.loginEmail,
                    password: newPassword
                }
            });
        } else {
            res.json({ message: 'Password reset rejected' });
        }

        await request.save();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = async (req, res) => {
    try {
        const Participant = require('../models/Participant');
        const Event = require('../models/Event');
        const Ticket = require('../models/Ticket');

        const stats = {
            totalOrganizers: await Organizer.countDocuments(),
            totalParticipants: await Participant.countDocuments(),
            totalEvents: await Event.countDocuments(),
            totalRegistrations: await Ticket.countDocuments(),
            pendingPasswordResets: await PasswordResetRequest.countDocuments({ status: 'pending' })
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createOrganizer,
    getOrganizers,
    deleteOrganizer,
    getPasswordResetRequests,
    processPasswordResetRequest,
    getDashboard
};
