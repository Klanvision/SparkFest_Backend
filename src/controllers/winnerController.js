const dataStore = require('../models/dataStore');
const d1Client = require('../services/d1Client');
const { HTTP_STATUS } = require('../constants');

class WinnerController {
  async getAll(req, res, next) {
    try {
      const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const cleanSearch = (rawSearch === 'undefined' || rawSearch === 'null') ? '' : rawSearch;

      const rawTier = typeof req.query.tier === 'string' ? req.query.tier.trim().toLowerCase() : '';
      const cleanTier = (rawTier === 'undefined' || rawTier === 'null' || rawTier === 'all') ? '' : rawTier;
      const limit = req.query.limit;

      let results = [];

      // Query from Cloudflare D1 Database if configured
      if (d1Client.isConfigured()) {
        try {
          let sql = 'SELECT * FROM winners';
          const params = [];
          const where = [];

          if (cleanTier) {
            where.push('LOWER(tier) = LOWER(?)');
            params.push(cleanTier);
          }

          if (cleanSearch) {
            where.push('(LOWER(winner_name) LIKE ? OR LOWER(ticket_number) LIKE ? OR LOWER(short_ticket) LIKE ? OR LOWER(prize_title) LIKE ?)');
            const q = `%${cleanSearch.toLowerCase()}%`;
            params.push(q, q, q, q);
          }

          if (where.length > 0) {
            sql += ' WHERE ' + where.join(' AND ');
          }

          sql += ' ORDER BY announced_at DESC';

          if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit, 10));
          }

          const dbRes = await d1Client.query(sql, params);
          if (dbRes.success && dbRes.result?.[0]?.results) {
            results = dbRes.result[0].results.map(row => ({
              id: row.id,
              drawId: row.draw_id,
              winnerName: row.winner_name,
              maskedName: row.masked_name,
              ticketNumber: row.ticket_number,
              shortTicket: row.short_ticket,
              prizeTitle: row.prize_title,
              prizeAmount: row.prize_amount,
              tier: row.tier,
              drawDate: row.draw_date,
              city: row.city,
              offerTag: row.offer_tag,
              announcedAt: row.announced_at
            }));
          }
        } catch (dbErr) {
          console.error('[D1 WINNERS QUERY ERROR]:', dbErr.message);
        }
      }

      // If D1 is not configured or returned empty fallback to data store
      if (results.length === 0) {
        results = [...dataStore.winners];

        if (cleanTier) {
          results = results.filter(w => (w.tier || '').toLowerCase() === cleanTier);
        }

        if (cleanSearch) {
          const q = cleanSearch.toLowerCase();
          results = results.filter(w => 
            (w.maskedName || '').toLowerCase().includes(q) ||
            (w.winnerName || '').toLowerCase().includes(q) ||
            (w.ticketNumber || '').toLowerCase().includes(q) ||
            (w.shortTicket || '').toLowerCase().includes(q) ||
            (w.prizeTitle || '').toLowerCase().includes(q) ||
            (w.city || '').toLowerCase().includes(q)
          );
        }

        if (limit) {
          results = results.slice(0, parseInt(limit, 10));
        }
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }

  async getRecent(req, res, next) {
    try {
      let results = [];
      if (d1Client.isConfigured()) {
        try {
          const dbRes = await d1Client.query('SELECT * FROM winners ORDER BY announced_at DESC LIMIT 8');
          if (dbRes.success && dbRes.result?.[0]?.results) {
            results = dbRes.result[0].results.map(row => ({
              id: row.id,
              drawId: row.draw_id,
              winnerName: row.winner_name,
              maskedName: row.masked_name,
              ticketNumber: row.ticket_number,
              shortTicket: row.short_ticket,
              prizeTitle: row.prize_title,
              prizeAmount: row.prize_amount,
              tier: row.tier,
              drawDate: row.draw_date,
              city: row.city,
              offerTag: row.offer_tag,
              announcedAt: row.announced_at
            }));
          }
        } catch (e) {}
      }

      if (results.length === 0) {
        results = dataStore.winners.slice(0, 8);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: results
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WinnerController();
