// useCalendarSync.js
import { useState, useCallback } from 'react';
import calendarSyncService from '../services/calendarSyncService';

/**
 * Custom hook to manage calendar sync for tasks
 * @param {number} userId - The user ID
 * @returns {Object} - Calendar sync methods and state
 */
const useCalendarSync = (userId) => {
  const [syncStatus, setSyncStatus] = useState({
    loading: false,
    success: null,
    error: null
  });

  /**
   * Sync a task with the calendar
   * @param {Object} task - The task to sync
   */
  const syncTask = useCallback(async (task) => {
    if (!userId || !task) return;
    
    setSyncStatus({
      loading: true,
      success: null,
      error: null
    });
    
    try {
      const result = await calendarSyncService.syncTaskWithCalendar(task, userId);
      
      if (result.success) {
        setSyncStatus({
          loading: false,
          success: true,
          error: null,
          eventId: result.eventId,
          status: result.status
        });
        return result;
      } else {
        // Handle authentication expired case
        if (result.reason === 'auth_expired') {
          setSyncStatus({
            loading: false,
            success: false,
            error: 'Authentication expired',
            needsReconnect: true
          });
        } else {
          setSyncStatus({
            loading: false,
            success: false,
            error: result.message || 'Failed to sync with calendar'
          });
        }
        return result;
      }
    } catch (error) {
      setSyncStatus({
        loading: false,
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
      return { success: false, error: error.message };
    }
  }, [userId]);

  /**
   * Delete a task's calendar event
   * @param {number} taskId - The task ID
   */
  const deleteTaskEvent = useCallback(async (taskId) => {
    if (!userId || !taskId) return;
    
    setSyncStatus({
      loading: true,
      success: null,
      error: null
    });
    
    try {
      const result = await calendarSyncService.deleteTaskEvent(taskId, userId);
      
      if (result.success) {
        setSyncStatus({
          loading: false,
          success: true,
          error: null,
          status: result.status
        });
        return result;
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          error: result.error || 'Failed to delete calendar event'
        });
        return result;
      }
    } catch (error) {
      setSyncStatus({
        loading: false,
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
      return { success: false, error: error.message };
    }
  }, [userId]);

  return {
    syncTask,
    deleteTaskEvent,
    syncStatus
  };
};

export default useCalendarSync;