const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const dataStore = require('../models/dataStore');
const ticketService = require('./ticketService');
const whatsappService = require('./whatsappService');

class PaymentService {
  constructor() {
    this.razorpayInstance = null;
    this.initRazorpay();
  }

  initRazorpay() {
    if (config.razorpay.keyId && config.razorpay.keySecret) {
      try {
        this.razorpayInstance = new Razorpay({
          key_id: config.razorpay.keyId,
          key_secret: config.razorpay.keySecret
        });
        console.log('Razorpay SDK initialized successfully with provided keys.');
      } catch (err) {
        console.error('Failed to initialize Razorpay SDK:', err.message);
      }
    }
  }

  getTierInfo(selectedOffer) {
    switch (selectedOffer) {
      case 'festival_special':
        return {
          offerId: 'festival_special',
          amountInRupees: 30,
          amountInPaise: 3000,
          tickets: 3,
          plan: '30rs Plan',
          title: 'Festival Special'
        };
      case 'early_bird':
        return {
          offerId: 'early_bird',
          amountInRupees: 50,
          amountInPaise: 5000,
          tickets: 5,
          plan: '50rs Plan',
          title: 'Early Bird'
        };
      case 'ten_entry':
      default:
        return {
          offerId: 'ten_entry',
          amountInRupees: 10,
          amountInPaise: 1000,
          tickets: 1,
          plan: '10rs Plan',
          title: 'Ticket Entry'
        };
    }
  }

