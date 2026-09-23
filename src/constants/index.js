module.exports = {
  DRAW_STATUS: {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  },
  TICKET_STATUS: {
    ACTIVE: 'ACTIVE',
    WON: 'WON',
    EXPIRED: 'EXPIRED'
  },
  PRIZE_TIERS: {
    FIRST: '1st Prize',
    SECOND: '2nd Prize',
    THIRD: '3rd Prize',
    FESTIVAL: 'Festival Reward',
    EARLY_BIRD: 'Early Bird Reward'
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
  }
};
