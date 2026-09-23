const dataStore = require('../models/dataStore');
const { HTTP_STATUS } = require('../constants');

class OfferController {
  getAll(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: dataStore.offers
      });
    } catch (err) {
      next(err);
    }
  }

  getById(req, res, next) {
    try {
      const offer = dataStore.offers.find(o => o.id === req.params.id);
      if (!offer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Offer not found'
        });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: offer
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OfferController();
