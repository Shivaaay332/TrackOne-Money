const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword, setupPinLock, verifyPinLock, changePinLock, removePinLock } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Security Routes
router.post('/setup-pin', protect, setupPinLock);
router.post('/verify-pin', protect, verifyPinLock);
router.put('/change-pin', protect, changePinLock);
router.delete('/remove-pin', protect, removePinLock);

module.exports = router;