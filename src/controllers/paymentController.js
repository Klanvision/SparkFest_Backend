const paymentService = require('../services/paymentService');
const { HTTP_STATUS } = require('../constants');

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const {
        amount,
        currency,
        receipt,
        notes,
        fullName,
        email,
        phone,
        selectedOffer
      } = req.body;

      // Validate amount if explicitly provided (minimum 100 paise)
      if (amount !== undefined && amount !== null && amount !== '') {
        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount < 100) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid amount. Minimum amount is 100 paise (₹1).'
          });
        }
      }

      const result = await paymentService.createOrder({
        amount,
        currency,
        receipt,
        notes,
        fullName,
        email,
        phone,
        selectedOffer
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        order_id: result.order_id,
        id: result.order_id,
        amount: result.amount,
        currency: result.currency,
        receipt: result.receipt,
        key_id: result.keyId,
        data: result,
        message: 'Razorpay order created successfully.'
      });
    } catch (err) {
      // Handle auth failures (return 401), validation (400), Razorpay API errors (500)
      const statusCode = err.statusCode || (err.message && err.message.includes('Minimum amount') ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Razorpay order creation failed.',
        error: err.message
      });
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const razorpay_order_id = req.body.razorpay_order_id || req.body.order_id;
      const razorpay_payment_id = req.body.razorpay_payment_id || req.body.payment_id;
      const razorpay_signature = req.body.razorpay_signature || req.body.signature;

      // Missing fields: return 400
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Missing required fields: order_id, payment_id, and signature are required.'
        });
      }

      const result = await paymentService.verifyPaymentAndIssueTickets({
        ...req.body,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Payment verified successfully.',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        data: result
      });
    } catch (err) {
      // Signature mismatch or invalid params: return 400, do NOT mark as paid
      const statusCode = err.statusCode || HTTP_STATUS.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: err.message || 'Payment verification failed: signature mismatch.'
      });
    }
  }

  getConfig(req, res, next) {
    try {
      const config = paymentService.getConfig();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: config
      });
    } catch (err) {
      next(err);
    }
  }

  getOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const status = paymentService.getOrderStatus(orderId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  }

  handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'] || '';
      const result = paymentService.handleWebhook(req.body, signature);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: err.message
      });
    }
  }

  getPayments(req, res, next) {
    try {
      const payments = paymentService.getAllPayments();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: payments
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentController();
