import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StaffDashboard.css';

// Import icons (assuming you're using something like react-icons)
import {FiBell} from 'react-icons/fi';

const StaffSettings = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'All Status',
    priority: 'All Priorities'
  });
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usersMap, setUsersMap] = useState({});
  const [filteredTasks, setFilteredTasks] = useState([]);
  
  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Function to fetch tasks from the API
  const fetchTasks = async (currentUser) => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      // Filter tasks assigned to the current user
      const userTasks = response.data.filter(
        task => task.assignedTo === String(currentUser?.id)
      );
      setTasks(userTasks);
      setFilteredTasks(userTasks); // Initialize filtered tasks with all tasks
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get email by user ID
  const getEmailById = (userId) => {
    return usersMap[userId]?.email || 'No email available';
  };

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!loggedInUser) {
      navigate('/stafflogin');
      return;
    }

    setUser(loggedInUser);
    
    // Fetch users for the usersMap
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');
        const usersById = {};
        response.data.forEach(user => {
          usersById[user.id] = user;
        });
        setUsersMap(usersById);
        
        // Only fetch tasks after we have the user data
        await fetchTasks(loggedInUser);
      } catch (err) {
        console.error('Error fetching users:', err);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/');
  };

  const getAvatarInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  
  // Add state for phone number
  const [phoneData, setPhoneData] = useState({
    phoneNumber: user?.phoneNumber || '',
  });
  const [phoneMessage, setPhoneMessage] = useState(null);
  
  // Function to handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate that new password and confirm password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/api/change-password', {
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordMessage({ type: 'success', text: response.data.message });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update password' 
      });
    }
  };

  // Function to handle phone number update
  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    
    // Validate phone number (simple validation)
    if (!/^\d{10}$/.test(phoneData.phoneNumber)) {
      setPhoneMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/api/update-phone', {
        userId: user.id,
        phoneNumber: phoneData.phoneNumber
      });
      
      // Update the user in local state and localStorage
      const updatedUser = { ...user, phoneNumber: phoneData.phoneNumber };
      setUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      
      setPhoneMessage({ type: 'success', text: response.data.message || 'Phone number updated successfully' });
    } catch (err) {
      setPhoneMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update phone number' 
      });
    }
  };

  // Update phone number when user data is loaded
  useEffect(() => {
    if (user && user.phoneNumber) {
      setPhoneData({ phoneNumber: user.phoneNumber });
    }
  }, [user]);

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
            <li className="menu-item">
              <a href="staffrequests">
                <i className="fas fa-inbox"></i>
                <span>ReQuest</span>
              </a>
            </li>
            <li className="menu-item active">
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
            <div className="avatar">
              {getAvatarInitial(user?.username)}
            </div>
          </div>
        </header>

        <div className="settings-container">
          {/* Password Change Form */}
          <div className="settings-card">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Update Password</button>
              {passwordMessage && <div className={`message ${passwordMessage.type}`}>{passwordMessage.text}</div>}
            </form>
          </div>

          {/* Phone Number Update Form */}
          <div className="settings-card">
            <h2>Update Phone Number</h2>
            <form onSubmit={handlePhoneUpdate} className="settings-form">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  placeholder="Enter 10-digit phone number"
                  value={phoneData.phoneNumber}
                  onChange={(e) => setPhoneData({...phoneData, phoneNumber: e.target.value})}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Update Phone Number</button>
              {phoneMessage && <div className={`message ${phoneMessage.type}`}>{phoneMessage.text}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
        :root {
        --primary: #4361ee;
        --primary-light: #4895ef;
        --secondary: #3f37c9;
        --accent: #f72585;
        --success: #4cc9f0;
        --warning: #f8961e;
        --danger: #f94144;
        --dark: #1f2937;
        --light: #f9fafb;
        --gray-100: #f3f4f6;
        --gray-200: #e5e7eb;
        --gray-300: #d1d5db;
        --gray-400: #9ca3af;
        --gray-500: #6b7280;
        --gray-600: #4b5563;
        --transition: all 0.3s ease;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        --radius-sm: 0.25rem;
        --radius: 0.5rem;
        --radius-md: 0.75rem;
        --radius-lg: 1rem;
      }
      .settings-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }

      .settings-card {
        background: var(--light);
        border-radius: var(--radius);
        padding: 24px;
        box-shadow: var(--shadow);
        transition: var(--transition);
      }

      .settings-card:hover {
        box-shadow: var(--shadow-md);
      }

      .settings-card h2 {
        color: var(--dark);
        font-size: 1.25rem;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--primary-light);
      }

      .settings-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-weight: 500;
        color: var(--gray-600);
        font-size: 0.9rem;
      }

      .form-group input {
        padding: 12px;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-sm);
        font-size: 1rem;
        transition: var(--transition);
      }

      .form-group input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
      }

      .submit-btn {
        background-color: var(--primary);
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 1rem;
        transition: var(--transition);
        margin-top: 8px;
      }

      .submit-btn:hover {
        background-color: var(--secondary);
        transform: translateY(-2px);
      }

      .submit-btn:active {
        transform: translateY(0);
      }

      .message {
        padding: 12px;
        border-radius: var(--radius-sm);
        margin-top: 16px;
        font-size: 0.9rem;
      }

      .success {
        background-color: rgba(76, 201, 240, 0.2);
        color: var(--success);
        border: 1px solid var(--success);
      }

      .error {
        background-color: rgba(249, 65, 68, 0.2);
        color: var(--danger);
        border: 1px solid var(--danger);
      }

      @media (max-width: 768px) {
        .settings-container {
          grid-template-columns: 1fr;
        }
      }
    `}</style>

    </main>
  );
};

export default StaffSettings;