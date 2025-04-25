import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import Select from 'react-select';
import { TaskCompletionRateChart, TaskAssignmentChart } from './TaskCharts';
import "./AdminDashboard.css";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';


 


const AdminDashboard = () => {
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    dueDate: '',
    priority: 'Medium',
  });
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [requestCount, setRequestCount] = useState(0);
  // Add these to your state declarations at the top of the component
const [analyticsData, setAnalyticsData] = useState([]);
const [taskDistribution, setTaskDistribution] = useState({
  status: [],
  priority: []
});
  useEffect(() => {
    // Get count from localStorage
    const count = localStorage.getItem('pendingRequestsCount') || 0;
    setRequestCount(count);
  }, []);

  const COLORS = {
    primary: '#4361ee',
    primaryLight: '#4895ef',
    secondary: '#3f37c9',
    accent: '#f72585',
    success: '#4cc9f0',
    warning: '#f8961e',
    danger: '#f94144'
  };

  // Status colors
  const STATUS_COLORS = {
    'Pending': COLORS.warning,
    'Progress': COLORS.primary,
    'In Progress': COLORS.primary,
    'Completed': COLORS.success,
    'Rework': COLORS.accent
  };
  
  // Priority colors
  const PRIORITY_COLORS = {
    'Low': COLORS.success,
    'Medium': COLORS.warning,
    'High': COLORS.danger,
    'Critical': '#b91c1c'
  };

  const calculateAnalyticsData = () => {
    const today = new Date();
    const result = [];
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Random numbers for demo
      const completed = Math.floor(Math.random() * 5);
      const created = Math.floor(Math.random() * 7);
      const active = Math.floor(Math.random() * 10);
      
      result.push({
        date: dateStr,
        completed,
        created,
        active
      });
    }
    
    return result;
  };
  
  // Calculate task distribution
  const calculateTaskDistribution = () => {
    const statusCount = {
      'Pending': 0,
      'Progress': 0,
      'In Progress': 0,
      'Completed': 0,
      'Rework': 0
    };
    
    const priorityCount = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Critical': 0
    };
    
    tasks.forEach(task => {
      // Handle status
      if (task.status === 'In Progress' || task.status === 'Progress') {
        statusCount['Progress'] += 1;
      } else if (statusCount[task.status] !== undefined) {
        statusCount[task.status] += 1;
      }
      
      // Handle priority
      if (priorityCount[task.priority] !== undefined) {
        priorityCount[task.priority] += 1;
      }
    });
    
    const statusData = Object.keys(statusCount)
      .filter(key => statusCount[key] > 0) // Only include non-zero counts
      .map(status => ({
        name: status,
        value: statusCount[status]
      }));
    
    const priorityData = Object.keys(priorityCount)
      .filter(key => priorityCount[key] > 0) // Only include non-zero counts
      .map(priority => ({
        name: priority,
        value: priorityCount[priority]
      }));
    
    return {
      status: statusData,
      priority: priorityData
    };
  };

  // Calculate user performance metrics
  const calculateUserPerformance = () => {
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = {
        name: user.username,
        tasksAssigned: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        tasksRework: 0
      };
    });
    
    tasks.forEach(task => {
      const userId = parseInt(task.assignedTo);
      if (userMap[userId]) {
        userMap[userId].tasksAssigned += 1;
        
        if (task.status === 'Completed') {
          userMap[userId].tasksCompleted += 1;
        } else if (task.status === 'Pending') {
          userMap[userId].tasksPending += 1;
        } else if (task.status === 'Rework') {
          userMap[userId].tasksRework += 1;
        }
      }
    });
    
    return Object.values(userMap).filter(user => user.tasksAssigned > 0);
  };

  // Calculate tag distribution
  const calculateTagDistribution = () => {
    const tagCount = {};
    
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
          if (!tagCount[tag]) {
            tagCount[tag] = 0;
          }
          tagCount[tag] += 1;
        });
      }
    });
    
    return Object.keys(tagCount).map(tag => ({
      name: tag,
      value: tagCount[tag]
    }));
  };

  // Calculate task timeline data
  const calculateTaskTimeline = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const timeline = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      timeline[months[monthIndex]] = {
        month: months[monthIndex],
        completed: 0,
        pending: 0,
        rework: 0,
        total: 0
      };
    }
    
    // Analyze tasks by due date
    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      const monthName = months[dueDate.getMonth()];
      
      if (timeline[monthName]) {
        timeline[monthName].total += 1;
        
        if (task.status === 'Completed') {
          timeline[monthName].completed += 1;
        } else if (task.status === 'Pending') {
          timeline[monthName].pending += 1;
        } else if (task.status === 'Rework') {
          timeline[monthName].rework += 1;
        }
      }
    });
    
    return Object.values(timeline);
  };

  // Generate the data
  const taskDistributionn = calculateTaskDistribution();
  const userPerformance = calculateUserPerformance();
  const tagDistribution = calculateTagDistribution();
  const taskTimeline = calculateTaskTimeline();

  // Custom renderer for the pie chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#333"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // For tabs in the user performance chart
  const [activeTab, setActiveTab] = useState('radar');
  
  // Handle user form changes
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle user registration
  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    console.log('Sending user data:', newUser);
  
    axios.post('http://localhost:5000/api/register', newUser)
      .then(response => {
        alert('User registered successfully!');
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        fetchUsers(); // Refresh the users list
      })
      .catch(err => {
        alert('Error registering user: ' + (err.response?.data?.message || err.message));
      });
  };
  

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data if stored
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to home page
    navigate("/");
  };

  // Fetch users from the API
  const fetchUsers = () => {
    axios.get('http://localhost:5000/api/users')
      .then(response => {
        const usersArray = Array.isArray(response.data) ? response.data : (response.data.users || []);
        
        // Create a mapping of user IDs to user data for quick lookup
        const userMapObj = {};
        usersArray.forEach(user => {
          userMapObj[user.id] = user;
        });
        setUsersMap(userMapObj);
        
        // Format users for the select dropdown
        const formattedUsers = usersArray.map(user => ({
          value: user.id,
          label: user.username,
        }));
        setUsers(formattedUsers);
      })
      .catch(error => console.error('Error fetching users:', error));
  };
  
  // Fetch tags from the API
  const fetchTags = () => {
    axios.get("http://localhost:5000/api/tags")
      .then(response => {
        const tagsData = response.data || [];
        setTags(tagsData.map(tag => ({ value: tag, label: tag })));
      })
      .catch(error => console.error("Error fetching tags:", error));
  };
  
  // Fetch tasks from the API
  const fetchTasks = () => {
    setLoading(true);
    axios.get("http://localhost:5000/api/tasks")
      .then(response => {
        const tasksData = response.data || [];
        setTasks(tasksData);
        setFilteredTasks(tasksData);
        
        // Generate analytics data after fetching tasks
        generateAnalyticsData(tasksData);
        generateTaskDistribution(tasksData);
      })
      .catch(error => console.error("Error fetching tasks:", error))
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };
  
