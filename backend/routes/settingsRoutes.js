const express = require('express');
const router = express.Router();
const { updateProfile, exportUserData, importUserData, factoryReset } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/profile').put(protect, upload.single('profilePhoto'), updateProfile);
router.route('/backup').get(protect, exportUserData);
router.route('/restore').post(protect, importUserData);
router.route('/factory-reset').delete(protect, factoryReset);

module.exports = router;