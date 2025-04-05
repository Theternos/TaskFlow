import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";

// Import icons (assuming you're using something like react-icons)
import {
  FiHome,
  FiList,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiBell,
  FiLink,
  FiLogOut,
  FiRefreshCw,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiPaperclip,
  FiX,
  FiUpload,
  FiCheck,
} from "react-icons/fi";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StaffAnalytics = () => {
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
  const navigate = useNavigate();

  const [taskAnalytics, setTaskAnalytics] = useState({
    statusCount: {},
    priorityCount: {},
    weeklyProgress: [],
    completionRate: { completed: 0, total: 0 },
  });

  // Function to fetch tasks from the API
  const fetchTasks = async (currentUser) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/tasks");
      // Filter tasks assigned to the current user
      const userTasks = response.data.filter(
        (task) => task.assignedTo === String(currentUser?.id)
      );
      setTasks(userTasks);
      setFilteredTasks(userTasks); // Initialize filtered tasks with all tasks
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again later.");
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
      navigate("/login");
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

  // Effect to filter tasks when filters change
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

    setFilteredTasks(filtered);
  }, [tasks, priorityFilter, statusFilter]);

  // Close modal when clicking outside
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
      // First update the task status
      const updatedTaskData = {
        ...selectedTask,
        status: "Completed",
        completionDetails: {
          feedback: completionFeedback,
          link: completionLink,
          completedBy: user.id,
          completedDate: new Date().toISOString(),
        },
      };

      let response;

      if (completionFile) {
        // If there's a file, use FormData
        const formData = new FormData();
        formData.append("file", completionFile);
        formData.append(
          "completionDetails",
          JSON.stringify(updatedTaskData.completionDetails)
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

      // Show success message
      alert("Task completed successfully!");
    } catch (err) {
      console.error("Error completing task:", err);
      setIsSubmitting(false);
      setError("Failed to complete task. Please try again.");
    }
  };

  const processTaskAnalytics = (tasks) => {
    const statusCount = {};
    const priorityCount = {};
    const weeklyData = new Array(7).fill(0);
    let completed = 0;

    tasks.forEach((task) => {
      // Status count
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;

      // Priority count
      priorityCount[task.priority] = (priorityCount[task.priority] || 0) + 1;

      // Weekly progress
      if (task.completionDetails?.completedDate) {
        const completedDate = new Date(task.completionDetails.completedDate);
        const dayIndex =
          6 - (((new Date() - completedDate) / (1000 * 60 * 60 * 24)) | 0);
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyData[dayIndex]++;
        }
      }

      // Completion count
      if (task.status === "Completed") {
        completed++;
      }
    });

    setTaskAnalytics({
      statusCount,
      priorityCount,
      weeklyProgress: weeklyData,
      completionRate: { completed, total: tasks.length },
    });
  };

  useEffect(() => {
    if (tasks.length > 0) {
      processTaskAnalytics(tasks);
    }
  }, [tasks]);

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
              <li className="menu-item active">
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
              <div className="notification-bell">
                <FiBell />
                <span className="notification-badge">3</span>
              </div>
              <div className="avatar">{getAvatarInitial(user?.username)}</div>
            </div>
          </header>

          <div className="analytics-grid">
            {/* Task Status Distribution */}
            <div className="analytics-card">
              <h3>Task Status Distribution</h3>
              <div className="chart-container">
                <Pie
                  data={{
                    labels: Object.keys(taskAnalytics.statusCount),
                    datasets: [
                      {
                        data: Object.values(taskAnalytics.statusCount),
                        backgroundColor: [
                          "rgba(54, 162, 235, 0.8)",
                          "rgba(75, 192, 192, 0.8)",
                          "rgba(255, 159, 64, 0.8)",
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Priority Distribution */}
            <div className="analytics-card">
              <h3>Priority Distribution</h3>
              <div className="chart-container">
                <Doughnut
                  data={{
                    labels: Object.keys(taskAnalytics.priorityCount),
                    datasets: [
                      {
                        data: Object.values(taskAnalytics.priorityCount),
                        backgroundColor: [
                          "rgba(255, 99, 132, 0.8)",
                          "rgba(255, 206, 86, 0.8)",
                          "rgba(75, 192, 192, 0.8)",
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>

            {/* Weekly Task Completion Trend */}
            <div className="analytics-card">
              <h3>Weekly Task Completion Trend</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: [...Array(7)].map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                    }),
                    datasets: [
                      {
                        label: "Completed Tasks",
                        data: taskAnalytics.weeklyProgress,
                        borderColor: "rgba(75, 192, 192, 1)",
                        tension: 0.4,
                        fill: true,
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                      },
                    },
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Completion Rate */}
            <div className="analytics-card">
              <h3>Task Completion Rate</h3>
              <div className="chart-container">
                <Bar
                  data={{
                    labels: ["Tasks"],
                    datasets: [
                      {
                        label: "Completed",
                        data: [taskAnalytics.completionRate.completed],
                        backgroundColor: "rgba(75, 192, 192, 0.8)",
                      },
                      {
                        label: "Remaining",
                        data: [
                          taskAnalytics.completionRate.total -
                            taskAnalytics.completionRate.completed,
                        ],
                        backgroundColor: "rgba(255, 159, 64, 0.8)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true, beginAtZero: true },
                    },
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .analytics-card h3 {
          text-align: center;
          font-size: 20px;
          margin-bottom: 20px
        }
      `}</style>
    </main>
  );
};

export default StaffAnalytics;
