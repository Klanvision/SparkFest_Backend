const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const drawController = require('../controllers/drawController');
const prizeController = require('../controllers/prizeController');
const offerController = require('../controllers/offerController');
const winnerController = require('../controllers/winnerController');
const faqController = require('../controllers/faqController');
const ticketController = require('../controllers/ticketController');
const participantController = require('../controllers/participantController');
const contactController = require('../controllers/contactController');
const adminController = require('../controllers/adminController');

const { verifyAdmin } = require('../middleware/auth');

// Public API Routes
router.get('/home', homeController.getHomeData);

// Draws
router.get('/draw/current', drawController.getCurrent);
router.get('/draw/:id', drawController.getById);

// Prizes
router.get('/prizes', prizeController.getAll);
router.get('/prizes/:id', prizeController.getById);

// Offers
router.get('/offers', offerController.getAll);
router.get('/offers/:id', offerController.getById);

// Winners
router.get('/winners', winnerController.getAll);
router.get('/winners/recent', winnerController.getRecent);

// FAQs
router.get('/faqs', faqController.getAll);

// Tickets
router.get('/tickets/:ticketNumber', ticketController.getByNumber);
router.post('/tickets/generate', ticketController.generate);

// Participation
router.post('/participants/otp/request', participantController.requestOtp);
router.post('/participants/otp/verify', participantController.verifyOtp);
router.post('/participants/register', participantController.register);

// Contact
router.post('/contact', contactController.submit);

// Admin Routes (Public login, protected dashboard & actions)
router.post('/admin/login', adminController.login);
router.get('/admin/dashboard', verifyAdmin, adminController.getDashboard);
router.get('/admin/audit-logs', verifyAdmin, adminController.getAuditLogs);
router.get('/admin/contacts', verifyAdmin, contactController.getAll);
router.put('/admin/draw/:id', verifyAdmin, adminController.updateDraw);
router.post('/admin/draw/:id/execute', verifyAdmin, adminController.triggerWinner);

module.exports = router;
