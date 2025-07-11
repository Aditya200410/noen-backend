const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Admin signup
const adminSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, email, password: hashedPassword });
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }
    // Find admin by email or username
    const admin = await Admin.findOne(email ? { email } : { username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Use a consistent JWT secret - ensure it's the same as in middleware
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    // Generate JWT with admin-specific claims
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        isAdmin: true,
        role: 'admin',
        type: 'admin' // Add type to distinguish from other tokens
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('Admin login successful:', { id: admin._id, email: admin.email });
    
    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        isAdmin: true,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin token verification endpoint
const verifyAdminToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if it's an admin token
    if (!decoded.isAdmin || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Not an admin token' });
    }

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        isAdmin: decoded.isAdmin,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  adminLogin,
  adminSignup,
  verifyAdminToken
}; 