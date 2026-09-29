const authService = require('../services/authService');
const drawService = require('../services/drawService');
const dataStore = require('../models/dataStore');
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

  executeSpin(req, res, next) {
    try {
      const { planType } = req.body; // '10rs', '30rs', '50rs'
      const allRegistrations = this._formatRegistrations();
      
      let eligible = allRegistrations.filter(r => 
        (r.plan || '').toLowerCase().includes((planType || '').toLowerCase())
      );
      
      if (eligible.length === 0) {
        eligible = allRegistrations;
      }
      
      const winner = eligible[Math.floor(Math.random() * eligible.length)];
      
      const prizesByPlan = {
        '10rs': ['₹1,000 Cash Prize', 'Silver Coin (5g)', 'Diwali Festive Hamper', '₹500 Shopping Voucher', 'Family Cracker Box', 'Special Sweets Hamper'],
        '30rs': ['₹5,000 Cash Prize', 'Gold Coin (1g)', 'Smart Watch', 'Kitchen Appliance Combo', 'Royal Sweets & Cracker Box', 'Diwali Gold Voucher'],
        '50rs': ['₹10,000 Cash Prize', '55" 4K Smart TV', '5G Smartphone', 'Gold Sovereign (2g)', 'Mega Diwali Bumper Hamper', 'Electric Scooter Voucher']
      };
      
      const prizes = prizesByPlan[planType] || prizesByPlan['10rs'];
      const prizeWon = prizes[Math.floor(Math.random() * prizes.length)];
      
      const spinResult = {
        id: 'spin-' + Date.now(),
        planType: planType || '10rs',
        winnerName: winner ? winner.fullName : 'Lucky Participant',
        token: winner ? winner.token : 'DD-2026-SPIN',
        mobileNumber: winner ? winner.mobileNumber : 'N/A',
        gmail: winner ? winner.gmail : 'N/A',
        location: winner ? winner.location : 'India',
        prize: prizeWon,
        executedAt: new Date().toISOString()
      };
      
      dataStore.logAudit('EXECUTE_SPIN', req.user ? req.user.email : 'admin', spinResult);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: spinResult,
        message: `Diwali Day Spin Success! Winner: ${spinResult.winnerName} (${spinResult.token}) won ${prizeWon}!`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
