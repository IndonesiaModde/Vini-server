const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const generateToken = (userId, expiresIn = config.jwtExpire) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, config.jwtSecret, { expiresIn: '30d' });
};

module.exports = {
  verifyToken,
  generateToken,
  generateRefreshToken
};
