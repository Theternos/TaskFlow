import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";

import StaffRequestModal from "./StaffRequestModal"; // Adjust path if needed
import RequestHistoryModal from "./RequestHistoryModal";

// Import icons (assuming you're using something like react-icons)
import { FiBell, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const StaffRequests = () => {
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

  const extensionModalRef = useRef(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedTaskForCancellation, setSelectedTaskForCancellation] =
    useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationFile, setCancellationFile] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");
  const cancellationModalRef = useRef(null);

  const [showRequestModal, setShowRequestModal] = useState(false);

  // In the parent component:
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedTaskForExtension, setSelectedTaskForExtension] =
    useState(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionDate, setExtensionDate] = useState("");
  const [extensionFile, setExtensionFile] = useState(null);
  const [extensionError, setExtensionError] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  const [requestTypeFilter, setRequestTypeFilter] = useState("all");

  // Toggle for showing history
  const [showHistory, setShowHistory] = useState(false);

  // State for request history view
  const [requestHistory, setRequestHistory] = useState([]);

  // State for request details modal
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const requestDetailsModalRef = useRef(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  const [showRequestHistoryModal, setShowRequestHistoryModal] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);

  // Modify the toggle function to load history data when switching tabs
  // Make this change to your toggleHistoryView function
  const toggleHistoryView = () => {
    const newHistoryState = !showHistory;
    setShowHistory(newHistoryState);

    // If switching to history view, fetch the request history
    if (newHistoryState) {
      if (tasks.length > 0) {
        fetchRequestHistory(user);
      } else {
        // If tasks aren't loaded yet, load them first
        fetchTasks(user).then(() => fetchRequestHistory(user));
      }
    }
  };

  // Add a function to open the history modal
  const openRequestHistoryModal = (request) => {
    // Find the task that this request belongs to
    const taskForRequest = tasks.find((task) => task.id === request.taskId);
    if (taskForRequest) {
      setSelectedTaskForHistory(taskForRequest);
      setSelectedRequest(request); // Store the selected request to access its type
      setShowRequestHistoryModal(true);
    } else {
      console.error("Task not found for this request");
    }
  };
  // Function to fetch request history
  const fetchRequestHistory = async (currentUser) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tasks/requests/history/${currentUser.id}`
      );
      setRequestHistory(response.data);

      if (response.data.length === 0) {
        // Fallback: Generate history from tasks with requests
        const historyItems = [];

        tasks.forEach((task) => {
          // Add extension requests
          if (task.extensionRequests && task.extensionRequests.length > 0) {
            task.extensionRequests.forEach((req) => {
              historyItems.push({
                taskId: task.id,
                taskTitle: task.title,
                taskDescription: task.description,
                requestType: "extension",
                requestDate: req.requestDate || req.createdAt,
                status: req.status || "pending",
                reason: req.reason,
                newDeadline: req.requestDate,
              });
            });
          }

          // Add cancellation requests
          if (
            task.cancellationRequests &&
            task.cancellationRequests.length > 0
          ) {
            task.cancellationRequests.forEach((req) => {
              historyItems.push({
                taskId: task.id,
                taskTitle: task.title,
                taskDescription: task.description,
                requestType: "cancellation",
                requestDate: req.requestDate || req.createdAt,
                status: req.status || "pending",
                reason: req.reason,
              });
            });
          }
        });

        setRequestHistory(historyItems);
      }
    } catch (err) {
      console.error("Error fetching request history:", err);

      // Fallback when API fails
      const historyItems = [];

      tasks.forEach((task) => {
        // Same code as above to generate history items from tasks
        // Add extension requests
        if (task.extensionRequests && task.extensionRequests.length > 0) {
          task.extensionRequests.forEach((req) => {
            historyItems.push({
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              requestType: "extension",
              requestDate: req.requestDate || req.createdAt,
              status: req.status || "pending",
              reason: req.reason,
              newDeadline: req.requestDate,
            });
          });
        }

        // Add cancellation requests
        if (task.cancellationRequests && task.cancellationRequests.length > 0) {
          task.cancellationRequests.forEach((req) => {
            historyItems.push({
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              requestType: "cancellation",
              requestDate: req.requestDate || req.createdAt,
              status: req.status || "pending",
              reason: req.reason,
            });
          });
        }
      });

      setRequestHistory(historyItems);
    }
  };

  const getRequestTypeBadge = (type) => {
    let color;
    switch (type?.toLowerCase()) {
      case "extension":
        color = "var(--primary)";
        break;
      case "cancellation":
        color = "var(--danger)";
        break;
      default:
        color = "var(--gray-400)";
    }

    const backgroundColor = `${color}20`; // 20% opacity version of the color

    return (
      <span className="request-type-badge" style={{ backgroundColor, color }}>
        {type === "extension" ? "Deadline Extension" : "Task Cancellation"}
      </span>
    );
  };

  // Function to open request details modal
  const openRequestDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailsModal(true);
  };
  const [debugMode, setDebugMode] = useState(false);

  // Function to filter request history based on selected filters
  const getFilteredRequestHistory = () => {
    if (!requestHistory || requestHistory.length === 0) {
      console.log("No request history available");
      return [];
    }

    console.log("Filtering request history:", requestHistory.length, "items");
    console.log("Type filter:", requestTypeFilter);
    console.log("Status filter:", requestStatusFilter);

    // First, filter by the selected filters
    const filtered = requestHistory.filter((request) => {
      let matchesTypeFilter = true;
      let matchesStatusFilter = true;

      // Only apply type filter if not "all"
      if (requestTypeFilter !== "all" && request.requestType) {
        matchesTypeFilter = request.requestType
          .toLowerCase()
          .includes(requestTypeFilter.toLowerCase());
      }

      // Only apply status filter if not "all"
      if (requestStatusFilter !== "all" && request.status) {
        matchesStatusFilter = request.status
          .toLowerCase()
          .includes(requestStatusFilter.toLowerCase());
      }

      return matchesTypeFilter && matchesStatusFilter;
    });

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.requestDate || a.createdAt);
      const dateB = new Date(b.requestDate || b.createdAt);
      return dateB - dateA;
    });

    // Then deduplicate based on taskId and requestType
    const uniqueRequests = [];
    const seen = new Set();

    filtered.forEach((request) => {
      // Create a unique key based on taskId and requestType
      const uniqueKey = `${request.taskId}-${request.requestType}`;

      // Only add to the unique list if we haven't seen this combination before
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueRequests.push(request);
      }
    });

    return uniqueRequests;
  };

  // Function to close request details modal
  const closeRequestDetailsModal = () => {
    setShowRequestDetailsModal(false);
    setSelectedRequest(null);
  };

  // Add click outside handler for request details modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        requestDetailsModalRef.current &&
        !requestDetailsModalRef.current.contains(event.target)
      ) {
        closeRequestDetailsModal();
      }
    };

    if (showRequestDetailsModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRequestDetailsModal]);

  const openRequestModal = (task) => {
    setSelectedTask(task);
    setShowRequestModal(true);
  };

  const navigate = useNavigate();

  const prioritizeTasks = (tasks) => {
    if (!tasks || tasks.length === 0) return [];
    
    // Create a priority order mapping
    const priorityOrder = {
      high: 1,
      medium: 2,
      low: 3
    };
    
    // Sort tasks by priority
    return [...tasks].sort((a, b) => {
      const priorityA = a.priority?.toLowerCase() || 'medium';
      const priorityB = b.priority?.toLowerCase() || 'medium';
      
      // Compare priorities
      const priorityComparison = priorityOrder[priorityA] - priorityOrder[priorityB];
      
      // If priorities are the same, sort by due date (earlier dates first)
      if (priorityComparison === 0) {
        const dateA = new Date(a.dueDate || '9999-12-31');
        const dateB = new Date(b.dueDate || '9999-12-31');
        return dateA - dateB;
      }
      
      return priorityComparison;
    });
  };
  
  // Then update the fetchTasks function to use this:
  const fetchTasks = async (currentUser) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/tasks");
      // Filter tasks assigned to the current user
      const userTasks = response.data.filter(
        (task) => task.assignedTo === String(currentUser?.id)
      );
  
      console.log("Tasks loaded:", userTasks.length);
      console.log("Sample task data:", userTasks[0]);
  
      // Check if tasks have extension/cancellation data
      let hasExtensionRequests = false;
      let hasCancellationRequests = false;
  
      userTasks.forEach((task) => {
        if (task.extensionRequests && task.extensionRequests.length > 0) {
          hasExtensionRequests = true;
        }
        if (task.cancellationRequests && task.cancellationRequests.length > 0) {
          hasCancellationRequests = true;
        }
      });
  
      console.log("Tasks with extension requests:", hasExtensionRequests);
      console.log("Tasks with cancellation requests:", hasCancellationRequests);
  
      // Sort tasks by priority and due date
      const prioritizedTasks = prioritizeTasks(userTasks);
      
      setTasks(prioritizedTasks);
      setFilteredTasks(prioritizedTasks); // Initialize filtered tasks with prioritized tasks
  
      return prioritizedTasks;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again later.");
      return [];
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (!tasks.length) return;
  
    let filtered = [...tasks];
  
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
  
    // Filter out tasks with approved cancellation requests
    filtered = filtered.filter(task => {
      const isApproved = task.cancellationRequests?.[
        task.cancellationRequests.length - 1
      ]?.status === "Approved";
      
      return !isApproved;
    });
  
    // Filter to only show Pending or Rework tasks
    filtered = filtered.filter(task => 
      task.status === "Pending" || task.status === "Rework"
    );
  
    setFilteredTasks(filtered);
  }, [tasks, priorityFilter, statusFilter]);

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
    let color;
    switch (status?.toLowerCase()) {
      case "declined":
        color = "rgb(255, 0, 0)"; // Example for var(--danger)
        break;
      case "pending":
        color = "rgb(255, 165, 0)"; // Example for var(--warning)
        break;
      case "approved":
        color = "rgb(0, 128, 0)"; // Example for var(--success)
        break;
      default:
        color = "rgb(169, 169, 169)"; // Example for var(--gray-400)
    }

    const backgroundColor = color.replace("rgb", "rgba").replace(")", ", 0.1)"); // 30% opacity
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

  // Function to open extension modal - REORDERED
  const openExtensionModal = (task) => {
    setSelectedTaskForExtension(task);
    setShowExtensionModal(true);
    setExtensionReason("");
    setExtensionFile(null);
    setExtensionError("");
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

  // Handle extension file selection - REORDERED
  const handleExtensionFileChange = (e) => {
    setExtensionFile(e.target.files[0]);
  };

  // Submit extension request - REORDERED
  const handleExtensionRequest = async () => {
    if (!selectedTaskForExtension || !extensionReason) {
      setExtensionError("Please provide a reason for the extension.");
      return;
    }

    setIsSubmittingExtension(true);

    try {
      const extensionData = {
        taskId: selectedTaskForExtension.id,
        reason: extensionReason,
        requestedBy: user.id,
        requestDate: extensionDate,
      };

      let response;

      if (extensionFile) {
        // If there's a file, use FormData
        const formData = new FormData();
        formData.append("file", extensionFile);
        formData.append("extensionData", JSON.stringify(extensionData));

        response = await axios.post(
          `http://localhost:5000/api/tasks/${selectedTaskForExtension.id}/extension-request`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // If no file, just send the extension data
        response = await axios.post(
          `http://localhost:5000/api/tasks/${selectedTaskForExtension.id}/extension-request`,
          extensionData
        );
      }

      // Update local state with the response (if needed)
      const updatedTask = response.data.task;

      // Refresh tasks list
      fetchTasks(user);

      // Reset states and close modal
      setIsSubmittingExtension(false);
      setExtensionError("");
      closeExtensionModal();

      // Show success message
      alert("Extension request submitted successfully!");
    } catch (err) {
      console.error("Error submitting extension request:", err);
      setIsSubmittingExtension(false);
      setExtensionError(
        "Failed to submit extension request. Please try again."
      );
    }
  };

  const openCancellationModal = (task) => {
    setSelectedTaskForCancellation(task);
    setShowCancellationModal(true);
    setCancellationReason("");
    setCancellationFile(null);
    setCancellationError("");
  };

  // Function to close cancellation modal
  const closeCancellationModal = () => {
    setShowCancellationModal(false);
    setSelectedTaskForCancellation(null);
    setCancellationReason("");
    setCancellationFile(null);
    setIsCancelling(false);
    setCancellationError("");
  };

  // Handle cancellation file selection
  const handleCancellationFileChange = (e) => {
    setCancellationFile(e.target.files[0]);
  };

  // Submit cancellation request
  const handleCancellationRequest = async () => {
    if (!selectedTaskForCancellation || !cancellationReason) {
      setCancellationError("Please provide a reason for cancellation.");
      return;
    }

    setIsCancelling(true);

    try {
      const cancellationData = {
        taskId: selectedTaskForCancellation.id,
        reason: cancellationReason,
        requestedBy: user.id,
      };

      let response;

      if (cancellationFile) {
        const formData = new FormData();
        formData.append("file", cancellationFile);
        formData.append("cancellationData", JSON.stringify(cancellationData));

        response = await axios.post(
          `http://localhost:5000/api/tasks/${selectedTaskForCancellation.id}/cancellation-request`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/tasks/${selectedTaskForCancellation.id}/cancellation-request`,
          cancellationData
        );
      }

      // Refresh tasks list
      fetchTasks(user);

      // Reset states and close modal
      setIsCancelling(false);
      setCancellationError("");
      closeCancellationModal();

      // Show success message
      alert("Cancellation request submitted successfully!");
    } catch (err) {
      console.error("Error submitting cancellation request:", err);
      setIsCancelling(false);
      setCancellationError(
        "Failed to submit cancellation request. Please try again."
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        cancellationModalRef.current &&
        !cancellationModalRef.current.contains(event.target)
      ) {
        closeCancellationModal();
      }
    };

    if (showCancellationModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCancellationModal]);

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
              <li className="menu-item active">
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
                <span>{showHistory ? "Request History" : "Recent Tasks"}</span>
              </h2>
              <div className="card-actions">
                {/* Toggle Switch for History */}
                <div className="toggle-container" onClick={toggleHistoryView}>
                  <span
                    className={`toggle-label ${!showHistory ? "active" : ""}`}
                  >
                    Tasks
                  </span>
                  <div
                    className={`toggle-switch ${showHistory ? "active" : ""}`}
                  >
                    <div className="toggle-thumb">
                      {showHistory ? <FiToggleRight /> : <FiToggleLeft />}
                    </div>
                  </div>
                  <span
                    className={`toggle-label ${showHistory ? "active" : ""}`}
                  >
                    History
                  </span>
                </div>
              </div>

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
              {!showHistory ? (
                <>
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
                      <option value="all">All Requests</option>
                      <option value="pending">Deadline Extensions</option>
                      <option value="progress">Task Cancellations</option>
                    </select>
                  </div>

                  <div className="task-table-wrapper">
                    <table className="task-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Priority</th>
                          <th>Deadline</th>
                          <th>Tags</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

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
      </td>
      <td>
        <div className={`priority-badge ${task.priority?.toLowerCase() || "medium"}`}>
          {task.priority}
        </div>
      </td>
      <td>
        <div className={`task-deadline ${
          new Date(
            task.reworkDetails?.length > 0
              ? task.reworkDetails[task.reworkDetails.length - 1].deadline
              : task.dueDate
          ) < new Date() && task.status !== "Completed"
            ? "overdue"
            : ""
        }`}>
          <i className="far fa-calendar-alt"></i>
          <span>
            {task.reworkDetails?.length > 0
              ? task.reworkDetails[task.reworkDetails.length - 1].deadline
              : task.dueDate}
          </span>
        </div>
        <div className="days-until-deadline">
          {new Date(
            task.reworkDetails?.length > 0
              ? task.reworkDetails[task.reworkDetails.length - 1].deadline
              : task.dueDate
          ) < new Date() && task.status !== "Completed"
            ? "Overdue"
            : ""}
          {task.daysUntilDeadline > 0 ? `${task.daysUntilDeadline} days remaining` : ""}
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
        <button
          className="open-request-modal-btn"
          onClick={() => openRequestModal(task)}
        >
          <i className="fas fa-edit"></i> Extension or Cancellation
        </button>
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="6" className="no-data">
      <i className="fas fa-info-circle"></i> &nbsp;
      <span>No tasks available to display.</span>
    </td>
  </tr>
)}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <div className="task-filters">
                    <div className="filter-item">
                      <i className="fas fa-filter"></i>
                      <span>Request History</span>
                    </div>
                    <select
                      className="filter-select"
                      value={requestTypeFilter}
                      onChange={(e) => setRequestTypeFilter(e.target.value)}
                    >
                      <option value="all">All Requests</option>
                      <option value="extension">Extension Requests</option>
                      <option value="cancellation">
                        Cancellation Requests
                      </option>
                    </select>

                    {/* Add this new dropdown for status filtering */}
                    <select
                      className="filter-select"
                      value={requestStatusFilter}
                      onChange={(e) => setRequestStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  <div className="task-table-wrapper">
                    <table className="task-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Request Type</th>
                          <th>Request Date</th>
                          <th>Request Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredRequestHistory().length > 0 ? (
                          getFilteredRequestHistory().map((request, index) => (
                            <tr
                              key={`${request.taskId}-${request.requestType}-${index}`}
                            >
                              <td>
                                <div className="task-title">
                                  <i className="fas fa-tasks"></i>
                                  <span>{request.taskTitle}</span>
                                </div>
                                <div className="task-description">
                                  {request.taskDescription ||
                                    "No description available"}
                                </div>
                              </td>
                              <td>
                                {getRequestTypeBadge(request.requestType)}
                              </td>
                              <td>
                                <div className="request-date">
                                  <i className="far fa-calendar-alt"></i> &nbsp;
                                  <span>
                                    {formatDate(
                                      request.requestDate || request.createdAt
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td>{getStatusBadge(request.status)}</td>
                              <td>
                                <button
                                  className="open-request-modal-btn"
                                  onClick={() =>
                                    openRequestHistoryModal(request)
                                  }
                                >
                                  <i className="fas fa-eye"></i> View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="no-data">
                              <i className="fas fa-info-circle"></i> &nbsp;
                              <span>
                                No request history found matching the selected
                                filters.
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Extension Request Modal */}
        {showRequestModal && selectedTask && (
          <StaffRequestModal
            user={user}
            task={selectedTask}
            onClose={() => setShowRequestModal(false)}
            onTaskRefresh={refreshTasks}
          />
        )}

        {/* Request Details Modal */}
        {showRequestDetailsModal && (
          <div className="modal">
            <div className="modal-content" ref={requestDetailsModalRef}>
              <div className="modal-header">
                <h3>Request Details</h3>
                <button
                  className="close-btn"
                  onClick={closeRequestDetailsModal}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="request-details">
                  <div className="detail-row">
                    <div className="detail-label">Task:</div>
                    <div className="detail-value">
                      {selectedRequest.taskTitle}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Request Type:</div>
                    <div className="detail-value">
                      {getRequestTypeBadge(selectedRequest.requestType)}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  {selectedRequest.requestType === "extension" &&
                    selectedRequest.newDeadline && (
                      <div className="detail-row">
                        <div className="detail-label">
                          Requested New Deadline:
                        </div>
                        <div className="detail-value">
                          {formatDate(selectedRequest.newDeadline)}
                        </div>
                      </div>
                    )}
                  <div className="detail-row">
                    <div className="detail-label">Reason:</div>
                    <div className="detail-value">
                      {selectedRequest.reason || "No reason provided"}
                    </div>
                  </div>
                  {selectedRequest.reviewedBy && (
                    <>
                      <div className="detail-row">
                        <div className="detail-label">Reviewed By:</div>
                        <div className="detail-value">
                          {getEmailById(selectedRequest.reviewedBy)}
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Review Date:</div>
                        <div className="detail-value">
                          {formatDate(selectedRequest.reviewDate)}
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Comments:</div>
                        <div className="detail-value">
                          {selectedRequest.reviewComment || "No comments"}
                        </div>
                      </div>
                    </>
                  )}
                  {selectedRequest.attachmentUrl && (
                    <div className="detail-row">
                      <div className="detail-label">Attachment:</div>
                      <div className="detail-value">
                        <a
                          href={selectedRequest.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fas fa-file-download"></i> Download
                          Attachment
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={closeRequestDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showRequestHistoryModal && selectedTaskForHistory && (
          <RequestHistoryModal
            task={selectedTaskForHistory}
            user={user}
            requestTypeFilter={selectedRequest?.requestType || null}
            onClose={() => {
              setShowRequestHistoryModal(false);
              setSelectedTaskForHistory(null);
              setSelectedRequest(null); // Clear the selected request
            }}
          />
        )}
      </div>
      <style jsx>{`
        /* Modal styling for request details */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.2rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: color 0.3s;
        }

        .close-btn:hover {
          color: var(--danger);
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        /* Request details styling */
        .request-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .detail-label {
          min-width: 160px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .detail-value {
          flex: 1;
          color: var(--text-primary);
        }

        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .btn-secondary {
          background-color: #e9ecef;
          color: #495057;
        }

        .btn-secondary:hover {
          background-color: #dee2e6;
        }
        .task-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .task-action-btn.cancellation-btn {
          background-color: var(--danger);
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .task-action-btn.cancellation-btn:hover {
          background-color: var(--danger-dark);
        }

        .cancellation-modal {
          background: white;
          width: 500px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
        }

        .cancellation-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid var(--gray-200);
        }

        .cancellation-modal .modal-body {
          padding: 20px;
        }

        .cancellation-form .form-group {
          margin-bottom: 15px;
        }

        .cancellation-form textarea {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          border: 1px solid var(--gray-300);
          border-radius: 4px;
        }

        .cancellation-modal .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid var(--gray-200);
        }

        .cancellation-modal .submit-btn {
          background-color: var(--danger);
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .cancellation-modal .submit-btn:disabled {
          background-color: var(--gray-300);
          cursor: not-allowed;
        }

        .cancellation-modal .cancel-btn {
          background-color: var(--gray-200);
          color: var(--gray-700);
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .cancellation-modal .cancel-btn:hover {
          background-color: var(--gray-300);
        }

        .open-request-modal-btn {
          background-color: var(--primary);
          color: #fff;
          border: none;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.3s ease, transform 0.2s;
        }

        .open-request-modal-btn i {
          font-size: 14px;
        }

        .open-request-modal-btn:hover {
          background-color: var(--primary-light);
        }

        .open-request-modal-btn:active {
          transform: scale(0.96);
        }
        .no-data {
          text-align: center;
          padding: 50px !important;
          font-size: 16px;
        }
        .toggle-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          cursor: pointer;
          font-weight: 600;
          color: var(--gray-600);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          background: var(--gray-100);
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .toggle-container:hover {
          background: var(--gray-200);
        }

        .toggle-label {
          transition: var(--transition);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 1rem;
        }

        .toggle-label.active {
          color: var(--light);
          background-color: var(--primary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
        }

        .toggle-switch {
          position: relative;
          width: 60px;
          height: 28px;
          background: var(--gray-300);
          border-radius: var(--radius-lg);
          transition: var(--transition);
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .toggle-switch.active {
          background: var(--primary);
        }

        .toggle-thumb {
          width: 24px;
          height: 24px;
          background: var(--light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          transform: translateX(0);
          box-shadow: var(--shadow-sm);
        }

        .toggle-switch.active .toggle-thumb {
          transform: translateX(32px);
        }
      `}</style>
    </main>
  );
};

export default StaffRequests;
