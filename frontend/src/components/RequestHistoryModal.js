import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const RequestHistoryModal = ({ onClose, task, user, requestTypeFilter }) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  // Function to fetch requests filtered by request type
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // In production, you would have an API endpoint for this
      // For now, we'll simulate the data based on the task
      const extensionRequests = task.extensionRequests || [];
      const cancellationRequests = task.cancellationRequests || [];

      // Combine and sort all requests by date (newest first)
      let allRequests = [...extensionRequests, ...cancellationRequests]
        .map((req) => ({
          ...req,
          requestType: extensionRequests.includes(req)
            ? "extension"
            : "cancellation",
          requestDate:
            req.requestDate || req.createdAt || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

      // If there are no actual requests, create a few samples for demonstration
      if (allRequests.length === 0) {
        const sampleRequests = [
          {
            id: "sample-ext-1",
            taskId: task.id,
            requestType: "extension",
            reason:
              "Need additional time due to unexpected complexity in requirements.",
            requestedBy: user.id,
            requestDate: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            newDeadline: new Date(
              new Date(task.dueDate).getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            status: "approved",
            reviewedBy: "admin-1",
            reviewDate: new Date(
              Date.now() - 12 * 24 * 60 * 60 * 1000
            ).toISOString(),
            reviewComment:
              "Deadline extended as requested. Please ensure completion by the new deadline.",
          },
          {
            id: "sample-ext-2",
            taskId: task.id,
            requestType: "extension",
            reason:
              "Need more time to integrate with the updated API endpoints that were released later than expected.",
            requestedBy: user.id,
            requestDate: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            newDeadline: new Date(
              new Date(task.dueDate).getTime() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            status: "pending",
          },
          {
            id: "sample-cancel-1",
            taskId: task.id,
            requestType: "cancellation",
            reason:
              "Task requirements have been incorporated into another project. This task is now redundant.",
            requestedBy: user.id,
            requestDate: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            status: "declined",
            reviewedBy: "admin-2",
            reviewDate: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
            reviewComment:
              "This task is still required. Please continue with implementation as planned.",
            feedback:
              "Task is critical for the project roadmap and cannot be cancelled.",
          },
        ];

        allRequests = sampleRequests;
      }

      // Filter requests by type if requestTypeFilter is provided
      if (requestTypeFilter) {
        allRequests = allRequests.filter(
          (req) => req.requestType === requestTypeFilter
        );
      }

      setRequests(allRequests);
    } catch (err) {
      console.error("Error fetching request history:", err);
      setError("Failed to load request history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Add click outside handler
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [requestTypeFilter]); // Added requestTypeFilter as dependency to refetch when it changes

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "req-history-approved";
      case "declined":
        return "req-history-declined";
      default:
        return "req-history-pending";
    }
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case "extension":
        return "fas fa-calendar-plus";
      case "cancellation":
        return "fas fa-ban";
      default:
        return "fas fa-question-circle";
    }
  };

  const getRequestTypeLabel = (type) => {
    switch (type) {
      case "extension":
        return "Deadline Extension";
      case "cancellation":
        return "Task Cancellation";
      default:
        return "Unknown Request";
    }
  };

  // Function to get the due date (original or latest reworked)
  const getTaskDueDate = () => {
    return formatDate(task.dueDate);
  };

  // Function to get a user's email or name
  const getUserInfo = (userId) => {
    // This would come from your users map in a real application
    return userId === user.id
      ? user.username || user.email
      : `User ID: ${userId}`;
  };

  // Function to determine if a task is active or inactive
  const isTaskActive = () => {
    // Task is inactive if completed or cancelled, otherwise active
    const status = task.status?.toLowerCase() || "";
    const lastCancellationRequest = task.cancellationRequests?.[task.cancellationRequests.length - 1];
    const isCancelled = lastCancellationRequest?.status?.toLowerCase() || "";    
    return !(status === "completed" || isCancelled === "approved");
  };

  // Get active status for display
  const getActiveStatus = () => {
    return isTaskActive() ? "Active" : "Inactive";
  };

  // Get class for active status
  const getActiveStatusClass = () => {
    return isTaskActive() ? "req-history-active" : "req-history-inactive";
  };

  // Get modal title based on request type filter
  const getModalTitle = () => {
    if (!requestTypeFilter) return "Request History";
    return getRequestTypeLabel(requestTypeFilter) + " History";
  };

  // Get empty state message based on request type filter
  const getEmptyStateMessage = () => {
    if (!requestTypeFilter) return "No requests have been made for this task.";
    return `No ${getRequestTypeLabel(requestTypeFilter).toLowerCase()} requests have been made for this task.`;
  };

  return (
    <div className="req-history-modal-overlay">
      <div className="req-history-modal-content" ref={modalRef}>
        <div className="req-history-modal-header">
          <h3>
            <i className={`${getRequestTypeIcon(requestTypeFilter || "history")} mr-2`}></i>
            {getModalTitle()}
          </h3>
          <button className="req-history-close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="req-history-modal-body">
          {/* Task Information Section */}
          <div className="req-history-task-info-section">
            <div className="req-history-task-info-grid">
              <div className="req-history-task-info-item">
                <div className="req-history-info-label">Task Title</div>
                <div className="req-history-info-value">{task.title}</div>
              </div>
              <div className="req-history-task-info-item">
                <div className="req-history-info-label">Task Status</div>
                <div className="req-history-info-value">
                  <div
                    className={`req-history-status-badge ${getActiveStatusClass()}`}
                  >
                    <i
                      className={
                        isTaskActive()
                          ? "fas fa-check-circle"
                          : "fas fa-times-circle"
                      }
                    ></i>
                    <span>{getActiveStatus()}</span>
                  </div>
                </div>
              </div>
            </div>

            {task.description && (
              <div className="req-history-task-description">
                <div className="req-history-info-label">Description</div>
                <div className="req-history-info-value">{task.description}</div>
              </div>
            )}
          </div>

          {/* Requests Timeline */}
          <div className="req-history-timeline-container">
            {loading ? (
              <div className="req-history-timeline-empty-state">
                <div className="req-history-spinner"></div>
                <p>Loading request history...</p>
              </div>
            ) : error ? (
              <div className="req-history-timeline-empty-state">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="req-history-no-requests">
                <i className={`${getRequestTypeIcon(requestTypeFilter || "inbox")} mr-2`}></i>
                <p>{getEmptyStateMessage()}</p>
              </div>
            ) : (
              <div className="req-history-timeline-list">
                {requests.map((request, index) => (
                  <div
                    key={request.id || index}
                    className={`req-history-timeline-item req-history-${request.requestType}`}
                  >
                    <div className="req-history-timeline-header">
                      <div className="req-history-request-type">
                        <i
                          className={getRequestTypeIcon(request.requestType)}
                        ></i>
                        {getRequestTypeLabel(request.requestType)}
                      </div>
                    </div>

                    <div className="req-history-timeline-details">
                      {request.requestType === "extension" && (
                        <div className="req-history-detail-item">
                          <div className="req-history-detail-label">
                            Requested Deadline
                          </div>
                          <div className="req-history-detail-value">
                            {formatDate(request.requestDate)}
                          </div>
                        </div>
                      )}

                      {/* If extension is approved, show the current due date */}
                      {request.requestType === "extension" &&
                        request.status?.toLowerCase() === "approved" && (
                          <div className="req-history-detail-item">
                            <div className="req-history-detail-label">
                              Approved Due Date
                            </div>
                            <div className="req-history-detail-value">
                              {getTaskDueDate()}
                            </div>
                          </div>
                        )}

                      <div className="req-history-detail-item">
                        <div className="req-history-detail-label">Request Status</div>
                        <div className="req-history-detail-value">
                          <span
                            className={`req-history-status-tag ${getStatusClass(
                              request.status
                            )}`}
                          >
                            {request.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="req-history-reason-box">{request.reason}</div>
                    )}

                    {/* Show decline feedback when a request is declined */}
                    {request.status?.toLowerCase() === "declined" &&
                      request.feedback && (
                        <div className="req-history-reason-box req-history-feedback-box">
                          <strong>Decline Feedback:</strong> {request.feedback}
                        </div>
                      )}

                  
                    {/* Show attachment file if present */}
                    {request.attachmentFile && (
                        <div className="req-history-attachment-box">
                            <i className="fas fa-paperclip"></i>
                            <a
                                href={`http://localhost:5000/api/tasks/view/${request.attachmentFile.filename}`}  // Adjust URL as necessary
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {request.attachmentFile.originalName ||
                                "View Attachment"}
                            </a>
                        </div>
                    )}

                    {request.reviewedBy && (
                      <div className="req-history-review-section">
                        <div className="req-history-review-header">
                          Review Information
                        </div>
                        <div className="req-history-timeline-details">
                          <div className="req-history-detail-item">
                            <div className="req-history-detail-label">
                              Reviewed By
                            </div>
                            <div className="req-history-detail-value">
                              {getUserInfo(request.reviewedBy)}
                            </div>
                          </div>

                          {request.reviewDate && (
                            <div className="req-history-detail-item">
                              <div className="req-history-detail-label">
                                Review Date
                              </div>
                              <div className="req-history-detail-value">
                                {formatDate(request.reviewDate)}
                              </div>
                            </div>
                          )}
                        </div>

                        {request.reviewComment && (
                          <div className="req-history-reason-box">
                            {request.reviewComment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="req-history-modal-footer">
          <button className="req-history-btn req-history-btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i>
            Close
          </button>
        </div>
<style jsx>{`
.req-history-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.req-history-modal-content {
    background-color: #ffffff;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    animation: req-history-fade-in 0.3s ease;
}

@keyframes req-history-fade-in {
    from {
    opacity: 0;
    transform: translateY(-20px);
    }
    to {
    opacity: 1;
    transform: translateY(0);
    }
}

.req-history-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: var(--primary);
    color: white;
}

.req-history-modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    font-weight: 600;
}

.req-history-modal-header h3 i {
    margin-right: 0.5rem;
}

.req-history-close-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.2s ease;
}

.req-history-close-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.req-history-modal-body {
    padding: 0;
    overflow-y: auto;
    flex: 1;
}

.req-history-task-info-section {
    padding: 1.25rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.req-history-task-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.req-history-task-info-item {
    display: flex;
    flex-direction: column;
}

.req-history-info-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
}

.req-history-info-value {
    font-weight: 600;
    color: #111827;
}

.req-history-task-description {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed #d1d5db;
}

/* Timeline styles */
.req-history-timeline-container {
    position: relative;
    padding: 1.5rem 1.5rem 0.5rem;
}

.req-history-timeline-list {
    position: relative;
    padding-left: 40px;
}

.req-history-timeline-list::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #e5e7eb;
}

.req-history-timeline-item {
    position: relative;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-left: 4px solid;
    transition: box-shadow 0.2s ease;
}

.req-history-timeline-item:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.req-history-extension {
    border-left-color: var(--primary);
}

.req-history-cancellation {
    border-left-color: #ef4444;
}

.req-history-timeline-item::before {
    content: "";
    position: absolute;
    left: -38px;
    top: 1.25rem;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: white;
    border: 3px solid;
    z-index: 1;
}

.req-history-extension::before {
    border-color: var(--primary);
}

.req-history-cancellation::before {
    border-color: #ef4444;
}

.req-history-timeline-item::after {
    content: "";
    position: absolute;
    left: -28px;
    top: 1.35rem;
    width: 28px;
    height: 2px;
    background-color: #d1d5db;
}

.req-history-timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.req-history-request-type {
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
}

.req-history-request-type i {
    margin-right: 0.5rem;
}

.req-history-timeline-date {
    font-size: 0.875rem;
    color: #6b7280;
    display: flex;
    align-items: center;
}

.req-history-timeline-date i {
    margin-right: 0.25rem;
}

.req-history-timeline-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.req-history-detail-item {
    display: flex;
    flex-direction: column;
}

.req-history-detail-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.125rem;
}

.req-history-detail-value {
    font-size: 0.875rem;
}

.req-history-reason-box {
    background-color: #f9fafb;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    position: relative;
}

.req-history-reason-box::before {
    content: "Reason:";
    font-size: 0.75rem;
    color: #6b7280;
    display: block;
    margin-bottom: 0.25rem;
}

.req-history-status-tag {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-weight: 600;
}

.req-history-pending {
    background-color: rgba(248, 150, 30, 0.1);
    color: #f59e0b;
}

.req-history-approved {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.req-history-declined {
    background-color: rgba(249, 65, 68, 0.1);
    color: #ef4444;
}

.req-history-review-section {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #e5e7eb;
}

.req-history-review-header {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
}

.req-history-attachment-box {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: #f9fafb;
    border-radius: 6px;
    margin-top: 0.75rem;
}

.req-history-attachment-box i {
    margin-right: 0.5rem;
    color: var(--primary);
}

.req-history-attachment-box a {
    color: var(--primary);
    text-decoration: none;
    font-size: 0.875rem;
}

.req-history-attachment-box a:hover {
    text-decoration: underline;
}

.req-history-no-requests {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
}

.req-history-no-requests i {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #9ca3af;
}

.req-history-timeline-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #6b7280;
}

.req-history-spinner {
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 3px solid var(--primary);
    width: 24px;
    height: 24px;
    animation: req-history-spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes req-history-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Modal footer */
.req-history-modal-footer {
    padding: 1rem;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
}

.req-history-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.req-history-btn i {
    margin-right: 0.5rem;
}

.req-history-btn-primary {
    background-color: var(--primary);
    color: white;
}

.req-history-btn-primary:hover {
    background-color: #4338ca;
}

.req-history-btn-secondary {
    background-color: #e5e7eb;
    color: #374151;
}

.req-history-btn-secondary:hover {
    background-color: #d1d5db;
}

.req-history-feedback-box {
    background-color: rgba(249, 65, 68, 0.05);
    border-left: 3px solid #ef4444;
}

.req-history-feedback-box::before {
    content: "";
    display: none;
}

.req-history-feedback-box strong {
    color: #ef4444;
    display: inline-block;
    margin-right: 5px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .req-history-modal-content {
    width: 95%;
    }

    .req-history-task-info-grid,
    .req-history-timeline-details {
    grid-template-columns: 1fr;
    }

    .req-history-timeline-header {
    flex-direction: column;
    align-items: flex-start;
    }

    .req-history-timeline-date {
    margin-top: 0.5rem;
    }
}


.req-history-task-info-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 1.25rem;
margin-bottom: 1.25rem;
}

.req-history-task-info-item {
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.req-history-info-label {
font-size: 0.875rem;
font-weight: 600;
color: var(--gray-500);
text-transform: uppercase;
letter-spacing: 0.05em;
}

.req-history-info-value {
font-size: 1rem;
color: var(--dark);
font-weight: 500;
}

/* Status Badge Styles */
.req-history-status-badge {
display: inline-flex;
align-items: center;
gap: 0.5rem;
padding: 0.5rem 0.75rem;
border-radius: var(--radius-lg);
font-weight: 600;
font-size: 0.875rem;
}

.req-history-status-badge.req-history-active {
background-color:rgba(16, 185, 129, 0.1);
color: #10b981;
}

.req-history-status-badge.req-history-inactive {
background-color:rgba(239, 68, 68, 0.1);
color: #ef4444;
}

/* Priority Badge Styles */
.req-history-priority-badge {
display: inline-block;
padding: 0.4rem 0.75rem;
border-radius: var(--radius-lg);
font-weight: 600;
font-size: 0.875rem;
text-align: center;
}

.req-history-priority-badge.high {
background-color: rgba(249, 65, 68, 0.15);
color: var(--danger);
}

.req-history-priority-badge.medium {
background-color: rgba(248, 150, 30, 0.15);
color: var(--warning);
}

.req-history-priority-badge.low {
background-color: rgba(76, 201, 240, 0.15);
color: var(--success);
}

/* Description Section */
.req-history-task-description {
border-top: 1px solid var(--gray-200);
padding-top: 1.25rem;
}

.req-history-task-description .req-history-info-value {
background-color: var(--gray-100);
padding: 1rem;
border-radius: var(--radius-sm);
margin-top: 0.5rem;
line-height: 1.6;
}


`}</style>
       
      </div>
    </div>
  );
};

export default RequestHistoryModal;
    