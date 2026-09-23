const authService = require('../services/authService');
const { HTTP_STATUS } = require('../constants');

const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Forbidden. Administrator privileges required.'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or expired authorization token.'
    });
  }
};

module.exports = { verifyAdmin };
