/**
 * Counts the total number of pending extension and cancellation requests
 * @param {Array} tasks - Array of task objects 
 * @returns {number} - Total number of pending requests
 */
const countPendingRequests = (tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return 0;
    }
  
    let pendingRequestsCount = 0;
  
    // Count extension requests
    const tasksWithPendingExtensions = tasks.filter(task => 
      task.extensionRequests && 
      task.extensionRequests.some(req => req.status === "Pending" || req.status === "Rework")
    );
    
    // Count cancellation requests
    const tasksWithPendingCancellations = tasks.filter(task => 
      task.cancellationRequests && 
      task.cancellationRequests.some(req => req.status === "Pending" || req.status === "Rework")
    );
    
    // Get total count (avoiding double-counting tasks that have both request types)
    pendingRequestsCount = tasksWithPendingExtensions.length + tasksWithPendingCancellations.length;
    
    return pendingRequestsCount;
  };
  
  export default countPendingRequests;