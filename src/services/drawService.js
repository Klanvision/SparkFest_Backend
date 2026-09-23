const dataStore = require('../models/dataStore');
const { DRAW_STATUS, TICKET_STATUS } = require('../constants');
const { v4: uuidv4 } = require('uuid');

class DrawService {
  getCurrentDraw() {
    const draw = dataStore.draws[0];
    const now = new Date();
    const scheduled = new Date(draw.scheduledAt);

    // Dynamic state computation based on time if still marked SCHEDULED
    let computedStatus = draw.status;
    if (draw.status === DRAW_STATUS.SCHEDULED && now >= scheduled) {
      computedStatus = DRAW_STATUS.LIVE;
    }

    return {
      ...draw,
      status: computedStatus,
      serverTime: now.toISOString(),
      remainingMs: Math.max(0, scheduled.getTime() - now.getTime())
    };
  }

  getDrawById(id) {
    return dataStore.draws.find(d => d.id === id) || null;
  }

  updateDraw(id, updates, actor = 'admin') {
    const draw = this.getDrawById(id);
    if (!draw) return null;

    Object.assign(draw, updates);
    dataStore.logAudit('UPDATE_DRAW', actor, { drawId: id, updates });
    return draw;
  }

  executeDraw(id, prizeId, actor = 'admin') {
    const draw = this.getDrawById(id);
    if (!draw) throw new Error('Draw not found');

    const eligibleTickets = dataStore.tickets.filter(
      t => t.drawId === id && t.status === TICKET_STATUS.ACTIVE
    );

    if (eligibleTickets.length === 0) {
      throw new Error('No active eligible tickets found for this draw.');
    }

    // Pseudorandom fair selection
    const winningIndex = Math.floor(Math.random() * eligibleTickets.length);
    const winningTicket = eligibleTickets[winningIndex];

    const prize = dataStore.prizes.find(p => p.id === prizeId) || dataStore.prizes[0];

    // Find participant
    const participant = dataStore.participants.find(p => p.id === winningTicket.participantId) || {
      fullName: 'Lucky Winner',
      city: 'India'
    };

    // Mask name for privacy e.g. "Ramesh Sharma" -> "R*** S***"
    const nameParts = participant.fullName.split(' ');
    const maskedName = nameParts.map(p => p[0] + '***').join(' ');

    const newWinner = {
      id: uuidv4(),
      drawId: id,
      winnerName: participant.fullName,
      maskedName: maskedName,
      ticketNumber: winningTicket.ticketNumber,
      shortTicket: '#' + winningTicket.ticketNumber.split('-').pop(),
      prizeTitle: prize.title,
      prizeAmount: prize.amount,
      tier: prize.theme,
      drawDate: draw.displayDate,
      city: participant.city || 'Verified Citizen',
      announcedAt: new Date().toISOString()
    };

    winningTicket.status = TICKET_STATUS.WON;
    winningTicket.prize = prize.title;

    dataStore.winners.unshift(newWinner);
    dataStore.logAudit('EXECUTE_DRAW_WINNER', actor, { drawId: id, winnerId: newWinner.id, ticket: winningTicket.ticketNumber });

    return newWinner;
  }
}

module.exports = new DrawService();
