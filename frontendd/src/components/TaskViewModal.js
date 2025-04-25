import React, { useState } from 'react';
import { X, FileText, Link2, Clock, Tag, CheckCircle, AlertTriangle, Minimize2, Calendar, User, FileCheck, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#48bb78'; // Green
    case 'In Progress':
      return '#4299e1'; // Blue
    case 'Pending':
      return '#ecc94b'; // Yellow
    case 'On Hold':
      return '#ed8936'; // Orange
    case 'Cancelled':
      return '#f56565'; // Red
    default:
      return '#718096'; // Gray
  }
};

const TaskViewModal = ({ task, isOpen, onClose, usersMap }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(0); // Default to expand the first (most recent) submission

  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "No date available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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

  const handleOpenLink = (link) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High':
        return <AlertTriangle size={20} className="priority-icon high" />;
      case 'Medium':
        return <Minimize2 size={20} className="priority-icon medium" />;
      case 'Low':
        return <CheckCircle size={20} className="priority-icon low" />;
      default:
        return null;
    }
  };

  // Consolidate all submissions into a single chronological array
  const getAllSubmissions = () => {
    const submissions = [];
    
    // Add original submission if it exists
    if (task.completionDetails) {
      const date = new Date(task.completionDetails.completedDate);

      const options = {
        timeZone: "UTC",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };

      const formatted = date.toLocaleString("en-US", options);

      submissions.push({
        type: 'original',
        feedback: task.completionDetails.feedback,
        date: formatted,
        completedBy: task.completionDetails.completedBy,
        link: task.completionDetails.link,
        file: task.attachmentFile
      });
    }
    
    // Add rework submissions if they exist
    if (task.reworkDetails && Array.isArray(task.reworkDetails)) {
      task.reworkDetails.forEach((rework, index) => {
        // Check if rework.completionDetails exists before trying to access it
        if (rework && rework.completionDetails) {
          const date = new Date(rework.completionDetails.completedDate);

          const options = {
            timeZone: "UTC",
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          };

          const formatted = date.toLocaleString("en-US", options);
        
          submissions.push({
            type: 'rework',
            index: index + 1,
            feedback: rework.completionDetails.feedback,
            date: formatted,
            completedBy: rework.completionDetails.completedBy,
            link: rework.completionDetails.link,
            file: rework.attachmentFile,
            reworkComment: rework.comment,
            reworkDate: rework.deadline
          });
        }
      });
    }
    submissions.reverse();

    // Sort by date (newest first - most recent rework at top, original at bottom)
    return submissions;
  };

  const submissions = getAllSubmissions();

  const toggleSubmissionExpansion = (index) => {
    if (expandedSubmission === index) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(index);
    }
  };

  // Format username from the usersMap
  const formatUsername = (userId) => {
    if (!userId) return "Unknown User";
    if (!usersMap) return `User ${userId}`;
    
    // Check if usersMap[userId] is an object with username property
    if (usersMap[userId] && typeof usersMap[userId] === 'object' && usersMap[userId].username) {
      return usersMap[userId].username;
    } 
    // Check if usersMap[userId] is a string
    else if (usersMap[userId] && typeof usersMap[userId] === 'string') {
      return usersMap[userId];
    }
    
    return `User ${userId}`;
  };

  return (
    <div className="task-modal-overlay">
      <div className="task-modal-container">
        <div className="task-modal-header">
          <div className="task-modal-header-content">
            <div className="task-modal-title-section">
              <h2 className="task-modal-title">Task Details</h2>
              <span 
                className="task-modal-status-badge"
                style={{ 
                  backgroundColor: `${getStatusColor(task.status)}20`, 
                  color: getStatusColor(task.status) 
                }}
              >
                {task.status}
              </span>
            </div>
            <button 
              className="task-modal-close-btn" 
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="task-modal-content">
          <div className="task-modal-main-section">
            <div className="task-modal-details">
              <div className="task-modal-title-container">
                <h1 className="task-modal-main-title">{task.title}</h1>
                <div className="task-modal-priority">
                  {getPriorityIcon(task.priority)}
                  <span className="task-modal-priority-text">{task.priority} Priority</span>
                </div>
              </div>
              
              <p className="task-modal-description">{task.description}</p>

              <div className="task-modal-metadata-grid">
                <div className="task-modal-metadata-card">
                  <Clock size={20} className="task-modal-icon" />
                  <div>
                    <span className="task-modal-metadata-label">Original Deadline: </span> &nbsp;
                    <span className="task-modal-metadata-value">{formatDate(task.dueDate)}</span>
                  </div>
                </div>

                {(task.reworkDetails && Array.isArray(task.reworkDetails) && task.reworkDetails.length > 0) ? (
                <div className="task-modal-metadata-card">
                  <Clock size={20} className="task-modal-icon" />
                  <div>
                    <span className="task-modal-metadata-label">Current Deadline: </span>&nbsp;
                    <span className="task-modal-metadata-value">{
                      formatDate(task.reworkDetails?.length > 0
                        ? task.reworkDetails[
                            task.reworkDetails.length - 1
                          ].deadline
                        : task.dueDate)
                        }
                    </span>
                  </div>
                </div>) : null }
                

                {task.tags && task.tags.length > 0 && (
                  <div className="task-modal-metadata-card">
                    <Tag size={20} className="task-modal-icon" />
                    <div>
                      <span className="task-modal-metadata-label">Tags</span>
                      <div className="task-modal-tag-container">
                        {task.tags.map((tag, index) => (
                          <span key={index} className="task-modal-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="task-modal-sidebar">
              {task.referenceLink && (
                <div className="task-modal-sidebar-section reference-link">
                  <div className="section-header">
                    <h3 className="task-modal-section-title">
                      <Link2 size={20} className="section-icon" />
                      Reference Link
                    </h3>
                  </div>
                  <div className="section-content">
                    <button 
                      className="task-modal-resource-btn reference-link-btn" 
                      onClick={() => handleOpenLink(task.referenceLink)}
                    >
                      Open Link
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="external-link-icon">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* File Handling Section */}
              {task.file && (
                <div className="task-modal-sidebar-section file-attachment">
                  <div className="section-header">
                    <h3 className="task-modal-section-title">
                      <FileText size={20} className="section-icon" />
                      Attached File
                    </h3>
                  </div>
                  <div className="section-content file-actions">
                    <button 
                      className="task-modal-resource-btn download-btn" 
                      onClick={() => handleDownload(task.file.filename)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Download'}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="download-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    <button 
                      className="task-modal-resource-btn view-btn" 
                      onClick={() => window.open(`http://localhost:5000/api/tasks/view/${task.file.filename}`, '_blank')}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'View'}
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="view-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submission History Section */}
          {submissions.length > 0 && (
            <div className="task-modal-submissions-section">
              <h3 className="task-modal-section-title">
                <FileCheck size={20} className="section-icon" />
                Submission History
              </h3>
              <div className="task-modal-submissions-timeline">
                {submissions.map((submission, index) => (
                  <div 
                    key={index} 
                    className={`task-modal-submission-card ${index === 0 ? 'latest-submission' : ''}`}
                  >
                    <div 
                      className="task-modal-submission-header"
                      onClick={() => toggleSubmissionExpansion(index)}
                    >
                      <div className="submission-header-left">
                        <div className="submission-badge-container">
                          <span className={`submission-type-badge ${submission.type}`}>
                            {submission.type === 'original' ? 'Original Submission' : `Rework #${submission.index}`}
                          </span>
                          {index === 0 && (
                            <span className="latest-badge">Latest</span>
                          )}
                        </div>
                        <div className="submission-date">
                          {(submission.date)}
                        </div>
                      </div>
                      <button className="expand-collapse-btn">
                        {expandedSubmission === index ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>

                    {expandedSubmission === index && (
                      <div className="task-modal-submission-details">
                        {submission.type === 'rework' && (
                          <div className="rework-request-details">
                            <h4 className="submission-detail-subtitle">Rework Request</h4>
                            <div className="submission-detail-item">
                              <label>Deadline Given:</label>
                              <span>{formatDate(submission.reworkDate)}</span>
                            </div>
                            <div className="submission-detail-item">
                              <label>Request Comment:</label>
                              <span>{submission.reworkComment}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="submission-content">
                          <h4 className="submission-detail-subtitle">Submission Details</h4>
                          <div className="submission-detail-item">
                            <label>Feedback:</label>
                            <span>{submission.feedback}</span>
                          </div>
                                                    
                          {submission.link && (
                            <div className="submission-detail-item">
                              <label>Reference Link:</label>
                              <button 
                                className="submission-link-btn"
                                onClick={() => handleOpenLink(submission.link)}
                              >
                                Open Link
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          )}
                          
                          {submission.file && (
                            <div className="submission-detail-item">
                              <label>Attached File:</label>
                              <div className="submission-file-actions">
                                <button 
                                  className="submission-file-btn download"
                                  onClick={() => handleDownload(submission.file.filename)}
                                >
                                  Download &nbsp;
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                </button>
                                <button 
                                  className="submission-file-btn view"
                                  onClick={() => window.open(`http://localhost:5000/api/tasks/view/${submission.file.filename}`, '_blank')}
                                >
                                  View &nbsp;
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Only show this section if there are rework details without completionDetails */}
          {task.reworkDetails && task.reworkDetails.filter(rework => !rework.completionDetails).length > 0 && (
            <div className="task-modal-rework-section">
              <h3 className="task-modal-section-title">Rework History</h3>
              <div className="task-modal-rework-timeline">
                {task.reworkDetails
                  .filter(rework => !rework.completionDetails)
                  .map((rework, index) => (
                    <div key={index} className="task-modal-rework-item">
                      <div className="rework-timeline-marker"></div>
                      <div className="task-modal-rework-content">
                        <div className="task-modal-rework-header">
                          <span className="task-modal-rework-date">{formatDate(rework.date)}</span>
                          {rework.deadline && (
                            <span className="task-modal-rework-deadline"> &nbsp; &nbsp; &nbsp; &nbsp;
                              <strong>New Deadline:</strong> {formatDate(rework.deadline)}
                            </span>
                          )}
                        </div>
                        <p className="task-modal-rework-comment">{rework.comment}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      <style jsx>{`
        :root {
          --modal-bg-light: #f8fafc;
          --modal-border-color: #e2e8f0;
          --text-primary: #1a202c;
          --text-secondary: #4a5568;
          --accent-color: #4361ee;
          --accent-light: #e6f2ff;
          --success-color: #48bb78;
          --warning-color:rgb(170, 136, 16);
          --danger-color: #f56565;
          --info-color: #4361ee;
          --success-light: #c6f6d5;
          --warning-light: #fefcbf;
          --danger-light: #fed7d7;
          --info-light: #e6f2ff;
        }
        
        .task-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(26, 32, 44, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(8px);
          animation: overlay-fade 0.3s ease-out;
        }

        @keyframes overlay-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .task-modal-container {
          background-color: var(--modal-bg-light);
          border-radius: 12px;
          width: 100%;
          max-width: 1100px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: modal-appear 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }

        .task-modal-header {
          background-color: white;
          border-bottom: 1px solid var(--modal-border-color);
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .task-modal-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-modal-title-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .task-modal-title {
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .task-modal-status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .task-modal-close-btn {
          background-color: var(--accent-light);
          color: var(--accent-color);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .task-modal-close-btn:hover {
          background-color: var(--accent-color);
          color: white;
        }

        .task-modal-content {
          display: flex;
          flex-direction: column;
          gap: 25px;
          padding: 25px;
          overflow-y: auto;
        }

        .task-modal-main-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 35px;
        }

        .task-modal-title-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .task-modal-priority {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .priority-icon {
          stroke-width: 2.5;
        }

        .priority-icon.high {
          color: var(--danger-color);
        }

        .priority-icon.medium {
          color: var(--warning-color);
        }

        .priority-icon.low {
          color: var(--success-color);
        }

        .task-modal-main-title {
          color: var(--text-primary);
          font-size: 2rem;
          font-weight: 800;
        }

        .task-modal-description {
          color: var(--text-secondary);
          line-height: 1.7;
          border-left: 4px solid var(--accent-color);
          padding-left: 15px;
          margin-bottom: 20px;
        }

        .task-modal-metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .task-modal-metadata-card {
          display: flex;
          align-items: center;
          gap: 15px;
          background-color: var(--accent-light);
          border-radius: 8px;
          padding: 15px;
          transition: transform 0.3s ease;
        }

        .task-modal-icon {
          color: var(--accent-color);
        }

        .task-modal-rework-timeline {
          position: relative;
          padding-left: 20px;
        }

        .task-modal-rework-item {
          position: relative;
          margin-bottom: 20px;
          padding-left: 30px;
        }

        .rework-timeline-marker {
          position: absolute;
          left: -10px;
          top: 10px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: var(--accent-color);
          border: 3px solid var(--accent-light);
        }

        .task-modal-rework-section {
          background-color: white;
          border: 1px solid var(--modal-border-color);
          border-radius: 8px;
          padding: 20px;
        }

        /* Submission History Styles */
        .task-modal-submissions-section {
          background-color: white;
          border: 1px solid var(--modal-border-color);
          border-radius: 8px;
          padding: 20px;
          margin-top: 10px;
        }

        .section-icon {
          margin-right: 10px;
          color: var(--accent-color);
        }

        .task-modal-section-title {
          display: flex;
          align-items: center;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        .task-modal-submissions-timeline {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .task-modal-submission-card {
          background-color: #f9fafb;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .task-modal-submission-card.latest-submission {
          border-left: 5px solid var(--accent-color);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .task-modal-submission-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #fff;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .task-modal-submission-header:hover {
          background-color: #f1f5f9;
        }

        .submission-header-left {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .submission-badge-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .submission-type-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .submission-type-badge.original {
          background-color: var(--info-light);
          color: var(--info-color);
        }

        .submission-type-badge.rework {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }

        .latest-badge {
          background-color: var(--success-light);
          color: var(--success-color);
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .submission-date {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .expand-collapse-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .expand-collapse-btn:hover {
          background-color: var(--accent-light);
          color: var(--accent-color);
        }

        .task-modal-submission-details {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #fff;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .rework-request-details {
          background-color: #fef9c3;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          border-left: 4px solid var(--warning-color);
        }

        .submission-detail-subtitle {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: var(--text-primary);
        }

        .submission-content {
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid var(--accent-color);
        }

        .submission-detail-item {
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .submission-detail-item:last-child {
          margin-bottom: 0;
        }

        .submission-detail-item label {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .submission-detail-item span {
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .submission-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: var(--info-light);
          color: var(--info-color);
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submission-link-btn:hover {
          background-color: var(--info-color);
          color: white;
        }

        .submission-file-actions {
          display: flex;
          gap: 10px;
          margin-top: 5px;
        }

        .submission-file-btn {
          width: 100%;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .submission-file-btn.download {
          background-color: var(--info-light);
          color: var(--info-color);
        }

        .submission-file-btn.download:hover {
          background-color: var(--info-color);
          color: white;
        }

        .submission-file-btn.view {
          background-color: var(--accent-light);
          color: var(--accent-color);
        }

        .submission-file-btn.view:hover {
          background-color: var(--accent-color);
          color: white;
        }

        /* Sidebar Styles */
        .task-modal-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .task-modal-sidebar-section {
          background-color: white;
          border: 1px solid var(--modal-border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .section-header {
          padding: 15px;
          border-bottom: 1px solid var(--modal-border-color);
        }

        .section-content {
          padding: 15px;
        }

        .task-modal-resource-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .reference-link-btn {
          background-color: var(--info-light);
          color: var(--info-color);
        }

        .reference-link-btn:hover {
          background-color: var(--info-color);
          color: white;
        }

        .download-btn {
          background-color: var(--accent-light);
          color: var(--accent-color);
          margin-bottom: 8px;
        }

        .download-btn:hover {
          background-color: var(--accent-color);
          color: white;
        }

        .view-btn {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }

        .view-btn:hover {
          background-color: var(--warning-color);
          color: white;
        }

        .file-actions {
          display: flex;
          flex-direction: column;
        }

        .error-message {
          color: var(--danger-color);
          margin-top: 10px;
          font-size: 0.9rem;
          padding: 10px;
          border-radius: 4px;
          background-color: var(--danger-light);
          text-align: center;
        }

        /* Tag styling */
        .task-modal-tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 5px;
        }

        .task-modal-tag {
          background-color: var(--accent-light);
          color: var(--accent-color);
          padding: 4px 10px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .task-modal-main-section {
            grid-template-columns: 1fr;
          }

          .task-modal-title-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .task-modal-metadata-grid {
            grid-template-columns: 1fr;
          }

          .task-modal-container {
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }

          .task-modal-overlay {
            padding: 0;
          }
        }

        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default TaskViewModal;

   