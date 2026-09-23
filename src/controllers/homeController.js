const drawService = require('../services/drawService');
const dataStore = require('../models/dataStore');
const { HTTP_STATUS } = require('../constants');

class HomeController {
  getHomeData(req, res, next) {
    try {
      const draw = drawService.getCurrentDraw();
      const prizes = dataStore.prizes;
      const offers = dataStore.offers;
      const recentWinners = dataStore.winners.slice(0, 5);
      const faqs = dataStore.faqs.slice(0, 6);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          brand: {
            name: 'DIWALI DHAMAKA',
            subheadline: 'Lucky Draw',
            tagline: 'Celebrate. Participate. Win Big.',
            trustBadge: 'Safe & Secure Participation',
            promoBadge: 'Big Prizes Bright Future'
          },
          draw,
          prizes,
          offers,
          recentWinners,
          faqs,
          stats: {
            totalParticipants: draw.totalParticipants,
            totalTickets: draw.totalTickets,
            totalPrizePool: draw.totalPrizePool
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HomeController();
