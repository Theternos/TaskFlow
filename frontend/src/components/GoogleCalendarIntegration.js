
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GoogleCalendarIntegration = ({ user, onUpdateIntegrations }) => {
  const [integrations, setIntegrations] = useState(user.integrations || {
    calendar: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [error, setError] = useState(null);

  // Ensure we're using the correct base URL for all requests
  // This is important if your frontend and backend are on different ports
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Empty string for same-origin

  // Function to handle integration toggle
  const handleToggle = async (key) => {
    if (key === "calendar") {
      // If turning ON, initiate connection
      if (!integrations.calendar) {
        setIsConnecting(true);
        setError(null);
        
        try {
          // Check if backend is running first
          await axios.get(`http://localhost:5000/api/health`);
          connectGoogleCalendar();
        } catch (err) {
          console.error("Backend server not responding:", err);
          setError("Backend server not responding. Please make sure the server is running.");
          setIsConnecting(false);
        }
        return; // Don't update state yet - wait for redirect and callback
      }
      
      // If turning OFF, disconnect the calendar
      if (integrations.calendar) {
        try {
          const result = await disconnectGoogleCalendar();
          if (result.success) {
            // Update state after successful disconnection
            const updatedIntegrations = {
              ...integrations,
              [key]: false
            };
            
            setIntegrations(updatedIntegrations);
            
            // Propagate change to parent component
            if (onUpdateIntegrations) {
              onUpdateIntegrations(updatedIntegrations);
            }
          }
        } catch (error) {
          console.error("Failed to disconnect calendar:", error);
          setError("Failed to disconnect calendar: " + (error.response?.data?.error || error.message));
        }
      }
    }
  };

  // Function to connect Google Calendar
  const connectGoogleCalendar = () => {
    console.log('Starting Google Calendar connection for user:', user.id);
    
    // Store user ID in session storage so we can retrieve it after redirect
    sessionStorage.setItem('calendarConnectUserId', user.id);
    
    // Redirect to Google auth endpoint
    window.location.href = `http://localhost:5000/auth/google?userId=${user.id}`;
  };

  // Function to disconnect Google Calendar
  const disconnectGoogleCalendar = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await axios.post(`http://localhost:5000/api/disconnect-google-calendar`, { userId: user.id });
      if (response.data.success) {
        setConnectStatus('disconnected');
      }
      setIsConnecting(false);
      return response.data;
    } catch (error) {
      setIsConnecting(false);
      setConnectStatus('error');
      setError("Failed to disconnect: " + (error.response?.data?.error || error.message));
      throw error;
    }
  };

  // Check connection status on component mount and when URL params change
  useEffect(() => {
    const checkConnectionStatus = async () => {
      setError(null);
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/check-calendar-connection?userId=${user.id}`);
        const isConnected = response.data.connected;
        setConnectStatus(isConnected ? 'connected' : 'disconnected');
        
        // If connection status from backend differs from local state, update local state
        if (isConnected !== integrations.calendar) {
          const updatedIntegrations = {
            ...integrations,
            calendar: isConnected
          };
          setIntegrations(updatedIntegrations);
          
          // Propagate change to parent component
          if (onUpdateIntegrations) {
            onUpdateIntegrations(updatedIntegrations);
          }
        }
      } catch (error) {
        console.error("Failed to check calendar connection status:", error);
        setError("Failed to connect to backend server. Please make sure it's running.");
      } finally {
        setIsConnecting(false);
      }
    };
    
    // Only call if we have a user ID
    if (user && user.id) {
      checkConnectionStatus();
    }
    
    // Check for URL parameters indicating OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    const calendarConnected = urlParams.get('calendarConnected');
    const errorMsg = urlParams.get('error');
    
    if (calendarConnected === 'true') {
      // Remove the parameter from URL to avoid duplicate checks on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      checkConnectionStatus(); // Re-check status after successful connection
    } else if (calendarConnected === 'false' && errorMsg) {
      setError(`Calendar connection failed: ${decodeURIComponent(errorMsg)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user.id, integrations.calendar, onUpdateIntegrations, API_BASE_URL]);

  return (
    <>
      <div className="integration-item">
        <div className="integration-info">
          <div className="integration-icon calendar">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="integration-details">
            <span className="integration-name">Google Calendar</span>
            <span className="integration-description">
              Sync task deadlines with your calendar
            </span>
          </div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={integrations.calendar}
            onChange={() => handleToggle("calendar")}
            disabled={isConnecting}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Display any errors */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

    </>
  );
};

export default GoogleCalendarIntegration;