const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String 
  },
  // 👇 YEH SABSE IMPORTANT FIX HAI 👇
  uid: { 
    type: String, 
    unique: true, 
    sparse: true // <--- Yeh line 2 nulls ko takrane se rokegi
  },
  profilePhoto: { 
    type: String, 
    default: '' 
  },
  isPinEnabled: { 
    type: Boolean, 
    default: false 
  },
  pin: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
