import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const StaffRequestModal = ({ user, task, onClose, onTaskRefresh }) => {
  const [activeSection, setActiveSection] = useState('extension');
  const modalRef = useRef(null);

  // Extension Request State
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionFile, setExtensionFile] = useState(null);
  const [extensionError, setExtensionError] = useState('');
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
  const [extensionProgress, setExtensionProgress] = useState(0);

  // Cancellation Request State
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationFile, setCancellationFile] = useState(null);
  const [cancellationError, setCancellationError] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [cancellationProgress, setCancellationProgress] = useState(0);

  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Add these state variables at the beginning with other state declarations
  const [cancellationRequestSubmitted, setCancellationRequestSubmitted] = useState(false);
  const [cancellationRequestStatus, setCancellationRequestStatus] = useState({
    stage: 'pending', // pending, review, approved, declined
    reviewedBy: null,
    reviewDate: null,
    comments: '',
  });

  // Request Stages
  const [requestStage, setRequestStage] = useState('form'); // 'form', 'submitting', 'success'
  const [requestStatus, setRequestStatus] = useState({
    stage: 'pending', // pending, review, approved, declined
    reviewedBy: null,
    reviewDate: null,
    comments: '',
  });

  // Add this function to fetch cancellation request status
  const fetchCancellationRequestStatus = async () => {
    // Only fetch if we're in success stage or if a cancellation request was already submitted
    if ((requestStage === 'success' && activeSection === 'cancellation') || cancellationRequestSubmitted) {
      try {
        console.log('Fetching cancellation request status for task:', task.id);
        const response = await axios.get(`http://localhost:5000/api/cancellation-requests/${task.id}`);
        
        // Log the response to debug
        console.log('API Response (Cancellation):', response.data);
        
        // Check if we got a valid response with data
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // We have request data
          const requestData = response.data[response.data.length - 1]; // Get the last request
          console.log('Cancellation request data found:', requestData);
          
          setCancellationRequestSubmitted(true);
          
          // Map API status to our internal status stages
          let stage = 'pending';
          if (requestData.status) {
            const status = requestData.status.toLowerCase(); // Convert to lowercase for consistency
            console.log('Cancellation Status from API:', status);
            
            if (status === 'pending') {
              stage = 'review';
            } else if (status === 'approved' || status === 'declined') {
              stage = status;
            }
          }
          
          console.log('Setting cancellation request status stage to:', stage);
          
          setCancellationRequestStatus({
            stage: stage,
            reviewedBy: requestData.reviewedBy || 'Department Manager',
            reviewDate: requestData.reviewDate || null,
            comments: requestData.comments || '',
          });
        } else {
          console.log('No cancellation request data found or empty array');
          // No requests found for this task
          setCancellationRequestSubmitted(false);
          setCancellationRequestStatus({
            stage: 'pending',
            reviewedBy: null,
            reviewDate: null,
            comments: '',
          });
        }
      } catch (error) {
        console.error('Error fetching cancellation request status:', error);
        // If there's an error, assume no request is submitted
        setCancellationRequestSubmitted(false);
        setCancellationRequestStatus({
          stage: 'pending',
          reviewedBy: null,
          reviewDate: null,
          comments: '',
        });
      }
    }
  };

  const fetchRequestStatus = async () => {
    // Only fetch if we're in success stage or if a request was already submitted
    if (requestStage === 'success' || requestSubmitted) {
      try {
        console.log('Fetching request status for task:', task.id);
        const response = await axios.get(`http://localhost:5000/api/extension-requests/${task.id}`);
        
        // Log the response to debug
        console.log('API Response:', response.data);
        
        // Check if we got a valid response with data
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // We have request data
          const requestData = response.data[response.data.length - 1]; // Get the last request
          console.log('Request data found:', requestData);
          
          setRequestSubmitted(true);
          
          // Map API status to our internal status stages
          let stage = 'pending';
          if (requestData.status) {
            const status = requestData.status.toLowerCase(); // Convert to lowercase for consistency
            console.log('Status from API:', status);
            
            if (status === 'pending') {
              stage = 'review';
            } else if (status === 'approved' || status === 'declined') {
              stage = status;
            }
          }
          
          console.log('Setting request status stage to:', stage);
          
          setRequestStatus({
            stage: stage,
            reviewedBy: requestData.reviewedBy || 'Department Manager',
            reviewDate: requestData.reviewDate || null,
            comments: requestData.comments || '',
          });
        } else {
          console.log('No request data found or empty array');
          // No requests found for this task
          setRequestSubmitted(false);
          setRequestStatus({
            stage: 'pending',
            reviewedBy: null,
            reviewDate: null,
            comments: '',
          });
        }
      } catch (error) {
        console.error('Error fetching request status:', error);
        // If there's an error, assume no request is submitted
        setRequestSubmitted(false);
        setRequestStatus({
          stage: 'pending',
          reviewedBy: null,
          reviewDate: null,
          comments: '',
        });
      }
    } else {
      console.log('Skipping fetch - requestStage:', requestStage, 'requestSubmitted:', requestSubmitted);
    }
  };

  // Effect for fetching extension request status when dependencies change
  useEffect(() => {
    fetchRequestStatus();
  }, [requestStage, requestSubmitted, requestStatus.stage]);

  // Effect for fetching cancellation request status when dependencies change
  useEffect(() => {
    fetchCancellationRequestStatus();
  }, [requestStage, cancellationRequestSubmitted, cancellationRequestStatus.stage, activeSection]);

  // Initial check for existing requests
  useEffect(() => {
    // Check for extension and cancellation requests
    const checkExistingRequests = async () => {
      try {
        // Check for extension requests
        const extensionResponse = await axios.get(`http://localhost:5000/api/extension-requests/${task.id}`);
        
        if (extensionResponse.data && Array.isArray(extensionResponse.data) && extensionResponse.data.length > 0) {
          setRequestSubmitted(true);
        }
        
        // Check for cancellation requests
        const cancellationResponse = await axios.get(`http://localhost:5000/api/cancellation-requests/${task.id}`);
        
        if (cancellationResponse.data && Array.isArray(cancellationResponse.data) && cancellationResponse.data.length > 0) {
          setCancellationRequestSubmitted(true);
        }
      } catch (error) {
        console.error('Error checking for existing requests:', error);
      }
    };
    
    checkExistingRequests();
    
    // Set up polling intervals
    const extensionInterval = setInterval(() => fetchRequestStatus(), 60000);
    const cancellationInterval = setInterval(() => fetchCancellationRequestStatus(), 60000);
    
    // Clean up intervals on component unmount
    return () => {
      clearInterval(extensionInterval);
      clearInterval(cancellationInterval);
    };
  }, []); // Empty dependency array to run only on mount

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Simulate progress for extension submission
  useEffect(() => {
    if (isSubmittingExtension) {
      const interval = setInterval(() => {
        setExtensionProgress((prevProgress) => {
          const newProgress = Math.min(prevProgress + 5, 90);
          return newProgress;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSubmittingExtension]);

  // Simulate progress for cancellation submission
  useEffect(() => {
    if (isSubmittingCancellation) {
      const interval = setInterval(() => {
        setCancellationProgress((prevProgress) => {
          const newProgress = Math.min(prevProgress + 5, 90);
          return newProgress;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSubmittingCancellation]);

  // Extension Request Handlers
  const handleExtensionFileChange = (e) => {
    setExtensionFile(e.target.files[0]);
  };

  // Inside StaffRequestModal
  const handleExtensionRequest = async () => {
    if (!extensionReason || !extensionDate) {
      setExtensionError('Please provide a reason and new due date.');
      return;
    }
  
    setIsSubmittingExtension(true);
    setRequestStage('submitting');
  
    try {
      const extensionData = {
        taskId: task.id,
        reason: extensionReason,
        requestedBy: user.id,
        requestDate: extensionDate,
      };
  
      let response;
      if (extensionFile) {
        const formData = new FormData();
        formData.append('file', extensionFile);
        formData.append('extensionData', JSON.stringify(extensionData));
  
        response = await axios.post(
          `http://localhost:5000/api/tasks/${task.id}/extension-request`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setExtensionProgress(percentCompleted);
            },
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/tasks/${task.id}/extension-request`,
          extensionData
        );
      }
  
      setExtensionProgress(100);
      setRequestStage('success');
      setRequestSubmitted(true);
      setRequestStatus({
        stage: 'pending',
        reviewedBy: null,
        reviewDate: null,
        comments: '',
      });
  
      onTaskRefresh();      
     
    } catch (err) {
      setExtensionError('Failed to submit extension request. Please try again.');
      setRequestStage('form');
    } finally {
      setTimeout(() => {
        setIsSubmittingExtension(false);
      }, 500);
    }
  };

  // Cancellation Request Handlers
  const handleCancellationFileChange = (e) => {
    setCancellationFile(e.target.files[0]);
  };

  const handleCancellationRequest = async () => {
    if (!cancellationReason) {
      setCancellationError('Please provide a reason for cancellation.');
      return;
    }
  
    setIsSubmittingCancellation(true);
    setRequestStage('submitting');
  
    try {
      const cancellationData = {
        taskId: task.id,
        reason: cancellationReason,
        requestedBy: user.id,
      };
  
      let response;
      if (cancellationFile) {
        const formData = new FormData();
        formData.append('file', cancellationFile);
        formData.append('cancellationData', JSON.stringify(cancellationData));
  
        response = await axios.post(
          `http://localhost:5000/api/tasks/${task.id}/cancellation-request`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setCancellationProgress(percentCompleted);
            },
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/tasks/${task.id}/cancellation-request`,
          cancellationData
        );
      }
  
      setCancellationProgress(100);
      setRequestStage('success');
      setCancellationRequestSubmitted(true);
      setCancellationRequestStatus({
        stage: 'pending',
        reviewedBy: null,
        reviewDate: null,
        comments: '',
      });
      onTaskRefresh();
      
      // Reset after showing success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setCancellationError('Failed to submit cancellation request. Please try again.');
      setRequestStage('form');
    } finally {
      setTimeout(() => {
        setIsSubmittingCancellation(false);
      }, 500);
    }
  };

  const renderProgressBar = (progress, type) => {
    const getProgressMessage = () => {
      if (progress < 25) return 'Preparing submission...';
      if (progress < 50) return 'Uploading request data...';
      if (progress < 75) return 'Processing attachments...';
      if (progress < 100) return 'Finalizing submission...';
      return `${type} request submitted successfully!`;
    };
  
    return (
      <div className="progress-container">
        <div className="progress-text">
          {progress < 100 ? 'Submitting Request' : 'Submission Complete'}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-details">
          {getProgressMessage()} ({progress}%)
        </div>
        {progress >= 100 && (
          <div className="checkmark-wrapper">
            <i className="fas fa-check-circle"></i>
          </div>
        )}
      </div>
    );
  };

  const renderStatusTracker = () => {
    let stages = ['Not Submitted', 'Submitted', 'Under Review', 'Decision'];
    let currentStageIndex = 0;
    
    // Determine which request type we're dealing with
    const isExtensionSection = activeSection === 'extension';
    
    // Use the appropriate state variables based on the section
    const sectionRequestSubmitted = isExtensionSection ? requestSubmitted : cancellationRequestSubmitted;
    const sectionRequestStatus = isExtensionSection ? requestStatus : cancellationRequestStatus;
    
    // If no request has been submitted yet
    if (!sectionRequestSubmitted) {
      currentStageIndex = 0;
    } 
    // If request has been submitted
    else {
      // Explicitly check for each status to make debugging easier
      if (sectionRequestStatus.stage === 'pending') {
        currentStageIndex = 1; // Submitted stage
      } 
      else if (sectionRequestStatus.stage === 'review') {
        currentStageIndex = 2; // Under Review stage
      }
      else if (sectionRequestStatus.stage === 'approved' || sectionRequestStatus.stage === 'declined') {
        currentStageIndex = 3; // Decision stage
      }
      else {
        currentStageIndex = 0;
      }
    }
    
    return (
      <div>
        {currentStageIndex !== 0 ? (
        <div className="status-tracker">
          <h4>{isExtensionSection ? "Extension Request Status" : "Cancellation Request Status"}</h4>
          <div className="tracker-container">
            {stages.map((stage, index) => (
              <div key={stage} className="tracker-stage">
                <div className={`stage-dot ${index <= currentStageIndex ? 'active' : ''}`}>
                  {index < currentStageIndex && <i className="fas fa-check"></i>}
                </div>
                <div className="stage-label">{stage}</div>
                {index < stages.length - 1 && (
                  <div className={`stage-line ${index < currentStageIndex ? 'active' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="status-details">
            <div className="status-icon">
              {!sectionRequestSubmitted && <i className="fas fa-file-alt"></i>}
              {sectionRequestSubmitted && sectionRequestStatus.stage === 'pending' && <i className="fas fa-clock"></i>}
              {sectionRequestStatus.stage === 'review' && <i className="fas fa-hourglass-half pulse"></i>}
              {sectionRequestStatus.stage === 'approved' && <i className="fas fa-check-circle"></i>}
              {sectionRequestStatus.stage === 'declined' && <i className="fas fa-times-circle"></i>}
            </div>
            <div className="status-text">
              <h5>
                {!sectionRequestSubmitted && "No Request Submitted"}
                {sectionRequestSubmitted && sectionRequestStatus.stage === 'pending' && "Request Submitted"}
                {sectionRequestStatus.stage === 'review' && "Under Review"}
                {sectionRequestStatus.stage === 'approved' && "Approved"}
                {sectionRequestStatus.stage === 'declined' && "Declined"}
              </h5>
              {!sectionRequestSubmitted && <p>Submit a request using the form below.</p>}
              {sectionRequestSubmitted && sectionRequestStatus.stage === 'pending' && <p>Your request has been submitted and is waiting to be reviewed.</p>}
              {sectionRequestStatus.stage === 'review' && <p>Your request is currently being reviewed by management.</p>}
              {sectionRequestStatus.stage === 'approved' && <p>Your request has been approved!</p>}
              {sectionRequestStatus.stage === 'declined' && <p>Your request has been declined. If necessary, you may reapply after addressing the rejection reason.</p>}
            </div>
          </div>
          
          {sectionRequestStatus.comments && (
            <div className="status-comments">
              <h5>Comments:</h5>
              <p>{sectionRequestStatus.comments}</p>
            </div>
          )}
        </div>
        ) : "" }
      </div>
    );
  };

  const renderSuccessMessage = (type) => {
    return (
      <div className="success-container">
        <div className="success-message">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>Request Submitted!</h3>
          <p>Your {type} request has been successfully submitted and is now pending approval.</p>
          <p className="email-note">You will receive an email notification once it has been reviewed.</p>
        </div>
        
        {renderStatusTracker()}
        
        <div className="expected-timeline">
          <h4>Expected Timeline</h4>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <h5>Initial Review</h5>
              <p>1-2 business days</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <h5>Final Decision</h5>
              <p>3-5 business days</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Safely check if the properties exist before accessing them
  const hasExtensionRequests = task.extensionRequests && task.extensionRequests.length > 0;
  const hasCancellationRequests = task.cancellationRequests && task.cancellationRequests.length > 0;

  // Get the latest request if it exists
  const latestExtensionRequest = hasExtensionRequests ? task.extensionRequests[task.extensionRequests.length - 1] : null;
  const latestCancellationRequest = hasCancellationRequests ? task.cancellationRequests[task.cancellationRequests.length - 1] : null;

  return (
    <div className="modal-overlay">
      <div className="staff-request-modal" ref={modalRef}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>{requestStage === 'success' ? 'Request Submitted' : 'Task Request'}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {requestStage === 'form' && (
          <>
            {/* Section Switcher */}
            <div className="section-switcher">
              <button 
                className={`switch-btn ${activeSection === 'extension' ? 'active' : ''}`}
                onClick={() => setActiveSection('extension')}
              >
                <i className="fas fa-calendar-plus"></i>
                <span>Deadline Extension</span>
              </button>
              <button 
                className={`switch-btn ${activeSection === 'cancellation' ? 'active' : ''}`}
                onClick={() => setActiveSection('cancellation')}
              >
                <i className="fas fa-ban"></i>
                <span>Task Cancellation</span>
              </button>
            </div>

            {/* Add the status tracker here */}
            {renderStatusTracker()}

            {/* Modal Body */}
            <div className="modal-body">
              {activeSection === 'extension' && (
                <div className="extension-section">
                  <div className="task-info-card">
                  {requestStatus.stage === 'declined' && latestExtensionRequest ? (
                      <div>
                        <div className="task-header">
                          <h4>Declined Reason</h4>
                        </div>
                        <p className='deadline-reason'>{latestExtensionRequest.feedback || "No feedback provided"}</p>
                        <br />
                      </div>
                  ) : ""}
                    <div className="task-header">
                      <h4>{task.title}</h4>
                      <span className="task-badge">Active Task</span>
                    </div>
                    <p>{task.description}</p>
                    <div className="date-info">
                      <div className="date-item">
                        <i className="fas fa-calendar-check"></i>
                        <div>
                          <span>Current Due Date</span>
                          <strong>
                            {task.reworkDetails && task.reworkDetails.length > 0
                              ? new Date(task.reworkDetails[task.reworkDetails.length - 1].deadline).toLocaleDateString()
                              : new Date(task.dueDate).toLocaleDateString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {extensionError && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      <span>{extensionError}</span>
                    </div>
                  )}

                  {requestStatus.stage !== 'pending' && requestStatus.stage !== 'declined' && latestExtensionRequest ? (
                    <div><br />
                    <div className="form-group">
                      <label>
                        <strong>Reason for Extension</strong>
                      </label>
                      <label> - {latestExtensionRequest.reason || "No reason provided"}</label>
                    </div>

                    <div className="form-group">
                      <label>
                        <strong>Requested New Due Date</strong>  
                      </label>
                      <label> - {latestExtensionRequest.requestDate || "No date provided"}</label>
                    </div>
                  </div>
                  ) : (
                    <div>
                    <div className="warning-box">
                      <i className="fas fa-exclamation-triangle"></i>
                      <div>
                        <strong>Warning: </strong> This applies to both tasks and reworks. You can extend the deadline only once per task, regardless of how many times it is sent for rework.
                        <br />
                      </div>
                    </div>
                    <br />
                    <div className="form-group">
                      <label>
                        Reason for Extension <span className="required">*</span>
                      </label>
                      <textarea
                        placeholder="Please explain why you need an extension..."
                        value={extensionReason}
                        onChange={(e) => setExtensionReason(e.target.value)}
                        required
                      ></textarea>
                      <div className="char-count">{extensionReason.length} characters</div>
                    </div>

                    <div className="form-group">
                      <label>
                        Requested New Due Date <span className="required">*</span>
                      </label>
                      <div className="input-with-icon">
                        <i className="fas fa-calendar-alt"></i>
                        <input
                          type="date"
                          value={extensionDate}
                          onChange={(e) => setExtensionDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Supporting Document (Optional)</label>
                      <div className="file-upload">
                        <input
                          type="file"
                          id="extension-attachment"
                          onChange={handleExtensionFileChange}
                          style={{ display: 'none' }}
                        />
                        <div className="file-upload-btn">
                          <label
                            htmlFor="extension-attachment"
                            className="custom-file-upload"
                          >
                            <i className="fas fa-paperclip"></i>
                            <span>
                              {extensionFile ? extensionFile.name : 'Choose file'}
                            </span>
                          </label>
                        </div>
                      </div>
                      {extensionFile && (
                        <div className="selected-file">
                          <div className="file-info">
                            <i className="fas fa-file-alt"></i>
                            <span>{extensionFile.name}</span>
                          </div>
                          <button
                            className="remove-file-btn"
                            onClick={() => setExtensionFile(null)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div> 
                  )}
                </div>
              )}

              {activeSection === 'cancellation' && (
                <div className="cancellation-section">
                  <div className="task-info-card">
                    {cancellationRequestStatus.stage === 'declined' && latestCancellationRequest ? (
                      <div>
                        <div className="task-header">
                          <h4>Declined Reason</h4>
                        </div>
                        <p className='deadline-reason'>{latestCancellationRequest.feedback || "No feedback provided"}</p>
                        <br />
                      </div>
                    ) : ""}
                    <div className="task-header">
                      <h4>{task.title}</h4>
                      <span className="task-badge warning">Cancellation Request</span>
                    </div>
                    <p>{task.description}</p>
                    <div className="warning-box">
                      <i className="fas fa-exclamation-triangle"></i>
                      <div>
                        <strong>Important:</strong> Cancellation requests are reviewed by management. Once approved, the task cannot be reinstated.
                      </div>
                    </div>
                  </div>

                  {cancellationError && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      <span>{cancellationError}</span>
                    </div>
                  )}

                  {cancellationRequestStatus.stage !== 'pending' && cancellationRequestStatus.stage !== 'declined' && latestCancellationRequest ? (
                    <div><br />
                    <div className="form-group">
                      <label>
                        <strong>Reason for Cancellation</strong>
                      </label>
                      <label> - {latestCancellationRequest.reason || "No reason provided"}</label>
                    </div>
                    </div>
                  ) : (
                    <div>
                      <div className="form-group">
                        <label>
                          Reason for Cancellation <span className="required">*</span>
                        </label>
                        <textarea
                          placeholder="Please explain why you want to cancel this task..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          required
                        ></textarea>
                        <div className="char-count">{cancellationReason.length} characters</div>
                      </div>

                      <div className="form-group">
                        <label>Supporting Document (Optional)</label>
                        <div className="file-upload">
                          <input
                            type="file"
                            id="cancellation-attachment"
                            onChange={handleCancellationFileChange}
                            style={{ display: 'none' }}
                          />
                          <div className="file-upload-btn">
                            <label
                              htmlFor="cancellation-attachment"
                              className="custom-file-upload"
                            >
                              <i className="fas fa-paperclip"></i>
                              <span>
                                {cancellationFile ? cancellationFile.name : 'Choose file'}
                              </span>
                            </label>
                          </div>
                        </div>
                        {cancellationFile && (
                          <div className="selected-file">
                            <div className="file-info">
                              <i className="fas fa-file-alt"></i>
                              <span>{cancellationFile.name}</span>
                            </div>
                            <button
                              className="remove-file-btn"
                              onClick={() => setCancellationFile(null)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {requestStage === 'submitting' && (
          <div className="modal-body centered">
            {activeSection === 'extension'
              ? renderProgressBar(extensionProgress, "extension")
              : renderProgressBar(cancellationProgress, "cancellation")
            }
          </div>
        )}

        {requestStage === 'success' && (
          <div className="modal-body centered">
            {activeSection === 'extension'
              ? renderSuccessMessage("extension")
              : renderSuccessMessage("cancellation")
            }
          </div>
        )}

        {/* Modal Footer */}
        {requestStage === 'form' && (
          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
              <span>Cancel</span>
            </button>
            <button
              className={`submit-btn ${
                activeSection === 'extension' 
                  ? (isSubmittingExtension ? 'submitting' : '') 
                  : (isSubmittingCancellation ? 'submitting' : '')
              }`}
              onClick={
                activeSection === 'extension' 
                  ? handleExtensionRequest 
                  : handleCancellationRequest
              }
              disabled={
                (activeSection === 'extension' 
                  ? (isSubmittingExtension || !extensionReason || !extensionDate)
                  : (isSubmittingCancellation || !cancellationReason))
              }
            >
              {activeSection === 'extension' ? (
                isSubmittingExtension ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Submitting Extension...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    <span>Submit Extension</span>
                  </>
                )
              ) : (
                isSubmittingCancellation ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Submitting Cancellation...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    <span>Submit Cancellation</span>
                  </>
                )
              )}
            </button>
          </div>
        )}
        
        {requestStage === 'success' && (
          <div className="modal-footer">
            <button className="done-btn" onClick={onClose}>
              <i className="fas fa-check"></i>
              <span>Done</span>
            </button>
          </div>
        )}

        {extensionError && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <span>{extensionError}</span>
          </div>
        )}
        
        <style jsx>{`
        :root {
       --primary: #4361ee;
        }

        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
        }

        .staff-request-modal {
          background-color: white;
          border-radius: 12px;
          width: 600px;
          max-width: 95%;
          max-height: 90%;
          overflow-y: auto;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease-out;
        }
        
        .staff-request-modal::-webkit-scrollbar {
          width: 0px;
        }
        
        .staff-request-modal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .staff-request-modal::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #e0e0e0;
          background-color: #f9f9f9;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #333;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 1.2rem;
          cursor: pointer;
          transition: color 0.3s ease, transform 0.2s ease;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #ff4d4d;
          background-color: #f0f0f0;
          transform: rotate(90deg);
        }

        .section-switcher {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
        }

        .switch-btn {
          flex: 1;
          padding: 16px 20px;
          background-color: #f5f5f5;
          border: none;
          color: #666;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .switch-btn i {
          font-size: 1.2rem;
        }

        .switch-btn.active {
          background-color: var(--primary);
          color: white;
        }

        .switch-btn:not(.active):hover {
          background-color: #e0e0e0;
        }

        .deadline-reason{
          background-color:#fff4e5;
          padding: 12px;
          border-radius: 8px;
          color: #7e5200 !important;
        }

        .modal-body {
          padding: 24px;
        }
        
        .modal-body.centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .task-info-card {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 24px;
          border-left: 4px solid var(--primary);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .task-info-card h4 {
          margin-top: 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .task-badge {
          background-color: #e8f0fe;
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .task-badge.warning {
          background-color: #fff4e5;
          color: #e67700;
        }

        .task-info-card p {
          color: #666;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .date-info {
          display: flex;
          gap: 16px;
        }
        
        .date-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .date-item i {
          color: var(--primary);
          font-size: 1.2rem;
        }
        
        .date-item div {
          display: flex;
          flex-direction: column;
        }
        
        .date-item span {
          font-size: 0.8rem;
          color: #666;
        }
        
        .date-item strong {
          color: #333;
        }
        
        .warning-box {
          display: flex;
          gap: 12px;
          background-color: #fff4e5;
          padding: 12px;
          border-radius: 8px;
          color: #7e5200;
        }
        
        .warning-box i {
          color: #e67700;
          font-size: 1.2rem;
          margin-top: 3px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 10px;
          color: #333;
          font-weight: 500;
        }

        .required {
          color: #ff4d4d;
        }

        textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          transition: border-color 0.3s ease;
        }
        
        textarea:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }
        
        .char-count {
          text-align: right;
          color: #888;
          font-size: 0.8rem;
          margin-top: 4px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }

        input[type="date"] {
          width: 100%;
          padding: 12px 12px 12px 38px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: inherit;
          transition: border-color 0.3s ease;
        }
        
        input[type="date"]:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }

        .file-upload-btn {
          border: 1px dashed #ddd;
          padding: 16px;
          text-align: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f9f9f9;
        }
        
        .file-upload-btn:hover {
          border-color: var(--primary);
          background-color: #f0f5fd;
        }

        .custom-file-upload {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          cursor: pointer;
        }

        .custom-file-upload i {
          margin-right: 10px;
          color: var(--primary);
        }

        .selected-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #f0f5fd;
          padding: 12px;
          margin-top: 12px;
          border-radius: 8px;
          border-left: 3px solid var(--primary);
        }
        
        .file-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .file-info i {
          color: var(--primary);
        }

        .remove-file-btn {
          background: none;
          border: none;
          color: #ff4d4d;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease;
        }
        
        .remove-file-btn:hover {
          background-color: #ffe5e5;
        }

        .error-message {
          background-color: #fff0f0;
          color: #ff4d4d;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          border-left: 3px solid #ff4d4d;
        }

        .error-message i {
          margin-right: 12px;
          font-size: 1.1rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 18px 24px;
          border-top: 1px solid #e0e0e0;
          background-color: #f9f9f9;
        }

        .cancel-btn, .submit-btn, .done-btn {
          padding: 12px 24px;
          border-radius: 8px;
          margin-left: 10px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .cancel-btn {
          background-color: #f5f5f5;
          color: #666;
          border: 1px solid #ddd;
        }
        
        .cancel-btn:hover {
          background-color: #e0e0e0;
        }

        .submit-btn {
          background-color: var(--primary);
          color: white;
          border: none;
        }
        
        .submit-btn:hover:not(:disabled) {
          background-color: #0d5bcd;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .submit-btn:disabled {
          background-color: #a7c5f7;
          cursor: not-allowed;
        }

        .submit-btn.submitting {
          cursor: wait;
        }
        
        .done-btn {
          background-color: #34a853;
          color: white;
          border: none;
        }
        
        .done-btn:hover {
          background-color: #2d9248;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        /* Progress Bar Styles */
        .progress-container {
          width: 100%;
          text-align: center;
        }
        
        .progress-bar {
          width: 100%;
          height: 12px;
          background-color: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        
        .progress-fill {
          height: 100%;
          background-color: var(--primary);
          transition: width 0.3s ease-in-out;
        }

        /* Success Container Styles */
.success-container {
  width: 100%;
}

/* Status Tracker Styles */
.status-tracker {
  background-color: #f5f9ff;
  border-radius: 10px;
  padding: 20px;
  margin: 24px 0;
  border: 1px solid #e0e9fc;
}

.status-tracker h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--primary);
  font-size: 1.1rem;
}

.tracker-container {
  display: flex;
  position: relative;
  margin-bottom: 24px;
}

.tracker-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.stage-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e0e0e0;
  border: 3px solid #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  margin-bottom: 10px;
  z-index: 2;
  transition: all 0.3s ease;
}

.stage-dot.active {
  background-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.2);
}

.stage-line {
  position: absolute;
  top: 16px;
  left: 50%;
  right: 0;
  height: 3px;
  background-color: #e0e0e0;
  z-index: 1;
  width: 100%;
}

.stage-line.active {
  background-color: var(--primary);
}

.stage-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  text-align: center;
}

.status-details {
  display: flex;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--primary);
  margin-bottom: 16px;
}

.status-icon {
  margin-right: 16px;
  font-size: 1.5rem;
  color: var(--primary);
}

.status-text p {
  margin: 0;
  color: #333;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

.status-comments {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e0e0e0;
}

.status-comments h5 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
}

.status-comments p {
  margin: 0;
  color: #666;
}

/* Expected Timeline Styles */
.expected-timeline {
  background-color: #f7f7f7;
  border-radius: 10px;
  padding: 20px;
  margin-top: 24px;
}

.expected-timeline h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 1.1rem;
}

.timeline-item {
  display: flex;
  margin-bottom: 16px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary);
  margin-right: 16px;
  margin-top: 4px;
}

.timeline-content h5 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.timeline-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Improved Progress Bar */
.progress-container {
  width: 100%;
  text-align: center;
  padding: 16px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-bar {
  width: 100%;
  height: 16px;
  background-color: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #64b5f6);
  transition: width 0.4s ease-in-out;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 30px 30px;
  animation: progressStripes 1s linear infinite;
  z-index: 1;
}

@keyframes progressStripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 30px 0;
  }
}

.progress-text {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
}

.progress-details {
  font-size: 0.9rem;
  color: #666;
}
  
          `}
        </style>
      </div>
    </div>
  );
}

export default StaffRequestModal;