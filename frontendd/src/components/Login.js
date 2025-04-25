

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StaffLogin = () => {
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
      if (response.data.message === 'Login successful') {
        // Store user info in localStorage
        localStorage.setItem('loggedInUser', JSON.stringify(response.data.user));
        
        // Redirect based on user role
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/staff');
        }
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <div className="logo-circle"></div>
            <div className="logo-text">Staff Portal</div>
          </div>
          <h1>Welcome Back</h1>
          <p>Please enter your credentials to access the staff dashboard</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username" className="label_name">Username: &nbsp;&nbsp;&nbsp;</label>
            <div className="input-wrapper">
              <i className="input-icon user-icon"></i>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <div className="label-row">
              <label htmlFor="password" className="label_name">Password: &nbsp;&nbsp;&nbsp;</label>
            </div>
            <div className="input-wrapper">
              <i className="input-icon lock-icon"></i>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              'Log In'
            )}
          </button>
        </form>
        <style jsx="true">{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .login-card {
          width: 100%;
          max-width: 450px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          position: relative;
        }
        
        .login-header {
          padding: 30px 35px 15px;
          text-align: center;
          position: relative;
        }
        
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        
        .logo-circle {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          border-radius: 50%;
          margin-right: 10px;
          position: relative;
        }
        
        .logo-circle:after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border: 3px solid white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .logo-text {
          font-size: 22px;
          font-weight: 600;
          color: #333;
        }
        
        .login-header h1 {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          color: #333;
        }
        
        .login-header p {
          color: #666;
          margin: 0;
          font-size: 15px;
        }
        
        .login-form {
          padding: 20px 35px;
        }
        
        .input-group {
          margin-bottom: 22px;
        }
        
        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        label {
          font-size: 14px;
          font-weight: 500;
          color: #444;
          margin-bottom: 8px;
          display: block;
        }
        
        .forgot-link {
          color: #4CAF50;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
        }
        
        .forgot-link:hover {
          text-decoration: underline;
        }
        
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-icon {
          position: absolute;
          left: 16px;
          width: 20px;
          height: 20px;
          z-index: 1;
          opacity: 0.5;
        }
        
        .user-icon:before {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          border: 2px solid #555;
          border-radius: 50%;
          top: 0;
          left: 3px;
        }
        
        .user-icon:after {
          content: '';
          position: absolute;
          width: 14px;
          height: 7px;
          border: 2px solid #555;
          border-top: none;
          border-radius: 0 0 8px 8px;
          top: 12px;
          left: 1px;
        }
        
        .lock-icon:before {
          content: '';
          position: absolute;
          width: 14px;
          height: 10px;
          border: 2px solid #555;
          border-radius: 3px;
          top: 8px;
          left: 1px;
        }
        
        .lock-icon:after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          border: 2px solid #555;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          top: 0;
          left: 4px;
        }
        
        input[type="text"],
        input[type="password"] {
          width: 100%;
          padding: 15px 15px 15px 46px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          color: #333;
          background-color: #f9f9f9;
          transition: all 0.3s;
        }
        
        input[type="text"]:focus,
        input[type="password"]:focus {
          border-color: #4CAF50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
          background-color: #fff;
          outline: none;
        }
        
        input::placeholder {
          color: #aaa;
        }
        
        .error-message {
          color: #e53935;
          font-size: 14px;
          margin-bottom: 15px;
          background-color: rgba(229, 57, 53, 0.1);
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #e53935;
        }
        
        .remember-row {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 30px;
          cursor: pointer;
          font-size: 14px;
          color: #555;
          user-select: none;
        }
        
        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 20px;
          width: 20px;
          background-color: #f1f1f1;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .checkbox-container:hover input ~ .checkmark {
          background-color: #e8e8e8;
        }
        
        .checkbox-container input:checked ~ .checkmark {
          background-color: #4CAF50;
          border-color: #4CAF50;
        }
        
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        
        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }
        
        .checkbox-container .checkmark:after {
          left: 7px;
          top: 3px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .login-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }
        
        .login-button:hover {
          background: linear-gradient(135deg, #43a047, #2E7D32);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          transform: translateY(-2px);
        }
        
        .login-button:active {
          transform: translateY(0);
        }
        
        .login-button.loading {
          background: #3b8a3e;
          cursor: not-allowed;
        }
        
        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .login-footer {
          padding: 10px 35px 30px;
        }
        
        .separator {
          position: relative;
          text-align: center;
          margin: 20px 0;
        }
        
        .separator::before,
        .separator::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 42%;
          height: 1px;
          background-color: #ddd;
        }
        
        .separator::before {
          left: 0;
        }
        
        .separator::after {
          right: 0;
        }
        
        .separator span {
          display: inline-block;
          padding: 0 10px;
          background-color: white;
          position: relative;
          font-size: 14px;
          color: #999;
        }
        
        .social-login {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .social-button {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          border: 1px solid #eee;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .social-button:hover {
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        
        .social-icon {
          width: 24px;
          height: 24px;
          position: relative;
        }
        
        .google-icon:before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #4285F4;
          top: 0;
          left: 0;
        }
        
        .google-icon:after {
          content: 'G';
          position: absolute;
          font-size: 16px;
          font-weight: bold;
          color: #4285F4;
          top: 1px;
          left: 7px;
        }
        
        .microsoft-icon:before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: conic-gradient(from 90deg, #f44336 90deg, #4CAF50 90deg 180deg, #2196F3 180deg 270deg, #FFC107 270deg);
          top: 0;
          left: 0;
        }
        
        .apple-icon:before {
          content: '';
          position: absolute;
          width: 14px;
          height: 18px;
          border-radius: 6px 6px 0 0;
          background: #000;
          top: 3px;
          left: 5px;
        }
        
        .apple-icon:after {
          content: '';
          position: absolute;
          width: 6px;
          height: 4px;
          background: #000;
          border-radius: 0 0 10px 10px;
          top: 21px;
          left: 9px;
        }
        
        .help-text {
          text-align: center;
          font-size: 13px;
          color: #777;
          margin: 5px 0 0;
        }
        
        .help-text a {
          color: #4CAF50;
          text-decoration: none;
          font-weight: 500;
        }
        
        .help-text a:hover {
          text-decoration: underline;
        }
        .label_name {
            padding: 13px 10px 0 0;
        }
        @media (max-width: 480px) {
          .login-header, .login-form, .login-footer {
            padding-left: 25px;
            padding-right: 25px;
          }
          
          .login-header h1 {
            font-size: 24px;
          }
          
          .social-button {
            width: 45px;
            height: 45px;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default StaffLogin;
