import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, AlertTriangle, ArrowDown, ArrowUp, FileText, Link2, ExternalLink, Download, Eye, RefreshCw, MessageSquare } from 'lucide-react';

export default function TaskSubmissionsDashboard() {
  const [tasks, setTasks] = useState([]);
  const [viewReportTask, setViewReportTask] = useState(null);
  const [showReworkComment, setShowReworkComment] = useState(false);
  const [reworkComment, setReworkComment] = useState('');
  const [reworkDeadline, setReworkDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  
  // Mock data for demonstration purposes
  useEffect(() => {
    // This would be your API call in a real application
    const mockData = [
      {
        "id": 9,
        "title": "Dummy",
        "description": "Dummy",
        "tags": ["S8 Project"],
        "assignedTo": "5",
        "dueDate": "2025-03-22",
        "priority": "High",
        "status": "Progress",
        "completionDetails": {
          "feedback": "Completed that issue",
          "link": "",
          "completedBy": 5,
          "completedDate": "2025-03-23T09:33:04.064Z"
        },
        "attachmentFile": {
          "filename": "1742721038953-dyxllqw8ypp.pdf",
          "originalName": "NQT&Campus.pdf"
        },
        "reworkDetails": [
          {
            "comment": "It is not proper",
            "deadline": "2025-03-24",
            "date": "2025-03-23T08:44:09.469Z"
          },
          {
            "comment": "Alignment Issues",
            "deadline": "2025-03-30",
            "date": "2025-03-23T10:01:27.314Z",
            "reminderSent": true,
            "completionDetails": {
              "feedback": "Rework Test - 1",
              "link": "https://docs.google.com/spreadsheets/d/1zWTfIowR6MMguwtIHVbmflGZbyHt0hjf/edit?gid=604677396#gid=604677396",
              "completedBy": 5,
              "completedDate": "2025-04-01T17:49:23.314Z",
              "currentStatus": "Rework"
            },
            "attachmentFile": {
              "filename": "1743529763347-m8tex4xwoda.pdf",
              "originalName": "Bannari Amman Institute of Technology Mail - Acceptance of Paper ID 789 for ICONIC 2K25 Presentation.pdf"
            }
          }
        ]
      },
      {
        "id": 8,
        "title": "Implement Authentication",
        "description": "Add JWT authentication to API endpoints",
        "tags": ["Security", "S8 Project"],
        "assignedTo": "5",
        "dueDate": "2025-03-27",
        "priority": "Medium",
        "status": "Rework",
        "completionDetails": {
          "feedback": "Completed",
          "link": "https://meet.google.com/yxf-zamh-inq",
          "completedBy": 5,
          "completedDate": "2025-03-24T05:33:51.771Z"
        },
        "attachmentFile": {
          "filename": "1742794431953-o9s6marl3gh.pdf",
          "originalName": "Fast2SMS Invoice - 150036.pdf"
        },
        "reworkDetails": [
          {
            "comment": "Not Proper",
            "deadline": "2025-03-27",
            "date": "2025-03-24T05:34:31.603Z",
            "requestedBy": null,
            "reminderSent": true
          }
        ]
      },
      {
        "id": 7,
        "title": "Submit Report",
        "description": "Align the report and submit it ASAP.",
        "tags": ["S8 Project"],
        "assignedTo": "5",
        "dueDate": "2025-03-22",
        "priority": "High",
        "status": "Completed",
        "completionDetails": {
          "feedback": "Aligned the report and added the images.",
          "link": "https://docs.google.com/document/d/1X8fn-4rmrEbpviSVpxXQ3zSlR8Nsfkij/edit",
          "completedBy": 5,
          "completedDate": "2025-03-21T12:37:40.248Z"
        },
        "attachmentFile": {
          "filename": "1742560660281-gzu402su5su.pdf",
          "originalName": "Task Management Module.pdf"
        }
      }
    ];
    
    // Sort tasks by completion date in descending order (most recent first)
    const sortedTasks = mockData.sort((a, b) => {
      const dateA = a.completionDetails?.completedDate || '';
      const dateB = b.completionDetails?.completedDate || '';
      return new Date(dateB) - new Date(dateA);
    });
    
    setTasks(sortedTasks);
  }, []);
  
  // Handler functions (retaining existing logic)
  const closeModals = () => {
    setViewReportTask(null);
    setShowReworkComment(false);
    setReworkComment('');
    setReworkDeadline('');
    setSummary('');
  };
  
  const handleViewReport = (task) => {
    setViewReportTask(task);
    setShowReworkComment(false);
  };
  
  const handleSummarize = (feedback) => {
    setIsLoading(true);
    // Mock AI summarization - in a real app, this would be an API call
    setTimeout(() => {
      setSummary(`Summarized: ${feedback.substring(0, 50)}...`);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleDownload = (filename) => {
    // In a real app, this would trigger a file download
    console.log(`Downloading ${filename}`);
  };
  
  const handleMarkComplete = (taskId) => {
    console.log(`Marking task ${taskId} as complete`);
    closeModals();
  };
  
  const handleSubmitRework = (taskId, comment, deadline) => {
    console.log(`Submitting rework for task ${taskId}: ${comment}, deadline: ${deadline}`);
    closeModals();
  };
  
  // Get status color based on task status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'tsd-status-completed';
      case 'Rework': return 'tsd-status-rework';
      case 'Progress': return 'tsd-status-progress';
      case 'Pending': return 'tsd-status-pending';
      default: return 'tsd-status-default';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'tsd-priority-high';
      case 'Medium': return 'tsd-priority-medium';
      case 'Low': return 'tsd-priority-low';
      default: return 'tsd-priority-default';
    }
  };

  return (
    <div className="tsd-container">
      <h1 className="tsd-main-heading">Task Submissions</h1>
      
      {/* Task submission cards */}
      <div className="tsd-card-grid">
        {tasks.map(task => (
          <div key={task.id} className="tsd-card">
            <div className="tsd-card-content">
              <div className="tsd-card-header">
                <div>
                  <h2 className="tsd-card-title">{task.title}</h2>
                  <p className="tsd-card-description">{task.description}</p>
                </div>
                <div className="tsd-badge-container">
                  <span className={`tsd-badge ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`tsd-badge ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              
              <div className="tsd-tag-container">
                {task.tags.map((tag, idx) => (
                  <span key={idx} className="tsd-tag">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="tsd-meta-grid">
                <div className="tsd-meta-item">
                  <Calendar className="tsd-icon" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                {task.completionDetails?.completedDate && (
                  <div className="tsd-meta-item">
                    <Clock className="tsd-icon" />
                    <span>Submitted: {new Date(task.completionDetails.completedDate).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              {task.completionDetails && (
                <div className="tsd-submission-box">
                  <h3 className="tsd-section-title">Submission Details</h3>
                  <p className="tsd-feedback-text">{task.completionDetails.feedback}</p>
                  
                  {task.completionDetails.link && (
                    <a 
                      href={task.completionDetails.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tsd-link"
                    >
                      <ExternalLink className="tsd-icon" />
                      Reference Link
                    </a>
                  )}
                  
                  {task.attachmentFile && (
                    <div className="tsd-file-item">
                      <FileText className="tsd-icon" />
                      <span className="tsd-filename">{task.attachmentFile.originalName}</span>
                    </div>
                  )}
                </div>
              )}
              
              {task.reworkDetails && task.reworkDetails.length > 0 && (
                <div className="tsd-rework-history">
                  <h3 className="tsd-section-title">Rework History</h3>
                  <ul className="tsd-rework-list">
                    {task.reworkDetails.map((rework, idx) => (
                      <li key={idx} className="tsd-rework-item">
                        <div className="tsd-rework-header">
                          <span className="tsd-rework-date">{new Date(rework.date).toLocaleDateString()}</span>
                          <span className="tsd-rework-deadline">Deadline: {new Date(rework.deadline).toLocaleDateString()}</span>
                        </div>
                        <p className="tsd-rework-comment">{rework.comment}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="tsd-actions">
                <button 
                  onClick={() => handleViewReport(task)}
                  className="tsd-view-button"
                >
                  <Eye className="tsd-icon" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal for task report */}
      {viewReportTask && (
        <div className="tsd-modal-overlay">
          <div className="tsd-modal">
            {/* Modal header */}
            <div className="tsd-modal-header">
              <h2 className="tsd-modal-title">Task Report</h2>
              <button 
                className="tsd-modal-close" 
                onClick={closeModals}
              >
                ×
              </button>
            </div>
            
            {/* Modal body */}
            <div className="tsd-modal-body">
              <h3 className="tsd-report-title">{viewReportTask.title}</h3>
              
              {viewReportTask.completionDetails && (
                <>
                  {/* Rework details section */}
                  {viewReportTask.reworkDetails && viewReportTask.reworkDetails.length > 0 && (
                    <div className="tsd-report-section tsd-report-rework">
                      <h4 className="tsd-report-section-title">Rework Comments:</h4>
                      <ul className="tsd-report-rework-list">
                        {viewReportTask.reworkDetails.map((rework, index) => (
                          <li key={index} className="tsd-report-rework-item">
                            <strong className="tsd-report-rework-date">
                              {new Date(rework.date).toLocaleDateString()}:
                            </strong>{" "}
                            {rework.comment}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Feedback section */}
                  {viewReportTask.completionDetails && (
                    <div className="tsd-report-section tsd-report-feedback">
                      <div className="tsd-report-section-header">
                        <h4 className="tsd-report-section-title">Feedback</h4>
                        <button
                          className="tsd-ai-button"
                          onClick={() => handleSummarize(viewReportTask.completionDetails.feedback)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="tsd-icon tsd-icon-spin" />
                              Summarizing...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="tsd-icon" />
                              AI Summarize
                            </>
                          )}
                        </button>
                      </div>
                      <div className="tsd-report-feedback-content">
                        <p className="tsd-report-feedback-text">
                          {summary ? summary : viewReportTask.completionDetails.feedback || "No feedback provided."}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Reference link section */}
                  {viewReportTask.completionDetails.link && (
                    <div className="tsd-report-section tsd-report-link">
                      <h4 className="tsd-report-section-title">Reference Link</h4>
                      <a
                        href={viewReportTask.completionDetails.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tsd-report-link-anchor"
                      >
                        <ExternalLink className="tsd-icon" />
                        View Reference
                      </a>
                    </div>
                  )}
                  
                  {/* Submission date section */}
                  <div className="tsd-report-section tsd-report-date">
                    <h4 className="tsd-report-section-title">Submitted On</h4>
                    <p className="tsd-report-date-text">
                      {new Date(viewReportTask.completionDetails.completedDate).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
              
              {/* Attachment section */}
              {viewReportTask.attachmentFile && (
                <div className="tsd-report-section tsd-report-attachment">
                  <h4 className="tsd-report-section-title">Attachment</h4>
                  <div className="tsd-report-attachment-actions">
                    <button
                      className="tsd-report-download-button"
                      onClick={() => handleDownload(viewReportTask.attachmentFile.filename)}
                    >
                      <Download className="tsd-icon" />
                      Download {viewReportTask.attachmentFile.originalName}
                    </button>
                    <button
                      className="tsd-report-view-button"
                      onClick={() => window.open(
                        `http://localhost:5000/api/tasks/view/${viewReportTask.attachmentFile.filename}`,
                        "_blank"
                      )}
                    >
                      <Eye className="tsd-icon" />
                      View Document
                    </button>
                  </div>
                </div>
              )}
              
              {/* Rework comment section - initially hidden */}
              {showReworkComment && (
                <div className="tsd-report-section tsd-report-new-rework">
                  <h4 className="tsd-report-section-title">Rework Details</h4>
                  
                  {/* Rework Comment Input */}
                  <textarea
                    className="tsd-rework-textarea"
                    placeholder="Add your comments for rework..."
                    value={reworkComment}
                    onChange={(e) => setReworkComment(e.target.value)}
                    rows={4}
                  />
                  
                  {/* Rework Deadline Input */}
                  <div className="tsd-rework-date-field">
                    <label className="tsd-rework-date-label">Due Date</label>
                    <input
                      type="date"
                      className="tsd-rework-date-input"
                      value={reworkDeadline}
                      onChange={(e) => setReworkDeadline(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal footer */}
            <div className="tsd-modal-footer">
              {!showReworkComment ? (
                <>
                  <button
                    className="tsd-rework-button"
                    onClick={() => setShowReworkComment(true)}
                  >
                    <RefreshCw className="tsd-icon" />
                    Rework
                  </button>
                  <button
                    className="tsd-complete-button"
                    onClick={() => handleMarkComplete(viewReportTask.id)}
                  >
                    <Check className="tsd-icon" />
                    Mark as Complete
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="tsd-cancel-button"
                    onClick={() => setShowReworkComment(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="tsd-submit-button"
                    onClick={() => handleSubmitRework(
                      viewReportTask.id,
                      reworkComment,
                      reworkDeadline
                    )}
                    disabled={!reworkComment.trim() || !reworkDeadline}
                  >
                    Submit Rework
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Task Submissions Dashboard CSS */
        
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
        
        /* Main Container */
        .tsd-container {
          padding: 1.5rem;
          max-width: 1280px;
          margin: 0 auto;
          background-color: var(--gray-100);
          min-height: 100vh;
        }
        
        .tsd-main-heading {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--dark);
          border-bottom: 2px solid var(--primary);
          padding-bottom: 0.75rem;
        }
        
        /* Card Grid */
        .tsd-card-grid {
          display: grid;
          gap: 1.5rem;
        }
        
        .tsd-card {
          background-color: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
          border-left: 4px solid var(--primary);
          transition: var(--transition);
        }
        
        .tsd-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        
        .tsd-card-content {
          padding: 1.25rem;
        }
        
        /* Card Header */
        .tsd-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        
        .tsd-card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--dark);
          margin-bottom: 0.25rem;
        }
        
        .tsd-card-description {
          color: var(--gray-600);
          margin-top: 0.25rem;
          font-size: 0.875rem;
        }
        
        /* Status and Priority Badges */
        .tsd-badge-container {
          display: flex;
          gap: 0.5rem;
        }
        
        .tsd-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
        }
        
        /* Status Colors */
        .tsd-status-completed {
          background-color: rgba(76, 201, 240, 0.2);
          color: var(--success);
        }
        
        .tsd-status-rework {
          background-color: rgba(248, 150, 30, 0.2);
          color: var(--warning);
        }
        
        .tsd-status-progress {
          background-color: rgba(72, 149, 239, 0.2);
          color: var(--primary);
        }
        
        .tsd-status-pending {
          background-color: rgba(156, 163, 175, 0.2);
          color: var(--gray-500);
        }
        
        .tsd-status-default {
          background-color: rgba(156, 163, 175, 0.2);
          color: var(--gray-500);
        }
        
        /* Priority Colors */
        .tsd-priority-high {
          background-color: rgba(249, 65, 68, 0.2);
          color: var(--danger);
        }
        
        .tsd-priority-medium {
          background-color: rgba(248, 150, 30, 0.2);
          color: var(--warning);
        }
        
        .tsd-priority-low {
          background-color: rgba(76, 201, 240, 0.2);
          color: var(--success);
        }
        
        .tsd-priority-default {
          background-color: rgba(156, 163, 175, 0.2);
          color: var(--gray-500);
        }
        
        /* Tags */
        .tsd-tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .tsd-tag {
          background-color: var(--gray-200);
          color: var(--gray-600);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        /* Meta Information */
        .tsd-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .tsd-meta-item {
          display: flex;
          align-items: center;
          color: var(--gray-700);
          font-size: 0.875rem;
        }
        
        .tsd-icon {
          height: 1rem;
          width: 1rem;
          margin-right: 0.5rem;
        }
        
        .tsd-icon-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Submission Box */
        .tsd-submission-box {
          background-color: rgba(72, 149, 239, 0.1);
          padding: 0.75rem;
          border-radius: var(--radius);
          margin-bottom: 1rem;
          border-left: 3px solid var(--primary);
        }
        
        .tsd-section-title {
          font-weight: 500;
          color: var(--primary);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        
        .tsd-feedback-text {
          color: var(--gray-700);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        
        .tsd-link {
          display: flex;
          align-items: center;
          color: var(--primary);
          text-decoration: none;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          transition: var(--transition);
        }
        
        .tsd-link:hover {
          color: var(--secondary);
          text-decoration: underline;
        }
        
        .tsd-file-item {
          display: flex;
          align-items: center;
          color: var(--primary);
          font-size: 0.875rem;
        }
        
        .tsd-filename {
          margin-right: 0.5rem;
        }
        
        /* Rework History */
        .tsd-rework-history {
          background-color: rgba(248, 150, 30, 0.1);
          padding: 0.75rem;
          border-radius: var(--radius);
          margin-bottom: 1rem;
          border-left: 3px solid var(--warning);
        }
        
        .tsd-rework-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .tsd-rework-item {
          border-bottom: 1px solid rgba(248, 150, 30, 0.2);
          padding-bottom: 0.5rem;
        }
        
        .tsd-rework-item:last-child {
          border-bottom: none;
        }
        
        .tsd-rework-header {
          display: flex;
          justify-content: space-between;
        }
        
        .tsd-rework-date {
          font-weight: 500;
          font-size: 0.75rem;
        }
        
        .tsd-rework-deadline {
          font-size: 0.75rem;
          color: var(--gray-500);
        }
        
        .tsd-rework-comment {
          color: var(--gray-700);
          margin-top: 0.25rem;
          font-size: 0.875rem;
        }
        
        /* Action Buttons */
        .tsd-actions {
          margin-top: 1rem;
          display: flex;
          justify-content: flex-end;
        }
        
        .tsd-view-button {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--radius);
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }
        
        .tsd-view-button:hover {
          background-color: var(--secondary);
          box-shadow: var(--shadow);
        }
        
        /* Modal */
        .tsd-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          overflow-y: auto;
          padding: 1rem;
        }
        
        .tsd-modal {
          background-color: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 48rem;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .tsd-modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tsd-modal-title {
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--dark);
}

.tsd-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-500);
  height: 2rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.tsd-modal-close:hover {
  background-color: var(--gray-100);
  color: var(--dark);
}

.tsd-modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.tsd-report-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--dark);
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 0.5rem;
}

.tsd-report-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: var(--radius);
  background-color: var(--gray-100);
}

.tsd-report-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tsd-report-section-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--dark);
  margin-bottom: 0.5rem;
}

.tsd-report-rework-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tsd-report-rework-item {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.tsd-report-rework-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.tsd-report-rework-date {
  color: var(--gray-500);
}

.tsd-report-feedback-content {
  background-color: white;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
}

.tsd-report-feedback-text {
  margin: 0;
  color: var(--gray-700);
}

.tsd-report-link-anchor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  text-decoration: none;
  transition: var(--transition);
}

.tsd-report-link-anchor:hover {
  color: var(--secondary);
  text-decoration: underline;
}

.tsd-report-date-text {
  font-size: 0.875rem;
  color: var(--gray-700);
}

.tsd-report-attachment-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.tsd-report-download-button,
.tsd-report-view-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.tsd-report-download-button {
  background-color: var(--primary-light);
  color: white;
}

.tsd-report-download-button:hover {
  background-color: var(--primary);
}

.tsd-report-view-button {
  background-color: var(--gray-200);
  color: var(--gray-700);
}

.tsd-report-view-button:hover {
  background-color: var(--gray-300);
}

.tsd-ai-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary);
  background-color: white;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.tsd-ai-button:hover:not(:disabled) {
  background-color: var(--primary);
  color: white;
}

.tsd-ai-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tsd-rework-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  resize: vertical;
  margin-bottom: 1rem;
}

.tsd-rework-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

.tsd-rework-date-field {
  margin-bottom: 1rem;
}

.tsd-rework-date-label {
  display: block;
  font-size: 0.875rem;
  color: var(--gray-700);
  margin-bottom: 0.25rem;
}

.tsd-rework-date-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
}

.tsd-rework-date-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

.tsd-modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.tsd-complete-button,
.tsd-rework-button,
.tsd-cancel-button,
.tsd-submit-button {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--transition);
}

.tsd-complete-button {
  background-color: var(--success);
  color: white;
  border: none;
}

.tsd-complete-button:hover {
  filter: brightness(0.9);
}

.tsd-rework-button {
  background-color: white;
  color: var(--warning);
  border: 1px solid var(--warning);
}

.tsd-rework-button:hover {
  background-color: var(--warning);
  color: white;
}

.tsd-cancel-button {
  background-color: white;
  color: var(--gray-600);
  border: 1px solid var(--gray-300);
}

.tsd-cancel-button:hover {
  background-color: var(--gray-100);
}

.tsd-submit-button {
  background-color: var(--primary);
  color: white;
  border: none;
}

.tsd-submit-button:hover:not(:disabled) {
  background-color: var(--secondary);
}

.tsd-submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .tsd-card-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}

@media (min-width: 768px) {
  .tsd-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .tsd-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
  `}</style>
    </div>
  );
}