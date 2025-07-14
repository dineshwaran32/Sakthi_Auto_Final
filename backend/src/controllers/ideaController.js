const Idea = require("../models/Idea");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
const { io } = require('../server');

// Helper to recalculate and update user's credit points
async function recalculateUserCreditPoints(userId, reason, updater) {
  // Duplicate calculation due to newIdea 
  try {
    console.log(
      `🔄 Recalculating credit points for user ${userId}, reason: ${reason}`
    );

    // Get all user's ideas from database
    let ideas = await Idea.find({
      submittedBy: userId,
      isActive: { $ne: false },
    });

    // If a new idea is provided, include it in the calculation

    // Count ideas by status
    let submitted = ideas.length;
    let approved = ideas.filter((i) => i.status === "approved").length;
    let implemented = ideas.filter((i) => i.status === "implemented").length;

    // Get current user data
    const oldUser = await User.findById(userId);
    if (!oldUser) {
      console.log(`❌ User ${userId} not found`);
      return;
    }

    const oldPoints = oldUser.creditPoints || 0;
    const creditPoints = submitted * 10 + approved * 20 + implemented * 30;

    console.log(`📊 Credit Points Calculation:`, {
      submitted,
      approved,
      implemented,
      oldPoints,
      newPoints: creditPoints,
      difference: creditPoints - oldPoints,
    });

    // Update user's credit points
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { creditPoints },
      { new: true }
    );

    console.log(
      `✅ User credit points updated: ${oldPoints} → ${creditPoints}`
    );

    // Send notification if points changed
    if (creditPoints !== oldPoints) {
      console.log(`📢 Sending credit points update notification`);
      await NotificationService.notifyCreditPointsUpdate(
        oldUser,
        oldPoints,
        creditPoints,
        reason || "Points recalculated",
        updater
      );
    } else {
      console.log(`ℹ️ No change in credit points`);
    }

    return updatedUser;
  } catch (error) {
    console.error(`❌ Error in recalculateUserCreditPoints:`, error);
    throw error;
  }
}

const createIdea = async (req, res) => {
  try {
    console.log("Creating idea for user:", req.user._id, req.user.name);

    const ideaData = {
      ...req.body,
      submittedBy: req.user._id,
      submittedByEmployeeNumber: req.user.employeeNumber,
    };

    console.log("Idea data:", ideaData);

    const idea = new Idea(ideaData);
    await idea.save();

    console.log("Idea saved with ID:", idea._id);

    // Populate the submittedBy field
    await idea.populate("submittedBy", "name employeeNumber department");

    console.log("About to recalculate credit points for user:", req.user._id);

    // Recalculate credit points for the user
    await recalculateUserCreditPoints(
      req.user._id,
      "Idea submitted",
      req.user,
      idea
    );

    console.log("Credit points recalculation completed");

    // Notify reviewers
    await NotificationService.notifyIdeaSubmitted(idea, req.user);

    console.log("Notifications sent");

    // Emit real-time update event
    io.emit('ideas_updated');

    res.status(201).json({
      success: true,
      message: "Idea submitted successfully",
      data: { idea },
    });
  } catch (error) {
    console.error("Create idea error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating idea",
    });
  }
};

const getIdeas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      department,
      benefit,
      submittedBy,
      search,
    } = req.query;

    const filter = { isActive: { $ne: false } };

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (benefit) filter.benefit = benefit;
    if (submittedBy) filter.submittedByEmployeeNumber = submittedBy;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { problem: { $regex: search, $options: "i" } },
        { improvement: { $regex: search, $options: "i" } },
      ];
    }

    const ideas = await Idea.find(filter)
      .populate("submittedBy", "name employeeNumber department designation")
      .populate("reviewedBy", "name employeeNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Idea.countDocuments(filter);

    res.json({
      success: true,
      data: {
        ideas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get ideas error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ideas",
    });
  }
};

