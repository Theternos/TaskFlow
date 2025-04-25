import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import Select from 'react-select';
import "./AdminDashboard.css";
import UserViewModal from './UserViewModal'; // Import our new component

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
  
  // New state for handling the delete modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // New state variables for filtering and searching users
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  
    const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);

  const handleViewUser = (userId) => {
    // Set the selected user data for the modal
    setSelectedUserData(usersMap[userId]);
    // Open the modal
    setShowUserModal(true);
  };
  
  // Add function to close the user modal
  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUserData(null);
  };


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
    setLoading(true);
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
        setFilteredUsers(formattedUsers); // Initialize filtered users with all users
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setLoading(false);
      });
  };
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
  const deleteUser = async (userId) => {
    try {
      // Your API call to delete user
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh the user list after successful deletion
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };
  
  // Add handler for delete button click
  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };
  
  // Handle actual deletion from the modal
  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete)
        .then(() => {
          closeModals();
        })
        .catch(err => {
          console.error("Error in delete operation:", err);
          // Optional: Add error notification here
        });
    }
  };
  
  // Add function to close all modals
  const closeModals = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data if stored
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to home page
    navigate("/");
  };


  // Filter users based on search query and role filter
  const filterUsers = () => {
    let filtered = users;
    
    // Filter by search query (name, email)
    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase();
      filtered = filtered.filter(user => {
        const userData = usersMap[user.value];
        return (
          user.label.toLowerCase().includes(query) || // username
          (userData?.email && userData.email.toLowerCase().includes(query)) // email
        );
      });
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        usersMap[user.value]?.role === roleFilter
      );
    }
    
    setFilteredUsers(filtered);
  };

  // Effect to filter users whenever search query or role filter changes
  useEffect(() => {
    filterUsers();
  }, [userSearchQuery, roleFilter, users]);

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
            <li className="menu-item active">
              <a href="#">
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
                
        {/* Content Grid - User Registration and Task Creation */}
        <div className="content-grid">
          {/* User Registration Card - unchanged */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <i className="fas fa-user-plus"></i>
                <span>Register New User</span>
              </h2>
              <div className="card-actions">
                <button className="card-action-btn">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <form id="userForm" onSubmit={handleUserFormSubmit}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" name="username" placeholder="Enter Name" value={newUser.username} onChange={handleUserChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" name="email" placeholder="Enter email" value={newUser.email} onChange={handleUserChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" name="password" placeholder="Enter password" value={newUser.password} onChange={handleUserChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control form-select drop-down" name="role" value={newUser.role} onChange={handleUserChange}>
                    <option value="user">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  <i className="fas fa-user-plus"></i>
                  <span> Register User</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Users Table with search, filter, and action buttons */}
        <div className="adm-content-grid">
          <div className="adm-users-card">
            <div className="adm-card-header">
              <h2 className="adm-card-title">
                <i className="fas fa-users"></i>
                <span>Users</span>
              </h2>
              <div className="adm-card-actions">
                <button className="adm-card-action-btn adm-refresh-btn" onClick={() => fetchUsers()} title="Refresh">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
            <div className="adm-card-body">
              {/* Search and filter controls */}
              <div className="adm-controls-container">
                <div className="adm-search-filter-row">
                  <div className="adm-search-wrapper">
                    <div className="adm-search-input-group">
                      <i className="fas fa-search adm-search-icon"></i>
                      <input 
                        type="text" 
                        className="adm-search-control" 
                        placeholder="Search by name or email..." 
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="adm-filter-wrapper">
                    <div className="adm-filter-group">
                      <div className="adm-filter-label">Role:</div>
                      <select 
                        className="adm-filter-control" 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="user">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="adm-loading-container">
                  <div className="adm-loading-spinner">
                    <span className="adm-visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="adm-table-container">
                  <table className="adm-users-table">
                    <thead>
                      <tr>
                        <th className="adm-col-id">ID</th>
                        <th className="adm-col-name">Name</th>
                        <th className="adm-col-email">Email</th>
                        <th className="adm-col-role">Role</th>
                        <th className="adm-col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <tr key={user.value}>
                            <td className="adm-col-id">{user.value}</td>
                            <td className="adm-col-name">
                              <div className="adm-user-info">
                                <div className="adm-user-avatar">{user.label.charAt(0).toUpperCase()}</div>
                                <div className="adm-user-name">{user.label}</div>
                              </div>
                            </td>
                            <td className="adm-col-email">{usersMap[user.value]?.email}</td>
                            <td className="adm-col-role">
                              <span className={`adm-role-badge ${usersMap[user.value]?.role === 'admin' ? 'adm-role-admin' : 'adm-role-staff'}`}>
                                {usersMap[user.value]?.role === 'admin' ? 'Admin' : 'Staff'}
                              </span>
                            </td>
                            <td className="adm-col-actions">
                              <div className="adm-action-buttons">
                                <button className="adm-action-btn adm-view-btn" onClick={() => handleViewUser(user.value)} title="View">
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button className="adm-action-btn adm-delete-btn" onClick={() => handleDeleteUser(user.value)} title="Delete">
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="adm-no-results">No users found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="adm-modal-overlay">
            <div className="adm-modal-container adm-delete-modal">
              <div className="adm-modal-header">
                <h2>Confirm Deletion</h2>
                <button className="adm-modal-close" onClick={closeModals}>×</button>
              </div>
              <div className="adm-modal-body">
                <div className="adm-delete-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#d92d20" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
                  </svg>
                </div>
                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn adm-btn-secondary" onClick={closeModals}>Cancel</button>
                <button className="adm-btn adm-btn-danger" onClick={confirmDeleteUser}>Delete User</button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style jsx>{`
          /* Card Styles */
          .adm-users-card {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            background-color: #fff;
            margin-bottom: 20px;
            border: none;
          }

          .adm-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eaedf2;
          }

          .adm-card-title {
            display: flex;
            align-items: center;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: #344054;
          }

          .adm-card-title i {
            margin-right: 10px;
            color: #4a6cf7;
          }

          .adm-card-body {
            padding: 0;
          }

          /* Controls Container */
          .adm-controls-container {
            padding: 16px 20px;
            border-bottom: 1px solid #eaedf2;
          }

          .adm-search-filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }

          .adm-search-wrapper {
            flex: 1;
            min-width: 250px;
          }

          .adm-filter-wrapper {
            width: auto;
            min-width: 200px;
          }

          .adm-search-input-group {
            position: relative;
            width: 100%;
          }

          .adm-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #687588;
          }

          .adm-search-control {
            width: 100%;
            padding: 8px 12px 8px 35px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .adm-search-control:focus {
            border-color: #4a6cf7;
            outline: none;
            box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.1);
          }

          .adm-filter-group {
            display: flex;
            align-items: center;
          }

          .adm-filter-label {
            margin-right: 8px;
            font-size: 14px;
            color: #344054;
            font-weight: 500;
          }

          .adm-filter-control {
            padding: 8px 12px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            font-size: 14px;
            flex-grow: 1;
            background-color: white;
          }

          .adm-filter-control:focus {
            border-color: #4a6cf7;
            outline: none;
            box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.1);
          }

          /* Loading State */
          .adm-loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 30px 0;
          }

          .adm-loading-spinner {
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 3px solid #4a6cf7;
            width: 24px;
            height: 24px;
            animation: adm-spin 1s linear infinite;
          }

          @keyframes adm-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Table Styles */
          .adm-table-container {
            overflow-x: auto;
          }

          .adm-users-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 14px;
          }

          .adm-users-table th,
          .adm-users-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #eaedf2;
          }

          .adm-users-table th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #344054;
            white-space: nowrap;
          }

          .adm-users-table tr:hover {
            background-color: #f9fafb;
          }

          .adm-users-table tr:last-child td {
            border-bottom: none;
          }

          .adm-col-id {
            width: 60px;
          }

          .adm-col-name {
            min-width: 180px;
          }

          .adm-col-email {
            min-width: 200px;
          }

          .adm-col-role {
            width: 110px;
          }

          .adm-col-actions {
            width: 100px;
            text-align: center;
          }

          /* User Info */
          .adm-user-info {
            display: flex;
            align-items: center;
          }

          .adm-user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #4a6cf7;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-right: 10px;
          }

          .adm-user-name {
            font-weight: 500;
          }

          /* Role Badge */
          .adm-role-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
          }

          .adm-role-admin {
            background-color: #fee4e2;
            color: #d92d20;
          }

          .adm-role-staff {
            background-color: #e6f4ee;
            color: #039855;
          }

          /* Action Buttons */
          .adm-action-buttons {
            display: flex;
            gap: 8px;
            justify-content: center;
          }

          .adm-action-btn {
            width: 30px;
            height: 30px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: 1px solid #d0d5dd;
            color: #344054;
            cursor: pointer;
            transition: all 0.2s;
          }

          .adm-view-btn:hover {
            background-color: #eef4ff;
            color: #4a6cf7;
            border-color: #4a6cf7;
          }

          .adm-delete-btn:hover {
            background-color: #fee4e2;
            color: #d92d20;
            border-color: #d92d20;
          }

          .adm-refresh-btn {
            background: none;
            border: 1px solid #d0d5dd;
            color: #344054;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .adm-refresh-btn:hover {
            background-color: #eef4ff;
            color: #4a6cf7;
            border-color: #4a6cf7;
          }

          .adm-no-results {
            text-align: center;
            padding: 20px;
            color: #667085;
          }

          .adm-visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
          }

          .adm-content-grid {
            display: grid;
            grid-gap: 20px;
          }
        
        /* Modal Styles */
        .adm-modal-overlay {
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
          animation: adm-fadeIn 0.2s ease-out;
        }

        .adm-modal-container {
          background-color: white;
          border-radius: 8px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: adm-slideIn 0.2s ease-out;
        }

        .adm-delete-modal {
          /* Specific styles for the delete modal if needed */
        }

        .adm-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eaedf2;
        }

        .adm-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #344054;
        }

        .adm-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          line-height: 1;
          color: #667085;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .adm-modal-close:hover {
          background-color: #f9fafb;
          color: #344054;
        }

        .adm-modal-body {
          padding: 20px;
          text-align: center;
        }

        .adm-delete-icon {
          margin: 0 auto 16px;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .adm-modal-body p {
          margin: 0;
          color: #4d5875;
          font-size: 15px;
          line-height: 1.5;
        }

        .adm-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 20px;
          gap: 12px;
          border-top: 1px solid #eaedf2;
        }

        .adm-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .adm-btn-secondary {
          background-color: white;
          border-color: #d0d5dd;
          color: #344054;
        }

        .adm-btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #667085;
        }

        .adm-btn-danger {
          background-color: #d92d20;
          color: white;
        }

        .adm-btn-danger:hover {
          background-color: #b42318;
        }

        @keyframes adm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes adm-slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

<UserViewModal
        user={selectedUserData}
        isOpen={showUserModal}
        onClose={closeUserModal}
      />
    </div>
  );
};

export default AdminDashboard;