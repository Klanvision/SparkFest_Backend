const participantService = require('../services/participantService');
const { HTTP_STATUS } = require('../constants');

class ParticipantController {
  requestOtp(req, res, next) {
    try {
      const { phone } = req.body;
      const result = participantService.requestOtp(phone || '');
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  verifyOtp(req, res, next) {
    try {
      const { phone, otp } = req.body;
      if (!otp) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'OTP is required.'
        });
      }
      const result = participantService.verifyOtp(phone || '', otp);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  register(req, res, next) {
    try {
      const result = participantService.registerParticipant(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
        message: 'Participant registered and Lucky Ticket issued successfully!'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ParticipantController();
