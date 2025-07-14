const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Engineering', 'Quality', 'Manufacturing', 'Management', 'Administration', 'HR', 'Finance']
  },
  designation: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['employee', 'reviewer'],
    default: 'employee'
  },
  creditPoints: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
// userSchema.index({ employeeNumber: 1 });
// userSchema.index({ email: 1 });
userSchema.index({ department: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    employeeNumber: this.employeeNumber,
    name: this.name,
    email: this.email,
    department: this.department,
    designation: this.designation,
    role: this.role,
    creditPoints: this.creditPoints,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    mobileNumber: this.mobileNumber
  };
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);