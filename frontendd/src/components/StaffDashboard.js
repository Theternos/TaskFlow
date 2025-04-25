import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";
import TaskViewModal from './TaskViewModal'; // Adjust path if needed
import TaskCompletionCelebration from './TaskCompletionCelebration'; // Adjust path if needed


// Import icons (assuming you're using something like react-icons)
import { FiBell } from "react-icons/fi";

const StaffDashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "All Status",
    priority: "All Priorities",
  });
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [usersMap, setUsersMap] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);

  // State for task completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionFeedback, setCompletionFeedback] = useState("");
  const [completionLink, setCompletionLink] = useState("");
  const [completionFile, setCompletionFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // State for extension modal - MOVED TO TOP LEVEL
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedTaskForExtension, setSelectedTaskForExtension] = useState(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionFile, setExtensionFile] = useState(null);
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
  const [extensionError, setExtensionError] = useState("");
  const extensionModalRef = useRef(null);
  const [extensionDate, setExtensionDate] = useState("");
  const [tableStyle, setTableStyle] = useState("normal"); 

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTask, setCelebrationTask] = useState(null);

const [isViewModalOpen, setIsViewModalOpen] = useState(false);

const openViewModal = (task) => {
  setSelectedTask(task);
  setIsViewModalOpen(true);
};

