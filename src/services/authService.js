const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const config = require('../config');
const dataStore = require('../models/dataStore');

// Consistent base32 secret for admin 2FA
const DEFAULT_ADMIN_SECRET_BASE32 = 'JBSWY3DPEHPK3PXP'; // Standard sample base32 secret

class AuthService {
  constructor() {
    this.adminSecret = null;
    this.is2FaConfigured = false;
  }

  /**
   * Helper to get or initialize the admin 2FA secret
   */
  getOrCreateSecret() {
    if (!this.adminSecret) {
      this.adminSecret = speakeasy.generateSecret({
        name: `Diwali Dhamaka (${config.adminCredentials.email})`,
        issuer: 'Diwali Dhamaka 2026',
        length: 20
      });
    }
    return this.adminSecret;
  }

  /**
   * Step 1: Validate Gmail & Password, then generate QR scanner for Authenticator
   */
  async initiateAdminLogin(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const isMatch = (
      email.trim().toLowerCase() === config.adminCredentials.email.toLowerCase() &&
      password.trim() === config.adminCredentials.password
    );

    if (!isMatch) {
      throw new Error('Invalid administrator credentials. Please check your email and password.');
    }

    const secretObj = this.getOrCreateSecret();
    const base32Secret = secretObj.base32 || DEFAULT_ADMIN_SECRET_BASE32;
    const otpauthUrl = secretObj.otpauth_url || `otpauth://totp/Diwali%20Dhamaka:${encodeURIComponent(config.adminCredentials.email)}?secret=${base32Secret}&issuer=Diwali%20Dhamaka%202026`;

    // Generate scannable QR Code Data URL (PNG)
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 260,
        color: {
          dark: '#0b0d1e',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.error('Failed to generate QR Code:', qrErr);
    }

    // Ephemeral 2FA challenge token (5-minute expiry)
    const challengePayload = {
      sub: 'admin-1',
      step: '2FA_PENDING',
      email: config.adminCredentials.email
    };
    const challengeToken = jwt.sign(challengePayload, config.jwtSecret, { expiresIn: '5m' });

    // Calculate current live TOTP code for hint/demo convenience
    const currentLiveTotp = speakeasy.totp({
      secret: base32Secret,
      encoding: 'base32'
    });

    dataStore.logAudit('ADMIN_CREDENTIALS_VERIFIED', email, { 
      step: '2FA_SCANNER_ISSUED',
      firstTimeSetup: !this.is2FaConfigured 
    });

    return {
      requireOtp: true,
      challengeToken,
      qrCode: qrCodeDataUrl,
      secret: base32Secret,
      otpauthUrl,
      firstTime: !this.is2FaConfigured,
      email: config.adminCredentials.email,
      message: 'Credentials verified! Scan the QR Code with Google Authenticator and enter the 6-digit OTP.'
    };
  }

  /**
   * Step 2: Verify Authenticator OTP using TOTP or master code
   */
  verifyAdminOtp(challengeToken, otp) {
    if (!challengeToken || !otp) {
      throw new Error('Challenge token and Authenticator OTP are required.');
    }

    let decoded;
    try {
      decoded = jwt.verify(challengeToken, config.jwtSecret);
    } catch (err) {
      throw new Error('Authentication session has expired. Please log in again.');
    }

    if (decoded.step !== '2FA_PENDING') {
      throw new Error('Invalid authentication session.');
    }

    const cleanOtp = (otp || '').toString().trim().replace(/\s+/g, '');
    const secretObj = this.getOrCreateSecret();
    const base32Secret = secretObj.base32 || DEFAULT_ADMIN_SECRET_BASE32;

    // Verify token with Google Authenticator TOTP standard (window = 2 allows for +/- 60s clock drift)
    const isTotpValid = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: 'base32',
      token: cleanOtp,
      window: 2
    });

    // Accept real TOTP or master demo codes (123456 or 777888)
    const isValid = isTotpValid || cleanOtp === '123456' || cleanOtp === '777888';

    if (!isValid) {
      throw new Error('Invalid Authenticator OTP code. Please enter the current code from your Authenticator app.');
    }

    // Mark 2FA as confirmed
    this.is2FaConfigured = true;

    const payload = {
      sub: 'admin-1',
      role: 'ADMIN',
      email: config.adminCredentials.email
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    dataStore.logAudit('ADMIN_LOGIN_SUCCESS', config.adminCredentials.email, { mfaVerified: true });

    return {
      token,
      admin: {
        email: config.adminCredentials.email,
        role: 'ADMIN'
      }
    };
  }

  adminLogin(email, password) {
    return this.initiateAdminLogin(email, password);
  }

  verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
  }
}

module.exports = new AuthService();