const getMyIdeas = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { submittedBy: req.user._id, isActive: { $ne: false } };
    if (status) filter.status = status;

    const ideas = await Idea.find(filter)
      .populate("reviewedBy", "name employeeNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Idea.countDocuments(filter);

    res.json({
      success: true,
      data: {
        ideas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get my ideas error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your ideas",
    });
  }
};

const getIdeaById = async (req, res) => {
  try {
    const idea = await Idea.findOne({
      _id: req.params.id,
      isActive: { $ne: false },
    })
      .populate("submittedBy", "name employeeNumber department designation")
      .populate("reviewedBy", "name employeeNumber");

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    res.json({
      success: true,
      data: { idea },
    });
  } catch (error) {
    console.error("Get idea by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching idea",
    });
  }
};

const updateIdeaStatus = async (req, res) => {
  try {
    const { status, reviewComments, actualSavings } = req.body;

    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    // Update idea
    idea.status = status;
    idea.reviewedBy = req.user._id;
    idea.reviewedAt = new Date();

    if (reviewComments) idea.reviewComments = reviewComments;
    if (actualSavings) idea.actualSavings = actualSavings;
    if (status === "implemented") idea.implementationDate = new Date();

    await idea.save();
    await idea.populate("submittedBy", "name employeeNumber");

    // Recalculate credit points for the user
    await recalculateUserCreditPoints(
      idea.submittedBy._id,
      `Idea status changed to ${status}`,
      req.user,
      idea
    );

    // Notify submitter
    await NotificationService.notifyIdeaStatusChange(idea, status, req.user);

    // Emit real-time update event
    io.emit('ideas_updated');

    res.json({
      success: true,
      message: "Idea status updated successfully",
      data: { idea },
    });
  } catch (error) {
    console.error("Update idea status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating idea status",
    });
  }
};

const getIdeaStats = async (req, res) => {
  try {
    const stats = await Idea.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalSavings: { $sum: "$estimatedSavings" },
        },
      },
    ]);

    const departmentStats = await Idea.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          totalSavings: { $sum: "$estimatedSavings" },
        },
      },
    ]);

    const benefitStats = await Idea.aggregate([
      {
        $group: {
          _id: "$benefit",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        departmentStats,
        benefitStats,
      },
    });
  } catch (error) {
    console.error("Get idea stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
    });
  }
};

const updateIdea = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "problem",
      "improvement",
      "benefit",
      "department",
      "estimatedSavings",
      "tags",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const idea = await Idea.findOneAndUpdate(
      { _id: req.params.id, submittedBy: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!idea) {
      return res
        .status(404)
        .json({ success: false, message: "Idea not found or not authorized" });
    }

    // Notify submitter if someone else edits the idea
    if (idea.submittedBy.toString() !== req.user._id.toString()) {
      await NotificationService.notifyIdeaUpdated(idea, updates, req.user);
    }

    // Emit real-time update event
    io.emit('ideas_updated');

    res.json({
      success: true,
      message: "Idea updated successfully",
      data: { idea },
    });
  } catch (error) {
    console.error("Update idea error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating idea" });
  }
};

const deleteIdea = async (req, res) => {
  try {
    const idea = await Idea.findOneAndUpdate(
      { _id: req.params.id, submittedBy: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!idea) {
      return res
        .status(404)
        .json({ success: false, message: "Idea not found or not authorized" });
    }

    // Recalculate credit points for the user after deleting idea
    await recalculateUserCreditPoints(
      req.user._id,
      "Idea deleted",
      req.user,
      idea
    );

    // Emit real-time update event
    io.emit('ideas_updated');

    res.json({ success: true, message: "Idea deleted successfully" });
  } catch (error) {
    console.error("Delete idea error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting idea" });
  }
};

module.exports = {
  createIdea,
  getIdeas,
  getMyIdeas,
  getIdeaById,
  updateIdeaStatus,
  getIdeaStats,
  updateIdea,
  deleteIdea,
};
