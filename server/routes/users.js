const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Update the path as per your directory structure
const Review = require('../models/review');
require('dotenv').config(); // If you're using dotenv for environment variables

const router = express.Router();

// Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ username: req.body.username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new user
    user = new User({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email, // Include if using email
      role: req.body.role // Include if using roles
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Save the user
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Your JWT secret from .env file
      { expiresIn: 3600 }, // Token expiration
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Create JWT payload including the user's role
    const payload = {
      user: {
        id: user.id,
        role: user.role // Include user role in the JWT payload
        
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Your JWT secret from .env file
      { expiresIn: 3600 }, // Token expiration
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          role: user.role, // Send role back in the response as well
          userId: user.id,
          name: user.name
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//Fetch user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update User Profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, email, contactNumber, address } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');

    // Update fields if they are provided in the request
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (address !== undefined) user.address = address;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;