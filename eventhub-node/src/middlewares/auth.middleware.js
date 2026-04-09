const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eventhub-secret-key';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Token ')) {
    return res.status(401).json({ message: 'Authentication credentials were not provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware: allow request through but attach user if token present
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Token ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }

  next();
};

// Middleware: only admin (role === 'admin') can write, everyone can read
const isAdminOrReadOnly = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication credentials were not provided.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  next();
};

module.exports = { authenticate, optionalAuth, isAdminOrReadOnly, JWT_SECRET };
