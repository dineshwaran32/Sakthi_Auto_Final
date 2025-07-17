const Notification = require('../models/Notification');
const User = require('../models/User');
const Idea = require('../models/Idea');

class NotificationService {
  // Create a single notification
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create multiple notifications
  static async createMultipleNotifications(notificationsData) {
    try {
      const notifications = await Notification.insertMany(notificationsData);
      return notifications;
    } catch (error) {
      console.error('Error creating multiple notifications:', error);
      throw error;
    }
  }

  // Idea submission notification
  static async notifyIdeaSubmitted(idea, submitter) {
  try {
    console.log('🔍 [DEBUG] Starting notifyIdeaSubmitted function');
    console.log('🔍 [DEBUG] Submitter details:', JSON.stringify({
      id: submitter._id,
      name: submitter.name,
      role: submitter.role,
      department: submitter.department
    }, null, 2));
    
    console.log('🔍 [DEBUG] Looking for admin users...');
    const adminQuery = { role: 'admin', isActive: true };
    console.log('🔍 [DEBUG] Admin query:', JSON.stringify(adminQuery, null, 2));
    
    // Get count of all users for debugging
    const totalUsers = await User.countDocuments({});
    console.log(`🔍 [DEBUG] Total users in database: ${totalUsers}`);
    
    // Get count of admin users
    const adminCount = await User.countDocuments(adminQuery);
    console.log(`🔍 [DEBUG] Total admin users: ${adminCount}`);
    
    // Find all users to see what roles exist
    const allUsers = await User.find({}).select('_id name email role isActive');
    console.log('🔍 [DEBUG] All users in database:', JSON.stringify(allUsers, null, 2));
    
    // Now find just the admins
    const admins = await User.find(adminQuery).select('_id name email role employeeNumber');
    
    console.log(`🔍 [DEBUG] Found ${admins.length} admin users:`, 
      JSON.stringify(admins.map(a => ({
        id: a._id,
        name: a.name,
        email: a.email,
        role: a.role,
        employeeNumber: a.employeeNumber
      })), null, 2)
    );
    
    if (admins.length === 0) {
      console.warn('⚠️ [WARNING] No active admin users found to notify');
      return [];
    }
    
    // Rest of your notification creation code...
    const notifications = admins.map(admin => {
      const notification = {
        recipient: admin._id,
        recipientEmployeeNumber: admin.employeeNumber,
        type: 'idea_submitted',
        title: 'New Idea Submitted - Action Required',
        message: `${submitter.name} from ${submitter.department || 'unknown department'} submitted a new idea: "${idea.title}"`,
        relatedIdea: idea._id,
        relatedUser: submitter._id,
        priority: 'high',
        metadata: {
          ideaTitle: idea.title,
          submitterName: submitter.name,
          department: idea.department || submitter.department,
          timestamp: new Date().toISOString()
        }
      };
      console.log('📝 [DEBUG] Creating notification:', JSON.stringify(notification, null, 2));
      return notification;
    });

    console.log('💾 [DEBUG] Saving notifications to database...');
    const result = await this.createMultipleNotifications(notifications);
    console.log('✅ [DEBUG] Notifications created successfully:', 
      JSON.stringify({
        count: result.length,
        notificationIds: result.map(n => n._id)
      }, null, 2)
    );
    
    return result;
  } catch (error) {
    console.error('❌ [ERROR] Error in notifyIdeaSubmitted:', error);
    throw error;
  }
}

