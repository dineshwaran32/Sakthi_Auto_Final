const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  problem: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  improvement: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  benefit: {
    type: String,
    required: true,
    enum: ['cost_saving', 'safety', 'quality', 'productivity']
  },
  estimatedSavings: {
    type: Number,
    min: 0
  },
  department: {
    type: String,
    required: true,
    enum: ['Engineering', 'Quality', 'Manufacturing', 'Management', 'Administration', 'HR', 'Finance']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedByEmployeeNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['under_review', 'approved', 'rejected', 'implementing', 'implemented'],
    default: 'under_review'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  implementationDate: {
    type: Date
  },
  actualSavings: {
    type: Number,
    min: 0
  },
  images: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  imageUris: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ideaSchema.index({ submittedBy: 1 });
ideaSchema.index({ submittedByEmployeeNumber: 1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ department: 1 });
ideaSchema.index({ benefit: 1 });
ideaSchema.index({ createdAt: -1 });

// Virtual for idea summary
ideaSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    status: this.status,
    benefit: this.benefit,
    estimatedSavings: this.estimatedSavings,
    submittedDate: this.createdAt,
    department: this.department
  };
});

// Update the updatedAt field before saving
ideaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Idea', ideaSchema);