const mongoose = require('mongoose');

const discussionMessageSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'authorModel',
        required: true
    },
    authorModel: {
        type: String,
        enum: ['Participant', 'Organizer'],
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        maxlength: 2000
    },
    isAnnouncement: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiscussionMessage',
        default: null
    },
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId },
        emoji: { type: String, default: '👍' }
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true
});

// Index for fast event-based queries
discussionMessageSchema.index({ event: 1, createdAt: -1 });
discussionMessageSchema.index({ event: 1, isPinned: -1 });

module.exports = mongoose.model('DiscussionMessage', discussionMessageSchema);
