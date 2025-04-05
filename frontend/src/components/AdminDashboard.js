import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import Select from 'react-select';
import { TaskCompletionRateChart, TaskAssignmentChart } from './TaskCharts';
import "./AdminDashboard.css";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';



 


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
  const [analyticsData, setAnalyticsData] = useState([]);
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  
  useEffect(() => {
    // Get count from localStorage
    const count = localStorage.getItem('pendingRequestsCount') || 0;
    setRequestCount(count);
  }, []);

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Status colors
const STATUS_COLORS = {
    'Pending': '#FFBB28',
    'In Progress': '#0088FE',
    'Completed': '#00C49F'
  };
  
  // Priority colors
  const PRIORITY_COLORS = {
    'Low': '#00C49F',
    'Medium': '#FFBB28',
    'High': '#FF8042',
    'Critical': '#FF0000'
  };


  
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
    
    // Populate with actual data
    tasksData.forEach(task => {
      const createdDate = new Date(task.createdAt || new Date());
      const completedDate = task.status === 'Completed' ? 
        new Date(task.completedAt || new Date()) : null;
      
      const createdDateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Count task creation
      if (tasksByDate[createdDateStr]) {
        tasksByDate[createdDateStr].created += 1;
      }
      
      // Count task completion
      if (completedDate) {
        const completedDateStr = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (tasksByDate[completedDateStr]) {
          tasksByDate[completedDateStr].completed += 1;
        }
      }
      
      // Count active tasks
      if (task.status === 'In Progress' || task.status === 'Pending') {
        const dateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (tasksByDate[dateStr]) {
          tasksByDate[dateStr].active += 1;
        }
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

  // Custom renderer for the pie chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    // Calculate the position for the label
    const radius = outerRadius * 1.2;
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
        {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
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
          <li className="menu-item">
            <a href="#">
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
        
        {/* Charts Section - with real-time charts */}
        <section className="charts-section">
          {/* CHANGE 1: Line Chart to Area Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-chart-line"></i>
                <span>Task Completion Trend (Last 7 Days)</span>
              </h2>
              <div className="card-actions">
                <div className="refresh-timer">
                  Auto-refresh: 30s
                </div>
                <button className="card-action-btn" onClick={() => fetchTasks()}>
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="completed" fill="#28a745" stroke="#28a745" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="created" fill="#007bff" stroke="#007bff" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="active" fill="#ffc107" stroke="#ffc107" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* CHANGE 2: Status Distribution using Exploded Donut Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-chart-pie"></i>
                <span>Task Distribution By Status</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskDistribution.status || []}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskDistribution.status && taskDistribution.status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
         
          {/* CHANGE 3: Priority Distribution using Exploded Pie Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-chart-pie"></i>
                <span>Task Distribution By Priority</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn" onClick={() => fetchTasks()}>
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskDistribution.priority || []}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={renderCustomizedLabel}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={5}
                      // Explode the pie chart segments
                      activeIndex={[0, 1, 2, 3]}
                      activeShape={(props) => {
                        const RADIAN = Math.PI / 180;
                        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, value, name } = props;
                        const sin = Math.sin(-RADIAN * midAngle);
                        const cos = Math.cos(-RADIAN * midAngle);
                        const mx = cx + (outerRadius + 10) * cos;
                        const my = cy + (outerRadius + 10) * sin;
                        return (
                          <g>
                            <path 
                              d={`
                                M ${cx} ${cy}
                                L ${cx + (outerRadius + 10) * Math.cos(-RADIAN * startAngle)}
                                  ${cy + (outerRadius + 10) * Math.sin(-RADIAN * startAngle)}
                                A ${outerRadius + 10} ${outerRadius + 10} 0
                                  ${endAngle - startAngle > 180 ? 1 : 0}
                                  1
                                  ${cx + (outerRadius + 10) * Math.cos(-RADIAN * endAngle)}
                                  ${cy + (outerRadius + 10) * Math.sin(-RADIAN * endAngle)}
                                Z
                              `}
                              fill={fill}
                              fillOpacity={0.1}
                            />
                          </g>
                        );
                      }}
                    >
                      {taskDistribution.priority && taskDistribution.priority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <TaskAssignmentChart tasks={tasks} usersMap={usersMap} />

        </section>

      </main>
    </div>
  );
};

export default AdminDashboard;