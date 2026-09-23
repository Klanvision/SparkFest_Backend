const dataStore = require('../models/dataStore');
const { HTTP_STATUS } = require('../constants');

class WinnerController {
  getAll(req, res, next) {
    try {
      const { search, tier, limit } = req.query;
      let results = [...dataStore.winners];

      if (tier && tier !== 'all') {
        results = results.filter(w => w.tier.toLowerCase() === tier.toLowerCase());
      }

      if (search) {
        const q = search.trim().toLowerCase();
        results = results.filter(w => 
          w.maskedName.toLowerCase().includes(q) ||
          w.ticketNumber.toLowerCase().includes(q) ||
          w.shortTicket.toLowerCase().includes(q) ||
          w.prizeTitle.toLowerCase().includes(q)
        );
      }

      if (limit) {
        results = results.slice(0, parseInt(limit, 10));
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }

  getRecent(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: dataStore.winners.slice(0, 8)
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WinnerController();
