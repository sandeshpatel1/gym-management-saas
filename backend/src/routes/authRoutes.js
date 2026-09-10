const express = require('express');
const { login, registerCompany, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register-company', registerCompany);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;