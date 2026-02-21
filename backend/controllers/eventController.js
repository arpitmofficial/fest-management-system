const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const QRCode = require('qrcode');

// @desc    Create new event (Organizer only)
// @route   POST /api/events
// @access  Private (Organizer)
const createEvent = async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            status: 'draft'
        };

        const event = await Event.create(eventData);
        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all events (with filters)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        const { 
            search, 
            eventType, 
            eligibility, 
            startDate, 
            endDate, 
            organizer,
            status,
            followed,
            trending
        } = req.query;

        let query = { status: { $in: ['published', 'ongoing'] } };

        // Search by name or description
        if (search) {
            query.$or = [
                { eventName: { $regex: search, $options: 'i' } },
                { eventDescription: { $regex: search, $options: 'i' } },
                { eventTags: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by event type
        if (eventType) {
            query.eventType = eventType;
        }

        // Filter by eligibility
        if (eligibility) {
            query.eligibility = eligibility;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.eventStartDate = {};
            if (startDate) query.eventStartDate.$gte = new Date(startDate);
            if (endDate) query.eventStartDate.$lte = new Date(endDate);
        }

        // Filter by organizer
        if (organizer) {
            query.organizer = organizer;
        }

        // Filter by status (for organizers)
        if (status) {
            query.status = status;
        }

        // Filter by followed organizers
        if (followed && req.user && req.user.followedOrganizers) {
            query.organizer = { $in: req.user.followedOrganizers };
        }

        let events;
        
        // Trending events (top 5 by registration in last 24 hours)
        if (trending === 'true') {
            events = await Event.find({ status: 'published' })
                .sort({ registrationCount: -1, viewCount: -1 })
                .limit(5)
                .populate('organizer', 'organizerName category');
        } else {
            events = await Event.find(query)
                .sort({ createdAt: -1 })
                .populate('organizer', 'organizerName category');
        }

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'organizerName category description contactEmail');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Increment view count
        event.viewCount += 1;
        await event.save();

        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer - owner only)
const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check ownership
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        // Restrict updates based on status
        const { status: currentStatus } = event;
        const updates = req.body;

        if (currentStatus === 'ongoing' || currentStatus === 'completed') {
            // Only allow status change
            const allowedFields = ['status'];
            Object.keys(updates).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updates[key];
                }
            });
        } else if (currentStatus === 'published') {
            // Allow limited updates
            const allowedFields = ['eventDescription', 'registrationDeadline', 'registrationLimit', 'status'];
            Object.keys(updates).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updates[key];
                }
            });
        }

        // Lock form after first registration
        if (event.registrationCount > 0) {
            delete updates.customFields;
            event.formLocked = true;
        }

        event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete event (Draft only)
// @route   DELETE /api/events/:id
// @access  Private (Organizer - owner only)
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (event.status !== 'draft') {
            return res.status(400).json({ message: 'Only draft events can be deleted' });
        }

        await event.deleteOne();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get organizer's events
// @route   GET /api/events/my-events
// @access  Private (Organizer)
const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id })
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Publish event
// @route   PUT /api/events/:id/publish
// @access  Private (Organizer)
const publishEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (event.status !== 'draft') {
            return res.status(400).json({ message: 'Only draft events can be published' });
        }

        event.status = 'published';
        await event.save();

        // TODO: Send Discord webhook notification if configured
        
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get event participants
// @route   GET /api/events/:id/participants
// @access  Private (Organizer - owner only)
const getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const tickets = await Ticket.find({ event: req.params.id })
            .populate('participant', 'firstName lastName email contactNumber collegeName')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get event analytics
// @route   GET /api/events/:id/analytics
// @access  Private (Organizer - owner only)
const getEventAnalytics = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const tickets = await Ticket.find({ event: req.params.id });

        const analytics = {
            totalRegistrations: tickets.length,
            confirmedRegistrations: tickets.filter(t => t.status === 'confirmed').length,
            pendingRegistrations: tickets.filter(t => t.status === 'pending').length,
            attendedCount: tickets.filter(t => t.attended).length,
            revenue: tickets.reduce((sum, t) => {
                if (t.status === 'confirmed' || t.merchandiseDetails?.paymentStatus === 'approved') {
                    return sum + (t.merchandiseDetails?.totalAmount || event.registrationFee || 0);
                }
                return sum;
            }, 0),
            viewCount: event.viewCount
        };

        res.json(analytics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getMyEvents,
    publishEvent,
    getEventParticipants,
    getEventAnalytics
};
