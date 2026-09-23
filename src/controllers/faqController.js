const dataStore = require('../models/dataStore');
const { HTTP_STATUS } = require('../constants');

class FaqController {
  getAll(req, res, next) {
    try {
      const { category, search } = req.query;
      let results = [...dataStore.faqs];

      if (category && category.toLowerCase() !== 'all') {
        results = results.filter(f => f.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.trim().toLowerCase();
        results = results.filter(f =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
        );
      }

      const categories = ['All', ...new Set(dataStore.faqs.map(f => f.category))];

      res.status(HTTP_STATUS.OK).json({
        success: true,
        categories,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FaqController();