const closeViewModal = () => {
  setSelectedTask(null);
  setIsViewModalOpen(false);
};


  const navigate = useNavigate();

  // Function to fetch tasks from the API
  const fetchTasks = async (currentUser) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/tasks");
      // Filter tasks assigned to the current user
      const userTasks = response.data.filter(
        (task) => task.assignedTo === String(currentUser?.id)
      );
      
      // Filter out tasks with approved cancellation requests
      const tasksWithoutCancelled = userTasks.filter(task => {
        // Check if the task has cancellationRequests property and it contains an approved request
        return !(
          task.cancellationRequests && 
          Array.isArray(task.cancellationRequests) && 
          task.cancellationRequests.some(request => request.status === "Approved")
        );
      });
      
      setTasks(tasksWithoutCancelled);
      setFilteredTasks(tasksWithoutCancelled); // Initialize filtered tasks without cancelled tasks
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again later.");
    } finally {
      setLoading(false);
    }    
  };

  const calculateDaysUntilDeadline = (task) => {
    const now = new Date();
    const deadline = new Date(
      task.reworkDetails?.length > 0
        ? task.reworkDetails[task.reworkDetails.length - 1].deadline
        : task.dueDate
    );

    return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  };

  // Function to get email by user ID
  const getEmailById = (userId) => {
    return usersMap[userId]?.email || "No email available";
  };

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedInUser) {
      navigate("/stafflogin");
      return;
    }

    setUser(loggedInUser);

    // Fetch users for the usersMap
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users");
        const usersById = {};
        response.data.forEach((user) => {
          usersById[user.id] = user;
        });
        setUsersMap(usersById);

        // Only fetch tasks after we have the user data
        await fetchTasks(loggedInUser);
      } catch (err) {
        console.error("Error fetching users:", err);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // Close completion modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeCompletionModal();
      }
    };

    if (showCompletionModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCompletionModal]);

  // Close extension modal when clicking outside - MOVED TO TOP LEVEL
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        extensionModalRef.current &&
        !extensionModalRef.current.contains(event.target)
      ) {
        closeExtensionModal();
      }
    };

    if (showExtensionModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExtensionModal]);

  const prioritizeTasks = (tasks) => {
    return tasks
      .map((task) => {
        const now = new Date();
        const deadline = new Date(
          task.reworkDetails?.length > 0
            ? task.reworkDetails[task.reworkDetails.length - 1].deadline
            : task.dueDate
        );
  
        // Edge case: If no due date or rework deadline exists, set a default deadline far in the future.
        if (isNaN(deadline)) {
          const farFutureDate = new Date();
          farFutureDate.setFullYear(now.getFullYear() + 10); // Assign a distant future deadline
          task.deadline = farFutureDate;
        }
  
        // Days until deadline
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        // Flag if task is overdue
        const isOverdue = deadline < now;
  
        // Base priority score (to be adjusted with more granular rules)
        let priorityScore = 0;
  
        // Priority based on task priority
        switch (task.priority?.toLowerCase()) {
          case "high":
            priorityScore += 50;
            break;
          case "medium":
            priorityScore += 30;
            break;
          case "low":
            priorityScore += 10;
            break;
          default:
            priorityScore += 20; // Default to moderate priority if not specified
        }
  
        // Adjust priority based on how close the deadline is
        if (daysUntilDeadline <= 1) {
          priorityScore += 60; // Very urgent task
        } else if (daysUntilDeadline <= 3) {
          priorityScore += 50; // Highly urgent task
        } else if (daysUntilDeadline <= 7) {
          priorityScore += 30; // Tasks due soon
        } else if (daysUntilDeadline <= 14) {
          priorityScore += 15; // Tasks due in the near future
        } else if (daysUntilDeadline > 30) {
          priorityScore += 5; // Tasks with far-off deadlines have lower priority
        }
  
        // Add priority for rework tasks
        if (task.status === "Rework") {
          priorityScore += 20; // Give rework tasks a higher priority
        }
  
        // Add 30 points if the task is overdue
        if (isOverdue) {
          priorityScore += 30; // Add 30 points to overdue tasks
          
          // Additional penalty for overdue tasks based on how overdue they are
          const overdueDays = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
          if (overdueDays <= 7) {
            priorityScore += 30; // Minor penalty for tasks overdue by less than a week
          } else if (overdueDays <= 14) {
            priorityScore += 50; // Bigger penalty for tasks overdue by a week or more
          } else {
            priorityScore += 70; // Severe penalty for tasks overdue for weeks
          }
        }
  
        // Completed tasks get no priority
        if (task.status === "Completed") {
          priorityScore = 0;
        }
  
        // In-progress tasks get a reduced priority score
        if (task.status === "Progress") {
          priorityScore = Math.max(priorityScore - priorityScore * 0.5, 0); // Half penalty for tasks in progress
        }
  
        // Normalize priority scores to a reasonable range
        priorityScore = Math.min(priorityScore, 100); // Cap the score at 100
  
        // Return task with updated score and deadline info
        return {
          ...task,
          priorityScore,
          daysUntilDeadline,
          isOverdue
        };
      })
      .sort((a, b) => {
        // Define the status groups
        const getStatusPriority = (task) => {
          if (task.status === "Completed") return 3; // Lowest priority
          if (task.status === "Progress") return 2; // Middle priority
          
          // For regular tasks (Pending, Rework, etc.)
          if (task.isOverdue) return 0; // Overdue tasks get highest priority
          return 1; // Normal non-overdue tasks
        };
        
        const aPriority = getStatusPriority(a);
        const bPriority = getStatusPriority(b);
        
        // If tasks have different status priorities, sort by that first
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If tasks have the same status priority, sort by priority score
        return b.priorityScore - a.priorityScore;
      });
  };
  

  // Modify the useEffect for filtering to use prioritization
  useEffect(() => {
    if (!tasks.length) return;

    let filtered = tasks.map(task => ({
      ...task,
      daysUntilDeadline: calculateDaysUntilDeadline(task)
    }));

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply prioritization based on table style
    if (tableStyle === "ai-ordered") {
      const prioritizedTasks = prioritizeTasks(filtered);
      setFilteredTasks(prioritizedTasks);
    } else {
      // Normal sorting - just set filtered tasks
      const sortedTasks = filtered.sort((a, b) => b.id - a.id);
      setFilteredTasks(sortedTasks);
        }
  }, [tasks, priorityFilter, statusFilter, tableStyle]);
    
   


  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "var(--success)";
      case "progress":
        return "var(--primary-light)";
      case "pending":
        return "var(--warning)";
      default:
        return "var(--gray-400)";
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const backgroundColor = `${color}20`; // 20% opacity version of the color

    return (
      <span className="status-badge" style={{ backgroundColor, color }}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    let color;
    switch (priority?.toLowerCase()) {
      case "high":
        color = "var(--danger)";
        break;
      case "medium":
        color = "var(--warning)";
        break;
      case "low":
        color = "var(--success)";
        break;
      default:
        color = "var(--gray-400)";
    }

    const backgroundColor = `${color}20`; // 20% opacity version of the color

    return (
      <span className="priority-badge" style={{ backgroundColor, color }}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const refreshTasks = () => {
    fetchTasks(user);
  };

  const getAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  // Open task completion modal
  const openCompletionModal = (task) => {
    setSelectedTask(task);
    setShowCompletionModal(true);
    setCompletionFeedback("");
    setCompletionLink("");
    setCompletionFile(null);
  };

  const closeCompletionModal = () => {
    setShowCompletionModal(false);
    setSelectedTask(null);
    setCompletionFeedback("");
    setCompletionLink("");
    setCompletionFile(null);
    setIsSubmitting(false);
    setError("");
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setCompletionFile(e.target.files[0]);
  };

  // Submit task completion
  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    setIsSubmitting(true);

    try {
      // Create completion details
      const newCompletionDetails = {
        feedback: completionFeedback,
        link: completionLink,
        completedBy: user.id,
        completedDate: new Date().toISOString(),
        currentStatus: selectedTask.status
      };
      
      // Prepare the updated task data
      // If current status is Rework, keep it as Rework, otherwise set to Progress
      const updatedTaskData = {
        ...selectedTask,
        status: selectedTask.status === "Rework" ? "Rework" : "Progress",
        completionDetails: newCompletionDetails
      };

      let response;

      if (completionFile) {
        // If there's a file, use FormData
        const formData = new FormData();
        formData.append("file", completionFile);
        formData.append(
          "completionDetails",
          JSON.stringify(newCompletionDetails)
        );
        formData.append("taskData", JSON.stringify(updatedTaskData));

        response = await axios.post(
          `http://localhost:5000/api/tasks/${selectedTask.id}/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // If no file, just update the task
        response = await axios.put(
          `http://localhost:5000/api/tasks/${selectedTask.id}`,
          updatedTaskData
        );
      }

      // Update local state with the response
      const updatedTask = response.data.task;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id ? updatedTask : task
        )
      );

      setFilteredTasks((prevFilteredTasks) =>
        prevFilteredTasks.map((task) =>
          task.id === selectedTask.id ? updatedTask : task
        )
      );

      // Reset states and close modal
      setIsSubmitting(false);
      setError("");
      closeCompletionModal();

      // Show celebration
      setCelebrationTask(updatedTask);
      setShowCelebration(true);

      // Optional: Auto-close celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
        setCelebrationTask(null);
      }, 5000);

    } catch (err) {
      console.error("Error completing task:", err);
      setIsSubmitting(false);
      setError("Failed to complete task. Please try again.");
    }
  };

 

  // Function to close extension modal - REORDERED
  const closeExtensionModal = () => {
    setShowExtensionModal(false);
    setSelectedTaskForExtension(null);
    setExtensionReason("");
    setExtensionFile(null);
    setIsSubmittingExtension(false);
    setExtensionError("");
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  
  return (
    <main>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Sidebar content remains unchanged */}
          <div className="logo-container">
            <div className="logo">
              <i className="fas fa-tasks"></i>
              <span>TaskFlow</span>
            </div>
          </div>

          <div className="menu-section">
            <h3 className="menu-title">Main</h3>
            <ul className="menu-items">
              <li className="menu-item active">
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
              <li className="menu-item">
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

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-list"></i>
                <span>Recent Tasks</span>
              </h2>
              <div className="card-actions">
                <button
                  className={`card-action-btn ${loading ? "rotating" : ""}`}
                  onClick={refreshTasks}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
                <button className="card-action-btn">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="task-filters">
                <div className="filter-item">
                  <i className="fas fa-filter"></i>
                  <span>All Tasks</span>
                </div>
                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="progress">Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rework">Rework</option>
                </select>
                <div className="table-style-toggle">
                  <p style={{ marginTop: "8px" }}>Ai Optimization: </p>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={tableStyle === "ai-ordered"}
                      onChange={() =>
                        setTableStyle(
                          tableStyle === "normal" ? "ai-ordered" : "normal"
                        )
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="task-table-wrapper">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Deadline</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  {tableStyle === "normal" ? (
                    <tbody>
                      {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <tr key={task.id}>
                          <td>
                            <div className="task-title">
                              <i className="fas fa-tasks"></i>
                              <span>{task.title}</span>
                            </div>
                            <div className="task-description">
                              {task.description}
                            </div>
                            {task.reworkDetails &&
                              task.reworkDetails.length > 0 && (
                                <div style={{maxWidth: "200px", overflowY: "hidden", maxHeight: "40px"}}>
                                  <strong>Rework Comment:</strong>{" "}
                                  {
                                    task.reworkDetails[
                                      task.reworkDetails.length - 1
                                    ].comment
                                  }
                                </div>
                              )}
                          </td>

                          <td>
                            <div
                              className={`status-badge ${
                                task.status?.toLowerCase() || "pending"
                              }`}
                            >
                              {" "}
                              &nbsp;
                              {task.status === "Progress" ? (
                                <i className="fas fa-spinner fa-spin">&nbsp;</i>
                              ) : (
                                <i className="fas fa-check-circle">&nbsp;</i>
                              )}
                              <span>{task.status}</span>
                            </div>
                          </td>
                          <td>
                            <div
                              className={`priority-badge ${
                                task.priority?.toLowerCase() || "medium"
                              }`}
                            >
                              {task.priority}
                            </div>
                          </td>
                          <td>
                            <div
                              className={`task-deadline ${
                                new Date(
                                  task.reworkDetails?.length > 0
                                    ? task.reworkDetails[
                                        task.reworkDetails.length - 1
                                      ].deadline
                                    : task.dueDate
                                ) < new Date() && task.status !== "Completed"
                                  ? "overdue"
                                  : ""
                              }`}
                            >
                              <i className="far fa-calendar-alt"></i>
                              <span>
                                {task.reworkDetails?.length > 0
                                  ? task.reworkDetails[
                                      task.reworkDetails.length - 1
                                    ].deadline
                                  : task.dueDate}
                              </span>
                            </div>
                            <div className="days-until-deadline">
                              {new Date(
                                task.reworkDetails?.length > 0
                                  ? task.reworkDetails[
                                      task.reworkDetails.length - 1
                                    ].deadline
                                  : task.dueDate
                              ) < new Date() && task.status !== "Completed"
                                ? "Overdue"
                                : ""}
                              {task.daysUntilDeadline > 0
                                ? `${task.daysUntilDeadline} days remaining`
                                : ""}
                            </div>
                          </td>
                          <td>
                            <div className="tag-list">
                              {task.tags && Array.isArray(task.tags) ? (
                                task.tags.map((tag, index) => (
                                  <span key={index} className="tag">
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span>No tags</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="task-actions">
                            <button
                                className="task-action-btn"
                                onClick={() => openViewModal(task)}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="task-action-btn"
                                onClick={() => openCompletionModal(task)}
                                disabled={
                                  task.status === "Completed" ||
                                  task.status === "Progress"
                                }
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                    <tr>
                      <td colSpan="6" className="no-data"> 
                        <span style={{display: "block", textAlign: "center"}}>
                          <i className="fas fa-info-circle"></i> &nbsp;
                          No tasks available to display.
                        </span>
                      </td>
                    </tr>
                    )}
                    </tbody>
                  ) : (
                    <tbody>
                      {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                          <tr key={task.id}>
                            <td>
                              <div className="task-title">
                                <i className="fas fa-tasks"></i>
                                <span>{task.title}</span>
                              </div>
                              <div className="task-description">
                                {task.description}
                              </div>
                              {task.reworkDetails &&
                                task.reworkDetails.length > 0 && (
                                  <div style={{maxWidth: "200px", overflowY: "hidden", maxHeight: "40px"}}>
                                    <strong>Rework Comment:</strong>{" "}
                                    {
                                      task.reworkDetails[
                                        task.reworkDetails.length - 1
                                      ].comment
                                    }
                                  </div>
                                )}
                            </td>

                            <td>
                              <div
                                className={`status-badge ${
                                  task.status?.toLowerCase() || "pending"
                                }`}
                              >
                                {" "}
                                &nbsp;
                                {task.status === "Progress" ? (
                                  <i className="fas fa-spinner fa-spin">&nbsp;</i>
                                ) : (
                                  <i className="fas fa-check-circle">&nbsp;</i>
                                )}
                                <span>{task.status}</span>
                              </div>
                            </td>
                            <td>
                              <div
                                className={`priority-badge ${
                                  task.priority?.toLowerCase() || "medium"
                                }`}
                              >
                                {task.priority}
                              </div>
                            </td>
                            <td>
                              <div
                                className={`task-deadline ${
                                  new Date(
                                    task.reworkDetails?.length > 0
                                      ? task.reworkDetails[
                                          task.reworkDetails.length - 1
                                        ].deadline
                                      : task.dueDate
                                  ) < new Date() && task.status !== "Completed"
                                    ? "overdue"
                                    : ""
                                }`}
                              >
                                <i className="far fa-calendar-alt"></i>
                                <span>
                                  {task.reworkDetails?.length > 0
                                    ? task.reworkDetails[
                                        task.reworkDetails.length - 1
                                      ].deadline
                                    : task.dueDate}
                                </span>
                              </div>
                              <div className="days-until-deadline">
                                {new Date(
                                  task.reworkDetails?.length > 0
                                    ? task.reworkDetails[
                                        task.reworkDetails.length - 1
                                      ].deadline
                                    : task.dueDate
                                ) < new Date() && task.status !== "Completed"
                                  ? "Overdue"
                                  : ""}
                                {task.daysUntilDeadline > 0
                                  ? `${task.daysUntilDeadline} days remaining`
                                  : ""}
                              </div>
                            </td>
                            <td>
                              <div className="tag-list">
                                {task.tags && Array.isArray(task.tags) ? (
                                  task.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span>No tags</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="task-actions">
                              <button
                                  className="task-action-btn"
                                  onClick={() => openViewModal(task)}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="task-action-btn"
                                  onClick={() => openCompletionModal(task)}
                                  disabled={
                                    task.status === "Completed" ||
                                    task.status === "Progress"
                                  }
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                      )) ): (
                        <tr>
                        <td colSpan="6" className="no-data"> 
                          <span style={{display: "block", textAlign: "center"}}>
                            <i className="fas fa-info-circle"></i> &nbsp;
                            No tasks available to display.
                          </span>
                        </td>
                      </tr>
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>


        {/* Task Completion Modal */}
        {showCompletionModal && selectedTask && (
          <div className="modal-overlay">
            <div className="completion-modal" ref={modalRef}>
              <div className="modal-header">
                <h3>Complete Task</h3>
                <button className="close-btn" onClick={closeCompletionModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <div className="task-info">
                  <h4>{selectedTask.title}</h4>
                  <p>{selectedTask.description}</p>
                  {selectedTask.reworkDetails &&
                    selectedTask.reworkDetails.length > 0 && (
                      <div>
                        <h4>Rework Comments:</h4>
                        <ul style={{ fontSize: "13px" }}>
                          {selectedTask.reworkDetails.map((rework, index) => (
                            <li key={index}>
                              <strong>
                                {new Date(rework.date).toLocaleDateString()}:
                              </strong>{" "}
                              {rework.comment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                <div className="completion-form">
                  <div className="form-group">
                    <label>Feedback/Notes</label>
                    <textarea
                      placeholder="Add your comments or feedback about this task..."
                      value={completionFeedback}
                      onChange={(e) => setCompletionFeedback(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Reference Link (Optional)</label>
                    <div className="input-with-icon">
                      <i className="fas fa-link"></i>
                      <input
                        type="text"
                        placeholder="https://example.com/resource"
                        value={completionLink}
                        onChange={(e) => setCompletionLink(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Attach File (Optional)</label>
                    <div className="file-upload">
                      <input
                        type="file"
                        id="task-attachment"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <div className="file-upload-btn">
                        <label
                          htmlFor="task-attachment"
                          className="custom-file-upload"
                        >
                          <i className="fas fa-paperclip"></i>
                          <span>
                            {completionFile
                              ? completionFile.name
                              : "Choose file"}
                          </span>
                        </label>
                      </div>
                    </div>
                    {completionFile && (
                      <div className="selected-file">
                        <i className="fas fa-file"></i>
                        <span>{completionFile.name}</span>
                        <button
                          className="remove-file-btn"
                          onClick={() => setCompletionFile(null)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeCompletionModal}>
                  Cancel
                </button>
                <button
                  className={`complete-btn ${isSubmitting ? "submitting" : ""}`}
                  onClick={handleCompleteTask}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task View Modal */}+
          <TaskViewModal 
          task={selectedTask} 
          isOpen={isViewModalOpen} 
          onClose={closeViewModal}
          usersMap={usersMap}
        />
        
        {showCelebration && (
          <TaskCompletionCelebration 
            task={celebrationTask} 
            onClose={() => {
              setShowCelebration(false);
              setCelebrationTask(null);
            }} 
          />
        )}
      </div>

      <style jsx>{`
        /* Add these styles to your StaffDashboard.css file */

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        /* Completion Modal */
        .completion-modal {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slide-in 0.3s ease-out;
        }
        .completion-modal::-webkit-scrollbar {
          display: none;
        }
        @keyframes slide-in {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid var(--gray-200);
          position: sticky;
          top: 0;
          background: white;
          z-index: 1000;
        }

        .modal-header h3 {
          margin: 0;
          color: var(--text-dark);
          font-size: 18px;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: var(--gray-500);
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: var(--danger);
        }

        /* Modal Body */
        .modal-body {
          padding: 20px;
        }

        .task-info {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--gray-200);
        }

        .task-info h4 {
          margin: 0 0 8px 0;
          color: var(--text-dark);
          font-size: 16px;
        }

        .task-info p {
          margin: 0;
          color: var(--text-medium);
          font-size: 14px;
        }

        /* Completion Form */
        .completion-form .form-group {
          margin-bottom: 18px;
        }

        .completion-form label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-dark);
          font-size: 14px;
        }

        .completion-form textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          min-height: 100px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon i {
          position: absolute;
          left: 12px;
          color: var(--gray-500);
        }

        .input-with-icon input {
          width: 100%;
          padding: 10px 12px 10px 35px;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          font-size: 14px;
        }

        /* File Upload */
        .file-upload {
          margin-top: 5px;
        }

        .custom-file-upload {
          display: inline-flex;
          align-items: center;
          padding: 8px 15px;
          background-color: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .custom-file-upload:hover {
          background-color: var(--gray-200);
        }

        .custom-file-upload i {
          margin-right: 8px;
          color: var(--primary);
        }

        .selected-file {
          display: flex;
          align-items: center;
          margin-top: 10px;
          padding: 8px 12px;
          background-color: var(--gray-50);
          border-radius: 4px;
          font-size: 14px;
        }

        .selected-file i {
          margin-right: 8px;
          color: var(--primary);
        }

        .selected-file span {
          flex: 1;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .remove-file-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-500);
          padding: 0 5px;
          transition: color 0.2s;
        }

        .remove-file-btn:hover {
          color: var(--danger);
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 15px 20px;
          border-top: 1px solid var(--gray-200);
          gap: 10px;
        }

        .cancel-btn {
          padding: 10px 16px;
          background-color: white;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          color: var(--text-medium);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background-color: var(--gray-100);
        }

        .complete-btn {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          background-color: var(--success);
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complete-btn:hover {
          background-color: var(--success-dark, #0e9f6e);
        }

        .complete-btn i {
          margin-right: 8px;
        }

        .complete-btn.submitting {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* For task actions button */
        .task-action-btn {
          padding: 6px;
          background-color: var(--success-light, #ecfdf5);
          border: none;
          border-radius: 4px;
          color: var(--success);
          cursor: pointer;
          transition: all 0.2s;
        }

        .task-action-btn:hover {
          background-color: var(--success);
          color: white;
        }

        .task-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        /* Extension Modal CSS */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .extension-modal {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slide-in 0.3s ease-out;
        }

        @keyframes slide-in {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid var(--gray-200);
          background-color: var(--primary);
          color: white;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: white;
          transition: all 0.2s;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .close-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        /* Modal Body */
        .modal-body {
          padding: 20px;
        }

        .task-info {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--gray-200);
        }

        .task-info h4 {
          margin: 0 0 8px 0;
          color: var(--dark);
          font-size: 16px;
          font-weight: 600;
        }

        .task-info p {
          margin: 0 0 15px 0;
          color: var(--gray-600);
          font-size: 14px;
          line-height: 1.5;
        }

        .current-due-date {
          background-color: var(--gray-100);
          padding: 10px 15px;
          border-radius: 4px;
          font-size: 14px;
          color: var(--gray-600);
          border-left: 3px solid var(--primary);
        }

        .current-due-date strong {
          color: var(--dark);
          font-weight: 500;
        }

        .error-message {
          background-color: rgba(249, 65, 68, 0.1);
          color: var(--danger);
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          font-size: 14px;
        }

        .error-message i {
          margin-right: 8px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--dark);
          font-size: 14px;
        }

        .required {
          color: var(--accent);
          margin-left: 2px;
        }

        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          min-height: 100px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.2s;
        }

        textarea:focus {
          outline: none;
          border-color: var(--primary);
        }

        /* File Upload */
        .file-upload {
          margin-top: 5px;
        }

        .file-upload-btn {
          margin-bottom: 10px;
        }

        .custom-file-upload {
          display: inline-flex;
          align-items: center;
          padding: 8px 15px;
          background-color: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .custom-file-upload:hover {
          background-color: var(--gray-200);
        }

        .custom-file-upload i {
          margin-right: 8px;
          color: var(--primary);
        }

        .selected-file {
          display: flex;
          align-items: center;
          margin-top: 10px;
          padding: 8px 12px;
          background-color: var(--gray-100);
          border-radius: 4px;
          font-size: 14px;
        }

        .selected-file i {
          margin-right: 8px;
          color: var(--primary);
        }

        .selected-file span {
          flex: 1;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          color: var(--gray-600);
        }

        .remove-file-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-500);
          padding: 0 5px;
          transition: color 0.2s;
        }

        .remove-file-btn:hover {
          color: var(--danger);
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 15px 20px;
          border-top: 1px solid var(--gray-200);
          gap: 10px;
          background-color: var(--gray-100);
        }

        .cancel-btn {
          padding: 10px 16px;
          background-color: white;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
          color: var(--gray-600);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background-color: var(--gray-200);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          background-color: var(--primary);
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover {
          background-color: var(--secondary);
        }

        .submit-btn i {
          margin-right: 8px;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn.submitting {
          background-color: var(--primary-light);
        }

        .extension-modal::-webkit-scrollbar {
          display: none;
        }
        .table-style-toggle {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-left: 10px;
          font-size: 15px;
          color: #000;
          gap: 10px;
          padding-top: 10px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 20px;
        }

        .slider::before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #4361ee;
        }

        input:checked + .slider::before {
          transform: translateX(20px);
        }
      `}</style>

    </main>
  );
};

export default StaffDashboard;
