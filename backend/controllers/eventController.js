const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Participant = require('../models/Participant');
const Organizer = require('../models/Organizer');
const QRCode = require('qrcode');
const axios = require('axios');

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

        // Fuzzy / partial search by name, description, tags, or organizer name
        if (search) {
            // Escape special regex characters for safety, then allow fuzzy matching
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Build a flexible pattern: allow partial word matches
            const fuzzyPattern = escaped.split(/\s+/).map(w => `(?=.*${w})`).join('');
            const regex = new RegExp(fuzzyPattern, 'i');

            // Also search by organizer name
            const matchingOrganizers = await Organizer.find({
                organizerName: { $regex: regex }
            }).select('_id');
            const orgIds = matchingOrganizers.map(o => o._id);

            query.$or = [
                { eventName: { $regex: regex } },
                { eventDescription: { $regex: regex } },
                { eventTags: { $regex: regex } },
                ...(orgIds.length > 0 ? [{ organizer: { $in: orgIds } }] : [])
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

        // Trending events (top 5 by registration count and views)
        if (trending === 'true') {
            events = await Event.find({ status: { $in: ['published', 'ongoing'] } })
                .sort({ registrationCount: -1, viewCount: -1 })
                .limit(5)
                .populate('organizer', 'organizerName category');
        } else {
            events = await Event.find(query)
                .sort({ createdAt: -1 })
                .populate('organizer', 'organizerName category');

            // Preference-based ordering: boost events matching user interests
            if (req.user && req.user.role === 'participant') {
                try {
                    const participant = await Participant.findById(req.user._id);
                    if (participant && participant.interests && participant.interests.length > 0) {
                        const interests = participant.interests.map(i => i.toLowerCase());
                        const followedIds = (participant.followedOrganizers || []).map(id => id.toString());

                        events = events.map(e => {
                            let score = 0;
                            // Boost if event tags match interests
                            (e.eventTags || []).forEach(tag => {
                                if (interests.some(interest => tag.toLowerCase().includes(interest) || interest.includes(tag.toLowerCase()))) {
                                    score += 2;
                                }
                            });
                            // Boost if organizer is followed
                            if (followedIds.includes(e.organizer?._id?.toString())) {
                                score += 3;
                            }
                            return { ...e.toObject(), _preferenceScore: score };
                        });

                        // Sort by preference score (higher first) then by date
                        events.sort((a, b) => b._preferenceScore - a._preferenceScore);
                    }
                } catch (prefErr) {
                    console.error('Preference sorting error:', prefErr);
                    // Continue with default order
                }
            }
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
            // Allow limited updates - customFields only if no registrations yet
            const allowedFields = ['eventDescription', 'registrationDeadline', 'registrationLimit', 'status'];

            // Allow customFields update only if form is not locked (no registrations)
            if (!event.formLocked && event.registrationCount === 0) {
                allowedFields.push('customFields');
            }

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
        console.error('Update Event Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
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

        // Auto-post to Discord webhook if configured
        try {
            const organizer = await Organizer.findById(event.organizer);
            if (organizer && organizer.discordWebhook) {
                await axios.post(organizer.discordWebhook, {
                    embeds: [{
                        title: `🎉 New Event: ${event.eventName}`,
                        description: event.eventDescription?.substring(0, 200) || '',
                        color: 0x5865F2,
                        fields: [
                            { name: 'Type', value: event.eventType, inline: true },
                            { name: 'Date', value: new Date(event.eventStartDate).toLocaleDateString(), inline: true },
                            { name: 'Fee', value: event.registrationFee ? `₹${event.registrationFee}` : 'Free', inline: true },
                            { name: 'Eligibility', value: event.eligibility, inline: true }
                        ],
                        footer: { text: `Organized by ${organizer.organizerName}` }
                    }]
                });
                console.log('Discord notification sent for event:', event.eventName);
            }
        } catch (discordErr) {
            console.error('Discord notification failed:', discordErr.message);
            // Don't fail the publish if Discord fails
        }

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

// @desc    Export event participants as CSV
// @route   GET /api/events/:id/participants/export
// @access  Private (Organizer - owner only)
const exportParticipantsCSV = async (req, res) => {
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

        const header = 'Name,Email,Contact,College,Registration Date,Status,Payment Status,Amount\n';
        const rows = tickets.map(t => {
            const p = t.participant || {};
            const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
            const regDate = new Date(t.createdAt).toISOString().split('T')[0];
            const payStatus = t.merchandiseDetails?.paymentStatus || 'N/A';
            const amount = t.merchandiseDetails?.totalAmount || t.amount || 0;
            return `"${name}","${p.email || ''}","${p.contactNumber || ''}","${p.collegeName || ''}",${regDate},${t.status},${payStatus},${amount}`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=participants_${event.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
        res.send(header + rows);
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
    getEventAnalytics,
    exportParticipantsCSV
};
