const express = require('express');
const { validateRequest, schemas } = require('../middleware/validation');
const { auth, authorize } = require('../middleware/auth');
const {
  createIdea,
  getIdeas,
  getMyIdeas,
  getIdeaById,
  updateIdeaStatus,
  getIdeaStats,
  updateIdea,
  deleteIdea
} = require('../controllers/ideaController');

const router = express.Router();

// @route   POST /api/ideas
// @desc    Create a new idea
// @access  Private
router.post('/', auth, validateRequest(schemas.createIdea), createIdea);

// @route   GET /api/ideas
// @desc    Get all ideas (with filters)
// @access  Private
router.get('/', auth, getIdeas);

// @route   GET /api/ideas/my
// @desc    Get current user's ideas
// @access  Private
router.get('/my', auth, getMyIdeas);

// @route   GET /api/ideas/:id
// @desc    Get idea by ID
// @access  Private
router.get('/:id', auth, getIdeaById);

// @route   PUT /api/ideas/:id
// @desc    Update an idea (edit)
// @access  Private (Owner)
router.put('/:id', auth, updateIdea);

// @route   PUT /api/ideas/:id/status
// @desc    Update idea status (review/approve/reject)
// @access  Private (Reviewers/Admins)
router.put('/:id/status', auth, authorize('reviewer', 'admin'), updateIdeaStatus);

// @route   DELETE /api/ideas/:id
// @desc    Delete an idea (soft delete)
// @access  Private (Owner)
router.delete('/:id', auth, deleteIdea);

module.exports = router;