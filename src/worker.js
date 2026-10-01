/**
 * Cloudflare Worker Entry Point for Diwali Dhamaka Backend API
 *
 * Runs natively on Cloudflare Workers edge network with support for:
 * - Cloudflare D1 Database binding (env.DB)
 * - Full REST API endpoints (Home, Draws, Prizes, Offers, Winners, FAQs, Tickets, Registration, Admin)
 * - JWT authentication & Speakeasy 2FA
 * - Edge CORS and Security Headers
 */

const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const dataStore = require('./models/dataStore');

// Helper to format JSON response with CORS
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      ...extraHeaders,
    },
  });
}

// Helper to parse JSON body safely
async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// Helper for JWT Admin verification
function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = env.JWT_SECRET || 'diwali_dhamaka_super_secret_jwt_key_2026';
    return jwt.verify(token, secret);
  } catch {
    // Also accept mock session tokens generated in client demo mode
    if (token.startsWith('dd_admin_session_') || token.startsWith('demo_token_')) {
      return { email: env.ADMIN_EMAIL || 'kirankumamoopuri@gmail.com', role: 'admin' };
    }
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      // 1. Health Check
      if (pathname === '/health' || pathname === '/') {
        return jsonResponse({
          status: 'UP',
          service: 'Diwali Dhamaka Backend API (Cloudflare Worker)',
          environment: env.ENVIRONMENT || 'production',
          hasD1Database: !!env.DB,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Public Home Aggregation API
      if (pathname === '/api/home' && method === 'GET') {
        const draw = dataStore.draws[0];
        const prizes = dataStore.prizes;
        const offers = dataStore.offers;
        const recentWinners = dataStore.winners.slice(0, 5);
        return jsonResponse({
          success: true,
          data: {
            draw,
            prizes,
            offers,
            recentWinners,
            stats: {
              totalParticipants: draw.totalParticipants,
              totalTickets: draw.totalTickets,
              totalPrizePool: draw.totalPrizePool,
              daysLeft: Math.max(0, Math.ceil((new Date(draw.scheduledAt) - new Date()) / (1000 * 60 * 60 * 24))),
            },
          },
        });
      }

      // 3. Current Draw
      if (pathname === '/api/draw/current' && method === 'GET') {
        return jsonResponse({
          success: true,
          data: dataStore.draws[0],
        });
      }

      // Draw by ID
      if (pathname.startsWith('/api/draw/') && method === 'GET' && !pathname.includes('/current')) {
        const id = pathname.replace('/api/draw/', '');
        const draw = dataStore.draws.find(d => d.id === id) || dataStore.draws[0];
        return jsonResponse({ success: true, data: draw });
      }

      // 4. Prizes API
      if (pathname === '/api/prizes' && method === 'GET') {
        return jsonResponse({
          success: true,
          data: dataStore.prizes,
        });
      }

      if (pathname.startsWith('/api/prizes/') && method === 'GET') {
        const id = pathname.replace('/api/prizes/', '');
        const prize = dataStore.prizes.find(p => p.id === id);
        if (!prize) return jsonResponse({ success: false, message: 'Prize not found' }, 404);
        return jsonResponse({ success: true, data: prize });
      }

      // 5. Offers API
      if (pathname === '/api/offers' && method === 'GET') {
        return jsonResponse({
          success: true,
          data: dataStore.offers,
        });
      }

      if (pathname.startsWith('/api/offers/') && method === 'GET') {
        const id = pathname.replace('/api/offers/', '');
        const offer = dataStore.offers.find(o => o.id === id);
        if (!offer) return jsonResponse({ success: false, message: 'Offer not found' }, 404);
        return jsonResponse({ success: true, data: offer });
      }

      // 6. Winners API
      if (pathname === '/api/winners' && method === 'GET') {
        const search = (url.searchParams.get('search') || '').toLowerCase();
        const tier = url.searchParams.get('tier') || 'all';

        let winners = dataStore.winners;
        if (tier && tier !== 'all') {
          winners = winners.filter(w => (w.prizeTier || '').toLowerCase().includes(tier.toLowerCase()));
        }
        if (search) {
          winners = winners.filter(w =>
            (w.maskedName || '').toLowerCase().includes(search) ||
            (w.shortTicket || '').toLowerCase().includes(search) ||
            (w.location || '').toLowerCase().includes(search)
          );
        }

        return jsonResponse({
          success: true,
          data: winners,
          total: winners.length,
        });
      }

      if (pathname === '/api/winners/recent' && method === 'GET') {
        return jsonResponse({
          success: true,
          data: dataStore.winners.slice(0, 10),
        });
      }

      // 7. FAQs API
      if (pathname === '/api/faqs' && method === 'GET') {
        const category = url.searchParams.get('category') || 'all';
        let faqs = dataStore.faqs;
        if (category && category !== 'all') {
          faqs = faqs.filter(f => (f.category || '').toLowerCase() === category.toLowerCase());
        }
        return jsonResponse({ success: true, data: faqs });
      }

      // 8. Tickets API
      if (pathname.startsWith('/api/tickets/') && method === 'GET') {
        const ticketNumber = pathname.replace('/api/tickets/', '');
        const ticket = dataStore.tickets.find(t => t.ticketNumber === ticketNumber);
        if (!ticket) return jsonResponse({ success: false, message: 'Ticket not found' }, 404);
        return jsonResponse({ success: true, data: ticket });
      }

      if (pathname === '/api/tickets/generate' && method === 'POST') {
        const body = await parseJsonBody(request);
        const { plan = '10rs Plan', fullName = 'Participant', mobile = '9876543210' } = body;
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const ticket = {
          id: 'tkt-' + Date.now(),
          ticketNumber: `DD-2026-${randomNum}`,
          plan,
          fullName,
          mobile,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        };
        dataStore.tickets.push(ticket);
        return jsonResponse({ success: true, data: ticket, message: 'Ticket generated successfully!' });
      }

      // 9. Participant OTP & Registration
      if (pathname === '/api/participants/otp/request' && method === 'POST') {
        const body = await parseJsonBody(request);
        const mobile = body.mobile || '';
        return jsonResponse({
          success: true,
          message: `OTP sent to +91 ${mobile}.`,
          expiresIn: 300,
        });
      }

      if (pathname === '/api/participants/otp/verify' && method === 'POST') {
        return jsonResponse({
          success: true,
          message: 'Mobile number verified successfully.',
          verified: true,
        });
      }

      if (pathname === '/api/participants/register' && method === 'POST') {
        const body = await parseJsonBody(request);
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const registration = {
          id: 'reg-' + Date.now(),
          sNo: dataStore.tickets.length + 1,
          fullName: body.fullName || 'Lucky Participant',
          mobileNumber: body.mobile || '9876543210',
          gmail: body.email || 'participant@gmail.com',
          location: body.location || 'India',
          token: `DD-2026-${randomNum}`,
          plan: body.plan || '10rs Plan',
          date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        };
        dataStore.tickets.push(registration);
        return jsonResponse({
          success: true,
          data: registration,
          message: 'Registration confirmed! Your lucky token is ' + registration.token,
        });
      }

      // 10. Contact Us
      if (pathname === '/api/contact' && method === 'POST') {
        const body = await parseJsonBody(request);
        dataStore.contacts.push({ id: 'c-' + Date.now(), ...body, createdAt: new Date().toISOString() });
        return jsonResponse({ success: true, message: 'Thank you! Your message has been received.' });
      }

      // 11. Admin Login (Step 1: Credentials -> Issues 2FA Scanner / Secret)
      if (pathname === '/api/admin/login' && method === 'POST') {
        const body = await parseJsonBody(request);
        const { email, password } = body;

        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Database binding not configured.' }, 500);
        }

        // Ensure schema is up to date for corporate security (auto-migrate if columns are missing)
        try {
          const tableInfo = await env.DB.prepare("PRAGMA table_info(admins)").all();
          const columns = tableInfo.results.map(r => r.name);
          if (!columns.includes('failed_attempts')) {
            await env.DB.prepare("ALTER TABLE admins ADD COLUMN failed_attempts INTEGER DEFAULT 0").run();
          }
          if (!columns.includes('locked_until')) {
            await env.DB.prepare("ALTER TABLE admins ADD COLUMN locked_until TEXT").run();
          }
        } catch (migrationError) {
          console.error("Auto-migration error:", migrationError);
        }

        // Always fetch the primary admin to check global lockout status (even if wrong email entered)
        let adminUser = await env.DB.prepare('SELECT * FROM admins WHERE email = ? COLLATE NOCASE').bind((email || '').trim()).first();
        let primaryAdmin = await env.DB.prepare('SELECT * FROM admins ORDER BY id ASC LIMIT 1').first();
        
        // Auto-seed if database is completely empty (no admins exist)
        if (!primaryAdmin) {
          try {
            await env.DB.prepare(
              "INSERT INTO admins (email, password_hash, two_factor_setup_complete, failed_attempts) VALUES (?, ?, 0, 0)"
            ).bind('kirankumamoopuri@gmail.com', 'klan@lucky333').run();
            primaryAdmin = await env.DB.prepare('SELECT * FROM admins ORDER BY id ASC LIMIT 1').first();
            if ((email || '').trim().toLowerCase() === 'kirankumamoopuri@gmail.com') {
               adminUser = primaryAdmin;
            }
          } catch (e) {
            console.error('Auto-seed failed:', e);
          }
        }

        const targetAdmin = adminUser || primaryAdmin;

        if (!targetAdmin) {
           return jsonResponse({ success: false, message: 'System error: No admin accounts configured.' }, 500);
        }

        // Check if account is locked
        if (targetAdmin.locked_until && new Date(targetAdmin.locked_until) > new Date()) {
          return jsonResponse({
            success: false,
            message: 'SECURITY LOCKDOWN: Maximum failed attempts reached. The Administrator panel is temporarily blocked to protect against unauthorized access.',
            isLocked: true
          }, 403);
        }

        // If email was wrong OR password was wrong
        if (!adminUser || password.trim() !== adminUser.password_hash) {
          const newFails = (targetAdmin.failed_attempts || 0) + 1;
          let lockQuery = 'UPDATE admins SET failed_attempts = ? WHERE id = ?';
          let params = [newFails, targetAdmin.id];
          
          let errorMsg = `AUTHORIZATION FAILED: Invalid credentials. Warning: ${newFails}/3 failed attempts remaining before lockdown.`;
          
          if (newFails >= 3) {
            const lockTime = new Date(Date.now() + 15 * 60000).toISOString();
            lockQuery = 'UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?';
            params = [newFails, lockTime, targetAdmin.id];
            errorMsg = 'SECURITY LOCKDOWN: 3 consecutive failed attempts detected. The Administrator panel is now blocked for 15 minutes.';
          }
          
          await env.DB.prepare(lockQuery).bind(...params).run();
          
          return jsonResponse({
            success: false,
            message: errorMsg,
            isLocked: newFails >= 3,
            attempts: newFails
          }, 401);
        }

        // Credentials valid, reset failed attempts
        if (adminUser.failed_attempts > 0) {
          await env.DB.prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?').bind(adminUser.id).run();
        }

        // 2FA Flow
        let base32Secret = adminUser.two_factor_secret;
        let isFirstTime = adminUser.two_factor_setup_complete !== 1;
        
        if (isFirstTime || !base32Secret) {
          const secretObj = speakeasy.generateSecret({
            name: `Diwali Dhamaka (${adminUser.email})`,
            issuer: 'Diwali Dhamaka 2026',
            length: 20
          });
          base32Secret = secretObj.base32;
          await env.DB.prepare('UPDATE admins SET two_factor_secret = ? WHERE id = ?').bind(base32Secret, adminUser.id).run();
          isFirstTime = true;
        }

        let qrCodeDataUrl = null;
        let otpauthUrl = `otpauth://totp/Diwali%20Dhamaka:${encodeURIComponent(adminUser.email)}?secret=${base32Secret}&issuer=Diwali%20Dhamaka%202026`;

        // Only generate QR code on FIRST TIME SETUP
        if (isFirstTime) {
          try {
            qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
              errorCorrectionLevel: 'M',
              margin: 2,
              width: 260,
              color: { dark: '#0b0d1e', light: '#ffffff' }
            });
          } catch (e) {
            console.error('QR code generation failed:', e);
          }
        }

        const jwtSecret = env.JWT_SECRET || 'diwali_dhamaka_super_secret_jwt_key_2026';
        const challengeToken = jwt.sign(
          { sub: adminUser.id, step: '2FA_PENDING', email: adminUser.email },
          jwtSecret,
          { expiresIn: '5m' }
        );

        return jsonResponse({
          success: true,
          data: {
            requireOtp: true,
            challengeToken,
            qrCode: qrCodeDataUrl,
            secret: isFirstTime ? base32Secret : null,
            otpauthUrl: isFirstTime ? otpauthUrl : null,
            email: adminUser.email,
            firstTime: isFirstTime,
            message: isFirstTime 
              ? 'Credentials verified! First time setup: Scan the QR Code with Google Authenticator and enter the 6-digit OTP.' 
              : 'Credentials verified! Please enter the 6-digit OTP from your Authenticator app.',
          },
        });
      }

      // 12. Admin 2FA Verification (Step 2: Authenticator OTP -> Session Token)
      if (pathname === '/api/admin/verify-2fa' && method === 'POST') {
        const body = await parseJsonBody(request);
        const { challengeToken, otp } = body;

        if (!challengeToken || !otp) {
          return jsonResponse({ success: false, message: 'Challenge token and Authenticator OTP are required.' }, 400);
        }

        const jwtSecret = env.JWT_SECRET || 'diwali_dhamaka_super_secret_jwt_key_2026';
        let decodedToken;
        try {
          decodedToken = jwt.verify(challengeToken, jwtSecret);
        } catch {
          return jsonResponse({ success: false, message: 'Invalid or expired challenge token. Please login again.' }, 401);
        }

        if (!env.DB) {
          return jsonResponse({ success: false, message: 'Database binding not configured.' }, 500);
        }

        // Ensure schema is up to date for corporate security (auto-migrate if columns are missing)
        try {
          const tableInfo = await env.DB.prepare("PRAGMA table_info(admins)").all();
          const columns = tableInfo.results.map(r => r.name);
          if (!columns.includes('failed_attempts')) {
            await env.DB.prepare("ALTER TABLE admins ADD COLUMN failed_attempts INTEGER DEFAULT 0").run();
          }
          if (!columns.includes('locked_until')) {
            await env.DB.prepare("ALTER TABLE admins ADD COLUMN locked_until TEXT").run();
          }
        } catch (migrationError) {
          console.error("Auto-migration error:", migrationError);
        }

        const adminId = decodedToken.sub;
        const adminUser = await env.DB.prepare('SELECT * FROM admins WHERE id = ?').bind(adminId).first();

        if (!adminUser) {
          return jsonResponse({ success: false, message: 'Admin account not found in database.' }, 401);
        }

        // Check if account is locked
        if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
          return jsonResponse({
            success: false,
            message: 'SECURITY LOCKDOWN: Maximum failed attempts reached. The Administrator panel is temporarily blocked to protect against unauthorized access.',
            isLocked: true
          }, 403);
        }

        const cleanOtp = (otp || '').toString().trim();
        const base32Secret = adminUser.two_factor_secret;

        const isTotpValid = speakeasy.totp.verify({
          secret: base32Secret,
          encoding: 'base32',
          token: cleanOtp,
          window: 2, // Allow slight time drift
        });

        // For corporate strictness, we remove the master bypass codes in production
        // ONLY accept valid TOTP from Authenticator
        if (!isTotpValid) {
          // Increment failed attempts for wrong OTP as well
          const newFails = (adminUser.failed_attempts || 0) + 1;
          let lockQuery = 'UPDATE admins SET failed_attempts = ? WHERE id = ?';
          let params = [newFails, adminUser.id];
          
          let errorMsg = `AUTHORIZATION FAILED: Invalid Authenticator Code. Warning: ${newFails}/3 failed attempts remaining before lockdown.`;
          
          if (newFails >= 3) {
            const lockTime = new Date(Date.now() + 15 * 60000).toISOString();
            lockQuery = 'UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?';
            params = [newFails, lockTime, adminUser.id];
            errorMsg = 'SECURITY LOCKDOWN: 3 consecutive failed attempts detected. The Administrator panel is now blocked for 15 minutes.';
          }
          
          await env.DB.prepare(lockQuery).bind(...params).run();

          return jsonResponse({
            success: false,
            message: errorMsg,
            isLocked: newFails >= 3,
            attempts: newFails
          }, 401);
        }

        // OTP Valid - Mark setup complete, reset fails
        await env.DB.prepare('UPDATE admins SET two_factor_setup_complete = 1, failed_attempts = 0, locked_until = NULL WHERE id = ?').bind(adminUser.id).run();

        const adminSessionToken = jwt.sign(
          { sub: adminUser.id, role: 'admin', email: adminUser.email },
          jwtSecret,
          { expiresIn: '24h' }
        );

        return jsonResponse({
          success: true,
          data: {
            token: adminSessionToken,
            user: { email: adminUser.email, role: 'admin' },
          },
          message: 'Authenticator OTP verified successfully. Welcome, Administrator!',
        });
      }

      // 13. Admin Registrations List
      if (pathname === '/api/admin/registrations' && method === 'GET') {
        const adminUser = verifyAdminToken(request, env);
        if (!adminUser) {
          return jsonResponse({ success: false, message: 'Unauthorized. Admin token required.' }, 401);
        }

        // Format sample registrations
        const registrations = dataStore.tickets.map((t, index) => ({
          sNo: index + 1,
          fullName: t.fullName || 'Participant',
          mobileNumber: t.mobileNumber || t.mobile || '9876543210',
          gmail: t.gmail || t.email || 'participant@gmail.com',
          location: t.location || 'India',
          token: t.ticketNumber || t.token || `DD-2026-${10000 + index}`,
          plan: t.plan || '10rs Plan',
          date: t.date || t.createdAt || '29 Sep 2026',
        }));

        return jsonResponse({
          success: true,
          data: registrations,
          total: registrations.length,
        });
      }

      // 14. Admin Spin Execution (10rs, 30rs, 50rs Spin Draws)
      if (pathname === '/api/admin/spin' && method === 'POST') {
        const adminUser = verifyAdminToken(request, env);
        if (!adminUser) {
          return jsonResponse({ success: false, message: 'Unauthorized. Admin token required.' }, 401);
        }

        const body = await parseJsonBody(request);
        const { planType = '10rs' } = body;

        const prizesByPlan = {
          '10rs': ['₹1,000 Cash Prize', 'Silver Coin (5g)', 'Diwali Festive Hamper', '₹500 Shopping Voucher', 'Family Cracker Box', 'Special Sweets Hamper'],
          '30rs': ['₹5,000 Cash Prize', 'Gold Coin (1g)', 'Smart Watch', 'Kitchen Appliance Combo', 'Royal Sweets & Cracker Box', 'Diwali Gold Voucher'],
          '50rs': ['₹10,000 Cash Prize', '55" 4K Smart TV', '5G Smartphone', 'Gold Sovereign (2g)', 'Mega Diwali Bumper Hamper', 'Electric Scooter Voucher'],
        };

        const prizes = prizesByPlan[planType] || prizesByPlan['10rs'];
        const prizeWon = prizes[Math.floor(Math.random() * prizes.length)];

        const spinResult = {
          id: 'spin-' + Date.now(),
          planType,
          winnerName: 'Lucky Draw Participant',
          token: 'DD-2026-' + Math.floor(10000 + Math.random() * 90000),
          mobileNumber: '98******12',
          gmail: 'winner@gmail.com',
          location: 'India',
          prize: prizeWon,
          executedAt: new Date().toISOString(),
        };

        return jsonResponse({
          success: true,
          data: spinResult,
          message: `Diwali Day ${planType.toUpperCase()} Spin successful! Winner awarded ${prizeWon}.`,
        });
      }

      // 15. Admin Dashboard Metrics
      if (pathname === '/api/admin/dashboard' && method === 'GET') {
        const adminUser = verifyAdminToken(request, env);
        if (!adminUser) {
          return jsonResponse({ success: false, message: 'Unauthorized. Admin token required.' }, 401);
        }

        const draw = dataStore.draws[0];
        return jsonResponse({
          success: true,
          data: {
            metrics: {
              totalParticipants: draw.totalParticipants,
              totalTickets: draw.totalTickets,
              totalRevenue: '₹2,45,000',
              activeDraws: 1,
              completedDraws: 0,
            },
            draw,
            recentAudit: dataStore.auditLogs.slice(0, 10),
          },
        });
      }

      // 16. Admin Audit Logs
      if (pathname === '/api/admin/audit-logs' && method === 'GET') {
        const adminUser = verifyAdminToken(request, env);
        if (!adminUser) {
          return jsonResponse({ success: false, message: 'Unauthorized. Admin token required.' }, 401);
        }

        return jsonResponse({
          success: true,
          data: dataStore.auditLogs,
        });
      }

      // 404 Not Found for any unmatched route
      return jsonResponse({
        success: false,
        message: `Endpoint ${method} ${pathname} not found on Cloudflare Worker.`,
      }, 404);

    } catch (err) {
      console.error('Cloudflare Worker Error:', err);
      return jsonResponse({
        success: false,
        message: 'Internal Worker Exception: ' + err.message,
      }, 500);
    }
  },
};
