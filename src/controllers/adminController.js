const authService = require('../services/authService');
const drawService = require('../services/drawService');
const dataStore = require('../models/dataStore');
const { HTTP_STATUS } = require('../constants');

class AdminController {
  login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = authService.adminLogin(email, password);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Admin login successful.'
      });
    } catch (err) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: err.message
      });
    }
  }

  getDashboard(req, res, next) {
    try {
      const currentDraw = drawService.getCurrentDraw();
      const stats = {
        totalParticipants: dataStore.participants.length,
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
}

module.exports = new AdminController();
