import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";

// Import icons
import {
  FiHome, FiList, FiUsers, FiBarChart2, FiSettings, FiBell, 
  FiLink, FiLogOut, FiRefreshCw, FiMoreVertical, FiEdit, 
  FiTrash2, FiPaperclip, FiX, FiUpload, FiCheck, FiCalendar,
  FiClock, FiAlertTriangle, FiCheckCircle
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
  RadialLinearScale,
} from "chart.js";
import { Line, Bar, Pie, Doughnut, PolarArea, Radar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
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
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("week");

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
    monthlyProgress: [],
    completionRate: { completed: 0, total: 0 },
    tagDistribution: {},
    upcomingDeadlines: [],
    performanceMetrics: {
      onTimeCompletion: 0,
      avgCompletionTime: 0,
      reworkRate: 0,
    },
    taskTrends: {
      pending: [],
      completed: [],
      reworked: []
    }
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
      case "rework":
        return "var(--danger)";
      default:
        return "var(--gray-400)";
    }
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

  // Calculate days between two dates
  const daysBetweenDates = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
  };

  const processTaskAnalytics = (tasks) => {
    // Basic counters
    const statusCount = {};
    const priorityCount = {};
    const tagDistribution = {};
    const weeklyData = new Array(7).fill(0);
    const monthlyData = new Array(30).fill(0);
    let completed = 0;
    
    // Performance metrics
    let onTimeCompletions = 0;
    let totalCompletionTime = 0;
    let completedTasksCount = 0;
    let reworkedTasksCount = 0;
    
    // Trend data for last 6 months
    const trendMonths = 6;
    const now = new Date();
    const pendingTrend = new Array(trendMonths).fill(0);
    const completedTrend = new Array(trendMonths).fill(0);
    const reworkedTrend = new Array(trendMonths).fill(0);
    
    // Upcoming deadlines
    const upcomingDeadlines = [];

    tasks.forEach((task) => {
      // Status count
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;

      // Priority count
      priorityCount[task.priority] = (priorityCount[task.priority] || 0) + 1;
      
      // Tag distribution
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
          tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
        });
      }

      // Weekly progress (tasks completed in the last 7 days)
      if (task.completionDetails?.completedDate) {
        const completedDate = new Date(task.completionDetails.completedDate);
        const dayIndex = 6 - Math.min(6, Math.floor((now - completedDate) / (1000 * 60 * 60 * 24)));
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyData[dayIndex]++;
        }
        
        // Monthly progress (tasks completed in the last 30 days)
        const monthDayIndex = 29 - Math.min(29, Math.floor((now - completedDate) / (1000 * 60 * 60 * 24)));
        if (monthDayIndex >= 0 && monthDayIndex < 30) {
          monthlyData[monthDayIndex]++;
        }
        
        // Calculate month index for trends (0 = current month, 5 = 5 months ago)
        const monthsAgo = (now.getMonth() - completedDate.getMonth() + 
                         (now.getFullYear() - completedDate.getFullYear()) * 12) % trendMonths;
        
        if (monthsAgo >= 0 && monthsAgo < trendMonths) {
          completedTrend[trendMonths - 1 - monthsAgo]++;
        }
        
        // Performance metrics
        const dueDate = new Date(task.dueDate);
        if (completedDate <= dueDate) {
          onTimeCompletions++;
        }
        
        // Calculate completion time (days from task creation to completion)
        // Assuming task was created when it was first assigned
        totalCompletionTime += daysBetweenDates(completedDate, task.dueDate);
        completedTasksCount++;
      }

      // Check for rework tasks
      if (task.reworkDetails && task.reworkDetails.length > 0) {
        reworkedTasksCount++;
        
        // Find the most recent rework request date for trend
        const latestRework = task.reworkDetails.reduce((latest, current) => 
          !latest || new Date(current.date) > new Date(latest.date) ? current : latest, null);
          
        if (latestRework) {
          const reworkDate = new Date(latestRework.date);
          const monthsAgo = (now.getMonth() - reworkDate.getMonth() + 
                           (now.getFullYear() - reworkDate.getFullYear()) * 12) % trendMonths;
          
          if (monthsAgo >= 0 && monthsAgo < trendMonths) {
            reworkedTrend[trendMonths - 1 - monthsAgo]++;
          }
        }
      }
      
      // Pending tasks trend
      if (task.status === "Pending") {
        // Use due date to determine which month the pending task belongs to
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const monthsAgo = (now.getMonth() - dueDate.getMonth() + 
                         (now.getFullYear() - dueDate.getFullYear()) * 12) % trendMonths;
                         
          if (monthsAgo >= 0 && monthsAgo < trendMonths) {
            pendingTrend[trendMonths - 1 - monthsAgo]++;
          }
        } else {
          // If no due date, count in current month
          pendingTrend[trendMonths - 1]++;
        }
      }
      
      // Upcoming deadlines (next 7 days)
      if (task.status !== "Completed" && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = daysBetweenDates(now, dueDate);
        
        if (daysUntilDue <= 7 && dueDate >= now) {
          upcomingDeadlines.push({
            id: task.id,
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
            daysRemaining: daysUntilDue
          });
        }
      }

      // Completion count
      if (task.status === "Completed") {
        completed++;
      }
    });
    
    // Sort upcoming deadlines by due date
    upcomingDeadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Calculate performance metrics
    const onTimeCompletionRate = completedTasksCount > 0 ? 
      (onTimeCompletions / completedTasksCount) * 100 : 0;
      
    const avgCompletionTime = completedTasksCount > 0 ? 
      (totalCompletionTime / completedTasksCount) : 0;
      
    const reworkRate = tasks.length > 0 ? 
      (reworkedTasksCount / tasks.length) * 100 : 0;
      
    let totalExtensionRequests = 0;
    tasks.forEach(task => {
      if (task.extensionRequests && Array.isArray(task.extensionRequests)) {
        totalExtensionRequests += task.extensionRequests.length;
      }
    });
      
    const extensionRate = totalExtensionRequests > 0 ? 
      (reworkedTasksCount / totalExtensionRequests) * 100 : 0;

    setTaskAnalytics({
      statusCount,
      priorityCount,
      weeklyProgress: weeklyData,
      monthlyProgress: monthlyData,
      completionRate: { completed, total: tasks.length },
      tagDistribution,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5), // Top 5 upcoming deadlines
      performanceMetrics: {
        onTimeCompletion: onTimeCompletionRate,
        avgCompletionTime: avgCompletionTime.toFixed(1),
        reworkRate: reworkRate.toFixed(1),
        extensionRate: extensionRate.toFixed(1)
      },
      taskTrends: {
        pending: pendingTrend,
        completed: completedTrend,
        reworked: reworkedTrend
      }
    });
  };

  useEffect(() => {
    if (tasks.length > 0) {
      processTaskAnalytics(tasks);
    }
  }, [tasks]);

  // Helper function to check if there's data for chart display
  const hasChartData = (dataObject) => {
    if (!dataObject) return false;
    
    // For objects like statusCount and priorityCount
    if (typeof dataObject === 'object' && !Array.isArray(dataObject)) {
      return Object.keys(dataObject).length > 0;
    }
    
    // For arrays like weeklyProgress
    if (Array.isArray(dataObject)) {
      return dataObject.length > 0 && dataObject.some(value => value > 0);
    }
    
    return false;
  };

  // Get month labels for trend charts
  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(months[monthIndex]);
    }
    
    return labels;
  };

  // Get day labels for progress charts
  const getDayLabels = (timeframe) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const labels = [];
    
    if (timeframe === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(today.getDate() - i);
        labels.push(days[day.getDay()]);
      }
    } else {
      // Last 30 days - show only every 5th day
      for (let i = 29; i >= 0; i -= 5) {
        const day = new Date();
        day.setDate(today.getDate() - i);
        labels.push(`${day.getDate()}/${day.getMonth() + 1}`);
      }
      // Add the last day
      labels.push(`${today.getDate()}/${today.getMonth() + 1}`);
    }
    
    return labels;
  };

  // No data message component
  const NoDataMessage = () => (
    <div className="no-data-message">
      <p>
        <FiAlertTriangle /> &nbsp;
        No data available to display the chart
      </p>
    </div>
  );

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
              <div className="avatar">{getAvatarInitial(user?.username)}</div>
            </div>
          </header>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon pending">
                <FiClock />
              </div>
              <div className="summary-info">
                <h3>Tasks Pending</h3>
                <p className="summary-value">{taskAnalytics.statusCount?.Pending || 0}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon completed">
                <FiCheckCircle />
              </div>
              <div className="summary-info">
                <h3>Tasks Completed</h3>
                <p className="summary-value">{taskAnalytics.completionRate.completed}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon inprogress">
                <FiBarChart2 />
              </div>
              <div className="summary-info">
                <h3>In Progress</h3>
                <p className="summary-value">{taskAnalytics.statusCount?.Progress || 0}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon rework">
                <FiAlertTriangle />
              </div>
              <div className="summary-info">
                <h3>Rework Rate</h3>
                <p className="summary-value">{taskAnalytics.performanceMetrics.reworkRate}%</p>
              </div>
            </div>
          </div>
            {/* Performance Metrics */}
            <div className="analytics-card" style={{ marginBottom: "20px" }}>
              <div className="performance-metrics">
                <div className="metric-item">
                  <div className="metric-icon on-time">
                    <FiCheckCircle />
                  </div>
                  <div className="metric-details">
                    <h4>On-Time Completion</h4>
                    <p>{taskAnalytics.performanceMetrics.onTimeCompletion.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-icon avg-time">
                    <FiClock />
                  </div>
                  <div className="metric-details">
                    <h4>Avg. Completion Time</h4>
                    <p>{taskAnalytics.performanceMetrics.avgCompletionTime} days</p>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-icon rework">
                    <FiAlertTriangle />
                  </div>
                  <div className="metric-details">
                    <h4>Task Extension Rate</h4>
                    <p>{taskAnalytics.performanceMetrics.extensionRate}%</p>
                  </div>
                </div>
              </div>
            </div>
            
          {/* Main Analytics Grid */}
          <div className="analytics-grid">

            {/* Task Status Distribution */}
            <div className="analytics-card" style={{height: "100%"}}>
              <h3>Task Status Distribution</h3>
              <div className="chart-container">
                {hasChartData(taskAnalytics.statusCount) ? (
                  <Doughnut
                    data={{
                      labels: Object.keys(taskAnalytics.statusCount),
                      datasets: [
                        {
                          data: Object.values(taskAnalytics.statusCount),
                          backgroundColor: [
                            "rgba(54, 162, 235, 0.8)",  // Blue - Progress
                            "rgba(75, 192, 192, 0.8)",  // Green - Completed
                            "rgba(255, 159, 64, 0.8)",  // Orange - Pending
                            "rgba(255, 99, 132, 0.8)",  // Red - Rework
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "bottom" },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((acc, cur) => acc + cur, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '60%',
                    }}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Task Priority Distribution */}
            <div className="analytics-card"  style={{height: "100%"}}>
              <h3>Priority Distribution</h3>
              <div className="chart-container">
                {hasChartData(taskAnalytics.priorityCount) ? (
                  <PolarArea
                    data={{
                      labels: Object.keys(taskAnalytics.priorityCount),
                      datasets: [
                        {
                          data: Object.values(taskAnalytics.priorityCount),
                          backgroundColor: [
                            "rgba(255, 99, 132, 0.7)",   // Red - High
                            "rgba(255, 206, 86, 0.7)",   // Yellow - Medium 
                            "rgba(75, 192, 192, 0.7)",   // Green - Low
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "bottom" },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((acc, cur) => acc + cur, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      scales: {
                        r: {
                          ticks: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Task Progress Over Time */}
            <div className="analytics-card progress-card">
              <div className="card-header">
                <h3>Task Completion Progress</h3>
                <div className="time-filter">
                  <button 
                    className={selectedTimeFrame === 'week' ? 'active' : ''} 
                    onClick={() => setSelectedTimeFrame('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={selectedTimeFrame === 'month' ? 'active' : ''} 
                    onClick={() => setSelectedTimeFrame('month')}
                  >
                    Month
                  </button>
                </div>
              </div>
              <div className="chart-container">
                {hasChartData(selectedTimeFrame === 'week' ? 
                  taskAnalytics.weeklyProgress : taskAnalytics.monthlyProgress) ? (
                  <Line
                    data={{
                      labels: getDayLabels(selectedTimeFrame),
                      datasets: [
                        {
                          label: "Completed Tasks",
                          data: selectedTimeFrame === 'week' ? 
                            taskAnalytics.weeklyProgress : 
                            taskAnalytics.monthlyProgress,
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
                        legend: { display: false },
                      },
                    }}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Task Completion Rate with Target */}
            <div className="analytics-card" style={{display: "block"}}>
              <h3>Task Completion Progress</h3>
              <div className="chart-container">
                {tasks.length > 0 ? (
                  <Bar
                    data={{
                      labels: ["Tasks"],
                      datasets: [
                        {
                          label: "Completed",
                          data: [taskAnalytics.completionRate.completed],
                          backgroundColor: "rgba(75, 192, 192, 0.8)",
                          barPercentage: 0.6,
                        },
                        {
                          label: "Remaining",
                          data: [
                            taskAnalytics.completionRate.total -
                              taskAnalytics.completionRate.completed,
                          ],
                          backgroundColor: "rgba(255, 159, 64, 0.8)",
                          barPercentage: 0.6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      indexAxis: 'y',
                      scales: {
                        x: { 
                          stacked: true,
                          grid: {
                            display: false
                          }
                        },
                        y: { 
                          stacked: true, 
                          beginAtZero: true,
                          grid: {
                            display: false
                          }
                        },
                      },
                      plugins: {
                        legend: { position: "bottom" },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.dataset.label || '';
                              const value = context.raw || 0;
                              const total = taskAnalytics.completionRate.total;
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                    }}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Task Tags Distribution */}
            <div className="analytics-card">
              <h3>Task Categories</h3>
              <div className="chart-container">
                {hasChartData(taskAnalytics.tagDistribution) ? (
                  <Pie
                    data={{
                      labels: Object.keys(taskAnalytics.tagDistribution),
                      datasets: [
                        {
                          data: Object.values(taskAnalytics.tagDistribution),
                          backgroundColor: [
                            "rgba(54, 162, 235, 0.7)",
                            "rgba(255, 99, 132, 0.7)",
                            "rgba(255, 206, 86, 0.7)",
                            "rgba(75, 192, 192, 0.7)",
                            "rgba(153, 102, 255, 0.7)",
                            "rgba(255, 159, 64, 0.7)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            boxWidth: 15,
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((acc, cur) => acc + cur, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                    }}
                  />
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Task Trends Over Time */}
            <div className="analytics-card trend-card">
              <h3>Task Trends (Last 6 Months)</h3>
              <div className="chart-container">
                {hasChartData(taskAnalytics.taskTrends.completed) || 
                 hasChartData(taskAnalytics.taskTrends.pending) || 
                 hasChartData(taskAnalytics.taskTrends.reworked) ? (
                  <Line
                    data={{
                      labels: getMonthLabels(),
                      datasets: [
                        {
                          label: "Completed",
                          data: taskAnalytics.taskTrends.completed,
                          borderColor: "rgba(75, 192, 192, 1)",
                          backgroundColor: "rgba(75, 192, 192, 0.1)",
                          tension: 0.4,
                          borderWidth: 2,
                          fill: true,
                        },
                        {
                          label: "Pending",
                          data: taskAnalytics.taskTrends.pending,
                          borderColor: "rgba(255, 159, 64, 1)",
                          backgroundColor: "rgba(255, 159, 64, 0.1)",
                          tension: 0.4,
                          borderWidth: 2,
                          fill: true,
                        },
                        {
                          label: "Reworked",
                          data: taskAnalytics.taskTrends.reworked,
                          borderColor: "rgba(255, 99, 132, 1)",
                          backgroundColor: "rgba(255, 99, 132, 0.1)",
                          tension: 0.4,
                          borderWidth: 2,
                          fill: true,
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
                ) : (
                  <NoDataMessage />
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="analytics-card upcoming-deadlines-card">
              <h3>Upcoming Deadlines</h3>
              {taskAnalytics.upcomingDeadlines.length > 0 ? (
                <div className="upcoming-deadlines">
                  {taskAnalytics.upcomingDeadlines.map((task) => (
                    <div className="deadline-item" key={task.id}>
                      <div className="deadline-info">
                        <h4>{task.title}</h4>
                        <div className="deadline-meta">
                          <span className="deadline-date">
                            <FiCalendar /> {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          <span className={`deadline-priority ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="deadline-days">
                        <span className={task.daysRemaining <= 2 ? "urgent" : ""}>
                          {task.daysRemaining === 0
                            ? "Today"
                            : task.daysRemaining === 1
                            ? "Tomorrow"
                            : `${task.daysRemaining} days`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-deadlines">
                  <p>No upcoming deadlines in the next 7 days</p>
                </div>
              )}
            </div>
          </div>

          {/* Task Completion Modal */}
          {showCompletionModal && (
            <div className="modal-overlay">
              <div className="modal-container" ref={modalRef}>
                <div className="modal-header">
                  <h3>Complete Task</h3>
                  <button className="close-btn" onClick={closeCompletionModal}>
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  <h4>{selectedTask?.title}</h4>
                  <p className="task-description">{selectedTask?.description}</p>

                  <div className="form-group">
                    <label>Completion Feedback</label>
                    <textarea
                      value={completionFeedback}
                      onChange={(e) => setCompletionFeedback(e.target.value)}
                      placeholder="Provide details about your task completion..."
                      rows={4}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Add a link (optional)</label>
                    <input
                      type="text"
                      value={completionLink}
                      onChange={(e) => setCompletionLink(e.target.value)}
                      placeholder="Add a link to your work"
                    />
                  </div>

                  <div className="form-group file-upload">
                    <label>
                      <FiPaperclip /> Attach a file (optional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setCompletionFile(e.target.files[0])}
                    />
                    {completionFile && (
                      <div className="file-preview">
                        <span>{completionFile.name}</span>
                        <button
                          onClick={() => setCompletionFile(null)}
                          className="remove-file"
                        >
                          <FiX />
                        </button>
                      </div>
                    )}
                  </div>

                  {error && <div className="error-message">{error}</div>}
                </div>
                <div className="modal-footer">
                  <button
                    className="secondary-btn"
                    onClick={closeCompletionModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => {
                      // Handle task completion submission
                      setIsSubmitting(true);
                      // Simulating API call
                      setTimeout(() => {
                        closeCompletionModal();
                        refreshTasks();
                      }, 1000);
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-small"></span> Submitting...
                      </>
                    ) : (
                      <>
                        <FiCheck /> Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
      /* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

body {
  background-color: var(--gray-100);
  color: var(--dark);
}

.dashboard-container {
  padding: 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

h1 {
  font-size: 1.75rem;
  color: var(--dark);
  font-weight: 700;
}

h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 1rem;
}

/* Summary Cards Section */
.summary-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  max-width: 1700px;
}

.summary-card {
  width: calc(25% - 1.25rem);
  background: var(--light);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow);
  transition: var(--transition);
  border-left: 4px solid transparent;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.summary-card:nth-child(1) {
  border-left-color: var(--warning);
}

.summary-card:nth-child(2) {
  border-left-color: var(--success);
}

.summary-card:nth-child(3) {
  border-left-color: var(--primary);
}

.summary-card:nth-child(4) {
  border-left-color: var(--danger);
}

.summary-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.25rem;
}

.summary-icon.pending {
  background-color: rgba(248, 150, 30, 0.15);
  color: var(--warning);
}

.summary-icon.completed {
  background-color: rgba(76, 201, 240, 0.15);
  color: var(--success);
}

.summary-icon.inprogress {
  background-color: rgba(67, 97, 238, 0.15);
  color: var(--primary);
}

.summary-icon.rework {
  background-color: rgba(249, 65, 68, 0.15);
  color: var(--danger);
}

.summary-info h3 {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: var(--gray-500);
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--dark);
}

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.25rem;
}

.analytics-card {
  background: var(--light);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.analytics-card:hover {
  box-shadow: var(--shadow-md);
}

.analytics-card h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--gray-600);
  display: flex;
  align-items: center;
}

.analytics-card h3::before {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  background-color: var(--primary);
  border-radius: 50%;
  margin-right: 0.5rem;
}

.chart-container {
  height: 280px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Card sizes */
.analytics-card:nth-child(1), 
.analytics-card:nth-child(2) {
  grid-column: span 3;
}

.analytics-card:nth-child(3) {
  grid-column: span 6;
}

.analytics-card:nth-child(5) {
  grid-column: span 4;
}

.analytics-card:nth-child(4) {
  grid-column: span 8;
}

.analytics-card:nth-child(6) {
  grid-column: span 12;
}

.analytics-card:nth-child(7){
  grid-column: span 12;
}

/* Performance Metrics */
.performance-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  height: 100%;
}

.metric-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: var(--radius);
  background-color: var(--gray-100);
  transition: var(--transition);
}

.metric-item:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-sm);
}

.metric-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-size: 1rem;
}

.metric-icon.on-time {
  background-color: rgba(76, 201, 240, 0.15);
  color: var(--success);
}

.metric-icon.avg-time {
  background-color: rgba(67, 97, 238, 0.15);
  color: var(--primary);
}

.metric-icon.rework {
  background-color: rgba(249, 65, 68, 0.15);
  color: var(--danger);
}

.metric-details h4 {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  color: var(--gray-500);
  font-weight: 500;
}

.metric-details p {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--dark);
}

/* Time Filter */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.time-filter {
  display: flex;
  background-color: var(--gray-200);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.time-filter button {
  border: none;
  background: transparent;
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--gray-500);
  transition: var(--transition);
}

.time-filter button.active {
  background-color: var(--primary);
  color: white;
}

/* Completion Text */
.completion-text {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: var(--light);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* Upcoming Deadlines */
.upcoming-deadlines {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.deadline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background-color: var(--gray-100);
  transition: var(--transition);
  border-left: 3px solid var(--gray-300);
}

.deadline-item:hover {
  background-color: var(--gray-200);
  transform: translateX(5px);
}

.deadline-info {
  flex: 1;
}

.deadline-info h4 {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: var(--dark);
  font-weight: 600;
}

.deadline-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.deadline-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.deadline-priority {
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.deadline-priority.high {
  background-color: rgba(249, 65, 68, 0.15);
  color: var(--danger);
}

.deadline-priority.medium {
  background-color: rgba(248, 150, 30, 0.15);
  color: var(--warning);
}

.deadline-priority.low {
  background-color: rgba(76, 201, 240, 0.15);
  color: var(--success);
}

.deadline-days {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background-color: var(--gray-200);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-600);
}

.deadline-days .urgent {
  color: var(--danger);
}

/* No Data Message */
.no-data-message {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
}

.no-data-message svg {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-data-message p {
  font-size: 0.875rem;
}

.no-deadlines {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .analytics-card:nth-child(1), 
  .analytics-card:nth-child(2) {
    grid-column: span 6;
  }
  
  .analytics-card:nth-child(5) {
    grid-column: span 6;
  }
  
  .analytics-card:nth-child(6) {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .summary-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .analytics-card {
    grid-column: span 12 !important;
  }
  
  .performance-metrics {
    grid-template-columns: 1fr;
  }
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-card, .analytics-card {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}

.summary-card:nth-child(1) { animation-delay: 0.1s; }
.summary-card:nth-child(2) { animation-delay: 0.2s; }
.summary-card:nth-child(3) { animation-delay: 0.3s; }
.summary-card:nth-child(4) { animation-delay: 0.4s; }

.analytics-card:nth-child(1) { animation-delay: 0.5s; }
.analytics-card:nth-child(2) { animation-delay: 0.6s; }
.analytics-card:nth-child(3) { animation-delay: 0.7s; }
.analytics-card:nth-child(4) { animation-delay: 0.8s; }
.analytics-card:nth-child(5) { animation-delay: 0.9s; }
.analytics-card:nth-child(6) { animation-delay: 1s; }
.analytics-card:nth-child(7) { animation-delay: 1.1s; }
.analytics-card:nth-child(8) { animation-delay: 1.2s; }

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 8px;
}

::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 8px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-light);
}
      `}</style>
    </main>
  );
};

export default StaffAnalytics;