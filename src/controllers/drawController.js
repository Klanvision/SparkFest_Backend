const drawService = require('../services/drawService');
const { HTTP_STATUS } = require('../constants');

class DrawController {
  getCurrent(req, res, next) {
    try {
      const draw = drawService.getCurrentDraw();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: draw
      });
    } catch (err) {
      next(err);
    }
  }

  getById(req, res, next) {
    try {
      const draw = drawService.getDrawById(req.params.id);
      if (!draw) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Draw not found'
        });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: draw
      });
    } catch (err) {
      next(err);
    }
  }

  update(req, res, next) {
    try {
      const updated = drawService.updateDraw(req.params.id, req.body, req.user ? req.user.email : 'admin');
      if (!updated) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Draw not found'
        });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updated,
        message: 'Draw updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  execute(req, res, next) {
    try {
      const { prizeId } = req.body;
      const winner = drawService.executeDraw(req.params.id, prizeId, req.user ? req.user.email : 'admin');
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: winner,
        message: 'Draw executed successfully and winner generated!'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DrawController();
