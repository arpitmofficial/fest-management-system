const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    reason: {
        type: String,
        required: [true, 'Please provide a reason for password reset']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminComment: String,
    newPassword: String, // Temporarily stored (hashed) when approved
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    processedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
