const Participant = require('../models/Participant');
const Organizer = require('../models/Organizer');

// @desc    Get current participant profile
// @route   GET /api/participants/profile
// @access  Private (Participant)
const getProfile = async (req, res) => {
    try {
        const participant = await Participant.findById(req.user._id)
            .populate('followedOrganizers', 'organizerName category');
        res.json(participant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update participant profile
// @route   PUT /api/participants/profile
// @access  Private (Participant)
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, collegeName, interests } = req.body;

        const participant = await Participant.findById(req.user._id);

        if (firstName) participant.firstName = firstName;
        if (lastName) participant.lastName = lastName;
        if (contactNumber) participant.contactNumber = contactNumber;
        if (collegeName && participant.participantType !== 'IIIT') {
            participant.collegeName = collegeName;
        }
        if (interests) participant.interests = interests;

        await participant.save();
        res.json(participant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update interests (onboarding)
// @route   PUT /api/participants/interests
// @access  Private (Participant)
const updateInterests = async (req, res) => {
    try {
        const { interests } = req.body;
        
        const participant = await Participant.findByIdAndUpdate(
            req.user._id,
            { interests },
            { new: true }
        );

        res.json(participant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Follow/Unfollow organizer
// @route   PUT /api/participants/follow/:organizerId
// @access  Private (Participant)
const toggleFollowOrganizer = async (req, res) => {
    try {
        const participant = await Participant.findById(req.user._id);
        const organizerId = req.params.organizerId;

        // Check if organizer exists
        const organizer = await Organizer.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const followIndex = participant.followedOrganizers.indexOf(organizerId);
        
        if (followIndex > -1) {
            // Unfollow
            participant.followedOrganizers.splice(followIndex, 1);
        } else {
            // Follow
            participant.followedOrganizers.push(organizerId);
        }

        await participant.save();
        res.json({ 
            following: followIndex === -1,
            followedOrganizers: participant.followedOrganizers 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all organizers
// @route   GET /api/participants/organizers
// @access  Private (Participant)
const getOrganizers = async (req, res) => {
    try {
        const organizers = await Organizer.find()
            .select('organizerName category description contactEmail');
        res.json(organizers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get organizer details
// @route   GET /api/participants/organizers/:id
// @access  Private (Participant)
const getOrganizerById = async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.params.id)
            .select('organizerName category description contactEmail');
        
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        res.json(organizer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Change password
// @route   PUT /api/participants/change-password
// @access  Private (Participant)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const participant = await Participant.findById(req.user._id).select('+password');

        if (!(await participant.matchPassword(currentPassword))) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        participant.password = newPassword;
        await participant.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updateInterests,
    toggleFollowOrganizer,
    getOrganizers,
    getOrganizerById,
    changePassword
};
