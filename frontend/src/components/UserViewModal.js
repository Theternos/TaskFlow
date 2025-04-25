// User View Modal Component for AdminDashboard
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

const UserViewModal = ({ user: initialUser, onClose, isOpen }) => {
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState(null);

  const [taskStats, setTaskStats] = useState({
    completed: 0,
    pending: 0,
    inProgress: 0,
    rework: 0,
    total: 0,
    onTimeCompletion: 0,
    delayedCompletion: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  });

  useEffect(() => {
    if (isOpen && initialUser) {
      console.log("Initial user data received in modal:", initialUser);
      fetchUserTasks(initialUser.id);
    }
  }, [isOpen, initialUser]);

  const fetchUserTasks = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/admin/tasks/user/${userId}`
      );
      console.log("API response:", response.data);

      const tasks = response.data.tasks || [];
      setUserTasks(tasks);
      calculateTaskStats(tasks);

      // Store the user data from the API
      setApiUser(response.data.user);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use apiUser if available, otherwise fall back to initialUser
  const user = apiUser || initialUser;
  const calculateTaskStats = (tasks) => {
    const stats = {
      completed: 0,
      pending: 0,
      inProgress: 0,
      rework: 0,
      total: tasks.length,
      onTimeCompletion: 0,
      delayedCompletion: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    };

    tasks.forEach((task) => {
      // Count by status
      if (task.status === "Completed") {
        stats.completed++;

        // Check if completed on time
        if (task.completionDetails && task.completionDetails.completedDate) {
          const completedDate = new Date(task.completionDetails.completedDate);
          const dueDate = new Date(task.dueDate);
          if (completedDate <= dueDate) {
            stats.onTimeCompletion++;
          } else {
            stats.delayedCompletion++;
          }
        }
      } else if (task.status === "Pending") {
        stats.pending++;
      } else if (task.status === "Progress") {
        stats.inProgress++;
      } else if (task.status === "Rework") {
        stats.rework++;
      }

      // Count by priority
      if (task.priority === "High") {
        stats.highPriority++;
      } else if (task.priority === "Medium") {
        stats.mediumPriority++;
      } else if (task.priority === "Low") {
        stats.lowPriority++;
      }
    });

    setTaskStats(stats);
  };

  if (!isOpen) return null;

  // Chart data for task status
  const statusChartData = {
    labels: ["Completed", "Pending", "In Progress", "Rework"],
    datasets: [
      {
        data: [
          taskStats.completed,
          taskStats.pending,
          taskStats.inProgress,
          taskStats.rework,
        ],
        backgroundColor: ["#f2efe8", "#9ccbd3", "#48a6a6", "#016a70"],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for task priority
  const priorityChartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [
          taskStats.highPriority,
          taskStats.mediumPriority,
          taskStats.lowPriority,
        ],
        backgroundColor: ["#d0f8ed", "#a1e3fb", "#578fca"],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-container">
        <div className="user-modal-header">
          <h2>User Profile</h2>
          <button className="user-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="user-modal-body">
          {loading ? (
            <div className="user-modal-loading">
              <div className="user-modal-spinner"></div>
              <span>Loading user data...</span>
            </div>
          ) : (
            <>
              <div className="user-profile-section">
                <div className="user-avatar-large">
                  {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-profile-details">
                  <h3 className="user-name">{user.username}</h3>
                  <div className="user-role-badge">
                    <span
                      className={
                        user.role === "admin" ? "role-admin" : "role-staff"
                      }
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </span>
                  </div>
                  <div className="user-contact-info">
                    <div className="user-info-item">
                      <i className="fas fa-envelope"></i>
                      <span>{user.email}</span>
                    </div>
                    {user.phoneNumber && (
                      <div className="user-info-item">
                        <i className="fas fa-phone"></i>
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                    <div className="user-info-item">
                      <i className="fas fa-id-badge"></i>
                      <span>ID: {user.id}</span>
                    </div>
                  </div>
                </div>
              </div>
              {user.role === "user" ? (
              <>
                <div className="user-integrations">
                  <h4>Integrations</h4>
                  <div className="integration-badges">
                    {user && user.integrations ? (
                      Object.entries(user.integrations)
                        .filter(([_, enabled]) => enabled)
                        .map(([key, _]) => (
                          <span
                            key={key}
                            className="integration-badge enabled"
                            title={`${key} enabled`}
                          >
                            <i
                              className={`fas fa-${getIntegrationIcon(key)}`}
                            ></i>
                            <span>{formatIntegrationName(key)}</span>
                          </span>
                        )).length > 0 ? (
                        Object.entries(user.integrations)
                          .filter(([_, enabled]) => enabled)
                          .map(([key, _]) => (
                            <span
                              key={key}
                              className="integration-badge enabled"
                              title={`${key} enabled`}
                            >
                              <i
                                className={`fas fa-${getIntegrationIcon(key)}`}
                              ></i>
                              <span>{formatIntegrationName(key)}</span>
                            </span>
                          ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No active integrations
                        </p>
                      )
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No integrations configured
                      </p>
                    )}
                  </div>
                </div>

                <div className="user-stats-section">
                  <h4>Task Statistics</h4>

                  <div className="stats-overview">
                    <div className="stat-card">
                      <div className="stat-value">{taskStats.total}</div>
                      <div className="stat-label">Total Tasks</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {taskStats.total > 0
                          ? Math.round(
                              (taskStats.completed / taskStats.total) * 100
                            )
                          : 0}
                        %
                      </div>
                      <div className="stat-label">Completion Rate</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {taskStats.completed > 0
                          ? Math.round(
                              (taskStats.onTimeCompletion / taskStats.completed) *
                                100
                            )
                          : 0}
                        %
                      </div>
                      <div className="stat-label">On Time</div>
                    </div>
                  </div>

                  <div className="charts-container">
                    <div className="chart-wrapper">
                      <h5>Task Status</h5>
                      <div className="chart-canvas">
                        <Doughnut data={statusChartData} options={chartOptions} />
                      </div>
                    </div>
                    <div className="chart-wrapper">
                      <h5>Task Priority</h5>
                      <div className="chart-canvas">
                        <Doughnut
                          data={priorityChartData}
                          options={chartOptions}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </> ) : ('')}
              {userTasks.length > 0 && (
                <div className="recent-tasks-section">
                  <h4>Recent Tasks</h4>
                  <div className="task-list">
                    {userTasks.slice(0, 3).map((task) => (
                      <div className="task-item" key={task.id}>
                        <div className="task-header">
                          <span
                            className={`task-priority priority-${task.priority.toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`task-status status-${task.status.toLowerCase()}`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="task-title">{task.title}</div>
                        <div className="task-due-date">
                          <i className="fas fa-calendar"></i>
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="user-modal-footer">
          <button className="user-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
        <style jsx="true">{`
          /* User View Modal Styles */
          .user-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          .user-modal-container {
            background-color: var(--light);
            border-radius: var(--radius);
            width: 800px;
            max-width: 90%;
            max-height: 90vh;
            box-shadow: var(--shadow-lg);
            display: flex;
            flex-direction: column;
            animation: slideIn 0.3s ease;
            overflow: hidden;
          }

          .user-modal-header {
            padding: 1.25rem;
            border-bottom: 1px solid var(--gray-200);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--primary);
            color: white;
          }

          .user-modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .user-modal-close {
            background: transparent;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: var(--transition);
          }

          .user-modal-close:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }

          .user-modal-body {
            padding: 1.5rem;
            overflow-y: auto;
            max-height: calc(90vh - 130px);
          }

          .user-modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--gray-200);
            display: flex;
            justify-content: flex-end;
          }

          .user-modal-button {
            padding: 0.5rem 1rem;
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
          }

          .user-modal-button:hover {
            background-color: var(--primary-light);
          }

          /* User Profile Section */
          .user-profile-section {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--gray-200);
          }

          .user-avatar-large {
            width: 80px;
            height: 80px;
            background-color: var(--primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 600;
            margin-right: 1.5rem;
            flex-shrink: 0;
          }

          .user-profile-details {
            flex-grow: 1;
          }

          .user-name {
            margin: 0 0 0.5rem;
            font-size: 1.5rem;
            font-weight: 600;
          }

          .user-role-badge {
            margin-bottom: 1rem;
          }

          .user-role-badge span {
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .role-admin {
            background-color: var(--primary);
            color: white;
          }

          .role-staff {
            background-color: var(--success);
            color: white;
          }

          .user-contact-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .user-info-item {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            color: var(--gray-600);
          }

          .user-info-item i {
            margin-right: 0.5rem;
            width: 16px;
            text-align: center;
            color: var(--primary);
          }

          /* User Integrations */
          .user-integrations {
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--gray-200);
          }

          .user-integrations h4,
          .user-stats-section h4,
          .recent-tasks-section h4 {
            margin: 0 0 1rem;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--dark);
          }

          .integration-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .integration-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
          }

          .integration-badge i {
            margin-right: 0.5rem;
          }

          .integration-badge.enabled {
            background-color: var(--success);
            color: white;
          }

          .integration-badge.disabled {
            background-color: var(--gray-200);
            color: var(--gray-600);
          }

          /* Stats Section */
          .stats-overview {
            display: flex;
            flex-direction: row;
            margin-bottom: 1.5rem;
          }

          .stat-card {
            background-color: white;
            padding: 1rem;
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-sm);
            text-align: center;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.25rem;
          }

          .stat-label {
            font-size: 0.75rem;
            color: var(--gray-500);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* Charts Container */
          .charts-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .chart-wrapper {
            background-color: white;
            padding: 1rem;
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-sm);
          }

          .chart-wrapper h5 {
            margin: 0 0 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--gray-600);
            text-align: center;
          }

          .chart-canvas {
            height: 200px;
            position: relative;
          }

          /* Recent Tasks Section */
          .task-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
          }

          .task-item {
            background-color: white;
            padding: 1rem;
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-sm);
          }

          .task-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
          }

          .task-priority,
          .task-status {
            font-size: 0.7rem;
            padding: 0.15rem 0.5rem;
            border-radius: 10px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .priority-high {
            background-color: rgba(249, 65, 68, 0.1);
            color: var(--danger);
          }

          .priority-medium {
            background-color: rgba(248, 150, 30, 0.1);
            color: var(--warning);
          }

          .priority-low {
            background-color: rgba(76, 201, 240, 0.1);
            color: var(--success);
          }

          .status-completed {
            background-color: rgba(76, 201, 240, 0.1);
            color: var(--success);
          }

          .status-pending {
            background-color: rgba(249, 65, 68, 0.1);
            color: var(--danger);
          }

          .status-progress {
            background-color: rgba(67, 97, 238, 0.1);
            color: var(--primary);
          }

          .status-rework {
            background-color: rgba(248, 150, 30, 0.1);
            color: var(--warning);
          }

          .task-title {
            font-weight: 600;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          }

          .task-due-date {
            font-size: 0.75rem;
            color: var(--gray-500);
            display: flex;
            align-items: center;
          }

          .task-due-date i {
            margin-right: 0.4rem;
          }

          /* Loading Spinner */
          .user-modal-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .user-modal-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(67, 97, 238, 0.3);
            border-radius: 50%;
            border-top-color: var(--primary);
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          /* Animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideIn {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .stats-overview {
              grid-template-columns: repeat(2, 1fr);
            }

            .charts-container {
              grid-template-columns: 1fr;
            }

            .user-profile-section {
              flex-direction: column;
              text-align: center;
            }

            .user-avatar-large {
              margin-right: 0;
              margin-bottom: 1rem;
            }
          }

          @media (max-width: 480px) {
            .stats-overview {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

// Helper functions for integrations display
const getIntegrationIcon = (integration) => {
  switch (integration) {
    case "whatsapp":
      return "comments";
    case "message":
      return "sms";
    case "voiceCall":
      return "phone";
    case "mail":
      return "envelope";
    case "calendar":
      return "calendar";
    default:
      return "check-circle";
  }
};

const formatIntegrationName = (integration) => {
  switch (integration) {
    case "whatsapp":
      return "WhatsApp";
    case "message":
      return "Message";
    case "voiceCall":
      return "Voice Call";
    case "mail":
      return "Email";
    case "calendar":
      return "Calendar";
    default:
      return integration;
  }
};

export default UserViewModal;
