import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap
import "./AdminDashboard.css";
import countPendingRequests from './countPendingRequests';
import { FiToggleLeft, FiToggleRight } from "react-icons/fi";
import RequestHistoryModal from "./RequestHistoryModal";

const FlexDue = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all"); // New filter for request type
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackForDecline, setFeedbackForDecline] = useState("");
  const [approvedDueDate, setApprovedDueDate] = useState("");
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false); // New modal state
  const [currentExtensionTask, setCurrentExtensionTask] = useState(null);
  const [currentCancellationTask, setCurrentCancellationTask] = useState(null); // New task state for cancellation
  const [requestCount, setRequestCount] = useState(0);
  const [sortField, setSortField] = useState('requestDate');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  
  // Add this function to handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);


  // Modify the toggle function to load history data when switching tabs
  const toggleHistoryView = () => {
    const newHistoryState = !showHistory;
    setShowHistory(newHistoryState);
    
    // If switching to history view, fetch the request history
    if (newHistoryState) {
      fetchRequestHistory(user);
    }
  };

  // Add a function to open the history modal
  const openRequestHistoryModal = (request) => {
    // Find the task that this request belongs to
    const taskForRequest = tasks.find(task => task.id === request.taskId);
    if (taskForRequest) {
      setSelectedTaskForHistory(taskForRequest);
      setSelectedRequest(request); // Store the selected request to access its type
      setShowRequestHistoryModal(true);
    } else {
      console.error("Task not found for this request");
    }
  };

  const getHistoryUserDisplay = (assignedToId) => {
    // Check if assignedToId exists
    if (!assignedToId) return "Unknown User";
    
    // Try to get user from usersMap
    const user = usersMap[assignedToId];
    
    if (user && user.username) {
      // We have user data
      return `(${user.username}) ${getEmailById(assignedToId)}`;
    } else {
      // User not found in map, try to get from users array by value
      const userFromArray = users.find(u => u.value === assignedToId);
      
      if (userFromArray) {
        return `(${userFromArray.label}) ${getEmailById(assignedToId)}`;
      }
      
      // Last resort - just show the ID
      return `(User #${assignedToId.substring(0, 8)}...) ${getEmailById(assignedToId) || "No email"}`;
    }
  };
  // Function to fetch request history for all users (admin view)
  const fetchRequestHistory = async () => {
    try {
      // First ensure users are loaded
      if (Object.keys(usersMap).length === 0) {
        console.log("Users map is empty, fetching users first");
        await fetchUsers();
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/tasks/requests/history/all`
      );
      
      console.log("Request history data:", response.data);
      
      // Add debugging info
      const uniqueUserIds = [...new Set(response.data.map(item => item.assignedTo))];
      console.log("Unique user IDs in history:", uniqueUserIds);
      console.log("Available user IDs in map:", Object.keys(usersMap));
      
      setRequestHistory(response.data);
    } catch (err) {
      console.error("Error fetching request history:", err);
      
      // Create fallback history from tasks if API fails
      const fallbackHistory = [];
      
      tasks.forEach(task => {
        // Extract extension requests
        if (task.extensionRequests && task.extensionRequests.length > 0) {
          task.extensionRequests.forEach(req => {
            fallbackHistory.push({
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              assignedTo: task.assignedTo,
              requestType: "extension",
              requestDate: req.requestDate || req.createdAt,
              status: req.status,
              reason: req.reason,
              requestedDate: req.requestedDate,
              feedback: req.feedback
            });
          });
        }
        
        // Extract cancellation requests
        if (task.cancellationRequests && task.cancellationRequests.length > 0) {
          task.cancellationRequests.forEach(req => {
            fallbackHistory.push({
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              assignedTo: task.assignedTo,
              requestType: "cancellation",
              requestDate: req.requestDate || req.createdAt,
              status: req.status,
              reason: req.reason,
              feedback: req.feedback
            });
          });
        }
      });
      
      // Sort by date (newest first)
      fallbackHistory.sort((a, b) => {
        const dateA = new Date(a.requestDate || a.createdAt || 0);
        const dateB = new Date(b.requestDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log("Using fallback history data:", fallbackHistory);
      setRequestHistory(fallbackHistory);
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



  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };


  // Function to open request details modal
  const openRequestDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailsModal(true);
  };

  // Function to filter request history based on selected filters
  const getFilteredRequestHistory = () => {
    if (!requestHistory || requestHistory.length === 0) {
      return [];
    }
    
    // First apply filters
    let filtered = requestHistory.filter((request) => {
      // Filter by request type
      if (
        requestTypeFilter !== "all" &&
        request.requestType?.toLowerCase() !== requestTypeFilter
      ) {
        return false;
      }
  
      // Filter by request status
      if (
        requestStatusFilter !== "all" &&
        request.status?.toLowerCase() !== requestStatusFilter.toLowerCase()
      ) {
        return false;
      }
  
      return true;
    });
    
    // Then sort the filtered results
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      // Handle different field types
      switch (sortField) {
        case 'taskTitle':
          comparison = a.taskTitle.localeCompare(b.taskTitle);
          break;
        case 'requestType':
          comparison = a.requestType.localeCompare(b.requestType);
          break;
        case 'requestDate':
          comparison = new Date(a.requestDate || a.createdAt) - new Date(b.requestDate || b.createdAt);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
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

  // Fetch users from the API
  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {
        const usersArray = Array.isArray(response.data)
          ? response.data
          : response.data.users || [];

        // Create a mapping of user IDs to user data for quick lookup
        const userMapObj = {};
        usersArray.forEach((user) => {
          userMapObj[user.id] = user;
        });
        setUsersMap(userMapObj);

        // Format users for the select dropdown
        const formattedUsers = usersArray.map((user) => ({
          value: user.id,
          label: user.username,
        }));
        setUsers(formattedUsers);
      })
      .catch((error) => console.error("Error fetching users:", error));
  };

  // Fetch tags from the API
  const fetchTags = () => {
    axios
      .get("http://localhost:5000/api/tags")
      .then((response) => {
        const tagsData = response.data || [];
        setTags(tagsData.map((tag) => ({ value: tag, label: tag })));
      })
      .catch((error) => console.error("Error fetching tags:", error));
  };

  // Fetch tasks from the API
  const fetchTasks = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/tasks")
      .then((response) => {
        const tasksData = response.data || [];
        setTasks(tasksData);
        setFilteredTasks(tasksData);
        const count = countPendingRequests(tasksData);
        setRequestCount(count);
        
        // Store count in localStorage for other pages to access
        localStorage.setItem('pendingRequestsCount', count);
      })
      .catch((error) => console.error("Error fetching tasks:", error))
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchUsers();
    fetchTags();
    fetchTasks();
  }, []);

  const getEmailById = (userId) => {
    // Guard clause - if userId is undefined or null, return early
    if (userId === undefined || userId === null) {
      return "No email";
    }

    // First check the usersMap for quick lookup
    if (usersMap[userId]) {
      return usersMap[userId].email;
    }

    // Fallback to search in the users array if not found in the map
    const user = users.find(
      (u) => u.value && userId && u.value.toString() === userId.toString()
    );

    if (user && usersMap[user.value]) {
      return usersMap[user.value].email;
    }

    return "Unknown";
  };

  // Apply filters when filters change
  useEffect(() => {
    let filtered = tasks;

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (task) =>
          task.priority &&
          task.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (task) =>
          task.status &&
          task.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [priorityFilter, statusFilter, tasks]);

  const handleLogout = () => {
    // Clear authentication data if stored
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to home page
    navigate("/");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query) {
      // If search is empty, reset to filtered tasks based on current filters
      let filtered = tasks;
      if (priorityFilter !== "all") {
        filtered = filtered.filter(
          (task) =>
            task.priority?.toLowerCase() === priorityFilter.toLowerCase()
        );
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (task) => task.status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      setFilteredTasks(filtered);
      return;
    }

    // Search across multiple columns
    const searchResults = tasks.filter((task) => {
      const searchFields = [
        task.title?.toLowerCase(),
        task.description?.toLowerCase(),
        usersMap[task.assignedTo]?.username?.toLowerCase(),
        task.tags?.join(" ").toLowerCase(),
      ];

      return searchFields.some(
        (field) => field && field.includes(query.toLowerCase())
      );
    });

    setFilteredTasks(searchResults);
  };

  // Update useEffect for filters to include search and request type
  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((task) => {
        const searchFields = [
          task.title?.toLowerCase(),
          task.description?.toLowerCase(),
          usersMap[task.assignedTo]?.username?.toLowerCase(),
          task.tags?.join(" ").toLowerCase(),
        ];

        return searchFields.some(
          (field) => field && field.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply other filters
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [searchQuery, priorityFilter, statusFilter, tasks, usersMap]);

  // Fixed version of the handleViewExtensionRequest function
  const handleViewExtensionRequest = (task) => {
    console.log("Opening extension request for task:", task.id);

    // Set the current task for reference
    setCurrentExtensionTask(task);

    // Set the modal visibility
    setIsExtensionModalOpen(true);

    // Set default approved date to requested extension date
    if (task.extensionRequests && task.extensionRequests.length > 0) {
      // Find the latest pending request
      const latestRequest = [...task.extensionRequests]
        .filter((req) => req.status === "Pending")
        .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))[0];

      if (latestRequest) {
        // Use the correct property and format it for the date input
        const requestedDate = latestRequest.requestedDate || latestRequest.requestDate;
        // Format date as YYYY-MM-DD for date input
        const formattedDate = requestedDate ? 
          new Date(requestedDate).toISOString().split('T')[0] : 
          task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
          
        setApprovedDueDate(formattedDate);
      } else {
        // If no pending request found, set to current due date
        const formattedDueDate = task.dueDate ? 
          new Date(task.dueDate).toISOString().split('T')[0] : '';
        setApprovedDueDate(formattedDueDate);
      }
    } else {
      // Fallback to current due date if no extension requests
      const formattedDueDate = task.dueDate ? 
        new Date(task.dueDate).toISOString().split('T')[0] : '';
      setApprovedDueDate(formattedDueDate);
    }

    // Reset feedback for decline
    setFeedbackForDecline("");
  };

  // New function for viewing cancellation requests
  const handleViewCancellationRequest = (task) => {
    console.log("Opening cancellation request for task:", task.id);

    // Set the current task for reference
    setCurrentCancellationTask(task);

    // Set the modal visibility
    setIsCancellationModalOpen(true);

    // Reset feedback for decline
    setFeedbackForDecline("");
  };

  // Fixed closeModals function
  const closeModals = () => {
    setIsExtensionModalOpen(false);
    setIsCancellationModalOpen(false);
    setCurrentExtensionTask(null);
    setCurrentCancellationTask(null);
    setFeedbackForDecline("");
    setApprovedDueDate("");
  };

  const handleApproveExtension = async (taskId) => {
    if (!approvedDueDate) {
      alert("Please select an approved due date");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/extension/approve`,
        {
          approvedDueDate,
        }
      );

      if (response.data.success) {
        alert("Extension request approved successfully!");
        fetchTasks(); // Refresh tasks
        closeModals();
      }
    } catch (error) {
      console.error("Error approving extension request:", error);
      alert(
        "Failed to approve extension request: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineExtension = async (taskId) => {
    if (!taskId) {
      alert("Task ID is missing");
      return;
    }

    if (!feedbackForDecline.trim()) {
      alert("Please provide feedback for declining the request");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/extension/decline`,
        {
          feedback: feedbackForDecline,
        }
      );

      if (response.data.success) {
        fetchTasks(); // Refresh tasks
        closeModals();
      }
    } catch (error) {
      console.error("Error declining extension request:", error);
      alert(
        "Failed to decline extension request: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // New functions for handling cancellation requests
  const handleApproveCancellation = async (taskId) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/cancellation/approve`,
        {}
      );
  
      if (response.data.success) {
        // Check if there are any pending extension requests for this task
        const task = tasks.find(t => t.id === taskId);
        
        if (task && task.extensionRequests && 
            task.extensionRequests.some(req => req.status === "Pending" || req.status === "Rework")) {
          
          // Automatically decline any pending extension requests
          try {
            await axios.put(
              `http://localhost:5000/api/tasks/${taskId}/extension/decline`,
              {
                feedback: "This extension request has been automatically declined because the task cancellation request was approved."
              }
            );
            console.log("Pending extension requests automatically declined");
          } catch (extError) {
            console.error("Error declining extension requests:", extError);
          }
        }
        
        alert("Cancellation request approved successfully!");
        fetchTasks(); // Refresh tasks
        closeModals();
      }
    } catch (error) {
      console.error("Error approving cancellation request:", error);
      alert(
        "Failed to approve cancellation request: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineCancellation = async (taskId) => {
    if (!taskId) {
      alert("Task ID is missing");
      return;
    }

    if (!feedbackForDecline.trim()) {
      alert("Please provide feedback for declining the request");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/cancellation/decline`,
        {
          feedback: feedbackForDecline,
        }
      );

      if (response.data.success) {
        fetchTasks(); // Refresh tasks
        closeModals();
      }
    } catch (error) {
      console.error("Error declining cancellation request:", error);
      alert(
        "Failed to decline cancellation request: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a helper function to open files in a new tab
  const openFileInNewTab = (filename) => {
    window.open(`http://localhost:5000/api/tasks/view/${filename}`, "_blank");
  };

  // Helper function to get all tasks with either extension or cancellation requests
  const getFilteredRequestTasks = () => {
    let tasks = filteredTasks;

    // Filter by request type if not "all"
    if (requestTypeFilter !== "all") {
      if (requestTypeFilter === "extensions") {
        tasks = tasks.filter(
          (task) =>
            task.extensionRequests &&
            task.extensionRequests.some(
              (req) => req.status === "Pending" || req.status === "Rework"
            )
        );
      } else if (requestTypeFilter === "cancellations") {
        tasks = tasks.filter(
          (task) =>
            task.cancellationRequests &&
            task.cancellationRequests.some(
              (req) => req.status === "Pending" || req.status === "Rework"
            )
        );
      }
    }

    // Create a flat array for display
    let displayTasks = [];

    // Add tasks with extension requests if not filtering for cancellations only
    if (requestTypeFilter !== "cancellations") {
      const extensionTasks = tasks
        .filter(
          (task) =>
            task.extensionRequests &&
            task.extensionRequests.some(
              (req) => req.status === "Pending" || req.status === "Rework"
            )
        )
        .map((task) => ({ ...task, requestType: "extension" }));

      displayTasks = [...displayTasks, ...extensionTasks];
    }

    // Add tasks with cancellation requests if not filtering for extensions only
    if (requestTypeFilter !== "extensions") {
      const cancellationTasks = tasks
        .filter(
          (task) =>
            task.cancellationRequests &&
            task.cancellationRequests.some(
              (req) => req.status === "Pending" || req.status === "Rework"
            )
        )
        .map((task) => ({ ...task, requestType: "cancellation" }));

      displayTasks = [...displayTasks, ...cancellationTasks];
    }

    return displayTasks;
  };

  // Debug the modal state
  useEffect(() => {
    console.log("Extension modal open state:", isExtensionModalOpen);
    console.log("Current extension task:", currentExtensionTask);
    console.log("Cancellation modal open state:", isCancellationModalOpen);
    console.log("Current cancellation task:", currentCancellationTask);
  }, [
    isExtensionModalOpen,
    currentExtensionTask,
    isCancellationModalOpen,
    currentCancellationTask,
  ]);

  return (
    <div className="dashboard-container">
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
              <a href="admin">
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="admintasks">
                <i className="fas fa-tasks"></i>
                <span>Tasks</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="users">
                <i className="fas fa-users"></i>
                <span>Users</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="menu-section">
          <h3 className="menu-title">Management</h3>
          <ul className="menu-items">
            <li className="menu-item active">
              <a href="flexdue">
                <i className="fas fa-inbox"></i>
                <span>ReQuest</span>
                <span className="badge">{requestCount}</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="adminsettings">
                <i className="fas fa-cogs"></i>
                <span>Settings</span>
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
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <h1 className="page-title">Welcome Admin!</h1>

          <div className="header-actions">
            <div className="user-profile">
              <div className="avatar">A</div>
              <div className="user-info">
                <div className="username">Admin User</div>
                <div className="user-role">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Task Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-list"></i>
              <span>{showHistory ? "Request History" : "Pending Requests"}</span>
            </h2>
              <div
                className="toggle-container"
                onClick={toggleHistoryView}
              >
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
            <div className="card-actions">
              <button
                className={`card-action-btn ${loading ? "rotating" : ""}`}
                onClick={fetchTasks}
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
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="rework">Rework</option>
                </select>

                {/* New Request Type Filter */}
                <select
                  className="filter-select"
                  value={requestTypeFilter}
                  onChange={(e) => setRequestTypeFilter(e.target.value)}
                >
                  <option value="all">All Requests</option>
                  <option value="extensions">Deadline Extensions</option>
                  <option value="cancellations">Task Cancellations</option>
                </select>
              </div>
              <div className="task-table-wrapper">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Assigned To</th>
                      <th>Request Type</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  {getFilteredRequestTasks().length === 0 ? (
                    <tbody>
                      <tr>
                        <td colSpan="6" className="empty-state-message">
                          <div style={{ textAlign: "center", padding: "20px" }}>
                            <i
                              className="fas fa-calendar-times"
                              style={{
                                fontSize: "24px",
                                marginBottom: "10px",
                                color: "#888",
                              }}
                            ></i>
                            <p>No pending requests found.</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {getFilteredRequestTasks().map((task, index) => (
                        <tr key={`${task.id}-${task.requestType}-${index}`}>
                          <td>
                            <div className="task-title">
                              <i className="fas fa-tasks"></i>
                              <span>{task.title}</span>
                            </div>
                            <div className="task-description">
                              {task.description}
                            </div>
                            {task.requestType === "extension" &&
                              task.extensionRequests &&
                              task.extensionRequests.length > 0 && (
                                <div style={{maxWidth: "200px", overflowY: "hidden", maxHeight: "40px"}}>
                                  <strong>Extension Reason:</strong>{" "}
                                  {task.extensionRequests.filter(
                                    (req) => req.status === "Pending"
                                  )[0]?.reason ||
                                    task.extensionRequests[
                                      task.extensionRequests.length - 1
                                    ].reason}
                                </div>
                              )}
                            {task.requestType === "cancellation" &&
                              task.cancellationRequests &&
                              task.cancellationRequests.length > 0 && (
                                <div style={{maxWidth: "200px", overflowY: "hidden", maxHeight: "40px"}}>
                                  <strong>Cancellation Reason:</strong>{" "}
                                  {task.cancellationRequests.filter(
                                    (req) => req.status === "Pending"
                                  )[0]?.reason ||
                                    task.cancellationRequests[
                                      task.cancellationRequests.length - 1
                                    ].reason}
                                </div>
                              )}
                          </td>
                          <td>
                            <div className="task-description">
                              {"(" +
                                usersMap[task.assignedTo]?.username +
                                ") " +
                                getEmailById(task.assignedTo)}
                            </div>
                          </td>

                          <td>
                            <div
                              className={`request-type-badge ${
                                task.requestType === "extension"
                                  ? "extension"
                                  : "cancellation"
                              }`}
                            >
                              {task.requestType === "extension"
                                ? "Deadline Extension"
                                : "Task Cancellation"}
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
                          </td>
                          <td>
                            <div className="task-actions">
                              {task.requestType === "extension" ? (
                                <button
                                  className="task-action-btn extension-btn"
                                  onClick={() => handleViewExtensionRequest(task)}
                                  title="View extension request"
                                >
                                  <i className="fas fa-calendar-plus"></i>
                                </button>
                              ) : (
                                <button
                                  className="task-action-btn cancellation-btn"
                                  onClick={() =>
                                    handleViewCancellationRequest(task)
                                  }
                                  title="View cancellation request"
                                >
                                  <i className="fas fa-ban"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                  
                </table>
              </div>
            </> ): (
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
    <th onClick={() => handleSort('taskTitle')} className="sortable-header">
      Task {sortField === 'taskTitle' && (sortDirection === 'asc' ? '↑' : '↓')}
    </th>
    <th>Assigned To</th>
    <th onClick={() => handleSort('requestType')} className="sortable-header">
      Request Type {sortField === 'requestType' && (sortDirection === 'asc' ? '↑' : '↓')}
    </th>

    <th onClick={() => handleSort('status')} className="sortable-header">
      Request Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
    </th>
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
  <div className="task-description">
    {getHistoryUserDisplay(request.assignedTo)}
  </div>
</td>

        <td>
          {getRequestTypeBadge(request.requestType)}
        </td>
        <td>{getStatusBadge(request.status)}</td>
        <td>
          <button
            className="open-request-modal-btn"
            onClick={() => openRequestHistoryModal(request)}
          >
            <i className="fas fa-eye"></i> View Details
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7" className="no-data"> {/* Updated colspan to match number of columns */}
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
            ) }
          </div>
        </div>
        <style jsx>{`
          .ext-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(3px);
          }

          .ext-modal {
            background-color: var(--light);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            width: 600px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 10000;
            position: relative;
            animation: ext-modal-appear 0.3s ease-out;
          }

          .ext-modal::-webkit-scrollbar {
            display: none;
          }
          @keyframes ext-modal-appear {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .ext-modal-header {
            display: flex;
            position: fixed;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--gray-200);
            background-color: var(--primary);
            color: var(--light);
            border-top-left-radius: var(--radius);
            border-top-right-radius: var(--radius);
            width: 37.5rem;
          }

          .ext-modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .ext-close-btn {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            color: var(--light);
            opacity: 0.8;
            transition: var(--transition);
          }

          .ext-close-btn:hover {
            opacity: 1;
          }

          .ext-modal-body {
            padding: 1.5rem;
            margin-top: 4rem;
          }

          .ext-request-details {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .ext-detail-row {
            display: flex;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--gray-200);
            align-items: flex-start;
          }

          .ext-detail-label {
            font-weight: 600;
            width: 170px;
            color: var(--gray-600);
          }

          .ext-detail-value {
            flex: 1;
          }

          .ext-detail-value.ext-highlight {
            font-weight: 600;
            color: var(--primary);
          }

          .ext-detail-value-full {
            flex: 1;
            white-space: pre-wrap;
            background: var(--gray-100);
            padding: 0.75rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--gray-200);
          }

          .ext-form {
            background: var(--gray-100);
            padding: 1.25rem;
            border-radius: var(--radius);
            margin-top: 1.5rem;
            border: 1px solid var(--gray-200);
          }

          .ext-form h4 {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1rem;
            color: var(--dark);
            font-weight: 600;
          }

          .ext-form-group {
            margin-bottom: 1rem;
          }

          .ext-form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--gray-600);
          }

          .ext-form-control {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid var(--gray-300);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            transition: var(--transition);
          }

          .ext-form-control:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
          }

          textarea.ext-form-control {
            resize: vertical;
            min-height: 100px;
          }

          .ext-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            border: none;
            border-radius: var(--radius-sm);
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
          }

          .ext-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .ext-btn i {
            font-size: 0.875rem;
          }

          .ext-btn-primary {
            background-color: var(--primary);
            color: white;
          }

          .ext-btn-primary:hover:not(:disabled) {
            background-color: var(--primary-light);
          }

          .ext-btn-success {
            background-color: var(--success);
            color: white;
          }

          .ext-btn-success:hover:not(:disabled) {
            filter: brightness(0.9);
          }

          .ext-btn-danger {
            background-color: var(--danger);
            color: white;
          }

          .ext-btn-danger:hover:not(:disabled) {
            filter: brightness(0.9);
          }

          .ext-view-document-btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }

          .ext-no-requests-message {
            color: var(--gray-500);
            text-align: center;
            padding: 2rem 0;
            font-style: italic;
          }

          /* For extension approval form and decline form */
          .ext-approval-form {
            border-left: 4px solid var(--success);
          }

          .ext-decline-form {
            border-left: 4px solid var(--danger);
          }
          .request-type-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
            white-space: nowrap;
            margin-top: 2px;
          }

          .request-type-badge.extension {
            background-color: #e1f0ff;
            color: #1a73e8;
          }

          .request-type-badge.cancellation {
            background-color: #ffeceb;
            color: #e53935;
          }

          .ext-warning-text {
            color: #e53935;
            font-size: 14px;
            margin-bottom: 15px;
            background-color: #ffeceb;
            padding: 8px;
            border-radius: 4px;
          }

          .task-action-btn.cancellation-btn {
            background-color: #ffeceb;
            color: #e53935;
          }

          .task-action-btn.cancellation-btn:hover {
            background-color: #e53935;
            color: white;
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

        /* Add this to your AdminDashboard.css file */
.sortable-header {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable-header:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Add this to your existing task-table styles or create new ones */
.task-table th.sortable-header {
  padding-right: 25px; /* Make room for the sort indicator */
}

/* Style for clickable table headers */
.task-table th.sortable-header:after {
  content: "↓↑";
  font-size: 0.7em;
  opacity: 0.3;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* Active sort indicators */
.task-table th.sortable-header.sort-asc:after {
  content: "↑";
  opacity: 1;
}

.task-table th.sortable-header.sort-desc:after {
  content: "↓";
  opacity: 1;
}
        `}</style>
      </main>

      {/* Extension Request Modal */}
      {isExtensionModalOpen && currentExtensionTask && (
        <div className="ext-modal-overlay">
          <div className="ext-modal">
            <div className="ext-modal-header">
              <h3>Due Date Extension Request</h3>
              <button className="ext-close-btn" onClick={closeModals}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ext-modal-body">
              {currentExtensionTask.extensionRequests &&
              currentExtensionTask.extensionRequests.length > 0 ? (
                <div className="ext-request-details">
                  {(() => {
                    const latestRequest = [
                      ...currentExtensionTask.extensionRequests,
                    ]
                      .filter((req) => req.status === "Pending")
                      .sort(
                        (a, b) =>
                          new Date(b.requestDate) - new Date(a.requestDate)
                      )[0];

                    return latestRequest ? (
                      <>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">Task:</span>
                          <span className="ext-detail-value">
                            {currentExtensionTask.title}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">
                            Requested By:
                          </span>
                          <span className="ext-detail-value">
                            {usersMap[latestRequest.requestedBy]?.username ||
                              "Unknown"}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">
                            Current Due Date:
                          </span>
                          <span className="ext-detail-value">
                            {currentExtensionTask.reworkDetails?.length > 0
                              ? currentExtensionTask.reworkDetails[
                                  currentExtensionTask.reworkDetails.length - 1
                                ].deadline
                              : currentExtensionTask.dueDate}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">
                            Requested Due Date:
                          </span>
                          <span className="ext-detail-value ext-highlight">
                            {latestRequest.requestDate
                              ? new Date(latestRequest.requestDate)
                                  .toISOString()
                                  .split("T")[0]
                              : "No specific date requested"}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">Reason:</span>
                          <div className="ext-detail-value-full">
                            {latestRequest.reason}
                          </div>
                        </div>

                        {/* Supporting Document */}
                        {latestRequest.attachmentFile && (
                          <div className="ext-detail-row">
                            <span className="ext-detail-label">
                              Supporting Document:
                            </span>
                            <button
                              className="ext-btn ext-btn-primary ext-view-document-btn"
                              onClick={() =>
                                openFileInNewTab(
                                  latestRequest.attachmentFile.filename
                                )
                              }
                            >
                              <i className="fas fa-file-pdf"></i> View Document
                            </button>
                          </div>
                        )}

                        {/* Approve form */}
                        <div className="ext-form ext-approval-form">
                          <h4>Approve Extension</h4>
                          <div className="ext-form-group">
                            <label>Set New Due Date:</label>
                            <input
                              type="date"
                              className="ext-form-control"
                              value={approvedDueDate}
                              onChange={(e) =>
                                setApprovedDueDate(e.target.value)
                              }
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <button
                            className="ext-btn ext-btn-success ext-approve-btn"
                            onClick={() =>
                              handleApproveExtension(currentExtensionTask.id)
                            }
                            disabled={loading}
                          >
                            {loading ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-check"></i>
                            )}
                            Approve Extension
                          </button>
                        </div>

                        {/* Decline form */}
                        <div className="ext-form ext-decline-form">
                          <h4>Decline Extension</h4>
                          <div className="ext-form-group">
                            <label>Feedback (Required):</label>
                            <textarea
                              className="ext-form-control"
                              value={feedbackForDecline}
                              onChange={(e) =>
                                setFeedbackForDecline(e.target.value)
                              }
                              placeholder="Please provide feedback on why the extension is declined..."
                              rows={3}
                            ></textarea>
                          </div>
                          <button
                            className="ext-btn ext-btn-danger ext-decline-btn"
                            onClick={() =>
                              handleDeclineExtension(currentExtensionTask.id)
                            }
                            disabled={loading || !feedbackForDecline.trim()}
                          >
                            {loading ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-times"></i>
                            )}
                            Decline Extension
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="ext-no-requests-message">
                        No pending extension requests found.
                      </p>
                    );
                  })()}
                </div>
              ) : (
                <p className="ext-no-requests-message">
                  No extension requests found for this task.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isCancellationModalOpen && currentCancellationTask && (
        <div className="ext-modal-overlay">
          <div className="ext-modal">
            <div className="ext-modal-header">
              <h3>Task Cancellation Request</h3>
              <button className="ext-close-btn" onClick={closeModals}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="ext-modal-body">
              {currentCancellationTask.cancellationRequests &&
              currentCancellationTask.cancellationRequests.length > 0 ? (
                <div className="ext-request-details">
                  {(() => {
                    const latestRequest = [
                      ...currentCancellationTask.cancellationRequests,
                    ]
                      .filter((req) => req.status === "Pending")
                      .sort(
                        (a, b) =>
                          new Date(b.requestDate) - new Date(a.requestDate)
                      )[0];

                    return latestRequest ? (
                      <>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">Task:</span>
                          <span className="ext-detail-value">
                            {currentCancellationTask.title}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">
                            Requested By:
                          </span>
                          <span className="ext-detail-value">
                            {usersMap[latestRequest.requestedBy]?.username ||
                              "Unknown"}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">
                            Request Date:
                          </span>
                          <span className="ext-detail-value">
                            {new Date(
                              latestRequest.requestDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="ext-detail-row">
                          <span className="ext-detail-label">Reason:</span>
                          <div className="ext-detail-value-full">
                            {latestRequest.reason}
                          </div>
                        </div>

                        {/* Supporting Document */}
                        {latestRequest.attachmentFile && (
                          <div className="ext-detail-row">
                            <span className="ext-detail-label">
                              Supporting Document:
                            </span>
                            <button
                              className="ext-btn ext-btn-primary ext-view-document-btn"
                              onClick={() =>
                                openFileInNewTab(
                                  latestRequest.attachmentFile.filename
                                )
                              }
                            >
                              <i className="fas fa-file-pdf"></i> View Document
                            </button>
                          </div>
                        )}

                        {/* Approve form */}
                        <div className="ext-form ext-approval-form">
                          <h4>Approve Cancellation</h4>
                          <p className="ext-warning-text">
                            Note: Approving this request will mark the task as
                            cancelled.
                          </p>
                          <button
                            className="ext-btn ext-btn-success ext-approve-btn"
                            onClick={() =>
                              handleApproveCancellation(
                                currentCancellationTask.id
                              )
                            }
                            disabled={loading}
                          >
                            {loading ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-check"></i>
                            )}
                            Approve Cancellation
                          </button>
                        </div>

                        {/* Decline form */}
                        <div className="ext-form ext-decline-form">
                          <h4>Decline Cancellation</h4>
                          <div className="ext-form-group">
                            <label>Feedback (Required):</label>
                            <textarea
                              className="ext-form-control"
                              value={feedbackForDecline}
                              onChange={(e) =>
                                setFeedbackForDecline(e.target.value)
                              }
                              placeholder="Please provide feedback on why the cancellation is declined..."
                              rows={3}
                            ></textarea>
                          </div>
                          <button
                            className="ext-btn ext-btn-danger ext-decline-btn"
                            onClick={() =>
                              handleDeclineCancellation(
                                currentCancellationTask.id
                              )
                            }
                            disabled={loading || !feedbackForDecline.trim()}
                          >
                            {loading ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-times"></i>
                            )}
                            Decline Cancellation
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="ext-no-requests-message">
                        No pending cancellation requests found.
                      </p>
                    );
                  })()}
                </div>
              ) : (
                <p className="ext-no-requests-message">
                  No cancellation requests found for this task.
                </p>
              )}
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
  );
};

export default FlexDue;
