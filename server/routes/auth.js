const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    // INDUSTRY: Get or Create a default organization
    let org = await Organization.findOne({ name: 'Emotional Energy Global' });
    if (!org) {
      org = new Organization({ name: 'Emotional Energy Global', inviteCode: 'ENERGY2026' });
      await org.save();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with role and organization
    let user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'Member', // Default role
      organization: org._id
    });

    await user.save();

    // Generate JWT with role and org
    const token = jwt.sign(
      { id: user._id, role: user.role, organization: user.organization }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '1d' }
    );

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({ user: { id: user._id, username: user.username, email: user.email, role: user.role, organization: user.organization } });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with role and org
    const token = jwt.sign(
      { id: user._id, role: user.role, organization: user.organization }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '1d' }
    );

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role, organization: user.organization } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Load Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findById(verified.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role, organization: user.organization } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout User
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
