import React, { useState, useEffect } from "react";
import "./IntegrationSettings.css";
import axios from "axios"; // Make sure to install axios: npm install axios
import GoogleCalendarIntegration from './GoogleCalendarIntegration';

const StaffIntegration = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("loggedInUser")) || {}
  );
  const [integrations, setIntegrations] = useState({
    whatsapp: false,
    message: false,
    voiceCall: false,
    mail: true, // Default enabled and cannot be disabled
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [activeIntegration, setActiveIntegration] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Fetch the user's integration settings when component mounts
  useEffect(() => {
    if (user && user.id) {
      fetchIntegrationSettings();
    } else {
      setLoading(false);
    }
  }, [user]);


  const handleUpdateIntegrations = async (updatedIntegrations) => {
    // Call your API to update user integrations in the backend
    try {
      await axios.post('/api/update-user-integrations', {
        userId: user.id,
        integrations: updatedIntegrations
      });
    } catch (error) {
      console.error('Failed to update integrations:', error);
    }
  };


  const fetchIntegrationSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/integrations/${user.id}`
      );
      if (response.data.success) {
        setIntegrations(response.data.integrations);
      }
    } catch (error) {
      console.error("Error fetching integration settings:", error);
      setMessage({
        text: "Failed to load integration settings. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (integration) => {
    if (integration === "mail") return; // Cannot toggle mail

    // Check if enabling a phone-requiring integration
    if (
      !integrations[integration] &&
      (integration === "whatsapp" ||
        integration === "message" ||
        integration === "voiceCall")
    ) {
      // Check if the user has a valid phone number
      if (!user.phoneNumber || user.phoneNumber === "") {
        setActiveIntegration(integration);
        setShowPhoneModal(true);
        return; // Don't toggle yet, wait for phone number input
      }
      console.log("User object:", user);
      console.log("Phone number:", user.phoneNumber);
    }

    // If we got here, either it's not a phone-related integration or the user already has a phone number
    setIntegrations({
      ...integrations,
      [integration]: !integrations[integration],
    });
  };

  const saveIntegrationSettings = async () => {
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });

      const response = await axios.post(
        `http://localhost:5000/api/integrations/${user.id}`,
        { integrations }
      );

      if (response.data.success) {
        setMessage({
          text: "Integration settings saved successfully!",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error saving integration settings:", error);
    } finally {
      setSaving(false);

      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/";
  };

  const getAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  const handlePhoneSubmit = async () => {
    // Basic validation for phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    try {
      setSaving(true);
      setPhoneError("");

      // Save the phone number to the user's profile
      const response = await axios.post(
        `http://localhost:5000/api/users/${user.id}/phone`,
        { phoneNumber }
      );

      if (response.data && response.data.success) {
        // Update local user data
        const updatedUser = { ...user, phoneNumber };
        setUser(updatedUser);
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

        // Toggle the integration now that we have a phone number
        setIntegrations({
          ...integrations,
          [activeIntegration]: true,
        });

        // Close the modal
        setShowPhoneModal(false);
      } else {
        // Handle case where server returns success: false
        setPhoneError(
          response.data.message ||
            "Failed to save phone number. Please try again."
        );
      }
    } catch (error) {
      console.error("Error saving phone number:", error);
      // More detailed error handling
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        setPhoneError(
          error.response.data.message ||
            `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        setPhoneError("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request
        setPhoneError(`Error: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Add a method to close the modal and reset errors
  const handleCloseModal = () => {
    setShowPhoneModal(false);
    setPhoneError("");
    // Reset phone number to original value if present
    setPhoneNumber(user?.phoneNumber || "");
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo">
            <i className="fas fa-tasks"></i>
            <span>TaskFlow</span>
          </div>
        </div>

        <div className="menu-section">
          <h3 className="menu-title">Main</h3>
          <ul className="menu-items">
            <li className="menu-item">
              <a href="staff">
                <i className="fas fa-tasks"></i>
                <span>Tasks</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="staffanalytics">
                <i className="fas fa-chart-bar"></i>
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="menu-section">
          <h3 className="menu-title">Management</h3>
          <ul className="menu-items">
            <li className="menu-item">
              <a href="staffrequests">
                <i className="fas fa-inbox"></i>
                <span>ReQuest</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="staffsettings">
                <i className="fas fa-cogs"></i>
                <span>Settings</span>
              </a>
            </li>
            <li className="menu-item active">
              <a href="staffintegrations">
                <i className="fas fa-plug"></i>
                <span>Integrations</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Logout Button */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> &nbsp;
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h1 className="page-title">Welcome {user?.username}!</h1>
          <div className="user-profile">
            <div className="avatar">{getAvatarInitial(user?.username)}</div>
          </div>
        </header>

        {/* Integration Settings */}
        <div className="integrations-container">
          <div className="integration-card">
            <div className="integration-header">
              <h2 className="integration-title">Integration Settings</h2>
            </div>
            <p className="integration-description">
              Connect TaskFlow with your favorite applications for a seamless
              workflow experience.
            </p>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.type === "success" ? (
                  <i className="fas fa-check-circle"></i>
                ) : (
                  <i className="fas fa-exclamation-circle"></i>
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="integration-list">
              {/* Mail Integration */}
              <div className="integration-item">
                <div className="integration-info">
                  <div className="integration-icon mail">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="integration-details">
                    <span className="integration-name">Mail</span>
                    <span className="integration-description">
                      Required: Email notifications for all tasks
                    </span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={true} disabled />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* WhatsApp Integration */}
              <div className="integration-item">
                <div className="integration-info">
                  <div className="integration-icon whatsapp">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <div className="integration-details">
                    <span className="integration-name">WhatsApp</span>
                    <span className="integration-description">
                      Receive task notifications via WhatsApp
                    </span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={integrations.whatsapp}
                    onChange={() => handleToggle("whatsapp")}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Message Integration */}
              <div className="integration-item">
                <div className="integration-info">
                  <div className="integration-icon message">
                    <i className="fas fa-comment"></i>
                  </div>
                  <div className="integration-details">
                    <span className="integration-name">Message</span>
                    <span className="integration-description">
                      Send SMS notifications for task updates
                    </span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={integrations.message}
                    onChange={() => handleToggle("message")}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Voice Call Integration */}
              <div className="integration-item">
                <div className="integration-info">
                  <div className="integration-icon voice-call">
                    <i className="fas fa-phone-alt"></i>
                  </div>
                  <div className="integration-details">
                    <span className="integration-name">Voice Call</span>
                    <span className="integration-description">
                      Receive automated calls for urgent tasks
                    </span>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={integrations.voiceCall}
                    onChange={() => handleToggle("voiceCall")}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Google Calendar Integration */}
               <GoogleCalendarIntegration 
                user={user}
                onUpdateIntegrations={handleUpdateIntegrations}
              />

              
            </div>



            {/* Save Button */}
            <button
              className={`save-button ${saving ? "saving" : ""}`}
              onClick={saveIntegrationSettings}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Integration Settings"}
            </button>

            {showPhoneModal && (
              <div className="modal-overlay">
                <div className="phone-modal">
                  <div className="modal-header">
                    <h3>Phone Number Required</h3>
                    <button className="close-button" onClick={handleCloseModal}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <p>
                    To enable{" "}
                    {activeIntegration === "whatsapp"
                      ? "WhatsApp"
                      : activeIntegration === "message"
                      ? "SMS"
                      : "Voice Call"}{" "}
                    integration, please provide your phone number:
                  </p>

                  <div className="phone-input-container">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className={phoneError ? "error" : ""}
                    />
                    {phoneError && (
                      <p className="error-message">{phoneError}</p>
                    )}
                  </div>

                  <div className="modal-buttons">
                    <button
                      onClick={handleCloseModal}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePhoneSubmit}
                      className="save-button"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Phone Number"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <style jsx='true'>{`
        .calendar-status {
          display: flex;
          align-items: center;
          margin: 10px 0;
          padding: 10px;
          border-radius: 4px;
        }
        
        .calendar-status.connected {
          background-color: #e6f7e6;
          color: #2e7d32;
        }
        
        .calendar-status i {
          margin-right: 8px;
        }
        
        .disconnect-button {
          margin-left: auto;
          padding: 6px 12px;
          background-color: #f8f9fa;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          color: #374151;
          cursor: pointer;
        }
        
        .disconnect-button:hover {
          background-color: #f3f4f6;
        }
        
        .connection-error {
          color: #d32f2f;
          margin-top: 8px;
          font-size: 0.875rem;
        }
        `}</style>
      </div>
    </div>
  );
};

export default StaffIntegration;
