const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400); throw new Error('User already exists'); }
    const user = await User.create({ name, email, password });
    if (user) {
      res.status(201).json({ success: true, _id: user._id, name: user.name, email: user.email, profilePhoto: user.profilePhoto, token: generateToken(user._id) });
    } else {
      res.status(400); throw new Error('Invalid user data');
    }
  } catch (error) { next(error); }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // Added profilePhoto here
      res.json({ success: true, _id: user._id, name: user.name, email: user.email, profilePhoto: user.profilePhoto, isPinEnabled: user.isPinEnabled, token: generateToken(user._id) });
    } else {
      res.status(401); throw new Error('Invalid email or password');
    }
  } catch (error) { next(error); }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Added profilePhoto here
      res.json({ success: true, _id: user._id, name: user.name, email: user.email, profilePhoto: user.profilePhoto, isPinEnabled: user.isPinEnabled });
    } else {
      res.status(404); throw new Error('User not found');
    }
  } catch (error) { next(error); }
};

const setupPinLock = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (pin.length !== 4) { res.status(400); throw new Error('PIN must be 4 digits'); }
    const user = await User.findById(req.user._id);
    user.pinLock = pin;
    user.isPinEnabled = true;
    await user.save();
    res.json({ success: true, message: 'App Lock enabled successfully', isPinEnabled: true });
  } catch (error) { next(error); }
};

const verifyPinLock = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);
    if (user && (await user.matchPin(pin))) {
      res.json({ success: true, message: 'Access Granted' });
    } else {
      res.status(401); throw new Error('Incorrect PIN');
    }
  } catch (error) { next(error); }
};

const changePinLock = async (req, res, next) => {
  try {
    const { oldPin, newPin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user || !(await user.matchPin(oldPin))) { res.status(401); throw new Error('Incorrect Old PIN'); }
    if (newPin.length !== 4) { res.status(400); throw new Error('New PIN must be 4 digits'); }
    user.pinLock = newPin;
    await user.save();
    res.json({ success: true, message: 'PIN changed successfully' });
  } catch (error) { next(error); }
};

const removePinLock = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user || !(await user.matchPin(pin))) { res.status(401); throw new Error('Incorrect PIN'); }
    user.pinLock = undefined;
    user.isPinEnabled = false;
    await user.save();
    res.json({ success: true, message: 'App Lock removed successfully', isPinEnabled: false });
  } catch (error) { next(error); }
};

const forgotPassword = async (req, res, next) => { res.status(200).json({ success: true, message: 'Password reset flow initiated' }); };
const resetPassword = async (req, res, next) => { res.status(200).json({ success: true, message: 'Password reset successful' }); };

module.exports = { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword, setupPinLock, verifyPinLock, changePinLock, removePinLock };