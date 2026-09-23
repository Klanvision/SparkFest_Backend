const jwt = require('jsonwebtoken');
const config = require('../config');
const dataStore = require('../models/dataStore');

class AuthService {
  adminLogin(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const isMatch = (
      email.trim().toLowerCase() === config.adminCredentials.email.toLowerCase() &&
      password.trim() === config.adminCredentials.password
    );

    if (!isMatch) {
      throw new Error('Invalid administrator credentials.');
    }

    const payload = {
      sub: 'admin-1',
      role: 'ADMIN',
      email: config.adminCredentials.email
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    dataStore.logAudit('ADMIN_LOGIN', email, { success: true });

    return {
      token,
      admin: {
        email: config.adminCredentials.email,
        role: 'ADMIN'
      }
    };
  }

  verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
  }
}

module.exports = new AuthService();
