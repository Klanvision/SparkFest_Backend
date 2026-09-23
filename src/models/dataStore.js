const { v4: uuidv4 } = require('uuid');
const { DRAW_STATUS, TICKET_STATUS, PRIZE_TIERS } = require('../constants');

class DataStore {
  constructor() {
    this.draws = [
      {
        id: 'draw-diwali-2026',
        name: 'Diwali Dhamaka Grand Lucky Draw 2026',
        description: 'Celebrate the Festival of Lights with our exclusive corporate lucky draw. Grand rewards, total transparency, and verified random draws.',
        scheduledAt: '2026-11-10T13:30:00.000Z', // 10 Nov 2026, 19:00:00 IST
        displayDate: '10 Nov 2026',
        displayTime: '07:00 PM (IST)',
        status: DRAW_STATUS.SCHEDULED,
        totalPrizePool: '₹85,000+',
        entryFee: '₹10',
        totalParticipants: 4280,
        totalTickets: 6850,
        rules: [
          'Participation is open to verified participants aged 18 and above.',
          'Unique cryptographic ticket numbers are issued immediately upon confirmed registration.',
          'Winners are selected through an automated, provably fair pseudorandom draw mechanism.',
          'Prize disbursement requires official government ID verification within 30 days.'
        ]
      }
    ];

    this.prizes = [
      {
        id: 'prize-1',
        drawId: 'draw-diwali-2026',
        tier: PRIZE_TIERS.FIRST,
        title: '1st Prize',
        amount: '₹50,000',
        numericAmount: 50000,
        icon: 'trophy',
        theme: 'gold',
        description: 'Grand Cash Prize credited directly to verified bank account.',
        winnersCount: 1,
        eligibility: 'All confirmed tickets'
      },
      {
        id: 'prize-2',
        drawId: 'draw-diwali-2026',
        tier: PRIZE_TIERS.SECOND,
        title: '2nd Prize',
        amount: '₹25,000',
        numericAmount: 25000,
        icon: 'award',
        theme: 'silver',
        description: 'Secondary Grand Cash Reward for lucky runner-up ticket.',
        winnersCount: 1,
        eligibility: 'All confirmed tickets'
      },
      {
        id: 'prize-3',
        drawId: 'draw-diwali-2026',
        tier: PRIZE_TIERS.THIRD,
        title: '3rd Prize',
        amount: '₹10,000',
        numericAmount: 10000,
        icon: 'medal',
        theme: 'bronze',
        description: 'Festive Celebration Cash Reward for third place winner.',
        winnersCount: 1,
        eligibility: 'All confirmed tickets'
      },
      {
        id: 'prize-4',
        drawId: 'draw-diwali-2026',
        tier: PRIZE_TIERS.FESTIVAL,
        title: '10+ Festival Rewards',
        amount: '₹1,000 Each',
        numericAmount: 1000,
        icon: 'gift',
        theme: 'purple',
        description: 'Ten additional festive hampers and rewards for lucky ticket holders.',
        winnersCount: 10,
        eligibility: 'All active participant tickets'
      }
    ];

    this.offers = [
      {
        id: 'offer-1',
        title: '₹10 Entry',
        subtitle: 'Special Entry Pass',
        description: 'Just ₹10 for a chance to win amazing prizes and participate in the grand festival draw!',
        badge: 'Popular',
        gradient: 'from-purple-900 via-indigo-900 to-purple-800',
        icon: 'sparkles',
        ctaText: 'JOIN NOW >',
        ctaLink: '/participate?offer=ten_entry'
      },
      {
        id: 'offer-2',
        title: 'Festival Special',
        subtitle: 'Double Celebration Bonus',
        description: 'Get bonus entry ticket with every additional participation. Maximize your winning probability!',
        badge: 'Festive High Value',
        gradient: 'from-red-950 via-rose-900 to-maroon-800',
        icon: 'gift',
        ctaText: 'PARTICIPATE NOW >',
        ctaLink: '/participate?offer=festival_special'
      },
      {
        id: 'offer-3',
        title: 'Early Bird Bonus',
        subtitle: 'Priority Tier Reward',
        description: 'Register early and get extra lucky tickets automatically allotted to your festive profile!',
        badge: 'Limited Slots',
        gradient: 'from-emerald-950 via-teal-900 to-cyan-900',
        icon: 'star',
        ctaText: 'REGISTER NOW >',
        ctaLink: '/participate?offer=early_bird'
      }
    ];

    this.winners = [
      {
        id: 'win-1',
        drawId: 'draw-diwali-2026',
        winnerName: 'Ramesh Sharma',
        maskedName: 'R*** S***',
        ticketNumber: 'DD-2026-45872',
        shortTicket: '#45872',
        prizeTitle: '1st Prize',
        prizeAmount: '₹50,000',
        tier: 'gold',
        drawDate: 'Diwali Mega Gala',
        city: 'Mumbai',
        announcedAt: '2026-09-15T18:30:00.000Z'
      },
      {
        id: 'win-2',
        drawId: 'draw-diwali-2026',
        winnerName: 'Priya Kulkarni',
        maskedName: 'P*** K***',
        ticketNumber: 'DD-2026-37261',
        shortTicket: '#37261',
        prizeTitle: '2nd Prize',
        prizeAmount: '₹25,000',
        tier: 'silver',
        drawDate: 'Festival Kickoff',
        city: 'Pune',
        announcedAt: '2026-09-12T18:30:00.000Z'
      },
      {
        id: 'win-3',
        drawId: 'draw-diwali-2026',
        winnerName: 'Suresh Menon',
        maskedName: 'S*** M***',
        ticketNumber: 'DD-2026-42903',
        shortTicket: '#42903',
        prizeTitle: '3rd Prize',
        prizeAmount: '₹10,000',
        tier: 'bronze',
        drawDate: 'Auspicious Round',
        city: 'Bengaluru',
        announcedAt: '2026-09-08T18:30:00.000Z'
      },
      {
        id: 'win-4',
        drawId: 'draw-diwali-2026',
        winnerName: 'Ananya Roy',
        maskedName: 'A*** R***',
        ticketNumber: 'DD-2026-18459',
        shortTicket: '#18459',
        prizeTitle: 'Festival Reward',
        prizeAmount: '₹5,000',
        tier: 'purple',
        drawDate: 'Early Bird Draw',
        city: 'Kolkata',
        announcedAt: '2026-09-05T18:30:00.000Z'
      },
      {
        id: 'win-5',
        drawId: 'draw-diwali-2026',
        winnerName: 'Kiran Nair',
        maskedName: 'K*** N***',
        ticketNumber: 'DD-2026-51024',
        shortTicket: '#51024',
        prizeTitle: 'Festival Reward',
        prizeAmount: '₹1,000',
        tier: 'purple',
        drawDate: 'Weekly Spark',
        city: 'Delhi',
        announcedAt: '2026-09-01T18:30:00.000Z'
      }
    ];

    this.faqs = [
      {
        id: 'faq-1',
        category: 'General',
        question: 'What is Diwali Dhamaka Lucky Draw?',
        answer: 'Diwali Dhamaka is a festival rewards and lucky draw initiative designed to celebrate the Festival of Lights with exciting cash prizes, gifts, and transparent verified digital participation.'
      },
      {
        id: 'faq-2',
        category: 'Participation',
        question: 'How can I participate in the lucky draw?',
        answer: 'Simply click "Enter Now", provide your mobile number, verify your OTP, complete your details, and an official unique ticket (e.g. DD-2026-XXXXX) will be generated instantly for you.'
      },
      {
        id: 'faq-3',
        category: 'Participation',
        question: 'Can I participate multiple times?',
        answer: 'Yes! With our Festival Special offer, additional participations earn you bonus lucky tickets, each entered into the draw pool with equal chance.'
      },
      {
        id: 'faq-4',
        category: 'Tickets',
        question: 'How will I receive my lucky ticket?',
        answer: 'Immediately upon confirmation, your digital lucky ticket will be shown on the screen with a downloadable voucher and sent via SMS/Email to your registered contact.'
      },
      {
        id: 'faq-5',
        category: 'Draw',
        question: 'When and how will the draw be conducted?',
        answer: 'The Grand Draw is scheduled for 10 November 2026 at 07:00 PM (IST). It is conducted live using our transparent, certified pseudorandom selection engine.'
      },
      {
        id: 'faq-6',
        category: 'Prizes',
        question: 'How will winners be notified and claims processed?',
        answer: 'Winners will be displayed live on the Winners and Live Draw pages, and notified directly via phone and email with straightforward claiming steps.'
      },
      {
        id: 'faq-7',
        category: 'Security',
        question: 'Is this lucky draw secure and legitimate?',
        answer: 'Yes, Diwali Dhamaka operates under strict compliance with transparent lucky draw governance standards, SSL encryption, and non-tamperable audit logs.'
      }
    ];

    this.participants = [
      {
        id: 'part-1',
        fullName: 'Kiran Kumar',
        email: 'kiran.k@example.com',
        phone: '9876543210',
        verified: true,
        createdAt: '2026-09-10T10:00:00.000Z'
      }
    ];

    this.tickets = [
      {
        id: 'tick-1',
        ticketNumber: 'DD-2026-45872',
        participantId: 'part-1',
        drawId: 'draw-diwali-2026',
        status: TICKET_STATUS.WON,
        prize: '1st Prize - ₹50,000',
        issuedAt: '2026-09-10T10:05:00.000Z'
      },
      {
        id: 'tick-2',
        ticketNumber: 'DD-2026-37261',
        participantId: 'part-1',
        drawId: 'draw-diwali-2026',
        status: TICKET_STATUS.WON,
        prize: '2nd Prize - ₹25,000',
        issuedAt: '2026-09-10T10:06:00.000Z'
      },
      {
        id: 'tick-sample',
        ticketNumber: 'DD-2026-99999',
        participantId: 'part-sample',
        drawId: 'draw-diwali-2026',
        status: TICKET_STATUS.ACTIVE,
        prize: null,
        issuedAt: new Date().toISOString()
      }
    ];

    this.contactMessages = [];
    this.auditLogs = [];
    this.otpSessions = new Map(); // phone -> { otp, expiresAt }
  }

  logAudit(action, actor, details) {
    const entry = {
      id: uuidv4(),
      action,
      actor,
      details,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(entry);
    return entry;
  }
}

module.exports = new DataStore();
