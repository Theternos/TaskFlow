import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password });
      if (response.data.message === 'Login successful' && response.data.user.role === 'admin') {
        // Redirect to Admin Dashboard
        navigate('/admin');
      } else {
        setError('You do not have the necessary permissions.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div>
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="logo-circle">A</div>
            <h2 className="login-title">Admin Portal</h2>
            <p className="login-subtitle">Sign in to your account</p>
          </div>
          
          {/* Form */}
          <div className="login-form">
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">@</span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <div className="password-header">
                  <label htmlFor="password" className="form-label">Password</label>
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              
              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  <span>{error}</span>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="login-footer">
            Protected area • Unauthorized access prohibited
          </div>
        </div>
        
        <div className="support-text">
          Need help? <a href="#" className="support-link">Contact Support</a>
        </div>
      </div>
      <style jsx="true">{`
      /* admin-login.css */

/* Main container styles */
.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-card {
  width: 380px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header styles */
.login-header {
  text-align: center;
  padding: 30px 0;
  background: linear-gradient(135deg, #2a3c85 0%, #1a237e 100%);
  color: white;
}

.logo-circle {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 24px;
  font-weight: bold;
}

.login-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.login-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 5px;
}

/* Form styles */
.login-form {
  padding: 30px;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 16px;
}

.form-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  font-size: 13px;
  color: #3182ce;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  color: #e53e3e;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
}

.error-icon {
  margin-right: 10px;
  flex-shrink: 0;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-button:hover {
  background: linear-gradient(135deg, #2c5282 0%, #1e3a5f 100%);
  box-shadow: 0 4px 10px rgba(44, 82, 130, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer styles */
.login-footer {
  padding: 15px;
  text-align: center;
  background-color: #f8fafc;
  border-top: 1px solid #edf2f7;
  color: #718096;
  font-size: 13px;
}

.support-text {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #718096;
}

.support-link {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
}

.support-link:hover {
  text-decoration: underline;
}
      `}</style>
    </div>
  );
};

export default AdminLogin;