  async createOrder({
    amount,
    currency = 'INR',
    receipt,
    notes,
    fullName,
    email,
    phone,
    selectedOffer
  }) {
    let orderAmount = null;

    if (amount !== undefined && amount !== null && amount !== '') {
      orderAmount = parseInt(amount, 10);
      if (isNaN(orderAmount) || orderAmount < 100) {
        const err = new Error('Invalid amount: Minimum amount is 100 paise (₹1).');
        err.statusCode = 400;
        throw err;
      }
    } else if (selectedOffer) {
      const tier = this.getTierInfo(selectedOffer);
      orderAmount = tier.amountInPaise;
    } else {
      orderAmount = 1000;
    }

    if (orderAmount < 100) {
      const err = new Error('Invalid amount: Minimum amount is 100 paise (₹1).');
      err.statusCode = 400;
      throw err;
    }

    const tier = this.getTierInfo(selectedOffer || 'ten_entry');
    const receiptId = receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';

    let orderData = null;

    // If Razorpay live/test keys are configured, use official Razorpay API
    if (this.razorpayInstance) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: orderAmount,
          currency: currency || 'INR',
          receipt: receiptId,
          notes: notes || {
            fullName: (fullName || 'Participant').trim(),
            email: (email || 'participant@example.com').trim(),
            phone: cleanPhone || '9999999999',
            tier: tier.title,
            plan: tier.plan,
            tickets: tier.tickets
          }
        });

        orderData = {
          orderId: order.id,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: 'CREATED',
          keyId: config.razorpay.keyId
        };
      } catch (err) {
        console.error('Razorpay orders.create error:', err);
        const errorDetail = err?.error?.description || err?.message || 'Razorpay order creation failed.';
        const customErr = new Error(`Razorpay order creation failed: ${errorDetail}`);
        
        if (
          err?.statusCode === 401 ||
          err?.status === 401 ||
          (err?.message && /auth/i.test(err.message)) ||
          (err?.error?.code === 'BAD_REQUEST_ERROR' && /auth/i.test(err?.error?.description))
        ) {
          customErr.statusCode = 401;
        } else {
          customErr.statusCode = 500;
        }
        throw customErr;
      }
    } else {
      // In development/test mode without API keys configured:
      // generate a compliant mock Razorpay order for development testing
      const mockOrderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      orderData = {
        orderId: mockOrderId,
        order_id: mockOrderId,
        amount: orderAmount,
        currency: currency || 'INR',
        receipt: receiptId,
        status: 'CREATED',
        keyId: config.razorpay.keyId || 'rzp_test_placeholder',
        isMockMode: true
      };
    }

    // Record order in data store
    dataStore.orders.set(orderData.orderId, {
      ...orderData,
      tier,
      participantDetails: {
        fullName: (fullName || 'Participant').trim(),
        email: (email || 'participant@example.com').trim(),
        phone: cleanPhone || '9999999999'
      },
      createdAt: new Date().toISOString()
    });

    dataStore.logAudit('CREATE_PAYMENT_ORDER', cleanPhone || 'unknown', {
      orderId: orderData.orderId,
      amount: Math.round(orderData.amount / 100),
      tier: tier.title
    });

    return {
      order_id: orderData.orderId,
      orderId: orderData.orderId,
      id: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      amountInRupees: Math.round(orderData.amount / 100),
      keyId: orderData.keyId,
      tier: tier.title,
      ticketCount: tier.tickets,
      plan: tier.plan,
      isMockMode: Boolean(orderData.isMockMode)
    };
  }

  verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    if (config.razorpay.keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      return generatedSignature === razorpay_signature;
    }

    // In local development test mode without key secret, verify standard non-empty strings
    const recordedOrder = dataStore.orders.get(razorpay_order_id);
    if (recordedOrder && recordedOrder.isMockMode) {
      return razorpay_signature.length > 5;
    }

    return false;
  }

  async verifyPaymentAndIssueTickets({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    fullName,
    email,
    phone,
    city = 'India',
    selectedOffer = 'ten_entry',
    termsAccepted = true
  }) {
    // 1. Mandatory payment fields validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      dataStore.logAudit('PAYMENT_FAILED_MISSING_CREDENTIALS', phone || 'unknown', {
        razorpay_order_id,
        razorpay_payment_id
      });
      const err = new Error('Payment verification details missing. Tickets cannot be generated.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Prevent replay attacks: ensure payment ID was not processed previously
    const existingPayment = dataStore.payments.find(p => p.paymentId === razorpay_payment_id);
    if (existingPayment) {
      const err = new Error('This payment has already been processed. Tickets were already issued.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Cryptographic Signature Verification: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const isSignatureValid = this.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isSignatureValid) {
      dataStore.payments.push({
        id: uuidv4(),
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: 'FAILED',
        reason: 'Invalid cryptographic signature: signature mismatch',
        createdAt: new Date().toISOString()
      });

      dataStore.logAudit('PAYMENT_SIGNATURE_FAILED', phone || 'unknown', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });

      const err = new Error('Payment verification failed: signature mismatch.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Retrieve order information
    const recordedOrder = dataStore.orders.get(razorpay_order_id);
    const offerKey = selectedOffer || recordedOrder?.tier?.offerId || 'ten_entry';
    const tier = this.getTierInfo(offerKey);
    if (recordedOrder) {
      recordedOrder.status = 'PAID';
      recordedOrder.paymentId = razorpay_payment_id;
    }

    const participantName = (fullName || recordedOrder?.participantDetails?.fullName || 'Participant').trim();
    const participantEmail = (email || recordedOrder?.participantDetails?.email || 'participant@example.com').trim().toLowerCase();
    const rawPhone = phone || recordedOrder?.participantDetails?.phone || '9999999999';
    const cleanPhone = String(rawPhone).replace(/\D/g, '') || '9999999999';

    // 5. Store verified payment record
    const paymentRecord = {
      id: uuidv4(),
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: tier.amountInRupees,
      currency: 'INR',
      status: 'SUCCESS',
      phone: cleanPhone,
      email: participantEmail,
      fullName: participantName,
      createdAt: new Date().toISOString()
    };
    dataStore.payments.push(paymentRecord);

    // 6. ONLY NOW: Register participant and generate tickets
    let participant = dataStore.participants.find(p => p.phone === cleanPhone);

    if (!participant) {
      participant = {
        id: uuidv4(),
        fullName: participantName,
        email: participantEmail,
        phone: cleanPhone,
        city: (city || 'India').trim(),
        location: (city || 'India').trim(),
        plan: tier.plan,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        createdAt: new Date().toISOString()
      };
      dataStore.participants.push(participant);
      const draw = dataStore.draws[0];
      if (draw) {
        draw.totalParticipants += 1;
      }
    } else {
      participant.plan = tier.plan;
      participant.location = city.trim();
      participant.paymentId = razorpay_payment_id;
      participant.orderId = razorpay_order_id;
    }

    // Issue lucky tickets for participant
    const tickets = [];
    for (let i = 0; i < tier.tickets; i++) {
      const ticket = ticketService.generateTicket(participant.id, 'draw-diwali-2026', tier.plan);
      ticket.paymentId = razorpay_payment_id;
      ticket.orderId = razorpay_order_id;

      tickets.push({
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        plan: ticket.plan,
        issuedAt: ticket.issuedAt,
        drawId: ticket.drawId,
        drawName: dataStore.draws[0].name,
        drawDate: dataStore.draws[0].displayDate,
        drawTime: dataStore.draws[0].displayTime,
        paymentId: razorpay_payment_id
      });
    }

    dataStore.logAudit('PAYMENT_VERIFIED_AND_TICKETS_ISSUED', participant.id, {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: tier.amountInRupees,
      ticketCount: tickets.length
    });

    // Dispatch lucky draw token to user's WhatsApp number
    let whatsappResult = null;
    try {
      whatsappResult = await whatsappService.sendTokenWhatsApp({
        fullName: participant.fullName,
        phone: participant.phone,
        ticketNumber: tickets[0]?.ticketNumber,
        tickets,
        drawName: dataStore.draws[0]?.name,
        drawDate: dataStore.draws[0]?.displayDate,
        drawTime: dataStore.draws[0]?.displayTime,
        plan: tier.plan
      });
    } catch (waErr) {
      console.error('WhatsApp notification dispatch error:', waErr.message);
    }

    return {
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: tier.amountInRupees,
        currency: 'INR',
        status: 'SUCCESS',
        method: 'Razorpay Verified',
        verifiedAt: new Date().toISOString()
      },
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        city: participant.city
      },
      ticket: tickets[0],
      tickets: tickets,
      whatsapp: whatsappResult
    };
  }

  getConfig() {
    const isConfigured = Boolean(
      config.razorpay.keyId && 
      config.razorpay.keySecret && 
      config.razorpay.keyId !== 'rzp_test_placeholder'
    );

    return {
      keyId: config.razorpay.keyId || '',
      isConfigured,
      currency: 'INR',
      name: 'Diwali Dhamaka Lucky Draw',
      description: 'Official Lucky Draw Entry Payment'
    };
  }

  getOrderStatus(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required.');
    }

    const order = dataStore.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const payment = dataStore.payments.find(p => p.orderId === orderId);

    return {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      tier: order.tier,
      isPaid: order.status === 'PAID',
      payment: payment || null
    };
  }

  handleWebhook(rawBody, signature) {
    if (config.razorpay.webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature.');
      }
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventType = event.event;

    dataStore.logAudit('WEBHOOK_EVENT_RECEIVED', 'RAZORPAY', {
      event: eventType,
      id: event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id
    });

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        const recordedOrder = dataStore.orders.get(orderId);
        if (recordedOrder && recordedOrder.status !== 'PAID') {
          // Auto-verify and issue tickets via webhook
          const participantDetails = recordedOrder.participantDetails || {};
          return this.verifyPaymentAndIssueTickets({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: 'webhook_verified',
            fullName: participantDetails.fullName || 'Participant',
            email: participantDetails.email || 'participant@example.com',
            phone: participantDetails.phone || '9999999999',
            city: participantDetails.city || 'India',
            selectedOffer: recordedOrder.tier?.offerId || 'ten_entry'
          });
        }
      }
    }

    return { received: true, event: eventType };
  }

  getAllPayments() {
    return dataStore.payments.map(p => ({
      ...p,
      formattedAmount: `₹${p.amount}`
    }));
  }
}

module.exports = new PaymentService();
