import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import Select from 'react-select';
import "./AdminDashboard.css";

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
  const [newTag, setNewTag] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagError, setTagError] = useState('');
  const [tagSuccess, setTagSuccess] = useState('');
  const [requestCount, setRequestCount] = useState(0);
  
  useEffect(() => {
    // Get count from localStorage
    const count = localStorage.getItem('pendingRequestsCount') || 0;
    setRequestCount(count);
  }, []);
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
      })
      .catch(error => console.error("Error fetching tasks:", error))
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

  // Handle adding a new tag
  const handleAddTag = () => {
    // Reset previous messages
    setTagError('');
    setTagSuccess('');
    
    // Validate tag
    if (!newTag.trim()) {
      setTagError('Tag cannot be empty');
      return;
    }
    
    // Check if tag already exists
    if (tags.some(tag => tag.value.toLowerCase() === newTag.trim().toLowerCase())) {
      setTagError('This tag already exists');
      return;
    }
    
    // Send tag to backend
    axios.post('http://localhost:5000/api/tags', { tag: newTag.trim() })
      .then(response => {
        // Update the tags list
        fetchTags();
        setTagSuccess('Tag added successfully!');
        setNewTag(''); // Clear the input field
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setTagSuccess('');
        }, 3000);
      })
      .catch(error => {
        console.error('Error adding tag:', error);
        setTagError('Failed to add tag: ' + (error.response?.data?.message || error.message));
      });
  };
  
  // Handle deleting a tag
  const handleDeleteTag = (tagValue) => {
    // Send delete request to backend
    axios.delete(`http://localhost:5000/api/tags/${tagValue}`)
      .then(response => {
        // Update the tags list
        fetchTags();
        setTagSuccess('Tag deleted successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setTagSuccess('');
        }, 3000);
      })
      .catch(error => {
        console.error('Error deleting tag:', error);
        setTagError('Failed to delete tag: ' + (error.response?.data?.message || error.message));
      });
  };
  
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
    setShowTagModal(false);
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

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data if stored
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to home page
    navigate("/");
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
  const tagsDropdownRef = useRef(null);
  const usersDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setIsTagsDropdownOpen(false);
      }
      if (usersDropdownRef.current && !usersDropdownRef.current.contains(event.target)) {
        setIsUsersDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTagToggle = (tag) => {
    if (selectedTags.some(t => t.value === tag.value)) {
      setSelectedTags(selectedTags.filter(t => t.value !== tag.value));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsUsersDropdownOpen(false);
  };

  const handleTagInputChange = (e) => {
    setNewTag(e.target.value);
  };

  // Tag Modal - separated as a component that doesn't re-render the whole parent
  const TagModal = () => {
    // Local state for the input inside the modal - this prevents the blinking
    const [localNewTag, setLocalNewTag] = useState(newTag);
    const [localTagError, setLocalTagError] = useState(tagError);
    const [localTagSuccess, setLocalTagSuccess] = useState(tagSuccess);

    const handleLocalAddTag = () => {
      // Reset previous messages
      setLocalTagError('');
      setLocalTagSuccess('');
      
      // Validate tag
      if (!localNewTag.trim()) {
        setLocalTagError('Tag cannot be empty');
        return;
      }
      
      // Check if tag already exists
      if (tags.some(tag => tag.value.toLowerCase() === localNewTag.trim().toLowerCase())) {
        setLocalTagError('This tag already exists');
        return;
      }
      
      // Send tag to backend
      axios.post('http://localhost:5000/api/tags', { tag: localNewTag.trim() })
        .then(response => {
          // Update the tags list
          fetchTags();
          setLocalTagSuccess('Tag added successfully!');
          setLocalNewTag(''); // Clear the input field
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setLocalTagSuccess('');
          }, 3000);
        })
        .catch(error => {
          console.error('Error adding tag:', error);
          setLocalTagError('Failed to add tag: ' + (error.response?.data?.message || error.message));
        });
    };

    const handleLocalDeleteTag = (tagValue) => {
      // Send delete request to backend
      axios.delete(`http://localhost:5000/api/tags/${tagValue}`)
        .then(response => {
          // Update the tags list
          fetchTags();
          setLocalTagSuccess('Tag deleted successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setLocalTagSuccess('');
          }, 3000);
        })
        .catch(error => {
          console.error('Error deleting tag:', error);
          setLocalTagError('Failed to delete tag: ' + (error.response?.data?.message || error.message));
        });
    };

    return (
      <div className="modal-overlay active" onClick={closeModals}>
        <div className="modal-content tag-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Manage Tags</h3>
            <button className="close-btn" onClick={closeModals}>×</button>
          </div>
          
          <div className="modal-body">
            {localTagError && <div className="alert alert-danger">{localTagError}</div>}
            {localTagSuccess && <div className="alert alert-success">{localTagSuccess}</div>}
            
            <div className="add-tag-form">
              <input 
                type="text" 
                className="form-control"
                placeholder="Enter new tag"
                value={localNewTag}
                onChange={(e) => setLocalNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocalAddTag()}
              />
              <button 
                className="btn btn-primary ml-2" 
                onClick={handleLocalAddTag}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
            
            <div className="tags-list">
              <h4>Existing Tags</h4>
              {tags.length === 0 ? (
                <p>No tags available. Add your first tag above.</p>
              ) : (
                <div className="tag-chips">
                  {tags.map((tag, index) => (
                    <div className="tag-chip" key={index}>
                      <span>{tag.label}</span>
                      <button 
                        className="delete-tag-btn" 
                        onClick={() => handleLocalDeleteTag(tag.value)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModals}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Tag management modal - rendered conditionally */}
      {showTagModal && <TagModal />}
      
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
            <li className="menu-item">
              <a href="flexdue">
                <i className="fas fa-inbox"></i>
                <span>ReQuest</span>
                <span className="badge">{requestCount}</span>
              </a>
            </li>
            <li className="menu-item active">
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
        
        {/* Dashboard content would go here */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon tags-icon">
              <i className="fas fa-tags"></i>
            </div>
            <div className="stat-info">
              <h3>Total Tags</h3>
              <div className="stat-value">{tags.length}</div>
              <div className="stat-action">
                <button onClick={() => setShowTagModal(true)} className="btn-link">
                  Manage Tags <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* Other stat cards would go here */}
        </div>
<style jsx>{`

.modal-overlay {
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
  opacity: 0;
  visibility: hidden;
  transition: var(--transition);
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background-color: var(--light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transform: scale(0.9);
  transition: transform 0.2s ease;
}

.modal-overlay.active .modal-content {
  transform: scale(1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  margin: 0;
  color: var(--dark);
  font-weight: 600;
}
`}</style>
      </main>
    </div>
  );
};

export default AdminDashboard;