require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// 2. Mount the Routes
// This tells the server: "Any URL that starts with /api/auth, send it to authRoutes"
app.use('/api/auth', authRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});