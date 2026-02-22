const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const QRCode = require('qrcode');

// @desc    Register for event
// @route   POST /api/tickets/register/:eventId
// @access  Private (Participant)
const registerForEvent = async (req, res) => {
    try {
        console.log('=== REGISTRATION START ===');
        console.log('Registration request body:', JSON.stringify(req.body));
        console.log('User:', JSON.stringify(req.user));
        console.log('Event ID:', req.params.eventId);
        
        const event = await Event.findById(req.params.eventId);
        console.log('Event found:', event ? event.eventName : 'NOT FOUND');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if registration is open
        if (event.status !== 'published') {
            return res.status(400).json({ message: 'Registration is not open for this event' });
        }

        // Check deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }

        // Check registration limit
        if (event.registrationLimit && event.registrationCount >= event.registrationLimit) {
            return res.status(400).json({ message: 'Registration limit reached' });
        }

        // Check eligibility
        if (event.eligibility === 'iiit-only' && req.user.participantType !== 'IIIT') {
            return res.status(403).json({ message: 'This event is only for IIIT students' });
        }
        if (event.eligibility === 'non-iiit-only' && req.user.participantType === 'IIIT') {
            return res.status(403).json({ message: 'This event is only for non-IIIT participants' });
        }

        // Check if already registered
        const existingTicket = await Ticket.findOne({
            event: req.params.eventId,
            participant: req.user._id
        });

        if (existingTicket) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // Generate ticket ID
        const prefix = 'TKT';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const ticketId = `${prefix}-${timestamp}-${random}`;

        // Create ticket - handle formData properly
        const registrationData = req.body.formData || req.body || {};
        
        const ticketData = {
            ticketId,
            event: req.params.eventId,
            participant: req.user._id,
            registrationData: registrationData,
            status: event.registrationFee > 0 ? 'pending' : 'confirmed'
        };

        console.log('Creating ticket with data:', JSON.stringify(ticketData));
        
        let ticket;
        try {
            ticket = await Ticket.create(ticketData);
            console.log('Ticket created:', ticket._id);
        } catch (createError) {
            console.error('Ticket.create error:', createError);
            return res.status(500).json({ message: 'Failed to create ticket', error: createError.message });
        }

        // Generate QR code
        try {
            const qrData = JSON.stringify({
                ticketId: ticket.ticketId,
                eventId: event._id.toString(),
                participantId: req.user._id.toString()
            });
            
            ticket.qrCode = await QRCode.toDataURL(qrData);
            await ticket.save();
            console.log('QR code generated');
        } catch (qrError) {
            console.error('QR code error:', qrError);
            // Continue without QR code
        }

        // Increment registration count and lock form
        await Event.findByIdAndUpdate(req.params.eventId, {
            $inc: { registrationCount: 1 },
            $set: { formLocked: true }
        });

        console.log('Ticket created successfully:', ticket.ticketId);
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Purchase merchandise
// @route   POST /api/tickets/purchase/:eventId
// @access  Private (Participant)
const purchaseMerchandise = async (req, res) => {
    try {
        const { variantId, quantity, paymentProof } = req.body;
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.eventType !== 'merchandise') {
            return res.status(400).json({ message: 'This is not a merchandise event' });
        }

        // Find variant
        const variant = event.merchandiseVariants.id(variantId);
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }

        // Check stock
        if (variant.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Check purchase limit
        const existingPurchases = await Ticket.countDocuments({
            event: req.params.eventId,
            participant: req.user._id,
            'merchandiseDetails.paymentStatus': { $in: ['pending', 'approved'] }
        });

        if (existingPurchases + quantity > event.purchaseLimitPerParticipant) {
            return res.status(400).json({ 
                message: `Purchase limit is ${event.purchaseLimitPerParticipant} per participant` 
            });
        }

        // Create ticket with pending payment
        const ticket = await Ticket.create({
            event: req.params.eventId,
            participant: req.user._id,
            status: 'pending',
            merchandiseDetails: {
                variant: `${variant.size || ''} ${variant.color || ''}`.trim(),
                quantity,
                totalAmount: variant.price * quantity,
                paymentProof,
                paymentStatus: 'pending'
            }
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get participant's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private (Participant)
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ participant: req.user._id })
            .populate('event', 'eventName eventType eventStartDate eventEndDate organizer status')
            .populate({
                path: 'event',
                populate: { path: 'organizer', select: 'organizerName' }
            })
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('event')
            .populate('participant', 'firstName lastName email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check authorization
        const isParticipant = ticket.participant._id.toString() === req.user._id.toString();
        const isOrganizer = ticket.event.organizer.toString() === req.user._id.toString();
        
        if (!isParticipant && !isOrganizer && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Cancel registration
// @route   DELETE /api/tickets/:id
// @access  Private (Participant)
const cancelRegistration = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.participant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ticket.status === 'attended') {
            return res.status(400).json({ message: 'Cannot cancel after attendance' });
        }

        ticket.status = 'cancelled';
        await ticket.save();

        // Decrement registration count
        await Event.findByIdAndUpdate(ticket.event, { $inc: { registrationCount: -1 } });

        res.json({ message: 'Registration cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve/Reject merchandise payment (Organizer)
// @route   PUT /api/tickets/:id/payment
// @access  Private (Organizer)
const updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const ticket = await Ticket.findById(req.params.id).populate('event');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ticket.merchandiseDetails.paymentStatus !== 'pending') {
            return res.status(400).json({ message: 'Payment already processed' });
        }

        ticket.merchandiseDetails.paymentStatus = status;
        
        if (status === 'approved') {
            ticket.status = 'confirmed';
            
            // Generate QR code on approval
            const qrData = JSON.stringify({
                ticketId: ticket.ticketId,
                eventId: ticket.event._id,
                participantId: ticket.participant
            });
            ticket.qrCode = await QRCode.toDataURL(qrData);

            // Decrement stock
            const event = await Event.findById(ticket.event._id);
            const variantName = ticket.merchandiseDetails.variant;
            // Note: Stock management would need variant ID stored for proper decrement
            
            // Increment registration count
            event.registrationCount += 1;
            await event.save();
        } else {
            ticket.status = 'rejected';
        }

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark attendance (QR Scan)
// @route   PUT /api/tickets/:id/attend
// @access  Private (Organizer)
const markAttendance = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('event');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ticket.attended) {
            return res.status(400).json({ message: 'Already marked as attended' });
        }

        if (ticket.status !== 'confirmed') {
            return res.status(400).json({ message: 'Ticket is not confirmed' });
        }

        ticket.attended = true;
        ticket.attendedAt = new Date();
        ticket.status = 'attended';
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify ticket by QR/Ticket ID
// @route   POST /api/tickets/verify
// @access  Private (Organizer)
const verifyTicket = async (req, res) => {
    try {
        const { ticketId, eventId } = req.body;

        const ticket = await Ticket.findOne({ ticketId })
            .populate('event')
            .populate('participant', 'firstName lastName email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.event._id.toString() !== eventId) {
            return res.status(400).json({ message: 'Ticket does not belong to this event' });
        }

        if (ticket.event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({
            valid: true,
            ticket,
            alreadyAttended: ticket.attended
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    registerForEvent,
    purchaseMerchandise,
    getMyTickets,
    getTicketById,
    cancelRegistration,
    updatePaymentStatus,
    markAttendance,
    verifyTicket
};
