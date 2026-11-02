const authService = require('../services/authService');
const drawService = require('../services/drawService');
const dataStore = require('../models/dataStore');
const d1Client = require('../services/d1Client');
const { HTTP_STATUS } = require('../constants');

class AdminController {
  constructor() {
    this.login = this.login.bind(this);
    this.verify2Fa = this.verify2Fa.bind(this);
    this.getRegistrations = this.getRegistrations.bind(this);
    this.getDashboard = this.getDashboard.bind(this);
    this.getAuditLogs = this.getAuditLogs.bind(this);
    this.updateDraw = this.updateDraw.bind(this);
    this.triggerWinner = this.triggerWinner.bind(this);
    this.executeSpin = this.executeSpin.bind(this);
    this.getRecentSpins = this.getRecentSpins.bind(this);
    this.recordSpin = this.recordSpin.bind(this);
    this._formatRegistrations = this._formatRegistrations.bind(this);
  }

  /**

   * Step 1: Login with Gmail & Password -> Challenges for Authenticator OTP
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.initiateAdminLogin(email, password);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Credentials verified. Please scan QR in Authenticator and enter OTP.'
      });
    } catch (err) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: err.message
      });
    }
  }

  /**
   * Step 2: Verify Authenticator OTP -> Issues Admin Session Token
   */
  verify2Fa(req, res, next) {
    try {
      const { challengeToken, otp } = req.body;
      const result = authService.verifyAdminOtp(challengeToken, otp);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Authenticator OTP verified successfully. Welcome, Administrator!'
      });
    } catch (err) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: err.message
      });
    }
  }

  /**
   * Helper to format all registered participants & tokens according to specification:
   * S.No, Full Name, Mobile Number, Gmail, Location, Token, Plan, Date
   */
  _formatRegistrations() {
    return dataStore.tickets.map((ticket, index) => {
      const participant = dataStore.participants.find(p => p.id === ticket.participantId) || {};
      const planValue = ticket.plan || participant.plan || '10rs Plan';
      const dateObj = new Date(ticket.issuedAt);
      
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const formattedTime = dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return {
        sNo: index + 1,
        fullName: participant.fullName || 'Verified Participant',
        mobileNumber: participant.phone || 'N/A',
        gmail: participant.email || 'N/A',
        location: participant.location || participant.city || 'India',
        token: ticket.ticketNumber,
        plan: planValue,
        date: `${formattedDate}, ${formattedTime}`,
        rawDate: ticket.issuedAt,
        status: ticket.status,
        prize: ticket.prize
      };
    });
  }

  /**
   * Endpoint returning the single core admin table: Registrations
   */
  getRegistrations(req, res, next) {
    try {
      const { search, plan } = req.query;
      const allFormatted = this._formatRegistrations();
      let list = allFormatted;

      if (plan && plan !== 'all') {
        list = list.filter(r => r.plan.toLowerCase().includes(plan.toLowerCase()));
      }

      if (search) {
        const q = search.trim().toLowerCase();
        list = list.filter(r =>
          r.fullName.toLowerCase().includes(q) ||
          r.mobileNumber.toLowerCase().includes(q) ||
          r.gmail.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.token.toLowerCase().includes(q) ||
          r.plan.toLowerCase().includes(q)
        );
      }

      const total10rsPlans = allFormatted.filter(r => (r.plan || '').includes('10')).length;
      const total30rsPlans = allFormatted.filter(r => (r.plan || '').includes('30')).length;
      const total50rsPlans = allFormatted.filter(r => (r.plan || '').includes('50')).length;
      const totalRevenue = (total10rsPlans * 10) + (total30rsPlans * 30) + (total50rsPlans * 50);

      const summary = {
        totalPeoples: allFormatted.length,
        total10rsPlans,
        total30rsPlans,
        total50rsPlans,
        totalRevenue
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: list.length,
        summary,
        data: list
      });
    } catch (err) {
      next(err);
    }
  }

  getDashboard(req, res, next) {
    try {
      const currentDraw = drawService.getCurrentDraw();
      const registrations = this._formatRegistrations();

      const total10rsPlans = registrations.filter(r => (r.plan || '').includes('10')).length;
      const total30rsPlans = registrations.filter(r => (r.plan || '').includes('30')).length;
      const total50rsPlans = registrations.filter(r => (r.plan || '').includes('50')).length;
      const totalRevenue = (total10rsPlans * 10) + (total30rsPlans * 30) + (total50rsPlans * 50);

      const stats = {
        totalParticipants: dataStore.participants.length,
        totalPeoples: registrations.length,
        total10rsPlans,
        total30rsPlans,
        total50rsPlans,
        totalRevenue,
        totalTickets: dataStore.tickets.length,
        totalWinners: dataStore.winners.length,
        totalPrizes: dataStore.prizes.length,
        activeOffers: dataStore.offers.length,
        contactInquiries: dataStore.contactMessages.length,
        drawStatus: currentDraw.status,
        upcomingDrawDate: currentDraw.displayDate,
        upcomingDrawTime: currentDraw.displayTime
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          stats,
          currentDraw,
          registrations,
          recentTickets: dataStore.tickets.slice(-10).reverse(),
          recentWinners: dataStore.winners.slice(0, 5),
          recentInquiries: dataStore.contactMessages.slice(0, 5)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  getAuditLogs(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: dataStore.auditLogs.slice(0, 50)
      });
    } catch (err) {
      next(err);
    }
  }

  updateDraw(req, res, next) {
    try {
      const { id } = req.params;
      const updated = drawService.updateDraw(id, req.body, req.user ? req.user.email : 'admin');
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updated,
        message: 'Draw configuration updated successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  triggerWinner(req, res, next) {
    try {
      const { id } = req.params;
      const { prizeId } = req.body;
      const winner = drawService.executeDraw(id, prizeId, req.user ? req.user.email : 'admin');
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: winner,
        message: `Winner ${winner.maskedName} (${winner.shortTicket}) selected for ${winner.prizeTitle}!`
      });
    } catch (err) {
      next(err);
    }
  }

  getSpinStatus(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          counts: dataStore.spinCounts,
          limits: dataStore.spinLimits,
          remaining: {
            '10rs': Math.max(0, dataStore.spinLimits['10rs'] - dataStore.spinCounts['10rs']),
            '30rs': Math.max(0, dataStore.spinLimits['30rs'] - dataStore.spinCounts['30rs']),
            '50rs': Math.max(0, dataStore.spinLimits['50rs'] - dataStore.spinCounts['50rs'])
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  resetSpins(req, res, next) {
    try {
      dataStore.spinCounts = {
        '10rs': 0,
        '30rs': 0,
        '50rs': 0
      };
      dataStore.logAudit('RESET_SPINS', req.user ? req.user.email : 'admin', {});
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: dataStore.spinCounts,
        message: 'All spin wheel limits reset to 0.'
      });
    } catch (err) {
      next(err);
    }
  }

  _maskName(name) {
    if (!name) return 'L*** P***';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0] + '***').join(' ');
  }

  executeSpin(req, res, next) {
    try {
      const { planType } = req.body; // '10rs', '30rs', '50rs'
      const plan = planType || '10rs';

      const limit = dataStore.spinLimits[plan] || (plan === '10rs' ? 10 : 2);
      const currentCount = dataStore.spinCounts[plan] || 0;

      if (currentCount >= limit) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `${plan.toUpperCase()} Spin limit reached (${currentCount}/${limit}). This spin wheel is now disabled.`
        });
      }

      dataStore.spinCounts[plan] = currentCount + 1;
      const spinNumber = dataStore.spinCounts[plan];

      const allRegistrations = this._formatRegistrations();
      
      let eligible = allRegistrations.filter(r => 
        (r.plan || '').toLowerCase().includes(plan.toLowerCase())
      );
      
      if (eligible.length === 0) {
        eligible = allRegistrations;
      }
      
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      
      // Determine Tier & Prize Structure per specification:
      // 10rs spin: 10 spins total -> 1-5 Gold, 6-10 Silver
      // 30rs spin: 2 spins total -> Bronze
      // 50rs spin: 2 spins total -> Purple
      let tier = 'gold';
      let prizeTitle = '';
      let prizeAmount = '₹10,000';

      if (plan === '10rs') {
        if (spinNumber <= 5) {
          tier = 'gold';
          const titles = ['1st Prize', '2nd Prize', '3rd Prize', '4th Prize', '5th Prize'];
          const amounts = ['₹10,000', '₹9,500', '₹9,000', '₹8,500', '₹8,000'];
          prizeTitle = titles[spinNumber - 1];
          prizeAmount = amounts[spinNumber - 1];
        } else {
          tier = 'silver';
          const titles = ['6th Prize', '7th Prize', '8th Prize', '9th Prize', '10th Prize'];
          const amounts = ['₹7,500', '₹7,000', '₹6,500', '₹6,000', '₹5,500'];
          prizeTitle = titles[spinNumber - 6];
          prizeAmount = amounts[spinNumber - 6];
        }
      } else if (plan === '30rs') {
        tier = 'bronze';
        prizeTitle = `Festival Special #${spinNumber}`;
        prizeAmount = '₹10,000';
      } else if (plan === '50rs') {
        tier = 'purple';
        prizeTitle = `Early Bird Bonus #${spinNumber}`;
        prizeAmount = '₹10,000';
      }

      const prizesByPlan = {
        '10rs': ['₹1,000 Cash Prize', 'Silver Coin (5g)', 'Diwali Festive Hamper', '₹500 Shopping Voucher', 'Family Cracker Box', 'Special Sweets Hamper'],
        '30rs': ['₹5,000 Cash Prize', 'Gold Coin (1g)', 'Smart Watch', 'Kitchen Appliance Combo', 'Royal Sweets & Cracker Box', 'Diwali Gold Voucher'],
        '50rs': ['₹10,000 Cash Prize', '55" 4K Smart TV', '5G Smartphone', 'Gold Sovereign (2g)', 'Mega Diwali Bumper Hamper', 'Electric Scooter Voucher']
      };
      
      const prizes = prizesByPlan[plan] || prizesByPlan['10rs'];
      const prizeWon = prizes[Math.floor(Math.random() * prizes.length)];
      
      const spinResult = {
        id: 'spin-' + Date.now(),
        planType: plan,
        spinNumber,
        maxSpins: limit,
        remainingSpins: limit - spinNumber,
        isCompleted: spinNumber >= limit,
        winnerName: winner ? winner.fullName : 'Lucky Participant',
        maskedName: winner ? this._maskName(winner.fullName) : 'L*** P***',
        token: winner ? winner.token : `DD-2026-SPIN-${Math.floor(10000 + Math.random() * 90000)}`,
        shortTicket: '#' + (winner ? (winner.token || '').split('-').pop() : 'SPIN'),
        mobileNumber: winner ? winner.mobileNumber : 'N/A',
        gmail: winner ? winner.gmail : 'N/A',
        location: winner ? winner.location : 'India',
        prize: prizeWon,
        prizeTitle: prizeTitle,
        prizeAmount: prizeAmount,
        tier: tier,
        executedAt: new Date().toISOString()
      };

      // Add to dataStore.winners so that it immediately displays in the Winners Page!
      const winnerRecord = {
        id: 'spin-win-' + Date.now(),
        drawId: 'draw-diwali-2026',
        winnerName: spinResult.winnerName,
        maskedName: spinResult.maskedName,
        ticketNumber: spinResult.token,
        shortTicket: spinResult.shortTicket,
        prizeTitle: spinResult.prizeTitle,
        prizeAmount: spinResult.prizeAmount,
        tier: spinResult.tier,
        drawDate: 'Diwali Day Spin Draw',
        city: spinResult.location,
        offerTag: plan === '30rs' ? '3X Entries • Triple Chances' : plan === '50rs' ? '5X Entries • VIP Bumper Pool' : undefined,
        announcedAt: new Date().toISOString(),
        isSpinWinner: true,
        planType: plan,
        spinNumber: spinNumber
      };
      dataStore.winners.unshift(winnerRecord);
      
      dataStore.logAudit('EXECUTE_SPIN', req.user ? req.user.email : 'admin', spinResult);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: spinResult,
        counts: dataStore.spinCounts,
        limits: dataStore.spinLimits,
        message: `${plan.toUpperCase()} Spin #${spinNumber}/${limit} Complete! Winner: ${spinResult.winnerName} won ${prizeTitle} (${tier.toUpperCase()})!`
      });
    } catch (err) {
      next(err);
    }
  }

  async getRecentSpins(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: dataStore.recentSpins || []
      });
    } catch (err) {
      next(err);
    }
  }

  async recordSpin(req, res, next) {
    try {
      const {
        winnerName,
        maskedName,
        token,
        shortTicket,
        prize,
        prizeTitle,
        prizeAmount,
        tier,
        city,
        planType,
        spinNumber,
        time
      } = req.body;

      const plan = planType || '10rs';
      const count = spinNumber || ((dataStore.spinCounts[plan] || 0) + 1);
      dataStore.spinCounts[plan] = Math.max(dataStore.spinCounts[plan] || 0, count);

      const spinLog = {
        id: 'spin-' + Date.now(),
        planType: plan,
        winnerName: winnerName || 'Lucky Participant',
        token: token || `DD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        prize: prize || `${prizeTitle || 'Diwali Prize'} (${prizeAmount || '₹10,000'})`,
        tier: tier || 'gold',
        spinNumber: count,
        time: time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      if (!dataStore.recentSpins) {
        dataStore.recentSpins = [];
      }
      dataStore.recentSpins.unshift(spinLog);

      // Persist to database winners list as verified winner
      const winnerRecord = {
        id: 'spin-win-' + Date.now(),
        drawId: 'draw-diwali-2026',
        winnerName: winnerName || 'Lucky Participant',
        maskedName: maskedName || (winnerName ? winnerName.split(' ').map(p => p[0] + '***').join(' ') : 'L*** P***'),
        ticketNumber: spinLog.token,
        shortTicket: shortTicket || '#' + (spinLog.token.split('-').pop()),
        prizeTitle: prizeTitle || spinLog.prize,
        prizeAmount: prizeAmount || '₹10,000',
        tier: tier || 'gold',
        drawDate: 'Diwali Day Spin Draw',
        city: city || 'India',
        offerTag: plan === '30rs' ? '3X Entries • Triple Chances' : plan === '50rs' ? '5X Entries • VIP Bumper Pool' : undefined,
        announcedAt: new Date().toISOString(),
        isSpinWinner: true,
        planType: plan,
        spinNumber: count
      };

      dataStore.winners.unshift(winnerRecord);

      // Cloudflare D1 persistence if configured
      if (d1Client.isConfigured()) {
        try {
          await d1Client.query(
            `INSERT INTO winners (id, draw_id, winner_name, masked_name, ticket_number, short_ticket, prize_title, prize_amount, tier, draw_date, city, offer_tag, announced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              winnerRecord.id,
              winnerRecord.drawId,
              winnerRecord.winnerName,
              winnerRecord.maskedName,
              winnerRecord.ticketNumber,
              winnerRecord.shortTicket,
              winnerRecord.prizeTitle,
              winnerRecord.prizeAmount,
              winnerRecord.tier,
              winnerRecord.drawDate,
              winnerRecord.city,
              winnerRecord.offerTag || null,
              winnerRecord.announcedAt
            ]
          );
        } catch (dbErr) {
          console.error('[D1 RECORD SPIN WINNER ERROR]:', dbErr.message);
        }
      }

      dataStore.logAudit('RECORD_SPIN_WINNER', req.user ? req.user.email : 'admin', spinLog);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Diwali Day Spin Winner successfully stored in database!',
        data: spinLog,
        counts: dataStore.spinCounts
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