// Generate analytics data for the real-time chart
const generateAnalyticsData = (tasksData) => {
  // Create a map of task completion data by date
  const tasksByDate = {};
  const today = new Date();
  
  // Initialize the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    tasksByDate[dateStr] = {
      date: dateStr,
      completed: 0,
      created: 0,
      active: 0
    };
  }
  
  // Distribute tasks across the last 7 days instead of just today
  tasksData.forEach((task, index) => {
    // Get the date keys we've created
    const dateKeys = Object.keys(tasksByDate);
    
    // Assign tasks evenly across the available dates for demonstration
    const randomDateIndex = index % dateKeys.length;
    const dateStr = dateKeys[randomDateIndex];
    
    // Count task creation
    tasksByDate[dateStr].created += 1;
    
    // Add some completed tasks on various dates
    if (index % 3 === 0) { // Every third task is completed
      tasksByDate[dateStr].completed += 1;
    }
    
    // Add some active tasks on various dates
    if (index % 2 === 0) { // Every second task is active
      tasksByDate[dateStr].active += 1;
    }
  });
  
  // Convert map to array for chart data
  const chartData = Object.values(tasksByDate);
  setAnalyticsData(chartData);
};
  
  // Generate task distribution data for the pie chart
  const generateTaskDistribution = (tasksData) => {
    const statusCount = {
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0,
    };
    
    const priorityCount = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Critical': 0
    };
    
    tasksData.forEach(task => {
      if (task.status && statusCount[task.status] !== undefined) {
        statusCount[task.status] += 1;
      }
      
      if (task.priority && priorityCount[task.priority] !== undefined) {
        priorityCount[task.priority] += 1;
      }
    });
    
    const statusData = Object.keys(statusCount).map(status => ({
      name: status,
      value: statusCount[status]
    }));
    
    const priorityData = Object.keys(priorityCount).map(priority => ({
      name: priority,
      value: priorityCount[priority]
    }));
    
    setTaskDistribution({
      status: statusData,
      priority: priorityData
    });
  };
  
  // Initialize data on component mount
  useEffect(() => {
    fetchUsers();
    fetchTags();
    fetchTasks();
    
    // Set up real-time data refresh interval
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to get email by user ID - improved version
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
    const user = users.find(u => u.value && userId && 
      u.value.toString() === userId.toString());
      
    if (user && usersMap[user.value]) {
      return usersMap[user.value].email;
    }
    
    return "Unknown";
  };

  const formatUserLabel = (user) => {
    if (!user) return "Select User";
    
    const userId = user.id || user.value;
    // If userId is undefined, don't try to get the email
    if (userId === undefined || userId === null) {
      return user.name || user.label || "Unknown User";
    }
    
    const userName = user.name || user.label || "Unknown";
    const userEmail = getEmailById(userId);
    
    return `${userName} (${userEmail})`;
  };

  // Apply filters when filters change
  useEffect(() => {
    let filtered = tasks;
  
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => 
        task.priority && task.priority.toLowerCase() === priorityFilter.toLowerCase());
    }
  
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => 
        task.status && task.status.toLowerCase() === statusFilter.toLowerCase());
    }
  
    setFilteredTasks(filtered);
  }, [priorityFilter, statusFilter, tasks]);
  
  // Task submission
  const handleTaskFormSubmit = (e) => {
    e.preventDefault();
  
    const newTask = {
      title: taskData.title,
      description: taskData.description,
      tags: selectedTags.map(tag => tag.value),
      assignedTo: selectedUser ? selectedUser.value : null,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: "Pending"
    };
  
    axios.post("http://localhost:5000/api/tasks", newTask)
      .then(response => {
        console.log("Task added:", response.data);
        setTaskData({ title: "", description: "", dueDate: "", priority: "Low" });
        setSelectedTags([]);
        setSelectedUser(null);
        fetchTasks(); // Refresh the tasks list
      })
      .catch(error => console.error("Error adding task:", error));
  };
  
  // Handle file download
  const handleDownload = (filename) => {
    axios({
      url: `http://localhost:5000/api/tasks/download/${filename}`,
      method: 'GET',
      responseType: 'blob',
    }).then((response) => {
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
    }).catch(error => {
      alert('Error downloading file: ' + error.message);
    });
  };

  // Task deletion / Edit
  const [editTask, setEditTask] = useState(null); // Store task to edit
  const [deleteTaskId, setDeleteTaskId] = useState(null); // Store task ID for deletion

  const handleEditClick = (task) => {
    setEditTask(task); // Set task to edit
  };

  const handleDeleteClick = (taskId) => {
    setDeleteTaskId(taskId); // Set task ID for confirmation
  };

  const closeModals = () => {
    setEditTask(null);
    setDeleteTaskId(null);
  };

  // For Deletion of Task
  const deleteTask = async (taskId) => {
    console.log("Attempting to delete task with ID:", taskId);
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Delete response status:", response.status);
      const responseData = await response.json();
      console.log("Delete response data:", responseData);
      
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${responseData.error || response.statusText}`);
      }
      
      // Update local state after successful deletion
      setTasks(tasks.filter(task => task.id !== taskId));
      setFilteredTasks(filteredTasks.filter(task => task.id !== taskId));
      console.log("Task deleted successfully");
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task: ' + error.message);
    }
  };
  
  // Add this function to your component for testing
  const testDeleteEndpoint = async () => {
    try {
      console.log("Testing delete endpoint with task ID:", deleteTaskId);
      const response = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: 'DELETE',
      });
      console.log("Delete test response:", response.status);
      console.log("Response ok?", response.ok);
      const data = await response.json().catch(() => ({}));
      console.log("Response data:", data);
      return response.ok;
    } catch (error) {
      console.error("Error testing delete endpoint:", error);
      return false;
    }
  };

  // To Edit the task
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    
    // Extract form data
    const form = document.getElementById('editTaskForm');
    const updatedTask = {
      id: editTask.id,
      title: form.querySelector('[name="title"]').value,
      description: form.querySelector('[name="description"]').value,
      dueDate: form.querySelector('[name="dueDate"]').value,
      priority: form.querySelector('[name="priority"]').value,
      status: form.querySelector('[name="status"]') ? form.querySelector('[name="status"]').value : editTask.status,
      assignedTo: selectedUser ? selectedUser.value : editTask.assignedTo,
      tags: selectedTags ? selectedTags.map(tag => tag.value) : editTask.tags
    };
    
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${editTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTask)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
      
      // Update local state after successful update
      const updatedTaskData = await response.json();
      setTasks(tasks.map(task => task.id === editTask.id ? updatedTaskData.task : task));
      setFilteredTasks(filteredTasks.map(task => task.id === editTask.id ? updatedTaskData.task : task));
      
      closeModals();
      alert('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + error.message);
    }
  };

  const [editFormData, setEditFormData] = useState({});

  // Set initial form data when a task is selected for editing
  useEffect(() => {
    if (editTask) {
      setEditFormData({
        title: editTask.title || '',
        description: editTask.description || '',
        dueDate: editTask.dueDate || '',
        priority: editTask.priority || 'Medium',
        status: editTask.status || 'Pending'
      });
      
      // Set selected tags based on task tags
      if (editTask.tags && Array.isArray(editTask.tags)) {
        setSelectedTags(editTask.tags.map(tag => ({
          value: typeof tag === 'object' ? tag.value || tag.id : tag,
          label: typeof tag === 'object' ? tag.label || tag.name : tag
        })));
      } else {
        setSelectedTags([]);
      }
      
      // Set selected user based on task assignedTo
      if (editTask.assignedTo) {
        const user = users.find(u => u.value.toString() === editTask.assignedTo.toString());
        setSelectedUser(user || null);
      } else {
        setSelectedUser(null);
      }
    }
  }, [editTask]);

  // Handle form field changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="dashboard-container">
      {/* Sidebar - same as before */}
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
          <li className="menu-item">
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
        {/* Header - unchanged */}
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
        
        {/* Dashboard Metrics - using actual count of tasks */}
        <section className="dashboard-metrics">
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-title">Total Tasks</div>
              <div className="metric-icon tasks">
                <i className="fas fa-tasks"></i>
              </div>
            </div>
            <div className="metric-value">{tasks.length}</div>
            <div className="metric-trend up">
              <i className="fas fa-arrow-up"></i>
              <span>Updated</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-title">Active Users</div>
              <div className="metric-icon users">
                <i className="fas fa-users"></i>
              </div>
            </div>
            <div className="metric-value">{Object.keys(usersMap).length}</div>
            <div className="metric-trend up">
              <i className="fas fa-arrow-up"></i>
              <span>Updated</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-title">Completion Rate</div>
              <div className="metric-icon completion">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
            <div className="metric-value">
              {tasks.length ? 
                Math.round((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) + '%' 
                : '0%'}
            </div>
            <div className="metric-trend up">
              <i className="fas fa-arrow-up"></i>
              <span>Real-time</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-title">Overdue Tasks</div>
              <div className="metric-icon overdue">
                <i className="fas fa-exclamation-circle"></i>
              </div>
            </div>
            <div className="metric-value">
              {tasks.filter(t => 
                new Date(t.dueDate) < new Date() && 
                t.status !== "Completed"
              ).length}
            </div>
            <div className="metric-trend down">
              <i className="fas fa-arrow-down"></i>
              <span>Real-time</span>
            </div>
          </div>
        </section>
        
        <section className="charts-section">
        {/* Task Trends Chart - Enhanced Area Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-chart-line"></i>
              <span>Task Activity Trends</span>
            </h2>
            <div className="card-actions">
              <div className="refresh-timer">Live Data</div>
              <button className="card-action-btn">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#be5985" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#be5985" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb8e0" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ffb8e0" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffedf9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ffedf9" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="date" tick={{ fill: '#4b5563' }} />
              <YAxis tick={{ fill: '#4b5563' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff'
                }}
                itemStyle={{ color: '#f3f4f6' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', color: '#374151' }} />
              <Area type="monotone" dataKey="completed" stroke="#be5985" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} name="Completed Tasks" />
              <Area type="monotone" dataKey="created" stroke="#ffb8e0" fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} name="New Tasks" />
              <Area type="monotone" dataKey="active" stroke="#ffedf9" fillOpacity={1} fill="url(#colorActive)" strokeWidth={2} name="Active Tasks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

        </div>
        
        {/* Task Distribution Pie Charts in a flex layout */}
        <div className="flex" style={{ display: 'flex', gap: '20px', marginBottom: '20px', minHeight: '420px', maxHeight: '430px' }}>
          {/* Status Distribution Chart */}
          <div className="card qwerty" style={{ flex: 1 }}>
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-chart-pie"></i>
                <span>Task Status</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      {taskDistributionn.status.map((entry, index) => {
                        // Attractive balanced status colors
                        const statusColors = {
                          'Completed': '#3774b5',
                          'Progress': '#578fca',
                          'Pending': '#a1e3fb',
                          'Rework': '#d1f8ef',
                        };
                        return (
                          <filter key={`shadow-${index}`} id={`shadow-${entry.name}`} height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={`${statusColors[entry.name]}80`} />
                          </filter>
                        );
                      })}
                    </defs>
                    <Pie
                      data={taskDistributionn.status}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      filter="url(#shadow)"
                    >
                      {taskDistributionn.status.map((entry, index) => {
                        // Attractive balanced status colors
                        const statusColors = {
                          'Completed': '#3774b5',
                          'Progress': '#578fca',
                          'Pending': '#a1e3fb',
                          'Rework': '#d1f8ef',
                        };
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={statusColors[entry.name]} 
                            style={{
                              filter: `drop-shadow(0px 0px 3px ${statusColors[entry.name]}60)`,
                              outline: 'none'
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} tasks`, name]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(157, 168, 189, 0.85)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Priority Distribution Chart */}
          <div className="card qwerty" style={{ flex: 1}}>
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-flag"></i>
                <span>Priority Distribution</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      {taskDistributionn.priority.map((entry, index) => {
                        // Attractive balanced priority colors
                        const priorityColors = {
                          'High': '#48a6a6',
                          'Medium': '#9acbd0',
                          'Low': '#f2efe8',
                          'None': '#8a8a9a'
                        };
                        return (
                          <filter key={`shadow-${index}`} id={`shadow-${entry.name}`} height="200%">
                            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={`${priorityColors[entry.name]}80`} />
                          </filter>
                        );
                      })}
                    </defs>
                    <Pie
                      data={taskDistributionn.priority}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {taskDistributionn.priority.map((entry, index) => {
                        // Attractive balanced priority colors
                        const priorityColors = {
                          'High': '#48a6a6',
                          'Medium': '#9acbd0',
                          'Low': '#f2efe8',
                          'None': '#8a8a9a'
                        };
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={priorityColors[entry.name]}
                            style={{
                              filter: `drop-shadow(0px 0px 3px ${priorityColors[entry.name]}60)`,
                              cursor: 'pointer'
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} tasks`, name]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(45, 55, 72, 0.85)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeline & Tag Analysis in flex layout */}
        <div className="card" style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexDirection: 'row' }}> 
          {/* Task Timeline Chart */}
          <div className="card" style={{ flex: 2 }}>
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-calendar-alt"></i>
                <span>Task Timeline Analysis</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={taskTimeline} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(45, 55, 72, 0.85)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="total" name="Total Tasks" fill="#fff5f3" />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#c598b5" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#e5b2bb" />
                    <Bar dataKey="rework" name="Rework" stackId="a" fill="#fbcfc4" />
                    <Line type="monotone" dataKey="total" name="Task Trend" stroke="#486cad" strokeWidth={2} dot={{ fill: "#486cad", strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
                
          {/* Tag Distribution */}
          <div className="card" style={{ flex: 1, maxHeight: '440px', overflowY: 'auto' }}>
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-tags"></i>
                <span>Tag Distribution</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={tagDistribution} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 50, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.5} />
                  <XAxis 
                    type="number" 
                    tick={{ fill: '#6b7280' }} 
                    label={{ 
                      value: 'No. of Tasks', 
                      position: 'bottom', 
                      offset: 0,
                      fill: '#6b7280',
                      fontSize: 14,
                      dy: 10
                    }} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#6b7280' }} 
                    width={80} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(45, 55, 72, 0.85)', 
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value} tasks`]}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Tasks" 
                    radius={[0, 6, 6, 0]}
                  >
                    {tagDistribution.map((entry, index) => {
                      // Find max value for scaling
                      const maxValue = Math.max(...tagDistribution.map(item => item.value));
                      // Calculate position in range for color assignment
                      const position = Math.round((entry.value / maxValue) * 100);
                      
                      // Use a more appealing blue gradient scale
                      let color;
                      if (position < 25) {
                        color = '#d0f8ef';  // Deeper blue for lowest values
                      } else if (position < 50) {
                        color = '#a1e3fb';  // Medium blue
                      } else if (position < 75) {
                        color = '#578fca';  // Lighter blue
                      } else {
                        color = '#3774b5';  // Lightest blue for highest values
                      }
                      
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={color} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
      </section>

      </main>
    </div>
  );
};

export default AdminDashboard;