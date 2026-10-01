const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'diwali_dhamaka_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminCredentials: {
    email: process.env.ADMIN_EMAIL || 'kirankumamoopuri@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'klan@lucky333'
  },
  defaultDraw: {
    id: 'draw-diwali-2026',
    name: 'Diwali Dhamaka Grand Lucky Draw 2026',
    // Set for Nov 10, 2026, 19:00:00 IST (UTC+05:30)
    scheduledAt: '2026-11-10T13:30:00.000Z',
    status: 'SCHEDULED', // SCHEDULED, LIVE, COMPLETED
    totalPrizePool: '₹8₹+'
  },
  cloudflare: {
    databaseName: process.env.CLOUDFLARE_DATABASE_NAME || 'viswasluckydraw_db',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || 'ffd21a79-cb5b-4b4f-b607-6e930b4478ef',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || ''
  }
};

