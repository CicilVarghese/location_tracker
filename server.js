    const express = require('express');
    const path = require('path');
    const app = express();
    const http = require('http').Server(app);
    const { Server } = require('socket.io');
    const mongoose = require('mongoose');
    const session = require('express-session');
    const bcrypt = require('bcrypt');
    const axios = require('axios');
    const User = require('./models/User');

    const io = new Server(http);
    const port = 3000;

    // MongoDB connection
    mongoose.connect('mongodb://localhost:27017/purewebrtc').then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Database connection error:', err));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({
    secret: 'super_secret_key',
    resave: false,
    saveUninitialized: false,
    }));
    app.use(express.static('public'));

    // View Engine Setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    // Utility Function: Check Authentication
    function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
    }

    // Authentication Routes
    app.get('/signup', (req, res) => res.render('signup'));


    app.post('/check-email', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ exists: true, message: 'Email is required' });
            }

            const existingUser = await User.findOne({ email });
            res.json({ exists: !!existingUser });
        } catch (error) {
            console.error('Error checking email:', error);
            res.status(500).json({ exists: true, message: 'Server error checking email' });
        }
    });

    // Existing /signup route (already updated above)
    app.post('/signup', async (req, res) => {
        try {
            const { email, password, 'confirm-password': confirmPassword } = req.body;

            if (password !== confirmPassword) {
                return res.status(400).send('Passwords do not match. Please try again.');
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).send('This email is already registered. Please use a different email or log in.');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await new User({ email, password: hashedPassword }).save();
            res.redirect('/login');
        } catch (error) {
            console.error('Error during signup:', error);
            res.status(500).send('Internal server error');
        }
    });

    app.post('/login', async (req, res) => {
        try {
            const { email, password, token, serverUrl } = req.body;
            const user = await User.findOne({ email });

            if (user && await bcrypt.compare(password, user.password)) {
                req.session.userId = user._id;
                req.session.token = token;
                req.session.djangoServerURL = serverUrl;
                return res.redirect('/');
            }

            // Store the error in session instead of directly rendering
            req.session.loginError = 'Invalid credentials';
            return res.redirect('/login');
        } catch (error) {
            console.error('Error during login:', error);
            req.session.loginError = 'Internal server error';
            return res.redirect('/login');
        }
    });

    // Update the login GET route to show error only once
    app.get('/login', (req, res) => {
        const error = req.session.loginError;
        req.session.loginError = null; // Clear the error after showing it
        res.render('login', { error });
    });




    app.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).send('Could not log out.');
            res.redirect('/login');
        });
    });

    // Protected Routes
    app.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('streamer', {
        user: user,
        token: req.session.token,  // Pass token to EJS
        djangoServerURL: req.session.djangoServerURL  // Pass Django server URL to EJS
        });
    } catch (error) {
        console.error('Error loading user dashboard:', error);
        res.status(500).send('Internal server error');
    }
    });

    // Location sharing socket.io handling
    io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register Device
    socket.on('register_device', ({ email }) => {
        console.log(`Device registered: ${email}`);
    });

            // Handle Location Sharing
            socket.on("send_location", async (coords) => {
                const { email, lat, long, token, djangoServerURL } = coords;
                console.log(JSON.stringify({ email, lat, long, token }));
                console.log(`Django server URL: ${djangoServerURL}`);

                // Send data to the Django server
                try {
                    const response = await axios.post(djangoServerURL, {
                        email,
                        latitude: lat,
                        longitude: long,
                        token
                    });
                    console.log(`Data sent to Django server : ${response.status}`);
                } catch (error) {
                    console.error("Error sending data to Django server:", error.message);
                }
                // Emit location to other connected clients
                io.emit('receive-location', { id: socket.id, email, lat, long });
            });
        
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
    });

    http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    });
