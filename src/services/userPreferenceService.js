const User = require('../models/User');

class UserPreferenceService {
  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId) {
    try {
      console.log('🔍 Getting notification preferences for user:', userId);
      
      const user = await User.findById(userId).select('preferences.notifications');
      console.log('👤 User found:', !!user);
      
      if (!user) {
        console.log('❌ User not found, creating default preferences');
        // User not found, let's try to create default preferences
        const userExists = await User.findById(userId);
        if (!userExists) {
          throw new Error('USER_NOT_FOUND');
        }
        
        // Initialize default preferences
        userExists.preferences = userExists.preferences || {};
        userExists.preferences.notifications = {
          enabled: true,
          types: {
            task_assigned: true,
            task_completed: true,
            task_due_soon: true,
            note_shared: true,
            note_updated: false,
            file_uploaded: true,
            file_shared: true,
            chat_mention: true,
            system_alert: true
          },
          delivery: {
            realtime: true,
            email: false
          }
        };
        
        await userExists.save();
        console.log('✅ Default preferences created for user');
        return userExists.preferences.notifications;
      }

      // Check if preferences exist, if not initialize them
      if (!user.preferences || !user.preferences.notifications) {
        console.log('⚠️ Preferences not initialized, creating defaults');
        
        const fullUser = await User.findById(userId);
        fullUser.preferences = fullUser.preferences || {};
        fullUser.preferences.notifications = {
          enabled: true,
          types: {
            task_assigned: true,
            task_completed: true,
            task_due_soon: true,
            note_shared: true,
            note_updated: false,
            file_uploaded: true,
            file_shared: true,
            chat_mention: true,
            system_alert: true
          },
          delivery: {
            realtime: true,
            email: false
          }
        };
        
        await fullUser.save();
        console.log('✅ Default preferences initialized');
        return fullUser.preferences.notifications;
      }

      console.log('✅ Preferences found:', JSON.stringify(user.preferences.notifications, null, 2));
      return user.preferences.notifications;
    } catch (error) {
      console.error('❌ Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Validate preference structure
      const validatedPreferences = this._validatePreferences(preferences);

      // Update preferences
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...validatedPreferences
      };

      await user.save();

      return user.preferences.notifications;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check if user should receive a specific notification type
   */
  async shouldReceiveNotification(userId, notificationType) {
    try {
      console.log('🔍 UserPreferenceService.shouldReceiveNotification called:', { userId, notificationType });
      
      const preferences = await this.getNotificationPreferences(userId);
      console.log('📋 User notification preferences:', JSON.stringify(preferences, null, 2));
      
      // Check if notifications are globally enabled
      if (!preferences.enabled) {
        console.log('⚠️ Notifications globally disabled for user');
        return false;
      }

      // Check if specific notification type is enabled
      if (preferences.types && preferences.types[notificationType] !== undefined) {
        const result = preferences.types[notificationType];
        console.log(`📝 Specific preference for ${notificationType}:`, result);
        return result;
      }

      // Default to true if preference not set
      console.log('✅ No specific preference found, defaulting to true');
      return true;
    } catch (error) {
      console.error('❌ Error checking notification preference:', error);
      // Default to true on error to ensure important notifications are sent
      console.log('⚠️ Error occurred, defaulting to true for safety');
      return true;
    }
  }

  /**
   * Get user's preferred delivery methods
   */
  async getDeliveryPreferences(userId) {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      return preferences.delivery || { realtime: true, email: false };
    } catch (error) {
      console.error('Error getting delivery preferences:', error);
      return { realtime: true, email: false };
    }
  }

  /**
   * Update user theme preference
   */
  async updateThemePreference(userId, theme) {
    try {
      if (!['light', 'dark'].includes(theme)) {
        throw new Error('INVALID_THEME');
      }

      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      user.preferences.theme = theme;
      await user.save();

      return { theme };
    } catch (error) {
      console.error('Error updating theme preference:', error);
      throw error;
    }
  }

  /**
   * Get all user preferences
   */
  async getAllPreferences(userId) {
    try {
      const user = await User.findById(userId).select('preferences');
      
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return user.preferences;
    } catch (error) {
      console.error('Error getting all preferences:', error);
      throw error;
    }
  }

  /**
   * Reset notification preferences to defaults
   */
  async resetNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Reset to default preferences
      user.preferences.notifications = {
        enabled: true,
        types: {
          task_assigned: true,
          task_completed: true,
          task_due_soon: true,
          note_shared: true,
          note_updated: false,
          file_uploaded: true,
          file_shared: true,
          chat_mention: true,
          system_alert: true
        },
        delivery: {
          realtime: true,
          email: false
        }
      };

      await user.save();

      return user.preferences.notifications;
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Validate notification preferences structure
   */
  _validatePreferences(preferences) {
    const validated = {};

    // Validate enabled flag
    if (preferences.enabled !== undefined) {
      validated.enabled = Boolean(preferences.enabled);
    }

    // Validate notification types
    if (preferences.types && typeof preferences.types === 'object') {
      validated.types = {};
      const validTypes = [
        'task_assigned', 'task_completed', 'task_due_soon',
        'note_shared', 'note_updated',
        'file_uploaded', 'file_shared',
        'chat_mention', 'system_alert'
      ];

      for (const type of validTypes) {
        if (preferences.types[type] !== undefined) {
          validated.types[type] = Boolean(preferences.types[type]);
        }
      }
    }

    // Validate delivery preferences
    if (preferences.delivery && typeof preferences.delivery === 'object') {
      validated.delivery = {};
      
      if (preferences.delivery.realtime !== undefined) {
        validated.delivery.realtime = Boolean(preferences.delivery.realtime);
      }
      
      if (preferences.delivery.email !== undefined) {
        validated.delivery.email = Boolean(preferences.delivery.email);
      }
    }

    return validated;
  }

  /**
   * Bulk update preferences for multiple users (admin function)
   */
  async bulkUpdatePreferences(userIds, preferences) {
    try {
      const validatedPreferences = this._validatePreferences(preferences);
      
      const updateQuery = {};
      Object.keys(validatedPreferences).forEach(key => {
        updateQuery[`preferences.notifications.${key}`] = validatedPreferences[key];
      });

      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: updateQuery }
      );

      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      };
    } catch (error) {
      console.error('Error bulk updating preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences statistics (admin function)
   */
  async getPreferencesStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            notificationsEnabled: {
              $sum: { $cond: [{ $eq: ['$preferences.notifications.enabled', true] }, 1, 0] }
            },
            realtimeEnabled: {
              $sum: { $cond: [{ $eq: ['$preferences.notifications.delivery.realtime', true] }, 1, 0] }
            },
            emailEnabled: {
              $sum: { $cond: [{ $eq: ['$preferences.notifications.delivery.email', true] }, 1, 0] }
            },
            themeDistribution: {
              $push: '$preferences.theme'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalUsers: 0,
          notificationsEnabled: 0,
          realtimeEnabled: 0,
          emailEnabled: 0,
          themeDistribution: { light: 0, dark: 0 }
        };
      }

      // Process theme distribution
      const themeCount = { light: 0, dark: 0 };
      stats[0].themeDistribution.forEach(theme => {
        if (theme && themeCount[theme] !== undefined) {
          themeCount[theme]++;
        }
      });

      return {
        totalUsers: stats[0].totalUsers,
        notificationsEnabled: stats[0].notificationsEnabled,
        realtimeEnabled: stats[0].realtimeEnabled,
        emailEnabled: stats[0].emailEnabled,
        themeDistribution: themeCount
      };
    } catch (error) {
      console.error('Error getting preferences stats:', error);
      throw error;
    }
  }
}

module.exports = new UserPreferenceService();