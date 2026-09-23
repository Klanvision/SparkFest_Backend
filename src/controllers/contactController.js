const dataStore = require('../models/dataStore');
const { HTTP_STATUS } = require('../constants');
const { v4: uuidv4 } = require('uuid');

class ContactController {
  submit(req, res, next) {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Name, email, and message are required fields.'
        });
      }

      const inquiry = {
        id: uuidv4(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        subject: (subject || 'General Inquiry').trim(),
        message: message.trim(),
        status: 'NEW',
        createdAt: new Date().toISOString()
      };

      dataStore.contactMessages.unshift(inquiry);
      dataStore.logAudit('SUBMIT_CONTACT', email, { subject, inquiryId: inquiry.id });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          id: inquiry.id,
          referenceNumber: 'SR-' + inquiry.id.substring(0, 8).toUpperCase()
        },
        message: 'Thank you for contacting Diwali Dhamaka support. We have received your inquiry and will respond within 24 hours.'
      });
    } catch (err) {
      next(err);
    }
  }

  getAll(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: dataStore.contactMessages
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ContactController();
