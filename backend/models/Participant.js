const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const participantSchema = new mongoose.Schema
({
    firstName: {
        type: String,
        required: [true, 'Please add a first name']
    },
    lastName: {
        type: String,
        required: [true, 'Please add a last name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    contactNumber: {
        type: String,
        required: [true, 'Please add a contact number']
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    participantType: {
        type: String,
        enum: ['IIIT', 'Non-IIIT'],
        required: [true, 'Please specify participant type']
    },
    collegeName: {
        type: String,
        required: function() {
            return this.participantType === 'Non-IIIT';
        },
        default: function() {
            return this.participantType === 'IIIT' ? 'IIIT Hyderabad' : '';
        }
    },
    interests: [{
        type: String
    }],
    followedOrganizers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer'
    }]
},
{
    timestamps: true
});


participantSchema.pre('save', async function(next)
{
    if(!this.isModified('password'))
    {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

participantSchema.methods.matchPassword = async function(enteredPassword)
{
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Participant', participantSchema);