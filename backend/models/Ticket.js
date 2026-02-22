const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled', 'rejected', 'attended'],
        default: 'confirmed'
    },
    registrationData: {
        type: mongoose.Schema.Types.Mixed, // Stores custom form responses
        default: {}
    },

    // For merchandise
    merchandiseDetails: {
        variant: String,
        quantity: { type: Number, default: 1 },
        totalAmount: Number,
        paymentProof: String, // URL to uploaded image
        paymentStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },

    // For team events
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },

    // QR Code data
    qrCode: String,
    
    // Attendance
    attended: {
        type: Boolean,
        default: false
    },
    attendedAt: Date,

    // Email sent
    emailSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Generate unique ticket ID before saving
ticketSchema.pre('save', async function() {
    if (!this.ticketId) {
        const prefix = 'TKT';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.ticketId = `${prefix}-${timestamp}-${random}`;
    }
});

module.exports = mongoose.model('Ticket', ticketSchema);
