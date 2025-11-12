const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_CONFIG = {
  accessSecret: "mySuperAccessSecretKey123!",
  refreshSecret: "mySuperRefreshSecretKey456!",
  accessExpires: "7d",
  refreshExpires: "7d",
  bcryptSalt: 10
};

const authMiddleware = async (req, res, next) => {
  try {
    // الحصول على التوكن من الكوكيز أولاً
    let token = req.cookies.accessToken;
    
    // إذا لم يكن هناك توكن في الكوكيز، نتحقق من رأس الطلب للتوافق مع الإصدارات السابقة
    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2) {
        return res.status(401).json({ message: 'Token error' });
      }

      token = parts[1];
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, JWT_CONFIG.accessSecret);

    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};

module.exports = authMiddleware;
