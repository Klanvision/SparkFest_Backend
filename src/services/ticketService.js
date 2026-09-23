const dataStore = require('../models/dataStore');
const { TICKET_STATUS } = require('../constants');
const { v4: uuidv4 } = require('uuid');

class TicketService {
  generateTicket(participantId, drawId = 'draw-diwali-2026') {
    // Generate 5-digit number
    let ticketNum;
    let attempts = 0;
    do {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      ticketNum = `DD-2026-${randNum}`;
      attempts++;
    } while (dataStore.tickets.some(t => t.ticketNumber === ticketNum) && attempts < 100);

    const newTicket = {
      id: uuidv4(),
      ticketNumber: ticketNum,
      participantId,
      drawId,
      status: TICKET_STATUS.ACTIVE,
      prize: null,
      issuedAt: new Date().toISOString()
    };

    dataStore.tickets.push(newTicket);
    const draw = dataStore.draws.find(d => d.id === drawId);
    if (draw) {
      draw.totalTickets += 1;
    }

    dataStore.logAudit('GENERATE_TICKET', participantId, { ticketNumber: ticketNum, drawId });
    return newTicket;
  }

  getTicketByNumber(ticketNumber) {
    const ticket = dataStore.tickets.find(
      t => t.ticketNumber.toUpperCase() === ticketNumber.trim().toUpperCase()
    );
    if (!ticket) return null;

    const participant = dataStore.participants.find(p => p.id === ticket.participantId);
    const draw = dataStore.draws.find(d => d.id === ticket.drawId);

    // Mask name for public ticket view
    let maskedName = 'Verified Participant';
    if (participant && participant.fullName) {
      maskedName = participant.fullName.split(' ').map(p => p[0] + '***').join(' ');
    }

    return {
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      prize: ticket.prize,
      issuedAt: ticket.issuedAt,
      drawName: draw ? draw.name : 'Diwali Dhamaka Grand Draw',
      drawDate: draw ? draw.displayDate : '10 Nov 2026',
      drawTime: draw ? draw.displayTime : '07:00 PM (IST)',
      participantMaskedName: maskedName,
      verifiedAuthentic: true
    };
  }

  getAllTickets() {
    return dataStore.tickets;
  }
}

module.exports = new TicketService();
