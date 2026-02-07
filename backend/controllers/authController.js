const Participant = require('../models/Participant');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) =>
{
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new participant
// @route   POST /api/auth/register
// @access  Public
const registerParticipant = async (req, res) =>
{
    try
    {
        const
        { 
            firstName, lastName, email, password, 
            contactNumber, participantType, collegeName, interests 
        } = req.body;

        // required fields
        if(!firstName || !lastName || !email || !password || !contactNumber || !participantType)
        {
            return res.status(400).json({message: 'Please fill in all required fields'});
        }

        // iiit email
        if(participantType === 'IIIT')
        {
            const allowedDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
            const isValidIIITEmail = allowedDomains.some(domain => email.endsWith(domain));
            
            if(!isValidIIITEmail)
            {
                return res.status(400).json({message: 'Use a valid IIIT email for IIIT participants'});
            }
        }

        // user existance
        const userExists = await Participant.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const participant = await Participant.create({
            firstName,
            lastName,
            email,
            password,
            contactNumber,
            participantType,
            collegeName: participantType === 'IIIT' ? 'IIIT Hyderabad' : collegeName,
            interests
        });

        if(participant)
        {
            res.status(201).json({
                _id: participant.id,
                firstName: participant.firstName,
                email: participant.email,
                role: 'participant',
                token: generateToken(participant.id, 'participant')
            });
        }
        else
        {
            res.status(400).json({ message: 'Invalid user data' });
        }

    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) =>
{
    const { email, password, role } = req.body;

    if(!role)
    {
        return res.status(400).json({ message: "Please select a role (participant/organizer/admin)" });
    }

    try
    {
        let user;
        
        if(role === 'admin')
        {
            user = await Admin.findOne({ email }).select('+password');
        }
        else if(role === 'organizer')
        {
            user = await Organizer.findOne({ loginEmail: email }).select('+password'); 
        }
        else
        {
            user = await Participant.findOne({ email }).select('+password');
        }

        if(user && (await user.matchPassword(password)))
        {
            res.json({
                _id: user.id,
                email: role === 'organizer' ? user.loginEmail : user.email,
                role: role,
                firstName: role === 'participant' ? user.firstName : undefined,
                organizerName: role === 'organizer' ? user.organizerName : undefined,
                token: generateToken(user.id, role)
            });
        }
        else
        {
            res.status(401).json({ message: 'Invalid email or password' });
        }

    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { registerParticipant, loginUser };