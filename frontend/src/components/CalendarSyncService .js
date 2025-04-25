// calendarSyncService.js
import axios from 'axios';

/**
 * Service to manage synchronization between tasks and Google Calendar
 */
class CalendarSyncService {
  /**
   * Sync a task with Google Calendar
   * @param {Object} task - The task object
   * @param {number} userId - The user ID
   * @returns {Promise} - Promise that resolves when sync is complete
   */
  async syncTaskWithCalendar(task, userId) {
    // Check if user has calendar integration enabled
    const checkResponse = await axios.get(`/api/check-calendar-connection?userId=${userId}`);
    
    if (!checkResponse.data.connected) {
      console.log('Calendar integration not enabled for this user');
      return { success: false, reason: 'not_enabled' };
    }
    
    // Format event details from task
    const eventDetails = {
      summary: `Task: ${task.title}`,
      description: task.description || '',
      deadline: task.dueDate, // Assuming task has a dueDate field
      timeZone: task.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      // End time is 30 minutes after deadline by default
      endTime: task.endTime || new Date(new Date(task.dueDate).getTime() + 30 * 60000).toISOString()
    };
    
    try {
      // Send to backend to create/update calendar event
      const response = await axios.post('/api/create-calendar-event', {
        userId,
        taskId: task.id,
        eventDetails
      });
      
      return response.data;
    } catch (error) {
      console.error('Error syncing task with calendar:', error);
      
      // Check if we need to reconnect
      if (error.response?.data?.action === 'reconnect') {
        // Notify user they need to reconnect their calendar
        return { 
          success: false, 
          reason: 'auth_expired',
          message: 'Your Google Calendar connection has expired. Please reconnect.'
        };
      }
      
      return { 
        success: false, 
        reason: 'error',
        message: error.response?.data?.error || 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Delete a calendar event when a task is deleted
   * @param {number} taskId - The task ID
   * @param {number} userId - The user ID
   * @returns {Promise} - Promise that resolves when deletion is complete
   */
  async deleteTaskEvent(taskId, userId) {
    try {
      const response = await axios.delete('/api/delete-calendar-event', {
        data: { userId, taskId }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting task event:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete event'
      };
    }
  }
}

export default new CalendarSyncService();