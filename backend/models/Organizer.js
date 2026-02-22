const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const organizerSchema = new mongoose.Schema
({
    loginEmail: {
        type: String,
        required: [true, 'Please add a login email'],
        unique: true,
        lowercase: true,
        trim: true,
        immutable: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        select: false
    },

    organizerName: {
        type: String,
        required: [true, 'Please add an organizer name'],
        unique: true,
        trim: true
    },
    category: {
        type: String, // e.g., "Cultural", "Technical", "Sports", "Fest Team"
        required: [true, 'Please add a category']
    },
    collegeName: {
        type: String,
        required: [true, 'Please add college/organization name']
    },
    description: {
        type: String,
    },
    
    contactEmail: {
        type: String,
        required: [true, 'Please add a public contact email']
    },
    contactNumber: {
        type: String,
        default: ''
    },

    discordWebhook: {
        type: String,
        default: ''
    }

},
{
    timestamps: true
});

organizerSchema.pre('save', async function()
{
    if(!this.isModified('password'))
    {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

organizerSchema.methods.matchPassword = async function(enteredPassword)
{
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Organizer', organizerSchema);