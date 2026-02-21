const Feedback = require('../models/Feedback');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

// @desc    Submit feedback for an event
// @route   POST /api/feedback/:eventId
// @access  Private (Participant)
const submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const eventId = req.params.eventId;

        // Check if event exists and is completed
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if participant attended the event
        const ticket = await Ticket.findOne({
            event: eventId,
            participant: req.user._id,
            status: { $in: ['confirmed', 'attended'] }
        });

        if (!ticket) {
            return res.status(403).json({ message: 'You must have attended this event to submit feedback' });
        }

        // Check for existing feedback
        const existingFeedback = await Feedback.findOne({
            event: eventId,
            participant: req.user._id
        });

        if (existingFeedback) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event' });
        }

        const feedback = await Feedback.create({
            event: eventId,
            participant: req.user._id,
            rating,
            comment
        });

        res.status(201).json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get event feedback (Organizer view)
// @route   GET /api/feedback/:eventId
// @access  Private (Organizer)
const getEventFeedback = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check ownership (only organizer can view feedback details)
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const feedbacks = await Feedback.find({ event: req.params.eventId })
            .sort({ createdAt: -1 });

        // Calculate statistics
        const totalFeedbacks = feedbacks.length;
        const avgRating = totalFeedbacks > 0 
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
            : 0;

        const ratingDistribution = {
            1: feedbacks.filter(f => f.rating === 1).length,
            2: feedbacks.filter(f => f.rating === 2).length,
            3: feedbacks.filter(f => f.rating === 3).length,
            4: feedbacks.filter(f => f.rating === 4).length,
            5: feedbacks.filter(f => f.rating === 5).length
        };

        res.json({
            feedbacks,
            stats: {
                totalFeedbacks,
                avgRating: avgRating.toFixed(1),
                ratingDistribution
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    submitFeedback,
    getEventFeedback
};
