// Frontend: Admindashboard.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap
import Select from "react-select";
import "./AdminDashboard.css";
import { toast } from "react-toastify"; // or another library you prefer

const Admintask = () => {
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef(null);
  const [requestCount, setRequestCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [paginatedTasks, setPaginatedTasks] = useState([]);
  const [taskAttachment, setTaskAttachment] = useState(null);
  const [taskLink, setTaskLink] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [imagePreview, setImagePreview] = useState({ isOpen: false, url: '', title: '' });
  const fileInputRef = useRef(null); // Reference for the file input
  // Calculate pagination whenever filtered tasks or pagination settings change
  useEffect(() => {
    // Sort tasks in descending order by id (assuming newer tasks have higher ids)
    const sortedTasks = [...filteredTasks].sort((a, b) => b.id - a.id);

    // Calculate the tasks for the current page
    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    setPaginatedTasks(sortedTasks.slice(indexOfFirstTask, indexOfLastTask));

    // Reset to first page if the current page exceeds the total pages
    const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredTasks, currentPage, tasksPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle tasks per page change
  const handleTasksPerPageChange = (e) => {
    setTasksPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Generate page numbers array for pagination controls
  const getPageNumbers = () => {
    const totalPageCount = Math.ceil(filteredTasks.length / tasksPerPage);

    // If 5 or fewer pages, show all page numbers
    if (totalPageCount <= 10) {
      return Array.from({ length: totalPageCount }, (_, i) => i + 1);
    }

    // Otherwise, show current page with neighbors and ellipsis
    const pageNumbers = [];

    // Always include first page
    pageNumbers.push(1);

    // Add ellipsis if current page is more than 3
    if (currentPage > 3) {
      pageNumbers.push("...");
    }

    // Add page numbers around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPageCount - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis if current page is less than totalPageCount - 2
    if (currentPage < totalPageCount - 2) {
      pageNumbers.push("...");
    }

    // Always include last page if more than 1 page
    if (totalPageCount > 1) {
      pageNumbers.push(totalPageCount);
    }

    return pageNumbers;
  };
  useEffect(() => {
    // Get count from localStorage
    const count = localStorage.getItem("pendingRequestsCount") || 0;
    setRequestCount(count);
  }, []);

  // Handle user form changes
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch users from the API
  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {
        const usersArray = Array.isArray(response.data)
          ? response.data
          : response.data.users || [];

        // Create a mapping of user IDs to user data for quick lookup
        const userMapObj = {};
        usersArray.forEach((user) => {
          userMapObj[user.id] = user;
        });
        setUsersMap(userMapObj);

        // Format users for the select dropdown
        const formattedUsers = usersArray.map((user) => ({
          value: user.id,
          label: user.username,
        }));
        setUsers(formattedUsers);
      })
      .catch((error) => console.error("Error fetching users:", error));
  };

  // Fetch tags from the API
  const fetchTags = () => {
    axios
      .get("http://localhost:5000/api/tags")
      .then((response) => {
        const tagsData = response.data || [];
        setTags(tagsData.map((tag) => ({ value: tag, label: tag })));
      })
      .catch((error) => console.error("Error fetching tags:", error));
  };

  // Fetch tasks from the API
  const fetchTasks = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/tasks")
      .then((response) => {
        const tasksData = response.data || [];
        setTasks(tasksData);
        setFilteredTasks(tasksData);
      })
      .catch((error) => console.error("Error fetching tasks:", error))
      .finally(() => {
        setTimeout(() => setLoading(false), 500);
      });
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchUsers();
    fetchTags();
    fetchTasks();
  }, []);

  const getEmailById = (userId) => {
    // Guard clause - if userId is undefined or null, return early
    if (userId === undefined || userId === null) {
      return "No email";
    }

    // First check the usersMap for quick lookup
    if (usersMap[userId]) {
      return usersMap[userId].email;
    }

    // Fallback to search in the users array if not found in the map
    const user = users.find(
      (u) => u.value && userId && u.value.toString() === userId.toString()
    );

    if (user && usersMap[user.value]) {
      return usersMap[user.value].email;
    }

    return "Unknown";
  };

  const formatUserLabel = (user) => {
    if (!user) return "Select User";

    const userId = user.id || user.value;
    // If userId is undefined, don't try to get the email
    if (userId === undefined || userId === null) {
      return user.name || user.label || "Unknown User";
    }

    const userName = user.name || user.label || "Unknown";
    const userEmail = getEmailById(userId);

    return `${userName} (${userEmail})`;
  };

  // Apply filters when filters change
  useEffect(() => {
    let filtered = tasks;

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (task) =>
          task.priority &&
          task.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (task) =>
          task.status &&
          task.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [priorityFilter, statusFilter, tasks]);

  // Task submission
  // Add a new task with notification with all Integration

  // Handle file download
  const handleDownload = (filename) => {
    axios({
      url: `http://localhost:5000/api/tasks/download/${filename}`,
      method: "GET",
      responseType: "blob",
    })
      .then((response) => {
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = window.URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = fileURL;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
      })
      .catch((error) => {
        alert("Error downloading file: " + error.message);
      });
  };

  // Task deletion / Edit

  const [editTask, setEditTask] = useState(null); // Store task to edit
  const [deleteTaskId, setDeleteTaskId] = useState(null); // Store task ID for deletion

  const handleEditClick = (task) => {
    setEditTask(task); // Set task to edit
    // Reset file state when opening edit modal
    setFileUploaded(false);
    setTaskAttachment(null);

    // Set link if it exists
    setTaskLink(task.referenceLink || "");
  };

  const handleDeleteClick = (taskId) => {
    setDeleteTaskId(taskId); // Set task ID for confirmation
  };

  const closeModals = () => {
    setEditTask(null);
    setDeleteTaskId(null);
    setViewReportTask(null);
    setViewOnlyReportTask(null);
  };
  const closeModalss = () => {
    setDeleteTaskId(null);
  };

  // For Deletion of Task
  // Fix the deleteTask function in AdminDashboard.js
  const deleteTask = async (taskId) => {
    console.log("Attempting to delete task with ID:", taskId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Delete response status:", response.status);
      const responseData = await response.json();
      console.log("Delete response data:", responseData);

      if (!response.ok) {
        throw new Error(
          `Failed to delete task: ${responseData.error || response.statusText}`
        );
      }

      // Update local state after successful deletion
      setTasks(tasks.filter((task) => task.id !== taskId));
      setFilteredTasks(filteredTasks.filter((task) => task.id !== taskId));
      console.log("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task: " + error.message);
    }
  };

  // Add this function to your component for testing
  const testDeleteEndpoint = async () => {
    try {
      console.log("Testing delete endpoint with task ID:", deleteTaskId);
      const response = await fetch(`/api/tasks/${deleteTaskId}`, {
        method: "DELETE",
      });
      console.log("Delete test response:", response.status);
      console.log("Response ok?", response.ok);
      const data = await response.json().catch(() => ({}));
      console.log("Response data:", data);
      return response.ok;
    } catch (error) {
      console.error("Error testing delete endpoint:", error);
      return false;
    }
  };

  // Handle link input changes
  const handleLinkChange = (e) => {
    setTaskLink(e.target.value);
  };

  const [editFormData, setEditFormData] = useState({});

  // Function to handle file button click - FIXED
  const handleFileButtonClick = () => {
    // This ensures the click is properly triggered
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();

    // Extract form data
    const form = document.getElementById("editTaskForm");
    const updatedTask = {
      id: editTask.id,
      title: form.querySelector('[name="title"]').value,
      description: form.querySelector('[name="description"]').value,
      dueDate: form.querySelector('[name="dueDate"]').value,
      priority: form.querySelector('[name="priority"]').value,
      status: form.querySelector('[name="status"]')
        ? form.querySelector('[name="status"]').value
        : editTask.status,
      assignedTo: selectedUser ? selectedUser.value : editTask.assignedTo,
      tags: selectedTags ? selectedTags.map((tag) => tag.value) : editTask.tags,
      referenceLink: taskLink || editTask.referenceLink, // Include the link
    };

    try {
      if (taskAttachment) {
        // If there's a file to upload, use FormData
        const formData = new FormData();
        formData.append("file", taskAttachment);
        formData.append("taskData", JSON.stringify(updatedTask));

        const response = await fetch(
          `http://localhost:5000/api/v2/tasks/${editTask.id}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update task with file");
        }

        const updatedTaskData = await response.json();
        setTasks(
          tasks.map((task) =>
            task.id === editTask.id ? updatedTaskData.task : task
          )
        );
        setFilteredTasks(
          filteredTasks.map((task) =>
            task.id === editTask.id ? updatedTaskData.task : task
          )
        );
      } else {
        // If no file to upload, use regular JSON
        const response = await fetch(
          `http://localhost:5000/api/v2/tasks/${editTask.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedTask),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update task");
        }

        // Update local state after successful update
        const updatedTaskData = await response.json();
        setTasks(
          tasks.map((task) =>
            task.id === editTask.id ? updatedTaskData.task : task
          )
        );
        setFilteredTasks(
          filteredTasks.map((task) =>
            task.id === editTask.id ? updatedTaskData.task : task
          )
        );
      }

      closeModals();
      alert("Task updated successfully!");
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error updating task: " + error.message);
    }
  };

  // Set initial form data when a task is selected for editing
  useEffect(() => {
    if (editTask) {
      setEditFormData({
        id: editTask.id || "",
        title: editTask.title || "",
        description: editTask.description || "",
        dueDate: editTask.dueDate || "",
        priority: editTask.priority || "Medium",
        status: editTask.status || "Pending",
      });

      // Set selected tags based on task tags
      if (editTask.tags && Array.isArray(editTask.tags)) {
        setSelectedTags(
          editTask.tags.map((tag) => ({
            value: typeof tag === "object" ? tag.value || tag.id : tag,
            label: typeof tag === "object" ? tag.label || tag.name : tag,
          }))
        );
      } else {
        setSelectedTags([]);
      }

      // Set selected user based on task assignedTo
      if (editTask.assignedTo) {
        const user = users.find(
          (u) => u.value.toString() === editTask.assignedTo.toString()
        );
        setSelectedUser(user || null);
      } else {
        setSelectedUser(null);
      }
    }
  }, [editTask]);

  // Handle form field changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data if stored
    localStorage.removeItem("authToken");
    sessionStorage.clear();

    // Redirect to home page
    navigate("/");
  };

  const [viewReportTask, setViewReportTask] = useState(null);
  const [viewOnlyReportTask, setViewOnlyReportTask] = useState(null);

  // Handle viewing report
  const handleViewReport = (task) => {
    setViewReportTask(task);
  };
  const handleOnlyViewReport = (task) => {
    setViewOnlyReportTask(task);
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
  const tagsDropdownRef = useRef(null);
  const usersDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tagsDropdownRef.current &&
        !tagsDropdownRef.current.contains(event.target)
      ) {
        setIsTagsDropdownOpen(false);
      }
      if (
        usersDropdownRef.current &&
        !usersDropdownRef.current.contains(event.target)
      ) {
        setIsUsersDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTagToggle = (tag) => {
    if (selectedTags.some((t) => t.value === tag.value)) {
      setSelectedTags(selectedTags.filter((t) => t.value !== tag.value));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsUsersDropdownOpen(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query) {
      // If search is empty, reset to filtered tasks based on current filters
      let filtered = tasks;
      if (priorityFilter !== "all") {
        filtered = filtered.filter(
          (task) =>
            task.priority?.toLowerCase() === priorityFilter.toLowerCase()
        );
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (task) => task.status?.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      setFilteredTasks(filtered);
      return;
    }

    // Search across multiple columns
    const searchResults = tasks.filter((task) => {
      const searchFields = [
        task.title?.toLowerCase(),
        task.description?.toLowerCase(),
        usersMap[task.assignedTo]?.username?.toLowerCase(),
        task.tags?.join(" ").toLowerCase(),
      ];

      return searchFields.some(
        (field) => field && field.includes(query.toLowerCase())
      );
    });

    setFilteredTasks(searchResults);
  };

  // Update your useEffect for filters to include search
  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((task) => {
        const searchFields = [
          task.title?.toLowerCase(),
          task.description?.toLowerCase(),
          usersMap[task.assignedTo]?.username?.toLowerCase(),
          task.tags?.join(" ").toLowerCase(),
        ];

        return searchFields.some(
          (field) => field && field.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply other filters
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [searchQuery, priorityFilter, statusFilter, tasks, usersMap]);

  // Add these state variables to your component
  const [showReworkComment, setShowReworkComment] = useState(false);
  const [reworkComment, setReworkComment] = useState("");
  const [reworkDeadline, setReworkDeadline] = useState("");

  // Update these handler functions in your AdminDashboard.js file

  const handleMarkComplete = (taskId) => {
    // Show loading indicator if you have one
    setLoading(true);

    // Get the token from localStorage
    const token = localStorage.getItem("token");

    // API call to mark task as complete
    fetch(`http://localhost:5000/api/tasks/${taskId}/complete`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Failed to mark task as complete");
          });
        }
        return response.json();
      })
      .then((data) => {
        // Show success notification
        if (typeof toast !== "undefined") {
          toast.success("Task marked as complete!");
        } else {
          alert("Task marked as complete!");
        }

        // Close the modal
        closeModals();

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id.toString() === taskId.toString() ? data.task : task
          )
        );

        // Refresh task list to ensure it's up to date
        fetchTasks();
      })
      .catch((error) => {
        console.error("Error marking task as complete:", error);
        if (typeof toast !== "undefined") {
          toast.error(error.message || "Failed to mark task as complete.");
        } else {
          alert(error.message || "Failed to mark task as complete.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmitRework = (taskId, comment, deadline) => {
    // Validate comment
    if (!comment || comment.trim() === "") {
      if (typeof toast !== "undefined") {
        toast.error("Please provide a comment for rework.");
      } else {
        alert("Please provide a comment for rework.");
      }
      return;
    }

    // Validate deadline
    if (!deadline) {
      if (typeof toast !== "undefined") {
        toast.error("Please select a deadline for rework.");
      } else {
        alert("Please select a deadline for rework.");
      }
      return;
    }

    // Show loading indicator if you have one
    setLoading(true);

    // Get the token from localStorage
    const token = localStorage.getItem("token");

    // API call to submit task for rework
    fetch(`http://localhost:5000/api/tasks/${taskId}/rework`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        comment,
        deadline, // Sending the deadline to the backend
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Failed to submit task for rework");
          });
        }
        return response.json();
      })
      .then((data) => {
        // Show success notification
        if (typeof toast !== "undefined") {
          toast.success("Task submitted for rework!");
        } else {
          alert("Task submitted for rework!");
        }

        // Reset rework comment and deadline state
        setReworkComment("");
        setReworkDeadline("");
        setShowReworkComment(false);

        // Close the modal
        closeModals();

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id.toString() === taskId.toString() ? data.task : task
          )
        );

        // Refresh task list to ensure it's up to date
        fetchTasks();
      })
      .catch((error) => {
        console.error("Error submitting task for rework:", error);
        if (typeof toast !== "undefined") {
          toast.error(error.message || "Failed to submit task for rework.");
        } else {
          alert(error.message || "Failed to submit task for rework.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async (feedback) => {
    if (!feedback) return;

    setIsLoading(true);
    try {
      const response = await fetch("https://api.apyhub.com/ai/summarize-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apy-token":
            "APY09nsBr5rpvcTyTfQV0LUH51ZuCjJryqOqsb3QFZrdNFVi07wbuAGgafa0vx3QAFT",
        },
        body: JSON.stringify({ text: feedback }),
      });

      const result = await response.json();
      setSummary(result.data.summary);
    } catch (error) {
      console.error("Summarization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Low",
    referenceLink: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Validate file size (e.g., max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file && file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 5MB limit");
      return;
    }
    setSelectedFile(file);
    if (e.target.files && e.target.files[0]) {
      setTaskAttachment(e.target.files[0]);
      setFileUploaded(true);
    }
  };

  const validateTaskData = () => {
    const errors = [];

    if (!taskData.title.trim()) {
      errors.push("Task title is required");
    }

    if (taskData.title.length > 100) {
      errors.push("Task title cannot exceed 100 characters");
    }

    if (taskData.description && taskData.description.length > 500) {
      errors.push("Description cannot exceed 500 characters");
    }

    if (taskData.dueDate) {
      const selectedDate = new Date(taskData.dueDate);
      const today = new Date();
      if (selectedDate < today) {
        errors.push("Due date must be in the future");
      }
    }

    if (selectedFile && selectedFile.type !== "application/pdf") {
      errors.push("Only PDF files are allowed");
    }

    return errors;
  };

  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive debugging logs
    // Comprehensive debugging logs
    console.log("Raw Selected User:", selectedUser);

    // Extract user ID robustly
    const extractUserId = () => {
      if (selectedUser.value !== undefined) {
        return selectedUser.value;
      }

      // Extract name before '(' if present
      const labelName = selectedUser.label.split(" (")[0];

      // Find user by label name
      const user = users.find((u) => u.label === labelName);
      return user ? user.value || user.id : null;
    };

    const assignedUserId = extractUserId();

    console.log("Extracted User ID:", assignedUserId);
    console.log("All Users:", users);

    // Validate form data
    const validationErrors = validateTaskData();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    // Prevent multiple submissions
    if (submitting) return;

    setSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Append task data
      formData.append("title", taskData.title.trim());
      formData.append("description", taskData.description?.trim() || "");
      formData.append(
        "tags",
        JSON.stringify(selectedTags.map((tag) => tag.value))
      );
      formData.append("assignedTo", assignedUserId ? assignedUserId : null);
      formData.append("dueDate", taskData.dueDate);
      formData.append("priority", taskData.priority);
      formData.append("status", "Pending");
      formData.append("referenceLink", taskData.referenceLink?.trim() || "");

      // Append file if selected
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await axios.post(
        "http://localhost:5000/api/tasks",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Success handling
      toast.success("Task created successfully!");

      // Reset form
      setTaskData({
        title: "",
        description: "",
        dueDate: "",
        priority: "Low",
        referenceLink: "",
      });
      setSelectedTags([]);
      setSelectedUser(null);
      setSelectedFile(null);

      // Refresh tasks
      fetchTasks();
    } catch (error) {
      // Detailed error handling
      console.error("Error adding task:", error);

      if (error.response) {
        // The request was made and the server responded with a status code
        const errorMessage =
          error.response.data.message || "Failed to create task";
        toast.error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request
        toast.error("Error creating task. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar - same as before */}
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
              <a href="admin">
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="menu-item active">
              <a href="admintasks">
                <i className="fas fa-tasks"></i>
                <span>Tasks</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="users">
                <i className="fas fa-users"></i>
                <span>Users</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="menu-section">
          <h3 className="menu-title">Management</h3>
          <ul className="menu-items">
            <li className="menu-item">
              <a href="flexdue">
                <i className="fas fa-inbox"></i>
                <span>ReQuest</span>
                <span className="badge">{requestCount}</span>
              </a>
            </li>
            <li className="menu-item">
              <a href="adminsettings">
                <i className="fas fa-cogs"></i>
                <span>Settings</span>
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
      <main className="main-content">
        {/* Header - unchanged */}
        <header className="header">
          <h1 className="page-title">Welcome Admin!</h1>

          <div className="header-actions">
            <div className="user-profile">
              <div className="avatar">A</div>
              <div className="user-info">
                <div className="username">Admin User</div>
                <div className="user-role">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Grid - Task Creation */}
        <div className="task-creation-container">
          {!isExpanded ? (
            <button onClick={handleExpand} className="task-creation-expand-btn">
              <span className="flex items-center">
                <i className="fas fa-plus-circle mr-2"></i>
                Create New Task
              </span>
              <i className="fas fa-chevron-down"></i>
            </button>
          ) : (
            <div
              ref={modalRef}
              className={`task-creation-modal ${isExpanded ? "expanded" : ""}`}
            >
              <div className="task-creation-header">
                <h2>
                  <i className="fas fa-plus-circle mr-2"></i>
                  Create New Task
                </h2>
                <button onClick={handleExpand} aria-label="Close task creation">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form
                onSubmit={handleTaskFormSubmit}
                className="task-creation-form"
              >
                <div className="task-creation-column">
                  <div className="task-creation-input-group">
                    <label className="task-creation-label">Task Title</label>
                    <input
                      type="text"
                      className="task-creation-input"
                      placeholder="Enter task title"
                      value={taskData.title}
                      onChange={(e) =>
                        setTaskData({ ...taskData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="task-creation-input-group">
                    <label className="task-creation-label">Description</label>
                    <textarea
                      className="task-creation-input task-creation-input-description"
                      placeholder="Enter task description"
                      value={taskData.description}
                      onChange={(e) =>
                        setTaskData({
                          ...taskData,
                          description: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>

                  <div className="task-creation-input-group">
                    <label className="task-creation-label">Tags</label>
                    <Select
                      isMulti
                      options={tags}
                      value={selectedTags}
                      onChange={(newValue) => setSelectedTags(newValue)}
                      placeholder="Search or select tags..."
                    />
                  </div>
                </div>

                <div className="task-creation-column">
                  <div className="task-creation-input-group">
                    <label className="task-creation-label">Assigned To</label>
                    <Select
                      options={users.map((user) => ({
                        value: user.id,
                        label: formatUserLabel(user),
                      }))}
                      value={selectedUser}
                      onChange={(newValue) => setSelectedUser(newValue)}
                      placeholder="Select User"
                      isSearchable
                    />
                  </div>

                  <div className="task-creation-input-group">
                    <label className="task-creation-label">Due Date</label>
                    <input
                      type="date"
                      className="task-creation-input"
                      value={taskData.dueDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setTaskData({ ...taskData, dueDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="task-creation-input-group">
                    <label className="task-creation-label">Priority</label>
                    <select
                      className="task-creation-input"
                      value={taskData.priority}
                      onChange={(e) =>
                        setTaskData({ ...taskData, priority: e.target.value })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="task-creation-input-group">
                    <label className="task-creation-label">
                      Reference Link (Optional)
                    </label>
                    <input
                      type="url"
                      className="task-creation-input"
                      placeholder="Enter reference link"
                      value={taskData.referenceLink}
                      onChange={(e) =>
                        setTaskData({
                          ...taskData,
                          referenceLink: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="task-creation-input-group">
                    <label className="task-creation-label">
                      Attachment (Optional)
                    </label>
                    <div className="task-creation-file-input">
                      <input type="file" onChange={handleFileChange} />
                      <p>Drag and drop or click to upload</p>
                      {selectedFile && (
                        <span className="task-creation-file-name">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-full">
                  <button
                    type="submit"
                    className="task-creation-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus"></i> Create Task
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Task Table - improved with hover email functionality */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-list"></i>
              <span>Recent Tasks</span>
            </h2>
            <div className="card-actions">
              <button
                className={`card-action-btn ${loading ? "rotating" : ""}`}
                onClick={fetchTasks}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
              <button className="card-action-btn">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="search-container">
              <div className="search-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search tasks by title, description, assignee, or tags..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    onClick={() => handleSearch("")}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="task-filters">
              <div className="filter-item">
                <i className="fas fa-filter"></i>
                <span>All Tasks</span>
              </div>
              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="progress">Progress</option>
                <option value="completed">Completed</option>
                <option value="rework">Rework</option>
              </select>
            </div>
            <div className="task-table-wrapper">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Deadline</th>
                    <th>Tags</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTasks.length > 0 ? (
                    paginatedTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <div className="task-title">
                            <i className="fas fa-tasks"></i>
                            <span>{task.title}</span>
                          </div>
                          <div className="task-description">
                            {task.description}
                          </div>
                          {task.reworkDetails &&
                            task.reworkDetails.length > 0 && (
                              <div style={{maxWidth: "200px", overflowY: "hidden", maxHeight: "40px"}}>
                                <strong>Rework Comment:</strong>{" "}
                                {
                                  task.reworkDetails[
                                    task.reworkDetails.length - 1
                                  ].comment
                                }
                              </div>
                            )}
                        </td>
                        <td>
                          <div
                            className="user-avatar"
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            {/* Username display */}
                            <span>
                              {usersMap[task.assignedTo]?.username
                                .charAt(0)
                                .toUpperCase() || "U"}
                            </span>

                            {/* Tooltip with email */}
                            <div className="email-tooltip">
                              {getEmailById(task.assignedTo)}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div
                            className={`status-badge ${
                              task.status?.toLowerCase() || "pending"
                            }`}
                          >
                            {task.status === "Progress" ? (
                              <i className="fas fa-spinner fa-spin">
                                &nbsp;&nbsp;
                              </i>
                            ) : (
                              <i className="fas fa-check-circle">&nbsp;</i>
                            )}
                            <span>{task.status}</span>
                          </div>
                        </td>
                        <td>
                          <div
                            className={`priority-badge ${
                              task.priority?.toLowerCase() || "medium"
                            }`}
                          >
                            {task.priority}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`task-deadline ${
                              new Date(
                                task.reworkDetails?.length > 0
                                  ? task.reworkDetails[
                                      task.reworkDetails.length - 1
                                    ].deadline
                                  : task.dueDate
                              ) < new Date() && task.status !== "Completed"
                                ? "overdue"
                                : ""
                            }`}
                          >
                            <i className="far fa-calendar-alt"></i>
                            <span>
                              {task.reworkDetails?.length > 0
                                ? task.reworkDetails[
                                    task.reworkDetails.length - 1
                                  ].deadline
                                : task.dueDate}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="tag-list">
                            {task.tags && Array.isArray(task.tags) ? (
                              task.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span>No tags</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="task-actions">
                            <button
                              className={`page-btn task-action-btn ${
                                task.status === "Completed" ? "disabled" : ""
                              }`}
                              onClick={() => handleEditClick(task)}
                              disabled={task.status === "Completed"}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              className="task-action-btn"
                              onClick={() => handleOnlyViewReport(task)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {task.status === "Progress" && (
                              <button
                                className="task-action-btn report-btn"
                                onClick={() => handleViewReport(task)}
                              >
                                <i className="fas fa-file-alt"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-table-message">
                        <div>
                          <i className="fas fa-search"></i>
                          <p>No tasks found</p>
                          {searchQuery && (
                            <p>Try adjusting your search or filters</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Add this right after your task table, inside the card-body div */}
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing{" "}
                  {filteredTasks.length > 0
                    ? (currentPage - 1) * tasksPerPage + 1
                    : 0}{" "}
                  to{" "}
                  {Math.min(currentPage * tasksPerPage, filteredTasks.length)}{" "}
                  of {filteredTasks.length} tasks
                </div>

                <div className="per-page-selector">
                  <span>Show</span>
                  <select
                    value={tasksPerPage}
                    onChange={handleTasksPerPageChange}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={10}>10</option>
                  </select>
                  <span>per page</span>
                </div>

                <div className="pagination-controls">
                  <button
                    className={`page-btn ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>

                  <button
                    className={`page-btn ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-angle-left"></i>
                  </button>

                  {getPageNumbers().map((pageNum, index) =>
                    pageNum === "..." ? (
                      <span key={`ellipsis-${index}`} className="page-ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        className={`page-btn ${
                          currentPage === pageNum ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  <button
                    className={`page-btn ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-angle-right"></i>
                  </button>

                  <button
                    className={`page-btn ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </button>
                </div>
              </div>

              {/* Edit Task Modal */}
              {editTask && (
                <div className="modal-overlay">
                  <div className="modal-container">
                    <div className="modal-header">
                      <h2>Edit Task</h2>
                      <button className="modal-close" onClick={closeModals}>
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <form id="editTaskForm">
                        <div className="form-group">
                          <label className="form-label">Task Title</label>
                          <input
                            type="text"
                            name="title"
                            className="form-control"
                            placeholder="Enter task title"
                            defaultValue={editTask.title}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea
                            name="description" // Add name attribute
                            className="form-control"
                            placeholder="Enter task description"
                            value={editFormData.description}
                            onChange={handleEditFormChange}
                            rows="3"
                          ></textarea>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tags:</label>
                          <Select
                            isMulti
                            options={tags}
                            value={selectedTags} // Change from defaultValue to value
                            onChange={(newValue) => setSelectedTags(newValue)}
                            placeholder="Search or select tags..."
                            className="multi-select"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Assigned To</label>
                          <Select
                            options={users.map((user) => ({
                              value: user.value || user.id,
                              label: formatUserLabel(user),
                            }))}
                            value={selectedUser} // Change from defaultValue to value
                            onChange={(newValue) => setSelectedUser(newValue)}
                            placeholder="Select User"
                            isSearchable
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Due Date</label>
                          <input
                            type="date"
                            name="dueDate" // Add name attribute
                            className="form-control"
                            min={new Date().toISOString().split("T")[0]}
                            value={editFormData.dueDate}
                            onChange={handleEditFormChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Priority</label>
                          <select
                            name="priority" // Add name attribute
                            className="form-control form-select drop-down"
                            value={editFormData.priority}
                            onChange={handleEditFormChange}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </form>
                      <div className="form-group">
                        <label className="form-label">Resource Link</label>
                        <input
                          type="url"
                          name="link"
                          className="form-control"
                          placeholder="Enter a resource link (optional)"
                          value={taskLink}
                          onChange={handleLinkChange}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Attachment</label>
                        <div className="file-upload-container">
                          {/* Hidden file input that will be triggered by the button */}
                          <input
                            type="file"
                            id="taskAttachment"
                            name="attachment"
                            ref={fileInputRef}
                            className="file-input-hidden"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                          />

                          {editTask.file && !fileUploaded ? (
                            <div className="current-file">
                              <span>
                                Current file: {editTask.file.originalname}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={handleFileButtonClick}
                              >
                                Change File
                              </button>
                            </div>
                          ) : (
                            <div className="file-upload-field">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleFileButtonClick}
                              >
                                {fileUploaded ? "Change File" : "Upload File"}
                              </button>
                              {fileUploaded && taskAttachment && (
                                <div className="file-selected">
                                  <span>
                                    File selected: {taskAttachment.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <small className="form-text text-muted">
                          {editTask.file && !fileUploaded
                            ? "Upload a new file to replace the current attachment"
                            : "Upload a file attachment (optional)"}
                        </small>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteClick(editFormData.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={closeModals}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleEditFormSubmit}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {deleteTaskId && (
                <div className="modal-overlay">
                  <div className="modal-container delete-modal">
                    <div className="modal-header">
                      <h2>Confirm Deletion</h2>
                      <button className="modal-close" onClick={closeModalss}>
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="delete-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="48"
                          height="48"
                        >
                          <path
                            fill="var(--danger)"
                            d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"
                          />
                        </svg>
                      </div>
                      <p>
                        Are you sure you want to delete this task? This action
                        cannot be undone.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={closeModalss}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          console.log(
                            "Delete button clicked for task ID:",
                            deleteTaskId
                          );
                          deleteTask(deleteTaskId)
                            .then(() => {
                              console.log("Delete operation completed");
                              closeModals();
                              // Consider refreshing your task list here if needed
                              // For example: fetchTasks(); or invalidate a query cache
                            })
                            .catch((err) => {
                              console.error("Error in delete operation:", err);
                              // Maybe show an error notification
                            });
                        }}
                      >
                        Delete Task
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Report View Modal */}
              {viewReportTask && (
                <div className="modal-overlay">
                  <div className="modal-container report-modal">
                    <div className="modal-header">
                      <h2>Task Report</h2>
                      <button className="modal-close" onClick={closeModals}>
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="report-content">
                        <h3 className="report-title">{viewReportTask.title}</h3>
                        <h6 className="report-title">
                          {viewReportTask.description}
                        </h6>

                        {/* Submission Timeline */}
                        {viewReportTask.reworkDetails &&
                        viewReportTask.reworkDetails.length > 0 ? (
                          <div className="submission-timeline">
                            <h4>Submission History</h4>

                            {/* Current/Latest Submission */}
                            <div className="submission-card current">
                              <div className="submission-header">
                                <div className="submission-badge latest">
                                  <i className="fas fa-star"></i> Latest
                                  Submission
                                </div>
                                <div className="submission-date">
                                  {viewReportTask.reworkDetails.length > 0 &&
                                  viewReportTask.reworkDetails[
                                    viewReportTask.reworkDetails.length - 1
                                  ].completionDetails
                                    ? new Date(
                                        viewReportTask.reworkDetails[
                                          viewReportTask.reworkDetails.length -
                                            1
                                        ].completionDetails.completedDate
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : viewReportTask.completionDetails &&
                                      new Date(
                                        viewReportTask.completionDetails.completedDate
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </div>
                              </div>

                              <div className="submission-content">
                                {/* Latest Feedback */}
                                <div className="feedback-section">
                                  <div className="rework-request-section">
                                    <h6>Rework Request</h6>
                                    <p className="rework-comment">
                                      {viewReportTask.reworkDetails.length >
                                        0 &&
                                        viewReportTask.reworkDetails[
                                          viewReportTask.reworkDetails.length -
                                            1
                                        ].comment}
                                    </p>
                                    <p className="rework-deadline">
                                      <i className="far fa-calendar-alt"></i>{" "}
                                      Deadline:{" "}
                                      {viewReportTask.reworkDetails.length >
                                        0 &&
                                        viewReportTask.reworkDetails[
                                          viewReportTask.reworkDetails.length -
                                            1
                                        ].deadline}
                                    </p>
                                  </div>
                                  <div className="section-header">
                                    <h5>Feedback</h5>
                                    <button
                                      className="btn ai-summarize-btn"
                                      onClick={() =>
                                        handleSummarize(
                                          viewReportTask.reworkDetails.length >
                                            0 &&
                                            viewReportTask.reworkDetails[
                                              viewReportTask.reworkDetails
                                                .length - 1
                                            ].completionDetails
                                            ? viewReportTask.reworkDetails[
                                                viewReportTask.reworkDetails
                                                  .length - 1
                                              ].completionDetails.feedback
                                            : viewReportTask.completionDetails
                                            ? viewReportTask.completionDetails
                                                .feedback
                                            : ""
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      <i className="fas fa-magic magic-icon"></i>{" "}
                                      {isLoading
                                        ? "Summarizing..."
                                        : "AI Summarize"}
                                    </button>
                                  </div>
                                  <div className="feedback-container">
                                    <p className="report-text">
                                      {summary
                                        ? summary
                                        : viewReportTask.reworkDetails.length >
                                            0 &&
                                          viewReportTask.reworkDetails[
                                            viewReportTask.reworkDetails
                                              .length - 1
                                          ].completionDetails
                                        ? viewReportTask.reworkDetails[
                                            viewReportTask.reworkDetails
                                              .length - 1
                                          ].completionDetails.feedback
                                        : viewReportTask.completionDetails
                                        ? viewReportTask.completionDetails
                                            .feedback
                                        : "No feedback provided."}
                                    </p>
                                  </div>
                                </div>

                                {/* Latest Reference Link */}
                                {((viewReportTask.reworkDetails.length > 0 &&
                                  viewReportTask.reworkDetails[
                                    viewReportTask.reworkDetails.length - 1
                                  ].completionDetails &&
                                  viewReportTask.reworkDetails[
                                    viewReportTask.reworkDetails.length - 1
                                  ].completionDetails.link) ||
                                  (viewReportTask.completionDetails &&
                                    viewReportTask.completionDetails.link)) && (
                                  <div className="reference-section">
                                    <h5>Reference Link</h5>
                                    <a
                                      href={
                                        viewReportTask.reworkDetails.length >
                                          0 &&
                                        viewReportTask.reworkDetails[
                                          viewReportTask.reworkDetails.length -
                                            1
                                        ].completionDetails
                                          ? viewReportTask.reworkDetails[
                                              viewReportTask.reworkDetails
                                                .length - 1
                                            ].completionDetails.link
                                          : viewReportTask.completionDetails
                                              .link
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="reference-link"
                                    >
                                      <i className="fas fa-external-link-alt"></i>{" "}
                                      View Reference
                                    </a>
                                  </div>
                                )}

                                {/* Latest Attachment */}
                                {((viewReportTask.reworkDetails.length > 0 &&
                                  viewReportTask.reworkDetails[
                                    viewReportTask.reworkDetails.length - 1
                                  ].attachmentFile) ||
                                  viewReportTask.attachmentFile) && (
                                  <div className="attachment-section">
                                    <h5>Attachment</h5>
                                    <div className="attachment-actions">
                                      <button
                                        className="btn btn-secondary download-btn"
                                        onClick={() =>
                                          handleDownload(
                                            viewReportTask.reworkDetails
                                              .length > 0 &&
                                              viewReportTask.reworkDetails[
                                                viewReportTask.reworkDetails
                                                  .length - 1
                                              ].attachmentFile
                                              ? viewReportTask.reworkDetails[
                                                  viewReportTask.reworkDetails
                                                    .length - 1
                                                ].attachmentFile.filename
                                              : viewReportTask.attachmentFile
                                                  .filename
                                          )
                                        }
                                      >
                                        <i className="fas fa-download"></i>{" "}
                                        Download
                                      </button>
                                      <button
  className="btn btn-primary view-btn"
  onClick={() => {
    const rework = viewReportTask.reworkDetails;
    const latestFile =
      rework.length > 0 && rework[rework.length - 1].attachmentFile
        ? rework[rework.length - 1].attachmentFile
        : viewReportTask.attachmentFile;

    const fileUrl = `http://localhost:5000/api/tasks/view/${latestFile.filename}`;
    const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(latestFile.filename);
    console.log(fileUrl)

    if (isImage) {
      // Log the URL for debugging
      console.log("Opening image in modal:", fileUrl);
      
      // For images, open a modal/lightbox
      setImagePreview({
        isOpen: true,
        url: fileUrl,
        title: latestFile.originalname || "Image Preview",
        filename: latestFile.filename
      });
    } else {
      // For PDFs and other file types, open in a new tab
      window.open(fileUrl, "_blank");
    }
  }}
>
  <i className="fas fa-eye"></i> View Document
</button>

                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Previous Rework Requests and Submissions */}
                            <div className="submission-history-container">
                              <h5>Previous Submissions</h5>
                              <div className="timeline">
                                {viewReportTask.reworkDetails
                                  .slice(0, -1)
                                  .reverse()
                                  .map((rework, index) => (
                                    <div
                                      className="timeline-item"
                                      key={`rework-${index}`}
                                    >
                                      <div className="timeline-point">
                                        <div className="timeline-marker"></div>
                                      </div>
                                      <div className="timeline-content submission-card">
                                        <div className="submission-header">
                                          <div className="submission-badge rework">
                                            <i className="fas fa-redo"></i>{" "}
                                            Rework #
                                            {viewReportTask.reworkDetails
                                              .length -
                                              index -
                                              1}
                                          </div>
                                          <div className="submission-date">
                                            {rework.completionDetails
                                              ? new Date(
                                                  rework.completionDetails.completedDate
                                                ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })
                                              : new Date(
                                                  rework.date
                                                ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                })}
                                          </div>
                                        </div>

                                        <div className="submission-content">
                                          {/* Rework Request */}
                                          <div className="rework-request-section">
                                            <h6>Rework Request</h6>
                                            <p className="rework-comment">
                                              {rework.comment}
                                            </p>
                                            <p className="rework-deadline">
                                              <i className="far fa-calendar-alt"></i>{" "}
                                              Deadline: {rework.deadline}
                                            </p>
                                          </div>

                                          {/* Submission Response (if available) */}
                                          {rework.completionDetails && (
                                            <>
                                              <div className="submission-response-section">
                                                <h6>Submission Response</h6>
                                                <p className="response-feedback">
                                                  {
                                                    rework.completionDetails
                                                      .feedback
                                                  }
                                                </p>

                                                {rework.completionDetails
                                                  .link && (
                                                  <a
                                                    href={
                                                      rework.completionDetails
                                                        .link
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="reference-link"
                                                  >
                                                    <i className="fas fa-external-link-alt"></i>{" "}
                                                    View Reference
                                                  </a>
                                                )}
                                              </div>

                                              {rework.attachmentFile && (
                                                <div className="attachment-section compact">
                                                  <h6>Attachment</h6>
                                                  <div className="attachment-actions">
                                                    <button
                                                      className="btn btn-sm btn-secondary"
                                                      onClick={() =>
                                                        handleDownload(
                                                          rework.attachmentFile
                                                            .filename
                                                        )
                                                      }
                                                    >
                                                      <i className="fas fa-download"></i>{" "}
                                                      Download
                                                    </button>
                                                    <button
                                                      className="btn btn-sm btn-primary"
                                                      onClick={() =>
                                                        window.open(
                                                          `http://localhost:5000/api/tasks/view/${rework.attachmentFile.filename}`,
                                                          "_blank"
                                                        )
                                                      }
                                                    >
                                                      <i className="fas fa-eye"></i>{" "}
                                                      View
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                {/* Original Submission */}
                                {viewReportTask.completionDetails && (
                                  <div className="timeline-item">
                                    <div className="timeline-point">
                                      <div className="timeline-marker original"></div>
                                    </div>
                                    <div className="timeline-content submission-card">
                                      <div className="submission-header">
                                        <div className="submission-badge original">
                                          <i className="fas fa-flag"></i>{" "}
                                          Original Submission
                                        </div>
                                        <div className="submission-date">
                                          {new Date(
                                            viewReportTask.completionDetails.completedDate
                                          ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                      </div>

                                      <div className="submission-content">
                                        <div className="feedback-section">
                                          <h6>Feedback</h6>
                                          <p className="report-text">
                                            {viewReportTask.completionDetails
                                              .feedback ||
                                              "No feedback provided."}
                                          </p>
                                        </div>

                                        {viewReportTask.completionDetails
                                          .link && (
                                          <div className="reference-section">
                                            <h6>Reference Link</h6>
                                            <a
                                              href={
                                                viewReportTask.completionDetails
                                                  .link
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="reference-link"
                                            >
                                              <i className="fas fa-external-link-alt"></i>{" "}
                                              View Reference
                                            </a>
                                          </div>
                                        )}

                                        {viewReportTask.attachmentFile && (
                                          <div className="attachment-section compact">
                                            <h6>Attachment</h6>
                                            <div className="attachment-actions">
                                              <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() =>
                                                  handleDownload(
                                                    viewReportTask
                                                      .attachmentFile.filename
                                                  )
                                                }
                                              >
                                                <i className="fas fa-download"></i>{" "}
                                                Download
                                              </button>
                                              <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() =>
                                                  window.open(
                                                    `http://localhost:5000/api/tasks/view/${viewReportTask.attachmentFile.filename}`,
                                                    "_blank"
                                                  )
                                                }
                                              >
                                                <i className="fas fa-eye"></i>{" "}
                                                View
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // If no rework history, just show original submission
                          <div className="original-submission">
                            {viewReportTask.completionDetails && (
                              <>
                                <div className="report-section feedback-section">
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <h4>Feedback</h4>
                                    <button
                                      className="btn ai-summarize-btn"
                                      onClick={() =>
                                        handleSummarize(
                                          viewReportTask.completionDetails
                                            .feedback
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      <i className="fas fa-magic magic-icon"></i>{" "}
                                      {isLoading
                                        ? "Summarizing..."
                                        : "AI Summarize"}
                                    </button>
                                  </div>
                                  <div className="feedback-container">
                                    <p className="report-text">
                                      {summary
                                        ? summary
                                        : viewReportTask.completionDetails
                                            .feedback ||
                                          "No feedback provided."}
                                    </p>
                                  </div>
                                </div>

                                {viewReportTask.completionDetails.link && (
                                  <div className="report-section">
                                    <h4>Reference Link</h4>
                                    <a
                                      href={
                                        viewReportTask.completionDetails.link
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="reference-link"
                                    >
                                      <i className="fas fa-external-link-alt"></i>{" "}
                                      View Reference
                                    </a>
                                  </div>
                                )}

                                <div className="report-section">
                                  <h4>Submitted On</h4>
                                  <p className="report-date">
                                    {new Date(
                                      viewReportTask.completionDetails.completedDate
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </>
                            )}

                            {viewReportTask.attachmentFile && (
                              <div className="report-section">
                                <h4>Attachment</h4>
                                <div className="attachment-actions">
                                  <button
                                    className="btn btn-secondary download-btn"
                                    onClick={() =>
                                      handleDownload(
                                        viewReportTask.attachmentFile.filename
                                      )
                                    }
                                  >
                                    <i className="fas fa-download"></i> Download{" "}
                                    {viewReportTask.attachmentFile.originalName}
                                  </button>
                                  <button
  className="btn btn-primary view-btn"
  onClick={() => {
    const file = viewOnlyReportTask.attachmentFile;
    const fileUrl = `http://localhost:5000/api/tasks/view/${file.filename}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename);
    console.log(fileUrl)
    
    if (isImage) {
      // Log the URL for debugging
      console.log("Opening image in modal:", fileUrl);
      
      // For images, open a modal/lightbox
      setImagePreview({
        isOpen: true,
        url: fileUrl,
        title: file.originalname || "Image Preview",
        filename: file.filename
      });
    } else {
      // For PDFs and other file types, open in a new tab
      window.open(fileUrl, "_blank");
    }
  }}
>
  <i className="fas fa-eye"></i> View Document
</button>

                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rework comment section - initially hidden */}
                        {showReworkComment && (
                          <div className="report-section rework-input-section">
                            <h4>Rework Details</h4>

                            {/* Rework Comment Input */}
                            <textarea
                              className="rework-comment-input"
                              placeholder="Add your comments for rework..."
                              value={reworkComment}
                              onChange={(e) => setReworkComment(e.target.value)}
                            />

                            {/* Rework Deadline Input */}
                            <div className="rework-deadline">
                              <label className="form-label">Due Date</label>
                              <input
                                type="date"
                                className="form-control"
                                value={reworkDeadline}
                                onChange={(e) =>
                                  setReworkDeadline(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="modal-footer">
                      {!showReworkComment ? (
                        <>
                          <button
                            className="btn btn-warning"
                            onClick={() => {
                              setShowReworkComment(true);
                              // Use setTimeout to ensure DOM updates before scrolling
                              setTimeout(() => {
                                const modalBody =
                                  document.querySelector(".modal-body");
                                if (modalBody) {
                                  modalBody.scrollTo({
                                    top: modalBody.scrollHeight,
                                    behavior: "smooth",
                                  });
                                }
                              }, 100);
                            }}
                          >
                            <i className="fas fa-redo"></i> Rework
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={() =>
                              handleMarkComplete(viewReportTask.id)
                            }
                          >
                            <i className="fas fa-check"></i> Mark as Complete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setShowReworkComment(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              handleSubmitRework(
                                viewReportTask.id,
                                reworkComment,
                                reworkDeadline
                              )
                            }
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
              {/* Report View Modal */}
              {viewOnlyReportTask && (
                <div className="modal-overlay">
                  <div className="modal-container report-modal">
                    <div className="modal-header">
                      <h2>Task Report</h2>
                      <button className="modal-close" onClick={closeModals}>
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="report-content">
                        <h3 className="report-title">
                          {viewOnlyReportTask.title}
                        </h3>
                        <h6 className="report-title">
                          {viewOnlyReportTask.description}
                        </h6>

                        {/* Submission Timeline */}
                        {viewOnlyReportTask.reworkDetails &&
                        viewOnlyReportTask.reworkDetails.length > 0 ? (
                          <div className="submission-timeline">
                            <h4>Submission History</h4>

                            {/* Current/Latest Submission */}
                            <div className="submission-card current">
                              <div className="submission-header">
                                <div className="submission-badge latest">
                                  <i className="fas fa-star"></i> Latest
                                  Submission
                                </div>
                                <div className="submission-date">
                                  {viewOnlyReportTask.reworkDetails.length >
                                    0 &&
                                  viewOnlyReportTask.reworkDetails[
                                    viewOnlyReportTask.reworkDetails.length - 1
                                  ].completionDetails
                                    ? new Date(
                                        viewOnlyReportTask.reworkDetails[
                                          viewOnlyReportTask.reworkDetails
                                            .length - 1
                                        ].completionDetails.completedDate
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : viewOnlyReportTask.completionDetails &&
                                      new Date(
                                        viewOnlyReportTask.completionDetails.completedDate
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </div>
                              </div>

                              <div className="submission-content">
                                {/* Latest Feedback */}
                                <div className="feedback-section">
                                  <div className="rework-request-section">
                                    <h6>Rework Request</h6>
                                    <p className="rework-comment">
                                      {viewOnlyReportTask.reworkDetails.length >
                                        0 &&
                                        viewOnlyReportTask.reworkDetails[
                                          viewOnlyReportTask.reworkDetails
                                            .length - 1
                                        ].comment}
                                    </p>
                                    <p className="rework-deadline">
                                      <i className="far fa-calendar-alt"></i>{" "}
                                      Deadline:{" "}
                                      {viewOnlyReportTask.reworkDetails.length >
                                        0 &&
                                        viewOnlyReportTask.reworkDetails[
                                          viewOnlyReportTask.reworkDetails
                                            .length - 1
                                        ].deadline}
                                    </p>
                                  </div>
                                  <div className="section-header">
                                    <h5>Feedback</h5>
                                    <button
                                      className="btn ai-summarize-btn"
                                      onClick={() =>
                                        handleSummarize(
                                          viewOnlyReportTask.reworkDetails
                                            .length > 0 &&
                                            viewOnlyReportTask.reworkDetails[
                                              viewOnlyReportTask.reworkDetails
                                                .length - 1
                                            ].completionDetails
                                            ? viewOnlyReportTask.reworkDetails[
                                                viewOnlyReportTask.reworkDetails
                                                  .length - 1
                                              ].completionDetails.feedback
                                            : viewOnlyReportTask.completionDetails
                                            ? viewOnlyReportTask
                                                .completionDetails.feedback
                                            : ""
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      <i className="fas fa-magic magic-icon"></i>{" "}
                                      {isLoading
                                        ? "Summarizing..."
                                        : "AI Summarize"}
                                    </button>
                                  </div>
                                  <div className="feedback-container">
                                    <p className="report-text">
                                      {summary
                                        ? summary
                                        : viewOnlyReportTask.reworkDetails
                                            .length > 0 &&
                                          viewOnlyReportTask.reworkDetails[
                                            viewOnlyReportTask.reworkDetails
                                              .length - 1
                                          ].completionDetails
                                        ? viewOnlyReportTask.reworkDetails[
                                            viewOnlyReportTask.reworkDetails
                                              .length - 1
                                          ].completionDetails.feedback
                                        : viewOnlyReportTask.completionDetails
                                        ? viewOnlyReportTask.completionDetails
                                            .feedback
                                        : "No feedback provided."}
                                    </p>
                                  </div>
                                </div>

                                {/* Latest Reference Link */}
                                {((viewOnlyReportTask.reworkDetails.length >
                                  0 &&
                                  viewOnlyReportTask.reworkDetails[
                                    viewOnlyReportTask.reworkDetails.length - 1
                                  ].completionDetails &&
                                  viewOnlyReportTask.reworkDetails[
                                    viewOnlyReportTask.reworkDetails.length - 1
                                  ].completionDetails.link) ||
                                  (viewOnlyReportTask.completionDetails &&
                                    viewOnlyReportTask.completionDetails
                                      .link)) && (
                                  <div className="reference-section">
                                    <h5>Reference Link</h5>
                                    <a
                                      href={
                                        viewOnlyReportTask.reworkDetails
                                          .length > 0 &&
                                        viewOnlyReportTask.reworkDetails[
                                          viewOnlyReportTask.reworkDetails
                                            .length - 1
                                        ].completionDetails
                                          ? viewOnlyReportTask.reworkDetails[
                                              viewOnlyReportTask.reworkDetails
                                                .length - 1
                                            ].completionDetails.link
                                          : viewOnlyReportTask.completionDetails
                                              .link
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="reference-link"
                                    >
                                      <i className="fas fa-external-link-alt"></i>{" "}
                                      View Reference
                                    </a>
                                  </div>
                                )}

                                {/* Latest Attachment */}
                                {((viewOnlyReportTask.reworkDetails.length >
                                  0 &&
                                  viewOnlyReportTask.reworkDetails[
                                    viewOnlyReportTask.reworkDetails.length - 1
                                  ].attachmentFile) ||
                                  viewOnlyReportTask.attachmentFile) && (
                                  <div className="attachment-section">
                                    <h5>Attachment</h5>
                                    <div className="attachment-actions">
                                      <button
                                        className="btn btn-secondary download-btn"
                                        onClick={() =>
                                          handleDownload(
                                            viewOnlyReportTask.reworkDetails
                                              .length > 0 &&
                                              viewOnlyReportTask.reworkDetails[
                                                viewOnlyReportTask.reworkDetails
                                                  .length - 1
                                              ].attachmentFile
                                              ? viewOnlyReportTask
                                                  .reworkDetails[
                                                  viewOnlyReportTask
                                                    .reworkDetails.length - 1
                                                ].attachmentFile.filename
                                              : viewOnlyReportTask
                                                  .attachmentFile.filename
                                          )
                                        }
                                      >
                                        <i className="fas fa-download"></i>{" "}
                                        Download
                                      </button>
                                      <button
  className="btn btn-primary view-btn"
  onClick={() => {
    const rework = viewReportTask.reworkDetails;
    const latestFile =
      rework.length > 0 && rework[rework.length - 1].attachmentFile
        ? rework[rework.length - 1].attachmentFile
        : viewReportTask.attachmentFile;

    const fileUrl = `http://localhost:5000/api/tasks/view/${latestFile.filename}`;
    const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(latestFile.filename);
    console.log(fileUrl)

    if (isImage) {
      // Log the URL for debugging
      console.log("Opening image in modal:", fileUrl);
      
      // For images, open a modal/lightbox
      setImagePreview({
        isOpen: true,
        url: fileUrl,
        title: latestFile.originalname || "Image Preview",
        filename: latestFile.filename
      });
    } else {
      // For PDFs and other file types, open in a new tab
      window.open(fileUrl, "_blank");
    }
  }}
>
  <i className="fas fa-eye"></i> View Document
</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Previous Rework Requests and Submissions */}
                            <div className="submission-history-container">
                              <h5>Previous Submissions</h5>
                              <div className="timeline">
                                {viewOnlyReportTask.reworkDetails
                                  .slice(0, -1)
                                  .reverse()
                                  .map((rework, index) => (
                                    <div
                                      className="timeline-item"
                                      key={`rework-${index}`}
                                    >
                                      <div className="timeline-point">
                                        <div className="timeline-marker"></div>
                                      </div>
                                      <div className="timeline-content submission-card">
                                        <div className="submission-header">
                                          <div className="submission-badge rework">
                                            <i className="fas fa-redo"></i>{" "}
                                            Rework #
                                            {viewOnlyReportTask.reworkDetails
                                              .length -
                                              index -
                                              1}
                                          </div>
                                          <div className="submission-date">
                                            {rework.completionDetails
                                              ? new Date(
                                                  rework.completionDetails.completedDate
                                                ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })
                                              : new Date(
                                                  rework.date
                                                ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                })}
                                          </div>
                                        </div>

                                        <div className="submission-content">
                                          {/* Rework Request */}
                                          <div className="rework-request-section">
                                            <h6>Rework Request</h6>
                                            <p className="rework-comment">
                                              {rework.comment}
                                            </p>
                                            <p className="rework-deadline">
                                              <i className="far fa-calendar-alt"></i>{" "}
                                              Deadline: {rework.deadline}
                                            </p>
                                          </div>

                                          {/* Submission Response (if available) */}
                                          {rework.completionDetails && (
                                            <>
                                              <div className="submission-response-section">
                                                <h6>Submission Response</h6>
                                                <p className="response-feedback">
                                                  {
                                                    rework.completionDetails
                                                      .feedback
                                                  }
                                                </p>

                                                {rework.completionDetails
                                                  .link && (
                                                  <a
                                                    href={
                                                      rework.completionDetails
                                                        .link
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="reference-link"
                                                  >
                                                    <i className="fas fa-external-link-alt"></i>{" "}
                                                    View Reference
                                                  </a>
                                                )}
                                              </div>

                                              {rework.attachmentFile && (
                                                <div className="attachment-section compact">
                                                  <h6>Attachment</h6>
                                                  <div className="attachment-actions">
                                                    <button
                                                      className="btn btn-sm btn-secondary"
                                                      onClick={() =>
                                                        handleDownload(
                                                          rework.attachmentFile
                                                            .filename
                                                        )
                                                      }
                                                    >
                                                      <i className="fas fa-download"></i>{" "}
                                                      Download
                                                    </button>
                                                    <button
                                                      className="btn btn-sm btn-primary"
                                                      onClick={() =>
                                                        window.open(
                                                          `http://localhost:5000/api/tasks/view/${rework.attachmentFile.filename}`,
                                                          "_blank"
                                                        )
                                                      }
                                                    >
                                                      <i className="fas fa-eye"></i>{" "}
                                                      View
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                {/* Original Submission */}
                                {viewOnlyReportTask.completionDetails && (
                                  <div className="timeline-item">
                                    <div className="timeline-point">
                                      <div className="timeline-marker original"></div>
                                    </div>
                                    <div className="timeline-content submission-card">
                                      <div className="submission-header">
                                        <div className="submission-badge original">
                                          <i className="fas fa-flag"></i>{" "}
                                          Original Submission
                                        </div>
                                        <div className="submission-date">
                                          {new Date(
                                            viewOnlyReportTask.completionDetails.completedDate
                                          ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                      </div>

                                      <div className="submission-content">
                                        <div className="feedback-section">
                                          <h6>Feedback</h6>
                                          <p className="report-text">
                                            {viewOnlyReportTask
                                              .completionDetails.feedback ||
                                              "No feedback provided."}
                                          </p>
                                        </div>

                                        {viewOnlyReportTask.completionDetails
                                          .link && (
                                          <div className="reference-section">
                                            <h6>Reference Link</h6>
                                            <a
                                              href={
                                                viewOnlyReportTask
                                                  .completionDetails.link
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="reference-link"
                                            >
                                              <i className="fas fa-external-link-alt"></i>{" "}
                                              View Reference
                                            </a>
                                          </div>
                                        )}

                                        {viewOnlyReportTask.attachmentFile && (
                                          <div className="attachment-section compact">
                                            <h6>Attachment</h6>
                                            <div className="attachment-actions">
                                              <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() =>
                                                  handleDownload(
                                                    viewOnlyReportTask
                                                      .attachmentFile.filename
                                                  )
                                                }
                                              >
                                                <i className="fas fa-download"></i>{" "}
                                                Download
                                              </button>
                                              <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() =>
                                                  window.open(
                                                    `http://localhost:5000/api/tasks/view/${viewOnlyReportTask.attachmentFile.filename}`,
                                                    "_blank"
                                                  )
                                                }
                                              >
                                                <i className="fas fa-eye"></i>{" "}
                                                View
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // If no rework history, just show original submission
                          <div className="original-submission">
                            {viewOnlyReportTask.completionDetails && (
                              <>
                                <div className="report-section feedback-section">
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <h4>Feedback</h4>
                                    <button
                                      className="btn ai-summarize-btn"
                                      onClick={() =>
                                        handleSummarize(
                                          viewOnlyReportTask.completionDetails
                                            .feedback
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      <i className="fas fa-magic magic-icon"></i>{" "}
                                      {isLoading
                                        ? "Summarizing..."
                                        : "AI Summarize"}
                                    </button>
                                  </div>
                                  <div className="feedback-container">
                                    <p className="report-text">
                                      {summary
                                        ? summary
                                        : viewOnlyReportTask.completionDetails
                                            .feedback ||
                                          "No feedback provided."}
                                    </p>
                                  </div>
                                </div>

                                {viewOnlyReportTask.completionDetails.link && (
                                  <div className="report-section">
                                    <h4>Reference Link</h4>
                                    <a
                                      href={
                                        viewOnlyReportTask.completionDetails
                                          .link
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="reference-link"
                                    >
                                      <i className="fas fa-external-link-alt"></i>{" "}
                                      View Reference
                                    </a>
                                  </div>
                                )}

                                <div className="report-section">
                                  <h4>Submitted On</h4>
                                  <p className="report-date">
                                    {new Date(
                                      viewOnlyReportTask.completionDetails.completedDate
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </>
                            )}

                            {viewOnlyReportTask.attachmentFile && (
                              <div className="report-section">
                                <h4>Attachment</h4>
                                <div className="attachment-actions">
                                  <button
                                    className="btn btn-secondary download-btn"
                                    onClick={() =>
                                      handleDownload(
                                        viewOnlyReportTask.attachmentFile
                                          .filename
                                      )
                                    }
                                  >
                                    <i className="fas fa-download"></i> Download{" "}
                                    {
                                      viewOnlyReportTask.attachmentFile
                                        .originalName
                                    }
                                  </button>
                                  <button
  className="btn btn-primary view-btn"
  onClick={() => {
    const file = viewOnlyReportTask.attachmentFile;
    const fileUrl = `http://localhost:5000/api/tasks/view/${file.filename}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename);
    
    console.log(fileUrl)
    if (isImage) {
      // Log the URL for debugging
      console.log("Opening image in modal:", fileUrl);
      
      // For images, open a modal/lightbox
      setImagePreview({
        isOpen: true,
        url: fileUrl,
        title: file.originalname || "Image Preview",
        filename: file.filename
      });
    } else {
      // For PDFs and other file types, open in a new tab
      window.open(fileUrl, "_blank");
    }
  }}
>
  <i className="fas fa-eye"></i> View Document
</button>

                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rework comment section - initially hidden */}
                        {showReworkComment && (
                          <div className="report-section rework-input-section">
                            <h4>Rework Details</h4>

                            {/* Rework Comment Input */}
                            <textarea
                              className="rework-comment-input"
                              placeholder="Add your comments for rework..."
                              value={reworkComment}
                              onChange={(e) => setReworkComment(e.target.value)}
                            />

                            {/* Rework Deadline Input */}
                            <div className="rework-deadline">
                              <label className="form-label">Due Date</label>
                              <input
                                type="date"
                                className="form-control"
                                value={reworkDeadline}
                                onChange={(e) =>
                                  setReworkDeadline(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}


{imagePreview.isOpen && (
  <div className="modal-overlayy" onClick={() => setImagePreview({ ...imagePreview, isOpen: false })}>
    <div className="modal-contentt" onClick={(e) => e.stopPropagation()}>
      <div className="modal-headerr">
        <h3>{imagePreview.title}</h3>
        <button 
          className="close-btn"
          onClick={() => setImagePreview({ ...imagePreview, isOpen: false })}
        >
          &times;
        </button>
      </div>
      <div className="modal-body">
      <img 
      src={`http://localhost:5000/uploads/${imagePreview.filename}`} 
      alt={imagePreview.title} 
    />

      </div>
    </div>
  </div>
)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
        .modal-bodyy img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}
  .modal-overlayy {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-contentt {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  position: relative;
}

.modal-headerr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}


.modal-bodyy {
  display: flex;
  justify-content: center;
  align-items: center;
}
          /* Report button styles */
          .report-btn {
            color: var(--primary);
          }

          .report-btn:hover {
            color: #2b6cb0;
            background-color: rgba(66, 153, 225, 0.1);
          }

          /* Report modal styles */
          .report-modal {
            max-width: 600px;
          }

          .report-content {
            padding: 15px 0;
          }

          .report-section {
            margin-bottom: 20px;
          }

          .report-section h4 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #4a5568;
          }

          .report-text,
          .report-comment {
            background-color: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            color: #2d3748;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
          }

          .report-date {
            padding: 8px 12px;
            background-color: #f7fafc;
            border-radius: 6px;
            color: #4a5568;
            font-size: 14px;
          }

          .reference-link {
            display: inline-flex;
            align-items: center;
            color: #3182ce;
            font-weight: 500;
            text-decoration: none;
            padding: 8px 12px;
            background-color: #ebf8ff;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .reference-link:hover {
            background-color: #bee3f8;
            text-decoration: underline;
          }

          .reference-link i {
            margin-right: 6px;
          }

          .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .attachment-actions {
            display: flex;
            gap: 10px;
            margin-top: 8px;
          }

          .view-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          /* Report button styles */
          .report-btn {
            color: var(--primary);
          }

          .report-btn:hover {
            color: #2b6cb0;
            background-color: rgba(66, 153, 225, 0.1);
          }

          /* Report modal styles */
          .report-modal {
            max-width: 600px;
          }

          .report-content {
            padding: 15px 0;
          }

          .report-section {
            margin-bottom: 20px;
          }

          .report-section h4 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #4a5568;
          }

          .report-text,
          .report-comment {
            background-color: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            color: #2d3748;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
          }

          .report-date {
            padding: 8px 12px;
            background-color: #f7fafc;
            border-radius: 6px;
            color: #4a5568;
            font-size: 14px;
          }

          .reference-link {
            display: inline-flex;
            align-items: center;
            color: #3182ce;
            font-weight: 500;
            text-decoration: none;
            padding: 8px 12px;
            background-color: #ebf8ff;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .reference-link:hover {
            background-color: #bee3f8;
            text-decoration: underline;
          }

          .reference-link i {
            margin-right: 6px;
          }

          .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .attachment-actions {
            display: flex;
            gap: 10px;
            margin-top: 8px;
          }

          .view-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          /* New styles for buttons and rework input */
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .btn-warning {
            background-color: #ed8936;
            color: white;
          }

          .btn-warning:hover {
            background-color: #dd6b20;
          }

          .btn-success {
            background-color: #48bb78;
            color: white;
          }

          .btn-success:hover {
            background-color: #38a169;
          }

          .rework-comment-input {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
          }

          .rework-comment-input:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
          }

          /* Task Creation Container */
          .task-creation-container {
            width: 100%;
            max-width: 1400px;
            margin: 2rem auto;
            padding: 1rem;
            perspective: 1000px;
          }

          /* Expand Button */
          .task-creation-expand-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.875rem 1.25rem;
            border: 2px dashed var(--primary-light);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: var(--transition);
            box-shadow: var(--shadow-sm);
            font-weight: 600;

            background-color: var(--primary);
            color: var(--white);
            border-color: var(--primary);
          }

          .task-creation-expand-btn:hover {
            background-color: var(--primary-light);
            color: var(--white);
            border-color: var(--primary);
          }

          .task-creation-expand-btn .fa-plus-circle {
            margin-right: 0.5rem;
            transition: transform 0.3s ease;
          }

          .task-creation-expand-btn:hover .fa-plus-circle {
            transform: rotate(180deg);
          }

          /* Task Creation Modal */
          .task-creation-modal {
            background-color: var(--white);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            padding: 2rem;
            margin-top: 1rem;
            border: 1px solid var(--gray-200);
            transform-origin: top center;
            transform: scale(0.9) rotateX(-10deg);
            opacity: 0;
            transition: transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              opacity 0.5s ease;
            overflow: hidden;
          }

          .task-creation-modal.expanded {
            transform: scale(1) rotateX(0);
            opacity: 1;
          }

          /* Header Styles */
          .task-creation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--primary-light);
          }

          .task-creation-header h2 {
            display: flex;
            align-items: center;
            color: var(--primary);
            font-size: 1.5rem;
            font-weight: 700;
          }

          .task-creation-header button {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--gray-500);
            transition: var(--transition);
          }

          .task-creation-header button:hover {
            color: var(--danger);
            transform: rotate(90deg);
          }

          /* Form Styles */
          .task-creation-form {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }

          .task-creation-column {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .task-creation-input-group {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
          }

          .task-creation-label {
            font-size: 0.875rem;
            color: var(--dark);
            font-weight: 600;
            margin-left: 0.25rem;
          }

          .task-creation-input,
          .task-creation-select {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid var(--gray-300);
            border-radius: var(--radius);
            font-size: 0.975rem;
            transition: var(--transition);
            background-color: var(--gray-100);
          }

          .task-creation-input:focus,
          .task-creation-select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
          }

          /* File Input Styles */
          .task-creation-file-input {
            position: relative;
            border: 2px dashed var(--gray-300);
            border-radius: var(--radius);
            padding: 1rem;
            text-align: center;
            transition: var(--transition);
          }

          .task-creation-file-input:hover {
            border-color: var(--primary-light);
            background-color: var(--gray-100);
          }

          .task-creation-file-input input[type="file"] {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }

          .task-creation-file-name {
            display: block;
            margin-top: 0.5rem;
            color: var(--primary);
            font-weight: 500;
          }

          /* Submit Button */
          .task-creation-submit-btn {
            width: 205%;
            padding: 1rem 1.25rem;
            background-color: var(--primary);
            color: var(--white);
            border: none;
            border-radius: var(--radius-md);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            transition: var(--transition);
            font-weight: 600;
            box-shadow: var(--shadow-md);
            margin-top: 1.5rem;
          }

          .task-creation-submit-btn:hover {
            background-color: var(--secondary);
            transform: translateY(-3px);
            box-shadow: var(--shadow-lg);
          }

          .task-creation-submit-btn i {
            margin-right: 0.5rem;
          }

          .task-creation-input-description {
            min-height: 140px;
          }
          /* Responsive Design */
          @media (max-width: 768px) {
            .task-creation-form {
              grid-template-columns: 1fr;
            }

            .task-creation-container {
              padding: 0.5rem;
            }

            .task-creation-modal {
              padding: 1rem;
            }
          }
          /* Add this to your AdminDashboard.css file */

          .pagination-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding: 10px 0;
            border-top: 1px solid #e0e0e0;
          }

          .pagination-info {
            color: #666;
            font-size: 14px;
          }

          .per-page-selector {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .per-page-selector select {
            padding: 5px 8px;
            border-radius: 4px;
            border: 1px solid #ccc;
            background-color: white;
            cursor: pointer;
          }

          .pagination-controls {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .page-btn {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            border: 1px solid #ddd;
            background-color: white;
            color: #333;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .page-btn:hover {
            background-color: #f2f2f2;
          }

          .page-btn.active {
            background-color: var(--primary);
            color: white;
            border-color: var(--primary);
          }

          .page-btn.disabled  {
            color: #ccc;
            cursor: not-allowed !important;
            }
            

          .page-ellipsis {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Add this to your CSS file */
          .empty-table-message {
            text-align: center;
            padding: 40px 0;
            color: #888;
          }

          .empty-table-message i {
            font-size: 48px;
            margin-bottom: 15px;
            color: #ccc;
          }

          .empty-table-message p {
            margin: 5px 0;
          }

          .report-modal {
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
          }

          .report-modal .modal-body {
            overflow-y: auto;
            max-height: calc(90vh - 140px);
            padding: 20px;
          }

          /* Submission Timeline */
          .submission-timeline {
            margin-bottom: 30px;
          }

          .submission-timeline h4 {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
          }

          /* Current/Latest Submission */
          .submission-card {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .submission-card.current {
            border-left: 5px solid #2196f3;
          }

          .submission-card:hover {
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
          }

          .submission-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
          }

          .submission-badge {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .submission-badge.latest {
            background-color: #e3f2fd;
            color: #1976d2;
          }

          .submission-badge.rework {
            background-color: #fff3e0;
            color: #e65100;
          }

          .submission-badge.original {
            background-color: #e8f5e9;
            color: #2e7d32;
          }

          .submission-badge i {
            font-size: 0.8rem;
          }

          .submission-date {
            font-size: 0.8rem;
            color: #757575;
          }

          .submission-content {
            padding: 15px;
          }

          /* Feedback Section */
          .feedback-section,
          .reference-section,
          .attachment-section,
          .rework-request-section,
          .submission-response-section {
            margin-bottom: 15px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .feedback-section h5,
          .reference-section h5,
          .attachment-section h5 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #424242;
          }

          .feedback-container {
            background-color: #f9f9f9;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
          }

          .report-text {
            margin: 0;
            line-height: 1.5;
            color: #333;
          }

          /* Timeline History */
          .submission-history-container {
            margin-top: 30px;
          }

          .submission-history-container h5 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #616161;
          }

          .timeline {
            position: relative;
            padding-left: 30px;
            margin-left: 10px;
          }

          .timeline:before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #e0e0e0;
          }

          .timeline-item {
            position: relative;
            margin-bottom: 25px;
          }

          .timeline-point {
            position: absolute;
            left: -40px;
            top: 15px;
          }

          .timeline-marker {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #fff;
            border: 2px solid #ff9800;
            box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
          }

          .timeline-marker.original {
            border-color: #4caf50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
          }

          .timeline-content {
            margin-left: 5px;
          }

          /* Rework Request and Response */
          .rework-request-section h6,
          .submission-response-section h6 {
            font-size: 14px;
            color: #616161;
            margin-bottom: 8px;
          }

          .rework-comment {
            background-color: #fff3e0;
            padding: 10px;
            border-radius: 4px;
            border-left: 3px solid #ff9800;
            margin-bottom: 10px;
          }

          .rework-deadline {
            font-size: 0.8rem;
            color: #757575;
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .response-feedback {
            background-color: #f1f8e9;
            padding: 10px;
            border-radius: 4px;
            border-left: 3px solid #8bc34a;
          }

          /* Attachment Actions */
          .attachment-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
          }

          .attachment-section.compact .attachment-actions {
            flex-wrap: wrap;
          }

          .download-btn,
          .view-btn {
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.2s;
          }

          .download-btn:hover,
          .view-btn:hover {
            transform: translateY(-2px);
          }

          /* Button Styles */
          .btn {
            border-radius: 4px;
            font-weight: 500;
            transition: all 0.3s;
            padding: 8px 16px;
          }

          .btn-sm {
            padding: 4px 8px;
            font-size: 0.8rem;
          }

          .btn-secondary {
            background-color: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
          }

          .btn-primary {
            background-color: #1976d2;
            color: white;
            border: none;
          }

          .btn-warning {
            background-color: #ff9800;
            color: white;
            border: none;
          }

          .btn-success {
            background-color: #4caf50;
            color: white;
            border: none;
          }

          .ai-summarize-btn {
            display: flex;
            align-items: center;
            gap: 5px;
            background-color: #7e57c2;
            color: white;
            border: none;
            font-size: 0.85rem;
            padding: 5px 10px;
            border-radius: 4px;
          }

          .magic-icon {
            font-size: 0.8rem;
          }

          /* Reference Links */
          .reference-link {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: #1976d2;
            text-decoration: none;
            font-size: 0.9rem;
            padding: 6px 12px;
            border-radius: 4px;
            background-color: #e3f2fd;
            transition: all 0.2s;
          }

          .reference-link:hover {
            background-color: #bbdefb;
            text-decoration: none;
          }

          /* Rework Input Section */
          .rework-input-section {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            margin-top: 20px;
          }

          .rework-comment-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            min-height: 100px;
            margin-bottom: 15px;
            font-family: inherit;
          }

          .rework-deadline {
            margin-bottom: 10px;
          }

          .rework-deadline .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            font-size: 14px;
          }

          .rework-deadline .form-control {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          /* Responsive Adjustments */
          @media (max-width: 768px) {
            .report-modal {
              width: 95%;
            }

            .submission-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }

            .submission-date {
              width: 100%;
            }

            .attachment-actions {
              flex-direction: column;
            }

            .timeline {
              padding-left: 20px;
            }

            .timeline-point {
              left: -30px;
            }
          }

          /* Add these styles to your AdminDashboard.css file */

          .file-upload-container {
            margin-top: 8px;
            margin-bottom: 8px;
          }

          .current-file {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            margin-bottom: 10px;
          }

          .current-file button {
            margin-left: 10px;
          }

          .file-selected {
            margin-top: 8px;
            padding: 8px;
            background-color: #e2f0ff;
            border-radius: 4px;
            border: 1px solid #b8daff;
          }

          .form-control-file {
            padding: 8px 0;
          }
        `}</style>
      </main>
    </div>
  );
};

export default Admintask;
