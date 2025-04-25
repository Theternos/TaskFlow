import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const TaskReworkModal = ({ task, onClose, onReworkSubmitted }) => {
  const [comment, setComment] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  // Set a default deadline (one week from today)
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setDeadline(defaultDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
  }, []);

  // Close when clicking outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!comment) {
      setError("Please provide a comment for the rework request");
      return;
    }

    if (!deadline) {
      setError("Please set a deadline for the rework");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${task.id}/rework`,
        {
          comment,
          deadline,
          requestedBy: null // You might want to get this from the logged-in user
        }
      );

      setIsSubmitting(false);
      onReworkSubmitted(response.data.task);
      onClose();
    } catch (err) {
      console.error("Error submitting rework request:", err);
      setIsSubmitting(false);
      setError(err.response?.data?.message || "Failed to submit rework request");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="rework-modal" ref={modalRef}>
        <div className="modal-header">
          <h3>Request Rework</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="task-info">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
          </div>

          {task.reworkDetails && task.reworkDetails.length > 0 && (
            <div className="previous-reworks">
              <h4>Previous Rework Requests:</h4>
              <ul>
                {task.reworkDetails.map((rework, index) => (
                  <li key={index}>
                    <strong>{new Date(rework.date).toLocaleDateString()}:</strong> {rework.comment}
                    <div>Deadline: {new Date(rework.deadline).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rework-form">
            <div className="form-group">
              <label>Comment</label>
              <textarea
                placeholder="Provide feedback on what needs to be revised..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group">
              <label>New Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`submit-btn ${isSubmitting ? "submitting" : ""}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Rework Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskReworkModal;