// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';  // Import Home component
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminTasks from './components/Admintasks';
import FlexDue from './components/Flexdue';
import AdminSettings from './components/AdminSettings';
import StaffDashboard from './components/StaffDashboard';
import StaffAnalytics from './components/StaffAnalytics';
import StaffSettings from './components/StaffSettings';
import StaffRequests from './components/StaffRequests';
import StaffIntegration from './components/StaffIntegration';
import AdminLogin from './components/AdminLogin';
import GoogleCallback from './components/GoogleCallback'; // Adjust the path if it's different
import StaffRequestss from './components/test';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Home page */}
        <Route path="/stafflogin" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/admintasks" element={<AdminTasks />} />
        <Route path="/flexdue" element={<FlexDue />} />
        <Route path="/adminsettings" element={<AdminSettings />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staffanalytics" element={<StaffAnalytics />} />
        <Route path="/staffsettings" element={<StaffSettings />} />
        <Route path="/staffintegrations" element={<StaffIntegration />} />
        <Route path="/staffrequests" element={<StaffRequests />} />
        <Route path='/adminlogin' element={<AdminLogin />} />
        <Route path='/test' element={<StaffRequestss />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
