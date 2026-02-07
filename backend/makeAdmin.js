require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const makeAdmin = async (email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD) =>
{
    try
    {
        await connectDB();
        const adminExists = await Admin.findOne({ email: email });
        
        if(adminExists)
        {
            console.log(`Admin with email ${email} already exists. Skipping creation.`);
            process.exit();
        }

        const admin = new Admin
        ({
            email: email,
            password: password
        });

        await admin.save();
        console.log(`Admin with email ${email} created successfully!`);
        process.exit();

    }
    catch(error)
    {
        console.error(`Error creating admin with email ${email}: ${error.message}`);
        process.exit(1);
    }
};

makeAdmin();