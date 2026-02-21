const mongoose = require('mongoose');

// Custom form field schema for form builder
const formFieldSchema = new mongoose.Schema({
    fieldName: { type: String, required: true },
    fieldType: { 
        type: String, 
        enum: ['text', 'textarea', 'number', 'email', 'dropdown', 'checkbox', 'radio', 'file', 'date'],
        required: true 
    },
    options: [String], // For dropdown, checkbox, radio
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
}, { _id: true });

// Merchandise variant schema
const merchandiseVariantSchema = new mongoose.Schema({
    size: String,
    color: String,
    stock: { type: Number, default: 0 },
    price: { type: Number, required: true }
}, { _id: true });

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true
    },
    eventDescription: {
        type: String,
        required: [true, 'Event description is required']
    },
    eventType: {
        type: String,
        enum: ['normal', 'merchandise'],
        required: [true, 'Event type is required']
    },
    eligibility: {
        type: String,
        enum: ['all', 'iiit-only', 'non-iiit-only'],
        default: 'all'
    },
    registrationDeadline: {
        type: Date,
        required: [true, 'Registration deadline is required']
    },
    eventStartDate: {
        type: Date,
        required: [true, 'Event start date is required']
    },
    eventEndDate: {
        type: Date,
        required: [true, 'Event end date is required']
    },
    registrationLimit: {
        type: Number,
        default: null // null means unlimited
    },
    registrationCount: {
        type: Number,
        default: 0
    },
    registrationFee: {
        type: Number,
        default: 0
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    eventTags: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
        default: 'draft'
    },

    // For normal events - custom form builder
    customFields: [formFieldSchema],
    formLocked: {
        type: Boolean,
        default: false
    },

    // For merchandise events
    merchandiseVariants: [merchandiseVariantSchema],
    purchaseLimitPerParticipant: {
        type: Number,
        default: 1
    },

    // Analytics
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search
eventSchema.index({ eventName: 'text', eventDescription: 'text', eventTags: 'text' });

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
    const now = new Date();
    const deadlinePassed = this.registrationDeadline < now;
    const limitReached = this.registrationLimit && this.registrationCount >= this.registrationLimit;
    return this.status === 'published' && !deadlinePassed && !limitReached;
});

module.exports = mongoose.model('Event', eventSchema);
