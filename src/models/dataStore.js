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
        totalPrizePool: 'Exclusive',
        entryFee: 'ticket',
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
      { id: 'prize-1', drawId: 'draw-diwali-2026', tier: '1st Prize', title: '1st Prize', amount: '₹10,000', numericAmount: 10000, icon: 'trophy', theme: 'gold', description: 'Mega Bumper Cracker Stash: An ultimate collection of premium multi-shot aerial cakes, sky lanterns, and exclusive display fireworks delivered safely to your door.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-2', drawId: 'draw-diwali-2026', tier: '2nd Prize', title: '2nd Prize', amount: '₹9,500', numericAmount: 9500, icon: 'award', theme: 'silver', description: 'Elite Celebration Box: Packed with high-end aerial shells, dazzling sparklers, and spectacular festive crackers for an unforgettable night.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-3', drawId: 'draw-diwali-2026', tier: '3rd Prize', title: '3rd Prize', amount: '₹9,000', numericAmount: 9000, icon: 'medal', theme: 'bronze', description: 'Royal Diwali Hamper: A majestic assortment of beautiful ground spinners, colorful fountains, and premium family-friendly crackers.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-4', drawId: 'draw-diwali-2026', tier: '4th Prize', title: '4th Prize', amount: '₹8,500', numericAmount: 8500, icon: 'star', theme: 'purple', description: 'Luxury Sparkler Kit: Exclusive premium sparklers and safe, low-smoke color fountains perfect for celebrating with family.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-5', drawId: 'draw-diwali-2026', tier: '5th Prize', title: '5th Prize', amount: '₹8,000', numericAmount: 8000, icon: 'gift', theme: 'blue', description: 'Festive Joy Bundle: A delightful mix of classic flower pots, charkhis, and assorted color rockets.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-6', drawId: 'draw-diwali-2026', tier: '6th Prize', title: '6th Prize', amount: '₹7,500', numericAmount: 7500, icon: 'crown', theme: 'emerald', description: 'Premium Aerial Assortment: High-quality aerial fireworks and sky shots securely packed for your celebration.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-7', drawId: 'draw-diwali-2026', tier: '7th Prize', title: '7th Prize', amount: '₹7,000', numericAmount: 7000, icon: 'sparkles', theme: 'ruby', description: 'Classic Cracker Combo: A beautifully crafted box of traditional Diwali crackers and color matches.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-8', drawId: 'draw-diwali-2026', tier: '8th Prize', title: '8th Prize', amount: '₹6,500', numericAmount: 6500, icon: 'diamond', theme: 'sapphire', description: 'Family Fiesta Pack: Safe, brilliant, and noise-free light displays designed for joyous family gatherings.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-9', drawId: 'draw-diwali-2026', tier: '9th Prize', title: '9th Prize', amount: '₹6,000', numericAmount: 6000, icon: 'heart', theme: 'rose', description: 'Starlight Collection: Premium quality sparklers, pencil crackers, and magical glowing wires.', winnersCount: 1, eligibility: 'All confirmed tickets' },
      { id: 'prize-10', drawId: 'draw-diwali-2026', tier: '10th Prize', title: '10th Prize', amount: '₹5,500', numericAmount: 5500, icon: 'shield', theme: 'amber', description: 'Spark & Glow Hamper: A charming set of miniature fountains and vibrant ground fireworks to light up your evening.', winnersCount: 1, eligibility: 'All confirmed tickets' }
    ];

    this.offers = [
      {
        id: 'offer-1',
        title: 'ticket Entry',
        subtitle: 'Special Entry Pass',
        description: 'Just ticket for a chance to win amazing prizes and participate in the grand festival draw!',
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
        prizeAmount: '₹10,000',
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
        prizeAmount: '₹9,500',
        tier: 'gold',
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
        prizeAmount: '₹9,000',
        tier: 'gold',
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
        prizeTitle: '4th Prize',
        prizeAmount: '₹8,500',
        tier: 'gold',
        drawDate: 'Grand Bumper Draw',
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
        prizeTitle: '5th Prize',
        prizeAmount: '₹8,000',
        tier: 'gold',
        drawDate: 'Weekly Spark',
        city: 'Delhi',
        announcedAt: '2026-09-01T18:30:00.000Z'
      },
      {
        id: 'win-6',
        drawId: 'draw-diwali-2026',
        winnerName: 'Meena Iyer',
        maskedName: 'M*** I***',
        ticketNumber: 'DD-2026-63291',
        shortTicket: '#63291',
        prizeTitle: '6th Prize',
        prizeAmount: '₹7,500',
        tier: 'silver',
        drawDate: 'Festive Special',
        city: 'Chennai',
        announcedAt: '2026-08-28T18:30:00.000Z'
      },
      {
        id: 'win-7',
        drawId: 'draw-diwali-2026',
        winnerName: 'Rajesh Patel',
        maskedName: 'R*** P***',
        ticketNumber: 'DD-2026-74812',
        shortTicket: '#74812',
        prizeTitle: '7th Prize',
        prizeAmount: '₹7,000',
        tier: 'silver',
        drawDate: 'Diwali Round 2',
        city: 'Ahmedabad',
        announcedAt: '2026-08-25T18:30:00.000Z'
      },
      {
        id: 'win-8',
        drawId: 'draw-diwali-2026',
        winnerName: 'Sunita Joshi',
        maskedName: 'S*** J***',
        ticketNumber: 'DD-2026-82047',
        shortTicket: '#82047',
        prizeTitle: '8th Prize',
        prizeAmount: '₹6,500',
        tier: 'silver',
        drawDate: 'Bumper Draw',
        city: 'Hyderabad',
        announcedAt: '2026-08-22T18:30:00.000Z'
      },
      {
        id: 'win-9',
        drawId: 'draw-diwali-2026',
        winnerName: 'Arjun Verma',
        maskedName: 'A*** V***',
        ticketNumber: 'DD-2026-91365',
        shortTicket: '#91365',
        prizeTitle: '9th Prize',
        prizeAmount: '₹6,000',
        tier: 'silver',
        drawDate: 'Grand Finale',
        city: 'Jaipur',
        announcedAt: '2026-08-18T18:30:00.000Z'
      },
      {
        id: 'win-10',
        drawId: 'draw-diwali-2026',
        winnerName: 'Kavita Singh',
        maskedName: 'K*** S***',
        ticketNumber: 'DD-2026-10583',
        shortTicket: '#10583',
        prizeTitle: '10th Prize',
        prizeAmount: '₹5,500',
        tier: 'silver',
        drawDate: 'Lucky Dip',
        city: 'Lucknow',
        announcedAt: '2026-08-15T18:30:00.000Z'
      },
      {
        id: 'win-11',
        drawId: 'draw-diwali-2026',
        winnerName: 'Vikram Reddy',
        maskedName: 'V*** R***',
        ticketNumber: 'DD-2026-29147',
        shortTicket: '#29147',
        prizeTitle: 'Festival Special',
        prizeAmount: '₹10,000',
        offerTag: '3X Entries • Triple Chances',
        tier: 'bronze',
        drawDate: 'Festival Special Draw',
        city: 'Visakhapatnam',
        announcedAt: '2026-08-12T18:30:00.000Z'
      },
      {
        id: 'win-12',
        drawId: 'draw-diwali-2026',
        winnerName: 'Deepa Krishnan',
        maskedName: 'D*** K***',
        ticketNumber: 'DD-2026-36820',
        shortTicket: '#36820',
        prizeTitle: 'Festival Special',
        prizeAmount: '₹10,000',
        offerTag: '3X Entries • Triple Chances',
        tier: 'bronze',
        drawDate: 'Festival Special Draw',
        city: 'Kochi',
        announcedAt: '2026-08-10T18:30:00.000Z'
      },
      {
        id: 'win-13',
        drawId: 'draw-diwali-2026',
        winnerName: 'Mohan Das',
        maskedName: 'M*** D***',
        ticketNumber: 'DD-2026-47593',
        shortTicket: '#47593',
        prizeTitle: 'Early Bird Bonus',
        prizeAmount: '₹10,000',
        offerTag: '5X Entries • VIP Bumper Pool',
        tier: 'purple',
        drawDate: 'Early Bird Special',
        city: 'Bhopal',
        announcedAt: '2026-08-08T18:30:00.000Z'
      },
      {
        id: 'win-14',
        drawId: 'draw-diwali-2026',
        winnerName: 'Neha Gupta',
        maskedName: 'N*** G***',
        ticketNumber: 'DD-2026-58406',
        shortTicket: '#58406',
        prizeTitle: 'Early Bird Bonus',
        prizeAmount: '₹10,000',
        offerTag: '5X Entries • VIP Bumper Pool',
        tier: 'purple',
        drawDate: 'Early Bird Special',
        city: 'Chandigarh',
        announcedAt: '2026-08-06T18:30:00.000Z'
      }
    ];

    this.faqs = [
      {
        id: 'faq-1',
        category: 'General',
        question: 'What is Diwali Dhamaka Lucky Draw?',
        answer: 'Diwali Dhamaka is a festival rewards and lucky draw initiative designed to celebrate the Festival of Lights with exciting Gift prizes, gifts, and transparent verified digital participation.'
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
        prize: '1st Prize - Smart LED TV (55-inch)',
        issuedAt: '2026-09-10T10:05:00.000Z'
      },
      {
        id: 'tick-2',
        ticketNumber: 'DD-2026-37261',
        participantId: 'part-1',
        drawId: 'draw-diwali-2026',
        status: TICKET_STATUS.WON,
        prize: '2nd Prize - Latest 5G Smartphone',
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
