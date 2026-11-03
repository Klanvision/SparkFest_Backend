/**
 * WhatsApp Notification Service
 * Sends confirmed lucky draw token details to the participant's WhatsApp number.
 */

const https = require('https');

class WhatsAppService {
  /**
   * Format official WhatsApp message for lucky draw token issuance
   */
  formatTokenMessage({ fullName, phone, ticketNumber, tickets = [], drawName, drawDate, drawTime, plan }) {
    const ticketList = tickets.length > 1
      ? tickets.map((t, idx) => `  ${idx + 1}. *${t.ticketNumber}*`).join('\n')
      : `🎟️ *TOKEN ID:* *${ticketNumber}*`;

    return `✨ *DIWALI DHAMAKA GRAND LUCKY DRAW 2026* ✨\n\n` +
      `Congratulations *${fullName}*! Your participation is confirmed and your official lucky token has been generated.\n\n` +
      `${ticketList}\n\n` +
      `📅 *Draw Date:* ${drawDate || '10 Nov 2026'}\n` +
      `⏰ *Draw Time:* ${drawTime || '07:00 PM (IST)'}\n` +
      `📦 *Plan:* ${plan || 'Official Entry'}\n` +
      `🔒 *Status:* VERIFIED & ACTIVE\n\n` +
      `👉 *View & Download Your Official Voucher:*\n` +
      `http://localhost:5173/ticket/${ticketNumber}\n\n` +
      `Please save this message for draw verification. Good luck! 🪔✨`;
  }

  /**
   * Dispatches the token details to user's WhatsApp number.
   * Supports direct wa.me link generation and external API gateways.
   */
  async sendTokenWhatsApp({ fullName, phone, ticketNumber, tickets, drawName, drawDate, drawTime, plan }) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const message = this.formatTokenMessage({
      fullName,
      phone: cleanPhone,
      ticketNumber,
      tickets,
      drawName,
      drawDate,
      drawTime,
      plan
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedMessage}`;

    console.log(`[WHATSAPP NOTIFICATION] Token ${ticketNumber} dispatched to +91 ${cleanPhone}`);
    console.log(`[WHATSAPP MESSAGE]:\n${message}`);

    // If external WhatsApp API webhook/gateway URL is configured in environment
    const webhookUrl = process.env.WHATSAPP_GATEWAY_URL;
    if (webhookUrl) {
      try {
        await this.postToWebhook(webhookUrl, {
          to: `91${cleanPhone}`,
          message,
          ticketNumber,
          fullName
        });
      } catch (err) {
        console.error('[WHATSAPP GATEWAY ERROR]:', err.message);
      }
    }

    return {
      success: true,
      phone: cleanPhone,
      ticketNumber,
      whatsappUrl,
      message,
      dispatchedAt: new Date().toISOString()
    };
  }

  postToWebhook(url, payload) {
    return new Promise((resolve, reject) => {
      try {
        const data = JSON.stringify(payload);
        const urlObj = new URL(url);
        const req = https.request(
          urlObj,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data)
            }
          },
          (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve(true));
          }
        );
        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = new WhatsAppService();
