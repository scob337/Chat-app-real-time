const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware'); // إضافة middleware
const JWT_CONFIG = {
  accessSecret: "mySuperAccessSecretKey123!",
  refreshSecret: "mySuperRefreshSecretKey456!",
  accessExpires: "7d",
  refreshExpires: "7d",
  bcryptSalt: 10
};
// Socket Token - إضافة route جديد

const createAccessToken = (user) => {
  return jwt.sign({ sub: user._id }, JWT_CONFIG.accessSecret, { expiresIn: JWT_CONFIG.accessExpires });
};

const createRefreshToken = (user) => {
  return jwt.sign({ sub: user._id }, JWT_CONFIG.refreshSecret, { expiresIn: JWT_CONFIG.refreshExpires });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already registered' });
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hash = await bcrypt.hash(password, saltRounds);
    const user = await User.create({ name, phone, passwordHash: hash });
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    
    // تخزين التوكن في الكوكيز
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7*24*60*60*1000
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
    });
    
    return res.json({ 
      message: 'User registered', 
      user: { id: user._id, name: user.name, phone: user.phone }
    });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    
    // تخزين التوكن في الكوكيز
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 دقيقة
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
    });
    
    return res.json({ 
      message: 'Logged in', 
      user: { id: user._id, name: user.name, phone: user.phone }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
        const user = await User.findById(decoded.sub);
        if (user) {
          user.refreshToken = null;
          await user.save();
        }
      } catch (err) {
        // حتى لو كان هناك خطأ في التوكن، سنقوم بمسح الكوكيز
      }
    }
    
    // مسح الكوكيز
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    return res.json({ message: 'Logged out' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token', error: err.message });
  }
});

// Refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
    
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
    const user = await User.findById(decoded.sub);
    
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ message: 'Invalid refresh token' });
    
    const accessToken = createAccessToken(user);
    
    // تحديث توكن الوصول في الكوكيز
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 دقيقة
    });
    
    return res.json({ message: 'Token refreshed' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
});


// في مسار socket-token
router.get('/socket-token', auth, (req, res) => {
  try {
    const token = jwt.sign(
      { sub: req.user.id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate socket token' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');
    return res.json({ user: { id: user._id, name: user.name, phone: user.phone } });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

module.exports = router;