  // Idea status change notification
  static async notifyIdeaStatusChange(idea, newStatus, reviewer) {
    try {
      const statusMessages = {
        'approved': 'Your idea has been approved and is under consideration for implementation',
        'rejected': 'Your idea has been reviewed but not approved at this time',
        'implementing': 'Your idea is now being implemented!',
        'implemented': 'Congratulations! Your idea has been successfully implemented'
      };

      const notification = {
        recipient: idea.submittedBy,
        recipientEmployeeNumber: idea.submittedByEmployeeNumber,
        type: `idea_${newStatus}`,
        title: `Idea ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your idea "${idea.title}" has been ${newStatus}`,
        relatedIdea: idea._id,
        relatedUser: reviewer._id,
        priority: newStatus === 'implemented' ? 'high' : 'medium',
        metadata: {
          ideaTitle: idea.title,
          previousStatus: idea.status,
          newStatus: newStatus,
          reviewerName: reviewer.name
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error notifying idea status change:', error);
    }
  }

  // Credit points update notification
  static async notifyCreditPointsUpdate(user, oldPoints, newPoints, reason) {
    try {
      const pointsDiff = newPoints - oldPoints;
      const notification = {
        recipient: user._id,
        recipientEmployeeNumber: user.employeeNumber,
        type: 'credit_points_updated',
        title: 'Credit Points Updated',
        message: `Your credit points have been ${pointsDiff > 0 ? 'increased' : 'updated'} to ${newPoints} points. ${reason}`,
        relatedUser: user._id,
        priority: 'medium',
        metadata: {
          oldPoints: oldPoints,
          newPoints: newPoints,
          pointsDifference: pointsDiff,
          reason: reason
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error notifying credit points update:', error);
    }
  }

  // Leaderboard change notification
  static async notifyLeaderboardChange(user, newPosition, previousPosition, leaderboardType = 'individual') {
    try {
      const positionChange = previousPosition - newPosition;
      let message = '';
      
      if (positionChange > 0) {
        message = `Congratulations! You've moved up ${positionChange} position(s) in the ${leaderboardType} leaderboard. You're now ranked #${newPosition}.`;
      } else if (positionChange < 0) {
        message = `You've moved down ${Math.abs(positionChange)} position(s) in the ${leaderboardType} leaderboard. You're now ranked #${newPosition}.`;
      } else {
        message = `You've maintained your position at #${newPosition} in the ${leaderboardType} leaderboard.`;
      }

      const notification = {
        recipient: user._id,
        recipientEmployeeNumber: user.employeeNumber,
        type: 'leaderboard_change',
        title: 'Leaderboard Update',
        message: message,
        relatedUser: user._id,
        priority: 'medium',
        metadata: {
          newPosition: newPosition,
          previousPosition: previousPosition,
          positionChange: positionChange,
          leaderboardType: leaderboardType
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error notifying leaderboard change:', error);
    }
  }

  // Department leader notification
  static async notifyDepartmentLeader(user, department, position) {
    try {
      const notification = {
        recipient: user._id,
        recipientEmployeeNumber: user.employeeNumber,
        type: 'department_leader',
        title: 'Department Leader! 🏆',
        message: `Congratulations! You're now the #${position} leader in the ${department} department.`,
        relatedUser: user._id,
        priority: 'high',
        metadata: {
          department: department,
          position: position
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error notifying department leader:', error);
    }
  }

  // Weekly summary notification
  static async notifyWeeklySummary(user, summary) {
    try {
      const notification = {
        recipient: user._id,
        recipientEmployeeNumber: user.employeeNumber,
        type: 'weekly_summary',
        title: 'Weekly Summary',
        message: `This week: ${summary.ideasSubmitted} ideas submitted, ${summary.ideasApproved} approved, ${summary.pointsEarned} points earned.`,
        relatedUser: user._id,
        priority: 'low',
        metadata: {
          weekStart: summary.weekStart,
          weekEnd: summary.weekEnd,
          ideasSubmitted: summary.ideasSubmitted,
          ideasApproved: summary.ideasApproved,
          pointsEarned: summary.pointsEarned
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error notifying weekly summary:', error);
    }
  }

  // Idea update notification
  static async notifyIdeaUpdated(idea, updatedFields, updater) {
    try {
      const fieldNames = Object.keys(updatedFields).join(', ');
      const notification = {
        recipient: idea.submittedBy,
        recipientEmployeeNumber: idea.submittedByEmployeeNumber,
        type: 'idea_updated',
        title: 'Idea Updated',
        message: `Your idea "${idea.title}" has been updated. Changes: ${fieldNames}`,
        relatedIdea: idea._id,
        relatedUser: updater._id,
        priority: 'medium',
        metadata: {
          ideaTitle: idea.title,
          updatedFields: updatedFields,
          updaterName: updater.name
        }
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error('Error notifying idea update:', error);
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 