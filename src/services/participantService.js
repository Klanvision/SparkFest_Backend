const dataStore = require('../models/dataStore');
const ticketService = require('./ticketService');
const { v4: uuidv4 } = require('uuid');

class ParticipantService {
  requestOtp(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Please provide a valid 10-digit mobile number.');
    }

    // Deterministic 6-digit OTP (for easy demo: 777888 or random)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    dataStore.otpSessions.set(cleanPhone, { otp, expiresAt });
    dataStore.logAudit('REQUEST_OTP', cleanPhone, { expiresAt });

    return {
      phone: cleanPhone,
      otp, // Provided for easy demonstration & testing
      expiresInSeconds: 300,
      message: 'OTP sent successfully to registered mobile number.'
    };
  }

  verifyOtp(phone, otp) {
    const cleanPhone = phone.replace(/\D/g, '');
    const session = dataStore.otpSessions.get(cleanPhone);

    // Accept master demo OTP '777888' or generated OTP
    if (!session && otp !== '777888') {
      throw new Error('No OTP request found for this mobile number. Please request a new OTP.');
    }

    if (session) {
      if (Date.now() > session.expiresAt) {
        dataStore.otpSessions.delete(cleanPhone);
        throw new Error('OTP has expired. Please request a new OTP.');
      }
      if (session.otp !== otp.trim() && otp.trim() !== '777888') {
        throw new Error('Invalid OTP entered. Please check and try again.');
      }
      // Clear session after successful verification
      dataStore.otpSessions.delete(cleanPhone);
    }

    return {
      verified: true,
      phone: cleanPhone,
      message: 'Mobile number verified successfully!'
    };
  }

  registerParticipant(data) {
    const { fullName, email, phone, city = 'India', termsAccepted = true } = data;

    if (!fullName || !fullName.trim()) {
      throw new Error('Full Name is required.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('A valid email address is required.');
    }
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('A valid 10-digit mobile number is required.');
    }
    if (!termsAccepted) {
      throw new Error('You must accept the terms and lucky draw rules to participate.');
    }

    // Check if participant already exists
    let participant = dataStore.participants.find(p => p.phone === cleanPhone);
    if (!participant) {
      participant = {
        id: uuidv4(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        city: city.trim(),
        verified: true,
        createdAt: new Date().toISOString()
      };
      dataStore.participants.push(participant);
      const draw = dataStore.draws[0];
      if (draw) {
        draw.totalParticipants += 1;
      }
    }

    // Automatically issue the participant's lucky ticket
    const ticket = ticketService.generateTicket(participant.id, 'draw-diwali-2026');

    dataStore.logAudit('REGISTER_PARTICIPANT', participant.id, {
      fullName: participant.fullName,
      ticketNumber: ticket.ticketNumber
    });

    return {
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        city: participant.city
      },
      ticket: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        issuedAt: ticket.issuedAt,
        drawId: ticket.drawId,
        drawName: dataStore.draws[0].name,
        drawDate: dataStore.draws[0].displayDate,
        drawTime: dataStore.draws[0].displayTime
      }
    };
  }

  getAllParticipants() {
    return dataStore.participants;
  }
}

module.exports = new ParticipantService();
