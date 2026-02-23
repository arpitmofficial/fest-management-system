const DiscussionMessage = require('../models/DiscussionMessage');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// @desc    Get messages for an event
// @route   GET /api/discussions/:eventId
// @access  Private (Participant registered for event, or Organizer who owns event)
const getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify access
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const isOrganizer = req.user.role === 'organizer' && event.organizer.toString() === req.user._id.toString();
        const isRegistered = req.user.role === 'participant' && await Ticket.exists({
            event: eventId,
            participant: req.user._id,
            status: { $in: ['confirmed', 'attended'] }
        });

        if (!isOrganizer && !isRegistered) {
            return res.status(403).json({ message: 'You must be registered for this event to view discussions' });
        }

        // Get pinned messages first, then regular messages
        const pinned = await DiscussionMessage.find({ event: eventId, isPinned: true, isDeleted: false })
            .sort({ createdAt: -1 });

        const messages = await DiscussionMessage.find({ event: eventId, isPinned: false, isDeleted: false, parentMessage: null })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await DiscussionMessage.countDocuments({ event: eventId, isDeleted: false, parentMessage: null });

        res.json({
            pinned,
            messages,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            isOrganizer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get replies to a message (threading)
// @route   GET /api/discussions/:eventId/replies/:messageId
// @access  Private
const getReplies = async (req, res) => {
    try {
        const replies = await DiscussionMessage.find({
            parentMessage: req.params.messageId, isDeleted: false
        }).sort({ createdAt: 1 });
        res.json(replies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Post a message
// @route   POST /api/discussions/:eventId
// @access  Private (Registered participant or event organizer)
const postMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, parentMessage, isAnnouncement } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const isOrganizer = req.user.role === 'organizer' && event.organizer.toString() === req.user._id.toString();
        const isRegistered = req.user.role === 'participant' && await Ticket.exists({
            event: eventId,
            participant: req.user._id,
            status: { $in: ['confirmed', 'attended'] }
        });

        if (!isOrganizer && !isRegistered) {
            return res.status(403).json({ message: 'You must be registered for this event to post' });
        }

        // Only organizers can make announcements
        const announcement = isOrganizer && isAnnouncement ? true : false;

        // Determine author name
        let authorName;
        if (isOrganizer) {
            const Organizer = require('../models/Organizer');
            const org = await Organizer.findById(req.user._id);
            authorName = org?.organizerName || 'Organizer';
        } else {
            const Participant = require('../models/Participant');
            const p = await Participant.findById(req.user._id);
            authorName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Participant';
        }

        const message = await DiscussionMessage.create({
            event: eventId,
            author: req.user._id,
            authorModel: isOrganizer ? 'Organizer' : 'Participant',
            authorName,
            content,
            isAnnouncement: announcement,
            parentMessage: parentMessage || null
        });

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a message (organizer moderation or own message)
// @route   DELETE /api/discussions/:eventId/:messageId
// @access  Private (Organizer or message author)
const deleteMessage = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const message = await DiscussionMessage.findById(messageId);

        if (!message) return res.status(404).json({ message: 'Message not found' });

        const event = await Event.findById(eventId);
        const isOrganizer = req.user.role === 'organizer' && event.organizer.toString() === req.user._id.toString();
        const isAuthor = message.author.toString() === req.user._id.toString();

        if (!isOrganizer && !isAuthor) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedBy = req.user._id;
        message.content = '[Message deleted]';
        await message.save();

        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Pin/unpin a message (organizer only)
// @route   PUT /api/discussions/:eventId/:messageId/pin
// @access  Private (Organizer)
const togglePin = async (req, res) => {
    try {
        const { eventId, messageId } = req.params;
        const event = await Event.findById(eventId);

        if (!event || event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the event organizer can pin messages' });
        }

        const message = await DiscussionMessage.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        message.isPinned = !message.isPinned;
        await message.save();

        res.json({ pinned: message.isPinned });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    React to a message
// @route   PUT /api/discussions/:eventId/:messageId/react
// @access  Private
const reactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const validEmojis = ['👍', '❤️', '😂', '🎉', '🤔', '👎'];

        if (!validEmojis.includes(emoji)) {
            return res.status(400).json({ message: 'Invalid reaction' });
        }

        const message = await DiscussionMessage.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Toggle reaction: if user already reacted with same emoji, remove it
        const existingIndex = message.reactions.findIndex(
            r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
        );

        if (existingIndex >= 0) {
            message.reactions.splice(existingIndex, 1);
        } else {
            // Remove any existing reaction by this user
            message.reactions = message.reactions.filter(
                r => r.user.toString() !== req.user._id.toString()
            );
            message.reactions.push({ user: req.user._id, emoji });
        }

        await message.save();
        res.json({ reactions: message.reactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMessages,
    getReplies,
    postMessage,
    deleteMessage,
    togglePin,
    reactToMessage
};
