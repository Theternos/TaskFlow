import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Task Completion Rate Chart Component 
const TaskCompletionRateChart = ({ analyticsData }) => {
  // Calculate completion rate data
  const completionRateData = analyticsData.map(item => {
    const total = item.created > 0 ? item.created : 1; // Avoid division by zero
    const completionRate = (item.completed / total) * 100;
    
    return {
      date: item.date,
      completionRate: parseFloat(completionRate.toFixed(1)),
      target: 80 // Example target completion rate
    };
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <i className="fas fa-chart-bar"></i>
          <span>Task Completion Rate</span>
        </h2>
        <div className="card-actions">
          <div className="refresh-timer">
            Auto-refresh: 30s
          </div>
          <button className="card-action-btn">
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                label={{ value: 'Completion Rate (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
              <Legend />
              <Bar 
                dataKey="completionRate" 
                name="Completion Rate" 
                fill="#8884d8" 
                radius={[5, 5, 0, 0]}
              />
              <Bar 
                dataKey="target" 
                name="Target Rate" 
                fill="#82ca9d" 
                radius={[5, 5, 0, 0]}
                fillOpacity={0.3}
                strokeDasharray="5 5"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Task Assignment Distribution Chart Component
const TaskAssignmentChart = ({ tasks, usersMap }) => {
  // Process data to count tasks per user
  const prepareAssignmentData = () => {
    const userTaskCount = {};
    
    // Count tasks assigned to each user
    tasks.forEach(task => {
      if (task.assignedTo) {
        const userId = task.assignedTo;
        const userName = usersMap[userId]?.username || 'Unknown';
        
        if (!userTaskCount[userName]) {
          userTaskCount[userName] = {
            name: userName,
            assigned: 0,
            completed: 0
          };
        }
        
        userTaskCount[userName].assigned += 1;
        
        if (task.status === 'Completed') {
          userTaskCount[userName].completed += 1;
        }
      }
    });
    
    // Convert to array and sort by assigned tasks
    return Object.values(userTaskCount)
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 5); // Top 5 users
  };

  const assignmentData = prepareAssignmentData();

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <i className="fas fa-user-check"></i>
          <span>Team Workload Distribution</span>
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
            <BarChart
              layout="vertical"
              data={assignmentData}
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" name="Assigned Tasks" fill="#8884d8" radius={[0, 5, 5, 0]} />
              <Bar dataKey="completed" name="Completed Tasks" fill="#82ca9d" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Export both components for use in the dashboard
export { TaskCompletionRateChart, TaskAssignmentChart };