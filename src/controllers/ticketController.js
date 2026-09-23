const ticketService = require('../services/ticketService');
const { HTTP_STATUS } = require('../constants');

class TicketController {
  getByNumber(req, res, next) {
    try {
      const ticket = ticketService.getTicketByNumber(req.params.ticketNumber);
      if (!ticket) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'No ticket found with this ticket number. Please check the ticket number and try again.'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  }

  generate(req, res, next) {
    try {
      const { participantId, drawId } = req.body;
      if (!participantId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Participant ID is required to generate a ticket.'
        });
      }

      const ticket = ticketService.generateTicket(participantId, drawId || 'draw-diwali-2026');
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: ticket,
        message: 'Lucky Draw ticket generated successfully!'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TicketController();
