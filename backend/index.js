//backend code
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const nodemailer = require('nodemailer');                // Add this for email functionality
const { google } = require('googleapis');
const axios = require('axios');
const moment = require('moment');
const ml = require('ml-matrix');
const open = require('open');
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 5000;           // Change as per your need (e.g., 3000)
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// If you're using the cors package
app.use(cors({
  origin: '*', // or your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// In your backend routes file
app.get('/api/tasks/view/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename); // Adjust path as needed
  
  // Set headers for PDF viewing in browser
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=' + filename);
  
  // Send the file
  res.sendFile(filePath);
});




// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,           // Change as per your need (e.g., 'gmail')
  auth: {
    user: process.env.EMAIL_USER,               // Change as per your need (e.g., 'example@gmail.com')
    pass: process.env.EMAIL_PASS                // Change as per your need (App Password for Gmail)
  }
});

// Ensure directories and files exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}



// Configure file upload with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}-${uniqueId}${fileExtension}`;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// Database helper functions
const getData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], tasks: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
};

const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Function to send email notification
const sendTaskNotification = async (userEmail, taskDetails, userName) => {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Task Assigned</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 20px; background-color: #0d6efd; border-radius: 8px 8px 0 0;">
              <h2 style="color: #ffffff; margin: 0;">New Task Assigned</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p>Dear ${userName},</p>
              <p>A new task has been assigned to you. Here are the details:</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" border="0" style="margin: 20px 0; background-color: #f9f9f9; border-radius: 4px; border-left: 4px solid #0d6efd;">
                <tr>
                  <td width="120" style="font-weight: bold;">Title:</td>
                  <td><strong>${taskDetails.title}</strong></td>
                </tr>
                ${taskDetails.description ? `
                <tr>
                  <td width="120" style="font-weight: bold;">Description:</td>
                  <td>${taskDetails.description}</td>
                </tr>` : ''}
                <tr>
                  <td width="120" style="font-weight: bold;">Status:</td>
                  <td>${taskDetails.status}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Priority:</td>
                  <td style="${taskDetails.priority === 'High' ? 'color: #dc3545; font-weight: bold;' : taskDetails.priority === 'Low' ? 'color: #198754;' : 'color: #0d6efd;'}">${taskDetails.priority || 'Medium'}</td>
                </tr>
                ${taskDetails.dueDate ? `
                <tr>
                  <td width="120" style="font-weight: bold;">Due Date:</td>
                  <td>${taskDetails.dueDate}</td>
                </tr>` : ''}
                ${taskDetails.tags ? `
                <tr>
                  <td width="120" style="font-weight: bold;">Tags:</td>
                  <td>${Array.isArray(taskDetails.tags) ? taskDetails.tags.join(', ') : taskDetails.tags}</td>
                </tr>` : ''}
              </table>
              
              <p>Please log in to your dashboard to view more details and start working on this task.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="#" style="background-color: #0d6efd; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Task in Dashboard</a>
                  </td>
                </tr>
              </table>
              
              <p>Thank you,<br>Task Management System</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 15px; background-color: #f7f7f7; border-radius: 0 0 8px 8px; color: #777777; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,     // Change as per your need (e.g., 'example@gmail.com')
      to: userEmail,
      subject: `New Task Assigned: ${taskDetails.title}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('New task notification email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending new task notification email:', error);
    return false;
  }
};

// Authentication Routes
app.post('/api/register', (req, res) => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const data = getData();

  // Check if the user already exists
  if (data.users.find(user => user.username === username || user.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
    username,
    email,
    password: hashedPassword,
    role
  };

  data.users.push(newUser);
  saveData(data);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ 
    message: 'User registered successfully',
    user: userWithoutPassword
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const data = getData();
  const user = data.users.find(user => user.username === username);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Compare the hashed password
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json({ 
    message: 'Login successful', 
    user: userWithoutPassword
  });
});

// Task Management Routes
// Read JSON file
const readData = () => {
  const rawData = fs.readFileSync(DATA_FILE);
  return JSON.parse(rawData);
};

// Write to JSON file
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Get all tags
app.get("/api/tags", (req, res) => {
  const data = readData();
  res.json(data.tags || []);
});

// Get all tasks
app.get("/api/tasks", (req, res) => {
  const data = readData();
  res.json(data.tasks);
});


async function sendWhatsappMessage(newTask, userName, PHONE_NUMBER) {
  try {
    const response = await axios.post('https://whats-api.rcsoft.in/api/create-message', {
      appkey: process.env.WHATSAPP_APPKEY,             // Change as per your need
      authkey: process.env.WHATSAPP_AUTHKEY,           // Change as per your need
      to: PHONE_NUMBER,
      message: `Dear ${userName},  

A new task has been assigned to you. Here are the details:  

*Title:* ${newTask.title}  
${newTask.description ? "*Description:* " + newTask.description + "\n" : ""}*Status:* ${newTask.status}  
*Priority:* ${newTask.priority || 'Medium'}  
${newTask.dueDate ? "*Due Date:* " + newTask.dueDate + "\n" : ""}${newTask.tags ? "*Tags:* " + newTask.tags.join(', ') + "\n" : ""}  

Please log in to your dashboard to view more details and start working on this task.  

Thank you,  
Task Management System
`
    }, { timeout: 60000 }); // 60 seconds timeout

    console.log(response.data);
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.message);
  }
}


























// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};







// Add a new task with notification with all Integration
app.post("/api/tasks", upload.single('file'), async (req, res) => {
  try {
    const data = readData();
    const { 
      title, 
      description, 
      tags, 
      assignedTo, 
      dueDate, 
      priority, 
      status,
      referenceLink
    } = req.body;

    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Generate an incremental ID for tasks
    const id = data.tasks.length > 0 ? Math.max(...data.tasks.map(t => t.id)) + 1 : 1;

    // Prepare file information if a file was uploaded
    const fileInfo = req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path
    } : null;

    // Ensure ID is the first property
    const newTask = {
      id,
      title,
      description: description || '',
      tags: parsedTags,
      assignedTo: assignedTo ? String(assignedTo) : null,
      dueDate,
      priority,
      status,
      referenceLink: referenceLink || '',
      file: fileInfo
    };



  

    // Find the user email to send notification
    const assignedUser = data.users.find(user => user.id === parseInt(assignedTo));
    const userName = assignedUser ? assignedUser.username : null;

    if (assignedUser && assignedUser.email) {
      // Send email notification
      const emailSent = await sendTaskNotification(assignedUser.email, newTask, userName);

      // Send Google Calendar event request
      if (assignedUser.integrations.calendar) {
        
          // Example usage with proper parameters:
          const eventResponse = await createCalendarEvent(assignedUser.id, {
            title: newTask.title,
            description: newTask.description,
            startTime: newTask.dueDate + "T15:00:00",
            endTime: newTask.dueDate + "T16:00:00",
            timeZone: "Asia/Kolkata"                                   // Change as per your need (e.g., "America/New_York")
          });

          newTask.calendarEventId = eventResponse.id;

      } else {
        console.log("Calendar integration is disabled for this user.");
      }
      
      // Send Text Message
      if (assignedUser.integrations.message) {

        const API_KEY = process.env.FAST2SMS_API_KEY;               // Change as per your need

        async function sendSMS(userName, newTask, assignedUser) {
            const message = `Dear ${userName}, \nYou have a new task: \nTitle: ${newTask.title} \nStatus: ${newTask.status} \nPriority: ${newTask.priority || 'Medium'} ${newTask.dueDate ? "\nDue: " + newTask.dueDate : ''} \nCheck your dashboard for details.\n\nTask Management System`;
            
            const payload = {
                route: "q",
                message: message,
                schedule_time: "",                           // Leave empty for immediate sending
                flash: 0,
                numbers: assignedUser.phoneNumber
            };
            
            try {
                const response = await axios.post("https://www.fast2sms.com/dev/bulkV2", payload, {
                    headers: {
                        "authorization": API_KEY,
                        "Content-Type": "application/json"
                    }
                });
                console.log("SMS Sent:", response.data);
            } catch (error) {
                console.error("Error sending SMS:", error.response ? error.response.data : error.message);
            }
        }
        sendSMS(userName, newTask, assignedUser);
      } else {
        console.log("Message integration is disabled for this user.");
      }

      /// Send Voice Call
      if (assignedUser.integrations.voiceCall) {

        // Download the helper library from https://www.twilio.com/docs/node/install
        const twilio = require("twilio");

        // Twilio credentials
        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;     // Change as per your need
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;        // Change as per your need

        // Initialize Twilio client
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        // User phone number (ensure this is properly assigned)
        const PHONE_NUMBER = "+91" + assignedUser.phoneNumber; 

        async function makeCall() {
            try {
                const call = await client.calls.create({
                    url: process.env.TWILIO_CALL_URL,           // Change as per your need - Your Twilio call URL (e.g., URL of recoreded audio)
                    method: "GET",
                    from: process.env.TWILIO_PHONE_NUMBER,      // Change as per your need (Your Twilio number)
                    to: PHONE_NUMBER
                });

                console.log("Call initiated:", call.sid);
            } catch (error) {
                console.error("Error making call:", error.message);
            }
        }

        makeCall();

      } else {
        console.log("Voice Call integration is disabled for this user.");
      }

      // Send WhatsApp Message
      if (assignedUser.integrations.whatsapp) {    
        const PHONE_NUMBER = "91" + assignedUser.phoneNumber; 

        sendWhatsappMessage(newTask, userName, PHONE_NUMBER);


      } else {
        console.log("Whastapp integration is disabled for this user.");
      }

      data.tasks.push(newTask);
      writeData(data);


      res.json({ 
        message: emailSent ? "Task added successfully and notification sent" : "Task added successfully but notification failed", 
        task: newTask 
      });

    } else {
      res.json({ 
        message: "Task added successfully but user email not found", 
        task: newTask 
      });
    }
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ message: "Failed to add task", error: error.message });
  }
});


// File download route
app.get('/api/tasks/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(500).send('File download failed');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

// User Management Routes
app.get('/api/users', (req, res) => {
  const data = getData();
  // Return users without passwords
  const users = data.users.map(({ id, username, email, role }) => ({ id, username, email, role }));
  res.json(users);
});

// Get staff members only
app.get('/api/staff', (req, res) => {
  const data = getData();
  const staffMembers = data.users
    .filter(user => user.role === 'staff')
    .map(({ id, username, email }) => ({ id, username, email }));
  res.json(staffMembers);
});

// Map tasks with email
app.get("/api/tasks", (req, res) => {
  const data = getData();
  
  // Map tasks and include the assigned user's email
  const tasksWithEmail = data.tasks.map(task => {
    const assignedUser = data.users.find(user => user.id === Number(task.assignedTo));
    return {
      ...task,
      assignedEmail: assignedUser ? assignedUser.email : "Unknown"
    };
  });

  res.json(tasksWithEmail);
});

// DELETE endpoint to remove a task - Admin
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  console.log("Backend received delete request for task ID:", taskId);
  const dataPath = path.join(__dirname, 'data.json');
  
  // Read the current data
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).json({ error: 'Failed to read data file' });
    }
    
    try {
      // Parse the JSON data
      const jsonData = JSON.parse(data);
      
      // Find the index of the task to delete
      const taskIndex = jsonData.tasks.findIndex(task => task.id.toString() === taskId.toString());
      
      if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const taskToDelete = jsonData.tasks[taskIndex];
      
      // Delete the calendar event if there's an assignedTo and calendarEventId
      if (taskToDelete.assignedTo && taskToDelete.calendarEventId) {
        // This should be an async operation, but we're handling it synchronously for simplicity
        deleteCalendarEvent(taskToDelete.assignedTo, taskToDelete.calendarEventId)
          .catch(error => console.error('Error deleting calendar event:', error));
      }
            
      // Remove the task from the array
      jsonData.tasks.splice(taskIndex, 1);
      
      // Write the updated data back to the file
      fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing to data file:', err);
          return res.status(500).json({ error: 'Failed to update data file' });
        }

        
        res.status(200).json({ message: 'Task deleted successfully' });
      });
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      res.status(500).json({ error: 'Failed to parse data' });
    }
  });
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updatedData = req.body;
    const data = getData();
    
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get the current task
    const currentTask = data.tasks[taskIndex];
    
    // Ensure assignedTo is stored as a string
    if (updatedData.assignedTo !== undefined) {
      updatedData.assignedTo = String(updatedData.assignedTo);
    }
    
    // Special handling for Rework status
    if (updatedData.completionDetails && currentTask.status === "Rework") {
      // If the current status is Rework, add completion details to the last rework item
      // instead of directly updating the task
      
      // Make sure reworkDetails exists and has items
      if (!currentTask.reworkDetails || !currentTask.reworkDetails.length) {
        return res.status(400).json({ error: 'No rework details found for this task' });
      }
      
      // Add completion details to the last rework item
      const lastReworkIndex = currentTask.reworkDetails.length - 1;
      
      // Include both completion details and attachment file in the rework details
      currentTask.reworkDetails[lastReworkIndex] = {
        ...currentTask.reworkDetails[lastReworkIndex],
        completionDetails: updatedData.completionDetails,
      };
      
    // Preserve other updates but don't change the status yet
    data.tasks[taskIndex] = {
      ...currentTask,
      id: taskId, // Ensure ID doesn't change
      status: "Progress",
      reworkDetails: currentTask.reworkDetails
    };
      
    } else {
      // Normal update for non-rework tasks
      data.tasks[taskIndex] = {
        ...currentTask,
        ...updatedData,
        status: "Progress", 
        id: taskId // Ensure ID doesn't change
      };
    }
    
    console.log('Before save:', data.tasks[taskIndex].status);
    saveData(data);
    console.log('After save:', data.tasks[taskIndex].status);

    res.json({ 
      message: 'Task updated successfully',
      task: data.tasks[taskIndex]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.post('/api/tasks/:id/upload', upload.single('file'), (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const completionDetails = JSON.parse(req.body.completionDetails || '{}');
    const taskData = JSON.parse(req.body.taskData || '{}');
    const data = getData();
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      // Delete the uploaded file if task not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = data.tasks[taskIndex];
    
    // Create attachment file object if a file was uploaded
    const attachmentFile = req.file ? {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    } : null;
    
    // Special handling for rework submissions
    if (currentTask.status === "Rework") {
      // If the current status is Rework, add completion details to the last rework item
      if (!currentTask.reworkDetails || !currentTask.reworkDetails.length) {
        return res.status(400).json({ error: 'No rework details found for this task' });
      }
      
      // Add completion details and attachment file to the last rework item
      const lastReworkIndex = currentTask.reworkDetails.length - 1;
      
      currentTask.reworkDetails[lastReworkIndex] = {
        ...currentTask.reworkDetails[lastReworkIndex],
        completionDetails: completionDetails,
        attachmentFile: attachmentFile
      };
      
      // Update the task but keep status as Rework
      data.tasks[taskIndex] = {
        ...currentTask,
        id: taskId, // Ensure ID doesn't change
        status: "Progress", // Keep as Rework until reviewed
        reworkDetails: currentTask.reworkDetails
      };
    } else {
      // Normal update for non-rework tasks
      data.tasks[taskIndex] = {
        ...currentTask,
        ...taskData,
        attachmentFile: attachmentFile,
        id: taskId // Ensure ID doesn't change
      };
    }
    
    saveData(data);
    res.json({ 
      message: 'Task updated successfully with file',
      task: data.tasks[taskIndex]
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload file and update task' });
  }
});


// Modify the PUT endpoint to handle the link field
app.put('/api/v2/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updatedData = req.body;
    const data = getData();
    
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get the current task
    const currentTask = data.tasks[taskIndex];
    
    // Ensure assignedTo is stored as a string
    if (updatedData.assignedTo !== undefined) {
      updatedData.assignedTo = String(updatedData.assignedTo);
    }
    
    // Special handling for Rework status
    if (updatedData.completionDetails && currentTask.status === "Rework") {
      // If the current status is Rework, add completion details to the last rework item
      // instead of directly updating the task
      
      // Make sure reworkDetails exists and has items
      if (!currentTask.reworkDetails || !currentTask.reworkDetails.length) {
        return res.status(400).json({ error: 'No rework details found for this task' });
      }
      
      // Add completion details to the last rework item
      const lastReworkIndex = currentTask.reworkDetails.length - 1;
      
      // Include both completion details and attachment file in the rework details
      currentTask.reworkDetails[lastReworkIndex] = {
        ...currentTask.reworkDetails[lastReworkIndex],
        completionDetails: updatedData.completionDetails,
      };
    
    // Preserve other updates but don't change the status yet
    data.tasks[taskIndex] = {
      ...currentTask,
      id: taskId, // Ensure ID doesn't change
      status: "Pending",
      referenceLink: updatedData.referenceLink || currentTask.referenceLink, // Preserve the link field
      reworkDetails: currentTask.reworkDetails
    };
      
    } else {
      // Normal update for non-rework tasks
      data.tasks[taskIndex] = {
        ...currentTask,
        ...updatedData,
        status: "Pending", 
        id: taskId // Ensure ID doesn't change
      };
    }
    console.log(data.tasks)
    
    saveData(data);

    res.json({ 
      message: 'Task updated successfully',
      task: data.tasks[taskIndex]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Modify the file upload endpoint to handle the link field
app.post('/api/v2/tasks/:id/upload', upload.single('file'), (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const completionDetails = JSON.parse(req.body.completionDetails || '{}');
    const taskData = JSON.parse(req.body.taskData || '{}');
    const data = getData();
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      // Delete the uploaded file if task not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = data.tasks[taskIndex];
    
    // Create attachment file object if a file was uploaded
    const attachmentFile = req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    } : currentTask.file; // Preserve existing attachment if no new file
    
    // Special handling for rework submissions
    if (currentTask.status === "Rework") {
      // If the current status is Rework, add completion details to the last rework item
      if (!currentTask.reworkDetails || !currentTask.reworkDetails.length) {
        return res.status(400).json({ error: 'No rework details found for this task' });
      }
      
      // Add completion details and attachment file to the last rework item
      const lastReworkIndex = currentTask.reworkDetails.length - 1;
      
      currentTask.reworkDetails[lastReworkIndex] = {
        ...currentTask.reworkDetails[lastReworkIndex],
        completionDetails: completionDetails,
        file: attachmentFile
      };
      
      // Update the task but keep status as Rework
      data.tasks[taskIndex] = {
        ...currentTask,
        id: taskId, // Ensure ID doesn't change
        status: "Pending", // Keep as Rework until reviewed
        referenceLink: taskData.referenceLink || currentTask.referenceLink, // Preserve the link field
        reworkDetails: currentTask.reworkDetails
      };
    } else {
      // Normal update for non-rework tasks
      data.tasks[taskIndex] = {
        ...currentTask,
        ...taskData,
        file: attachmentFile,
        id: taskId // Ensure ID doesn't change
      };
    }
    console.log(data.tasks)
    saveData(data);
    res.json({ 
      message: 'Task updated successfully with file',
      task: data.tasks[taskIndex]
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload file and update task' });
  }
});

// Delete a user by Admin
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Read the current data
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).json({ success: false, message: 'Error reading users data' });
    }
    
    try {
      const jsonData = JSON.parse(data);
      
      // Check if user exists
      const userIndex = jsonData.users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Remove the user
      jsonData.users.splice(userIndex, 1);
      
      // Write the updated data back to the file
      fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to data file:', writeErr);
          return res.status(500).json({ success: false, message: 'Error updating users data' });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'User deleted successfully',
          deletedId: userId
        });
      });
      
    } catch (parseErr) {
      console.error('Error parsing JSON data:', parseErr);
      return res.status(500).json({ success: false, message: 'Error processing users data' });
    }
  });
});


const dataFilePath = path.join(__dirname, 'data.json');

// Helper function to read the data file
const readDataFile = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { tags: [] };
  }
};

// Helper function to write to the data file
const writeDataFile = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to data file:', error);
    return false;
  }
};

// GET endpoint to fetch all tags
app.get('/api/tags', (req, res) => {
  const data = readDataFile();
  const formattedTags = data.tags.map(tag => ({ label: tag, value: tag }));
  res.json(formattedTags);
});

// POST endpoint to add a new tag
app.post('/api/tags', (req, res) => {
  const { tag } = req.body;
  
  if (!tag || typeof tag !== 'string' || !tag.trim()) {
    return res.status(400).json({ message: 'Invalid tag value' });
  }
  
  const trimmedTag = tag.trim();
  const data = readDataFile();
  
  // Check if tag already exists (case insensitive)
  if (data.tags.some(existingTag => existingTag.toLowerCase() === trimmedTag.toLowerCase())) {
    return res.status(409).json({ message: 'Tag already exists' });
  }
  
  // Add new tag
  data.tags.push(trimmedTag);
  
  // Write updated data back to file
  if (writeDataFile(data)) {
    res.status(201).json({ message: 'Tag added successfully', tag: trimmedTag });
  } else {
    res.status(500).json({ message: 'Failed to save tag' });
  }
});

// DELETE endpoint to remove a tag
app.delete('/api/tags/:tagValue', (req, res) => {
  const tagToDelete = req.params.tagValue;
  const data = readDataFile();
  
  // Find the tag (case insensitive)
  const tagIndex = data.tags.findIndex(
    tag => tag.toLowerCase() === tagToDelete.toLowerCase()
  );
  
  if (tagIndex === -1) {
    return res.status(404).json({ message: 'Tag not found' });
  }
  
  // Remove the tag
  data.tags.splice(tagIndex, 1);
  
  // Write updated data back to file
  if (writeDataFile(data)) {
    res.json({ message: 'Tag deleted successfully' });
  } else {
    res.status(500).json({ message: 'Failed to delete tag' });
  }
});












// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage1 = multer.diskStorage({
  destination: (req, file, cb) => {
    const taskUploadDir = path.join(uploadsDir, req.params.taskId);
    if (!fs.existsSync(taskUploadDir)) {
      fs.mkdirSync(taskUploadDir, { recursive: true });
    }
    cb(null, taskUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload1 = multer({ storage1 });


// API Routes
// Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// Get a specific task by ID
app.get('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  res.json(task);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  // Log the incoming request body to help with debugging
  console.log('Update Task Request Body:', req.body);
  
  // Update the task with the new data
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...req.body
  };
  
  // Log the updated task
  console.log('Updated Task:', tasks[taskIndex]);
  
  res.json(tasks[taskIndex]);
});

// Upload file for a specific task
app.post('/api/tasks/:taskId/upload', upload.single('file'), async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const taskData = JSON.parse(req.body.taskData);
    const completionDetails = JSON.parse(req.body.completionDetails);
    const data = getData();
    
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task with completion details and file information if present
    const updatedTask = {
      ...data.tasks[taskIndex],
      ...taskData,
      status: 'Progress',
      completionDetails,
    };

    if (req.file) {
      updatedTask.attachmentFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    }

    data.tasks[taskIndex] = updatedTask;
    saveData(data);

    res.json({
      message: 'Task completed successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error handling task completion:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  // Return only necessary user data (exclude passwords)
  const safeUsers = users.map(({ id, username, email, role }) => ({
    id,
    username,
    email,
    role
  }));
  
  res.json(safeUsers);
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => 
    u.username === username && u.password === password
  );
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Create a safe version of user object (exclude password)
  const { password: _, ...safeUser } = user;
  
  res.json({
    message: 'Login successful',
    user: safeUser
  });
});




app.get('/api/tasks/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Check file existence
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Find task with this attachment to get original filename
  const taskWithAttachment = tasks.find(task => 
    task.attachmentFile && task.attachmentFile.filename === filename
  );

  let originalName = filename;
  if (taskWithAttachment && taskWithAttachment.attachmentFile.originalName) {
    originalName = taskWithAttachment.attachmentFile.originalName;
  }

  // Set content disposition to use original filename
  res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
  
  // Send the file
  res.sendFile(filePath);
});


// Route to download task attachments
app.get('/api/tasks/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Find the task with this attachment to get the original filename
  const taskWithAttachment = tasks.find(task => 
    task.attachmentFile && task.attachmentFile.filename === filename
  );
  
  let originalName = filename;
  if (taskWithAttachment && taskWithAttachment.attachmentFile.originalName) {
    originalName = taskWithAttachment.attachmentFile.originalName;
  }
  
  // Set content disposition to use the original filename
  res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
  
  // Send the file
  res.sendFile(filePath);
});











// Mark task as complete - Admin
app.put('/api/tasks/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Read the current data
    const jsonData = fs.readFileSync('./data.json', 'utf8');
    const data = JSON.parse(jsonData);
    
    // Find the task to update
    const taskIndex = data.tasks.findIndex(task => task.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update the task status
    data.tasks[taskIndex].status = 'Completed';
    
    // Add or update completion details if they don't exist
    if (!data.tasks[taskIndex].completionDetails) {
      data.tasks[taskIndex].completionDetails = {};
    }
    
    // Set completion date to current date
    data.tasks[taskIndex].completionDetails.completedDate = new Date().toISOString();
    
    // Get user ID from auth token (if available)
    const userId = req.user ? req.user.id : null;
    if (userId) {
      data.tasks[taskIndex].completionDetails.completedBy = userId;
    }
    
    // Write the updated data back to the file
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    
    // Return the updated task
    return res.status(200).json({ 
      message: 'Task marked as complete',
      task: data.tasks[taskIndex]
    });
  } catch (error) {
    console.error('Error marking task as complete:', error);
    return res.status(500).json({ error: 'Failed to mark task as complete' });
  }
});

// Submit task for rework - Admin
app.put('/api/tasks/:id/rework', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { comment, deadline } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Rework comment is required' });
    }
    if (!deadline) {
      return res.status(400).json({ error: 'Rework deadline is required' });
    }

    // Read data.json
    const jsonData = fs.readFileSync('./data.json', 'utf8');
    const data = JSON.parse(jsonData);

    // Find Task
    const taskIndex = data.tasks.findIndex(task => task.id.toString() === taskId.toString());
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = data.tasks[taskIndex];

    // Update Task Status
    task.status = 'Rework';

    // Add Rework Comment
    if (!task.reworkDetails) {
      task.reworkDetails = [];
    }
    task.reworkDetails.push({
      comment,
      deadline,
      date: new Date().toISOString(),
      requestedBy: req.user ? req.user.id : null
    });

    // Find Assigned User Email
    const assignedUser = data.users.find(user => user.id.toString() === task.assignedTo.toString());
    const userEmail = assignedUser ? assignedUser.email : null;
    const userName = assignedUser ? assignedUser.username : null;


    // Save Updated Data
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

    // Send Email Notification
    if (userEmail) {
      await sendReworkNotification(userEmail, task, comment, deadline, userName);
    } else {
      console.warn(`No email found for assigned user ID: ${task.assignedTo}`);
    }

    return res.status(200).json({
      message: 'Task submitted for rework',
      task
    });

  } catch (error) {
    console.error('Error submitting task for rework:', error);
    return res.status(500).json({ error: 'Failed to submit task for rework' });
  }
});







const sendTaskReminder = async (userEmail, task, userName) => {
  try {
    // Create a simpler, more email-client compatible template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 20px; background-color: #4a6fa5; border-radius: 8px 8px 0 0;">
              <h2 style="color: #ffffff; margin: 0;">Task Reminder</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p>Dear ${userName},</p>
              <p>This is a friendly reminder that the following task is due tomorrow:</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" border="0" style="margin: 20px 0; background-color: #f9f9f9; border-radius: 4px; border-left: 4px solid #4a6fa5;">
                <tr>
                  <td width="120" style="font-weight: bold;">Title:</td>
                  <td>${task.title}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Description:</td>
                  <td>${task.description}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Status:</td>
                  <td>${task.status}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Priority:</td>
                  <td style="${task.priority === 'High' ? 'color: #dc3545; font-weight: bold;' : task.priority === 'Low' ? 'color: #198754;' : 'color: #0d6efd;'}">${task.priority}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Due Date:</td>
                  <td>${task.dueDate}</td>
                </tr>
                ${task.tags ? `
                <tr>
                  <td width="120" style="font-weight: bold;">Tags:</td>
                  <td>${task.tags}</td>
                </tr>` : ''}
              </table>
              
              <p>Please ensure you complete this task before the deadline.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="#" style="background-color: #4a6fa5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Task in Dashboard</a>
                  </td>
                </tr>
              </table>
              
              <p>Thank you,<br>Task Management System</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 15px; background-color: #f7f7f7; border-radius: 0 0 8px 8px; color: #777777; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,          // Change as per your need (e.g., 'example@gmail.com')
      to: userEmail,
      subject: `Task Reminder: ${task.title}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Task reminder email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending task reminder email:', error);
    return false;
  }
};

// Let's do the same for the rework notification
const sendReworkNotification = async (userEmail, task, comment, deadline, userName) => {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rework Required</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 20px; background-color: #dc3545; border-radius: 8px 8px 0 0;">
              <h2 style="color: #ffffff; margin: 0;">⚠️ Task Rework Required</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p>Dear ${userName},</p>
              <p>One of your tasks has been returned for rework. Please review the details below and make the necessary changes:</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" border="0" style="margin: 20px 0; background-color: #f9f9f9; border-radius: 4px; border-left: 4px solid #dc3545;">
                <tr>
                  <td width="120" style="font-weight: bold;">Title:</td>
                  <td><strong>${task.title}</strong></td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Priority:</td>
                  <td style="${task.priority === 'High' ? 'color: #dc3545; font-weight: bold;' : task.priority === 'Low' ? 'color: #198754;' : 'color: #0d6efd;'}">${task.priority || 'Normal'}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Status:</td>
                  <td>${task.status}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Rework Comment:</td>
                  <td style="background-color: #fff8e6; padding: 10px; border-radius: 4px; font-style: italic;">${comment}</td>
                </tr>
                <tr>
                  <td width="120" style="font-weight: bold;">Deadline:</td>
                  <td style="color: #dc3545; font-weight: bold;">${deadline}</td>
                </tr>
              </table>
              
              <p>Please complete the requested changes before the deadline to avoid any project delays.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="#" style="background-color: #4a6fa5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Task in Dashboard</a>
                  </td>
                </tr>
              </table>
              
              <p>Thank you,<br>Task Management System</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 15px; background-color: #f7f7f7; border-radius: 0 0 8px 8px; color: #777777; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,               // Change as per your need (e.g., 'example@gmail.com')
      to: userEmail,
      subject: `Rework Required: ${task.title}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rework email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending rework email notification:', error);
    return false;
  }
};










































// Calenger Integration - Backend Server




// Google OAuth configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;                   //Change as per your need     (Get from Google Console)
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;           //Change as per your need    (Get from Google Console)
const REDIRECT_URI = process.env.REDIRECT_URI;                   //Change as per your need     (Set redirect URL in Gogole Console)


const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Helper function to refresh tokens if needed
async function refreshTokensIfNeeded(userId) {
  const dataPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('User data not found');
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const user = data.users.find(user => user.id === parseInt(userId));
  
  if (!user || !user.googleTokens) {
    throw new Error('User not found or not connected to Google Calendar');
  }
  
  const tokens = user.googleTokens;
  
  // Check if tokens are expired and need refreshing
  const expiryDate = tokens.expiry_date;
  const now = Date.now();
  
  if (expiryDate && now >= expiryDate - 60000) { // 1 minute buffer
    try {
      // Refresh the token
      oauth2Client.setCredentials(tokens);
      const newTokens = await oauth2Client.refreshToken(tokens.refresh_token);
      
      // Update the tokens in our data store
      user.googleTokens = newTokens.tokens;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      
      return newTokens.tokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh authentication token');
    }
  }
  
  return tokens;
}

// Debug route to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Google auth route - This is where the redirect happens
app.get('/auth/google', (req, res) => {
  console.log('Auth route accessed with userId:', req.query.userId);
  
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).send('Missing userId parameter');
  }
  
  // Define the scopes we need
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  // Generate the auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to ensure refresh token
    state: userId // Pass the userId so we can retrieve it in the callback
  });
  
  console.log('Redirecting to Google auth:', authUrl);
  
  // Redirect to Google's authorization page
  res.redirect(authUrl);
});

// Google auth callback route
app.get('/api/auth/google/callback', async (req, res) => {
  console.log('Callback route accessed with code:', req.query.code ? 'present' : 'missing');
  console.log('State (userId):', req.query.state);
  console.log('Server received callback at:', new Date().toISOString());
  console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('Headers:', req.headers);
  
  try {
    const { code, state } = req.query;
    
    if (!code) {
      console.error('No authorization code received');
      return res.redirect('/staffintegrations?calendarConnected=false&error=no_code');
    }
    
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', tokens ? 'yes' : 'no');
    
    // Store tokens in your database
    const userId = state;
    if (!userId) {
      console.error('No user ID received');
      return res.redirect('/staffintegrations?calendarConnected=false&error=no_user_id');
    }
    
    // For this example, we'll use a simple JSON file
    // In production, use a proper database
    const dataPath = path.join(__dirname, './data.json');
    console.log('Data path:', dataPath);
    const fileExists = fs.existsSync(dataPath);
    console.log('Data file exists:', fileExists);
    
    let data;
    
    // Create the file if it doesn't exist
    if (!fs.existsSync(dataPath)) {
      data = { users: [] };
    } else {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (!data.users) data.users = [];
    }
    
    // Find the user or create a new one
    const userIndex = data.users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      // Add new user
      data.users.push({
        id: parseInt(userId),
        googleTokens: tokens,
        integrations: { calendar: true }
      });
    } else {
      // Update existing user
      data.users[userIndex].googleTokens = tokens;
      if (!data.users[userIndex].integrations) {
        data.users[userIndex].integrations = {};
      }
      data.users[userIndex].integrations.calendar = true;
    }
    
    // Save the data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log('Tokens saved for user:', userId);
    console.log('Data file write successful:', fs.existsSync(dataPath));

    // Redirect back to the settings page
// After successful OAuth processing
    res.redirect('http://localhost:3000/staffintegrations?calendarConnected=true');             // Change to your frontend URL
    const savedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`http://localhost:3000/staffintegrations?calendarConnected=false&error=${encodeURIComponent(error.message)}`);              // Change to your frontend URL
  }
});


app.get('/api/test-route', (req, res) => {
  res.json({ message: 'Server route working' });
});


// Test endpoint to verify OAuth connection
app.get('/api/check-calendar-connection', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }
  
  try {
    const dataPath = path.join(__dirname, 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.json({ connected: false });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    if (!data.users) {
      return res.json({ connected: false });
    }
    
    const user = data.users.find(user => user.id === parseInt(userId));
    
    if (!user) {
      return res.json({ connected: false });
    }
    
    const isConnected = !!(user.googleTokens && user.integrations?.calendar);
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error checking calendar connection:', error);
    res.status(500).json({ error: 'Failed to check calendar connection' });
  }
});

// Endpoint to disconnect Google Calendar
app.post('/api/disconnect-google-calendar', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }
  
  try {
    const dataPath = path.join(__dirname, 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const userIndex = data.users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    
    if (!data.users[userIndex].integrations) {
      data.users[userIndex].integrations = {};
    }
    
    // Update calendar integration status
    data.users[userIndex].integrations.calendar = false;
    


    // Remove Google tokens and update integration status
    delete data.users[userIndex].googleTokens;


      // Write changes back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
  }
});

// Function to create a calendar event when a task is created or updated
app.post('/api/create-calendar-event', async (req, res) => {
  const { userId, taskId, eventDetails } = req.body;
  
  if (!userId || !taskId || !eventDetails) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    // Get fresh tokens, refreshing if needed
    const tokens = await refreshTokensIfNeeded(userId);
    
    // Set credentials
    oauth2Client.setCredentials(tokens);
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Format the event object correctly
    const calendarEvent = {
      summary: eventDetails.summary || 'Task Deadline',
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.deadline || new Date().toISOString(),
        timeZone: eventDetails.timeZone || 'UTC'
      },
      end: {
        dateTime: eventDetails.endTime || 
                new Date(new Date(eventDetails.deadline || Date.now()).getTime() + 3600000).toISOString(),
        timeZone: eventDetails.timeZone || 'UTC'
      },
      // Add metadata to link this event back to our task
      extendedProperties: {
        private: {
          taskId: taskId.toString()
        }
      }
    };
    
    // Check if there's an existing event for this task
    const dataPath = path.join(__dirname, 'data.json');
    let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const userIndex = data.users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize task_events if not exist
    if (!data.users[userIndex].task_events) {
      data.users[userIndex].task_events = {};
    }
    
    // If existing event, update it
    if (data.users[userIndex].task_events[taskId]) {
      const existingEventId = data.users[userIndex].task_events[taskId];
      
      try {
        const updatedEvent = await calendar.events.update({
          calendarId: 'primary',
          eventId: existingEventId,
          requestBody: calendarEvent
        });
        
        res.json({ 
          success: true, 
          eventId: updatedEvent.data.id,
          status: 'updated' 
        });
      } catch (error) {
        // If event no longer exists, create a new one
        if (error.code === 404) {
          createNewEvent();
        } else {
          throw error;
        }
      }
    } else {
      // Create new event
      createNewEvent();
    }
    
    // Helper function to create a new event
    async function createNewEvent() {
      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: calendarEvent
      });
      
      // Store the event ID
      data.users[userIndex].task_events[taskId] = event.data.id;
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      
      res.json({ 
        success: true, 
        eventId: event.data.id,
        status: 'created' 
      });
    }
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    // Handle specific OAuth errors
    if (error.message.includes('invalid_grant')) {
      // Token issues - require re-authentication
      return res.status(401).json({ 
        error: 'Authentication expired', 
        action: 'reconnect' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// Add endpoint to delete a calendar event when a task is deleted
app.delete('/api/delete-calendar-event', async (req, res) => {
  const { userId, taskId } = req.body;
  
  if (!userId || !taskId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    // Get tokens, refreshing if needed
    const tokens = await refreshTokensIfNeeded(userId);
    
    // Set credentials
    oauth2Client.setCredentials(tokens);
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get event ID from data store
    const dataPath = path.join(__dirname, 'data.json');
    let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const userIndex = data.users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if we have an event ID for this task
    if (!data.users[userIndex].task_events || !data.users[userIndex].task_events[taskId]) {
      return res.json({ success: true, status: 'no_event_found' });
    }
    
    const eventId = data.users[userIndex].task_events[taskId];
    
    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    
    // Remove the event ID from our data
    delete data.users[userIndex].task_events[taskId];
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    
    // If event not found, consider it a success
    if (error.code === 404) {
      return res.json({ success: true, status: 'already_deleted' });
    }
    
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});


// Fix for the TypeError
async function createCalendarEvent(userId, eventDetails = {}) {
  try {
    // Load user data and tokens
    const dataPath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Find the user
    const user = data.users.find(user => user.id === parseInt(userId));
    
    if (!user || !user.googleTokens) {
      throw new Error('User not found or not connected to Google Calendar');
    }
    
    // Set up OAuth client with the saved tokens
    oauth2Client.setCredentials(user.googleTokens);
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Define the event with defaults for missing fields
    const calendarEvent = {
      summary: (eventDetails && eventDetails.title) || 'New Event',
      description: (eventDetails && eventDetails.description) || '',
      start: {
        dateTime: (eventDetails && eventDetails.startTime) || new Date().toISOString(),
        timeZone: (eventDetails && eventDetails.timeZone) || 'UTC'
      },
      end: {
        dateTime: (eventDetails && eventDetails.endTime) || 
                new Date(new Date((eventDetails && eventDetails.startTime) || Date.now()).getTime() + 3600000).toISOString(),
        timeZone: (eventDetails && eventDetails.timeZone) || 'UTC'
      }
    };
    
    // Insert the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent
    });
    
    console.log('Event created: %s', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

async function deleteCalendarEvent(userId, eventId) {
  try {
    // Load user data and tokens
    const dataPath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Find the user
    const user = data.users.find(user => user.id === parseInt(userId));
    
    if (!user || !user.googleTokens) {
      throw new Error('User not found or not connected to Google Calendar');
    }
    
    // Set up OAuth client with the saved tokens
    oauth2Client.setCredentials(user.googleTokens);
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    
    console.log('Event deleted:', eventId);
    return { success: true, message: 'Event successfully deleted' };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    
    // If the event was already deleted or doesn't exist
    if (error.code === 404) {
      return { success: true, message: 'Event not found or already deleted' };
    }
    
    throw error;
  }
}




















// 2. Create the function to check for upcoming due dates and send reminders
const checkAndSendReminders = async () => {
  try {
    const data = readData();
    let dataModified = false;
    
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Process each task
    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      
      // Skip completed or cancelled tasks
      if (task.status === 'Completed' || task.status === 'Cancelled') {
        continue;
      }
      
      // Check for rework reminders
      if (task.status === 'Rework' && task.reworkDetails && task.reworkDetails.length > 0) {
        // Get the latest rework details
        const latestReworkIndex = task.reworkDetails.length - 1;
        const latestRework = task.reworkDetails[latestReworkIndex];
        
        // Check if the latest rework deadline is tomorrow and reminder not sent yet
        if (latestRework.deadline === tomorrowStr && !latestRework.reminderSent) {
          // Find the assigned user
          const assignedUser = data.users.find(user => user.id === parseInt(task.assignedTo));
          
          if (assignedUser && assignedUser.email) {
            const userName = assignedUser.username || 'User';
            
            // Add rework info to task
            const taskWithReworkInfo = { 
              ...task,
              reworkDeadline: latestRework.deadline,
              reworkComment: latestRework.comment
            };
            
            const result = await sendTaskReminder(
              assignedUser.email, 
              taskWithReworkInfo, 
              userName, 
              true,
              latestReworkIndex
            );
            
            if (result) {
              console.log(`Rework reminder sent for task: ${task.id} - ${task.title} to user: ${userName}`);
              
              // Mark this rework reminder as sent
              data.tasks[i].reworkDetails[latestReworkIndex].reminderSent = true;
              dataModified = true;
            }
          } else {
            console.log(`Could not send rework reminder for task ${task.id}: User email not found`);
          }
        }
      } 
      // Check for original task due date reminder (only if not in rework status)
      else if (task.dueDate === tomorrowStr && !task.reminderSent) {
        // Find the assigned user
        const assignedUser = data.users.find(user => user.id === parseInt(task.assignedTo));
        
        if (assignedUser && assignedUser.email) {
          const userName = assignedUser.username || 'User';
          
          const result = await sendTaskReminder(
            assignedUser.email, 
            task, 
            userName, 
            false
          );
          
          if (result) {
            console.log(`Task reminder sent for task: ${task.id} - ${task.title} to user: ${userName}`);
            
            // Mark this task reminder as sent
            data.tasks[i].reminderSent = true;
            dataModified = true;
          }
        } else {
          console.log(`Could not send reminder for task ${task.id}: User email not found`);
        }
      }
    }
    
    // Save the updated data if modified
    if (dataModified) {
      writeData(data);
    }
    
  } catch (error) {
    console.error('Error in reminder check process:', error);
  }
};

// 3. Set up the scheduler to run the check continuously at intervals
const scheduleReminderCheck = () => {
  // Check every hour (3600000 milliseconds)
  // This allows the system to continuously check but only send emails
  // when the conditions are met and flags aren't set
  const ONE_HOUR = 10 * 1000;
  
  setInterval(checkAndSendReminders, ONE_HOUR);
  
  // Also run once at startup
  checkAndSendReminders();
};

// 4. Initialize the scheduler when the app starts
scheduleReminderCheck();

// Optional: You might also want to expose an endpoint to manually trigger reminders for testing
app.post("/api/tasks/check-reminders", async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ message: "Reminder check triggered successfully" });
  } catch (error) {
    console.error("Error triggering reminder check:", error);
    res.status(500).json({ message: "Failed to trigger reminder check", error: error.message });
  }
});

// Optional: Add an endpoint to reset reminder flags for testing
app.post("/api/tasks/reset-reminder-flags", async (req, res) => {
  try {
    const data = readData();
    let modified = false;
    
    // Reset flags on all tasks
    for (let i = 0; i < data.tasks.length; i++) {
      if (data.tasks[i].reminderSent) {
        data.tasks[i].reminderSent = false;
        modified = true;
      }
      
      // Reset flags on rework details
      if (data.tasks[i].reworkDetails && data.tasks[i].reworkDetails.length > 0) {
        for (let j = 0; j < data.tasks[i].reworkDetails.length; j++) {
          if (data.tasks[i].reworkDetails[j].reminderSent) {
            data.tasks[i].reworkDetails[j].reminderSent = false;
            modified = true;
          }
        }
      }
    }
    
    if (modified) {
      writeData(data);
      res.json({ message: "Reminder flags reset successfully" });
    } else {
      res.json({ message: "No reminder flags needed to be reset" });
    }
  } catch (error) {
    console.error("Error resetting reminder flags:", error);
    res.status(500).json({ message: "Failed to reset reminder flags", error: error.message });
  }
});













const dataPath = './data.json';

app.post('/api/change-password', (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    // Read the data file
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Find the user
    const userIndex = data.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = data.users[userIndex];
    
    // Verify current password
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    // Update the user's password
    data.users[userIndex].password = hashedPassword;
    
    // Write the updated data back to the file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});















// Initialize integration settings for users if they don't exist
const initializeIntegrations = () => {
  const data = readData();
  let updated = false;

  data.users.forEach(user => {
    if (!user.integrations) {
      user.integrations = {
        whatsapp: false,
        message: false,
        voiceCall: false,
        mail: true, // Default enabled and cannot be disabled
        calendar: false
      };
      updated = true;
    }
  });

  if (updated) {
    writeData(data);
    console.log('Initialized integration settings for users');
  }
};

// Initialize integrations on startup
initializeIntegrations();

// API endpoint to get user's integration settings
app.get('/api/integrations/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = readData();
  
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // If integrations don't exist, initialize them
  if (!user.integrations) {
    user.integrations = {
      whatsapp: false,
      message: false,
      voiceCall: false,
      mail: true,
      calendar: false
    };
    writeData(data);
  }
  
  res.json({ success: true, integrations: user.integrations });
});

// API endpoint to update user's integration settings
app.post('/api/integrations/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const updatedIntegrations = req.body.integrations;

  if (!updatedIntegrations) {
    return res.status(400).json({ success: false, message: 'Integration data is required' });
  }

  // Ensure mail is always true
  updatedIntegrations.mail = true;

  const data = readData();
  const userIndex = data.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Make sure integrations object exists
  if (!data.users[userIndex].integrations) {
    data.users[userIndex].integrations = {};
  }
  console.log(Object.keys(updatedIntegrations));
  // Update only the fields provided in updatedIntegrations
  const existingIntegrations = data.users[userIndex].integrations || {};

  // Ensure mail is always true
  updatedIntegrations.mail = true;
  
  Object.keys(updatedIntegrations).forEach(key => {
    if (key !== 'calendar') {
      existingIntegrations[key] = updatedIntegrations[key];
    }
  });
  
  // Save the updated integrations back
  data.users[userIndex].integrations = existingIntegrations;

  if (writeData(data)) {
    res.json({ 
      success: true, 
      message: 'Integration settings updated successfully',
      integrations: data.users[userIndex].integrations
    });
  } else {
    res.status(500).json({ success: false, message: 'Failed to update integration settings' });
  }
});











// Update this endpoint in your server.js file
app.get('/api/integrations/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const data = readData();
  
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // If integrations don't exist, initialize them
  if (!user.integrations) {
    user.integrations = {
      whatsapp: false,
      message: false,
      voiceCall: false,
      mail: true,
      calendar: false
    };
    writeData(data);
  }
  
  // Return both integrations and the full user object
  res.json({ 
    success: true, 
    integrations: user.integrations,
    user: user // Include the full user object
  });
});

const writeDataaa = (data) => {
  try {
    // Make sure the data parameter is valid
    if (!data || typeof data !== 'object') {
      console.error('Invalid data provided to writeData');
      return false;
    }
    
    // Convert the data to a JSON string with proper formatting
    const jsonData = JSON.stringify(data, null, 2);
    
    // Write the data to the file
    fs.writeFileSync('./data.json', jsonData, 'utf8');
    
    // If we reach this point, the operation was successful
    return true;
  } catch (error) {
    // Log any errors that occur during the write operation
    console.error('Error writing to data.json:', error);
    return false;
  }
};

// Update the phone endpoint implementation
app.post('/api/users/:userId/phone', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    
    // Read the data file first
    let data;
    try {
      const rawData = fs.readFileSync('./data.json', 'utf8');
      data = JSON.parse(rawData);
    } catch (readError) {
      console.error('Error reading data.json:', readError);
      return res.status(500).json({ success: false, message: 'Failed to read database' });
    }
    
    // Find the user
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update user's phone number
    data.users[userIndex].phoneNumber = phoneNumber;
    
    // Write the updated data back to the file
    const writeSuccess = writeDataaa(data);
    
    if (writeSuccess) {
      return res.json({ 
        success: true, 
        message: 'Phone number updated successfully',
        user: data.users[userIndex]
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to write to database. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Error in /api/users/:userId/phone endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});












// Route to update phone number
app.post('/api/update-phone', (req, res) => {
  const { userId, phoneNumber } = req.body;
  
  if (!userId || !phoneNumber) {
    return res.status(400).json({ message: 'User ID and phone number are required' });
  }
  
  // Validate phone number format
  if (!/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
  }
  
  try {
    // Read the current data
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    // Find the user to update
    const userIndex = data.users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the phone number
    data.users[userIndex].phoneNumber = phoneNumber;
    
    // Write the updated data back to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    
    return res.status(200).json({ 
      message: 'Phone number updated successfully',
      user: {
        id: data.users[userIndex].id,
        username: data.users[userIndex].username,
        email: data.users[userIndex].email,
        phoneNumber: data.users[userIndex].phoneNumber,
        role: data.users[userIndex].role
      }
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});












// API endpoint to handle extension requests
app.post('/api/tasks/:id/extension-request', upload.single('file'), async (req, res) => {
  try {
    const taskId = req.params.id;
    let extensionData;
    
    // Parse extension data from request
    if (req.file) {
      // If file was uploaded
      extensionData = JSON.parse(req.body.extensionData);
      
      // Add file information to extension data
      extensionData.attachmentFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    } else {
      // If no file was uploaded
      extensionData = req.body;
    }
    console.log('Extension data:', extensionData);  // Debugging
    // Read the current data
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);
    
    // Find the task by ID
    const taskIndex = data.tasks.findIndex(task => task.id == taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get the task
    const task = data.tasks[taskIndex];
    
    // Initialize extensionRequests array if it doesn't exist
    if (!task.extensionRequests) {
      task.extensionRequests = [];
    }
    
    // Add the new extension request
    task.extensionRequests.push({
      reason: extensionData.reason,
      requestDate: extensionData.requestDate,
      requestedBy: extensionData.requestedBy,
      status: 'Pending', // Initial status is pending
      attachmentFile: extensionData.attachmentFile || null
    });
    
    // Update the task in the data
    data.tasks[taskIndex] = task;
    
    // Write the updated data back to the file
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    
    // Return success
    res.status(200).json({ 
      message: 'Extension request submitted successfully',
      task: task
    });
    
  } catch (error) {
    console.error('Error processing extension request:', error);
    res.status(500).json({ error: 'Failed to process extension request' });
  }
});

// Optional: API endpoint to get all extension requests for admin/manager view
app.get('/api/extension-requests', async (req, res) => {
  try {
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);
    
    // Collect all extension requests from all tasks
    const extensionRequests = [];
    
    data.tasks.forEach(task => {
      if (task.extensionRequests && task.extensionRequests.length > 0) {
        task.extensionRequests.forEach(request => {
          extensionRequests.push({
            taskId: task.id,
            taskTitle: task.title,
            ...request
          });
        });
      }
    });
    
    res.status(200).json(extensionRequests);
    
  } catch (error) {
    console.error('Error fetching extension requests:', error);
    res.status(500).json({ error: 'Failed to fetch extension requests' });
  }
});

// API endpoint to approve/reject extension requests (for admin/manager)
app.put('/api/extension-requests/:taskId/:requestIndex', async (req, res) => {
  try {
    const { taskId, requestIndex } = req.params;
    const { status, newDueDate, responseComment } = req.body;
    
    // Read the current data
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);
    
    // Find the task by ID
    const taskIndex = data.tasks.findIndex(task => task.id == taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get the task
    const task = data.tasks[taskIndex];
    
    // Check if the extension request exists
    if (!task.extensionRequests || !task.extensionRequests[requestIndex]) {
      return res.status(404).json({ error: 'Extension request not found' });
    }
    
    // Update the extension request
    task.extensionRequests[requestIndex].status = status;
    task.extensionRequests[requestIndex].responseComment = responseComment;
    task.extensionRequests[requestIndex].responseDate = new Date().toISOString();
    
    // If approved, update the due date
    if (status === 'Approved' && newDueDate) {
      // If it's a rework task, update the latest rework deadline
      if (task.status === 'Rework' && task.reworkDetails && task.reworkDetails.length > 0) {
        task.reworkDetails[task.reworkDetails.length - 1].deadline = newDueDate;
      } else {
        // Otherwise update the main due date
        task.dueDate = newDueDate;
      }
    }
    
    // Update the task in the data
    data.tasks[taskIndex] = task;
    
    // Write the updated data back to the file
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    
    // Return success
    res.status(200).json({
      message: `Extension request ${status.toLowerCase()}`,
      task: task
    });
    
  } catch (error) {
    console.error('Error processing extension request update:', error);
    res.status(500).json({ error: 'Failed to process extension request update' });
  }
});

// API endpoint to get extension requests for a specific task
app.get('/api/extension-requests/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract task ID from URL path
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);

    // Find the specific task
    const task = data.tasks.find(task => task.id === Number(id));
    // Check if task exists
    console.log('Task found:', task); // Debugging
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task has extension requests
    if (!task.extensionRequests || task.extensionRequests.length === 0) {
      return res.status(200).json({ message: 'No extension requests for this task' });
    }

    // Format response
    const extensionRequests = task.extensionRequests.map(request => ({
      taskId: task.id,
      taskTitle: task.title,
      ...request
    }));

    res.status(200).json(extensionRequests);

  } catch (error) {
    console.error('Error fetching extension requests:', error);
    res.status(500).json({ error: 'Failed to fetch extension requests' });
  }
});


// Route to handle approving extension requests
app.put('/api/tasks/:id/extension/approve', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { approvedDueDate } = req.body;
    
    if (!approvedDueDate) {
      return res.status(400).json({ success: false, message: 'Approved due date is required' });
    }
    
    // Read tasks from data.json
    const data = JSON.parse(fs.readFileSync('./data.json'));
    const taskIndex = data.tasks.findIndex(task => task.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = data.tasks[taskIndex];
    
    // Find the pending extension request
    const pendingRequestIndex = task.extensionRequests?.findIndex(req => req.status === 'Pending');
    
    if (pendingRequestIndex === undefined || pendingRequestIndex === -1) {
      return res.status(404).json({ success: false, message: 'No pending extension request found' });
    }
    
    // Update the request status only
    task.extensionRequests[pendingRequestIndex].status = 'Approved';
    
    // Check if the task has rework details
    if (task.reworkDetails && task.reworkDetails.length > 0) {
      // Update the latest rework deadline
      const latestReworkIndex = task.reworkDetails.length - 1;
      task.reworkDetails[latestReworkIndex].deadline = approvedDueDate;
    } else {
      // Otherwise, update the regular due date
      task.dueDate = approvedDueDate;
    }
    
    // Save the updated data
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    
    return res.json({ 
      success: true, 
      message: 'Extension request approved successfully', 
      task
    });
  } catch (error) {
    console.error('Error approving extension request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to handle declining extension requests
app.put('/api/tasks/:id/extension/decline', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { feedback } = req.body; // Extract feedback from request body

    console.log('Received decline request for task ID:', taskId);
    console.log('Request body:', req.body);

    // Read tasks from data.json
    const data = JSON.parse(fs.readFileSync('./data.json'));
    console.log('Total tasks in data:', data.tasks.length);

    const taskIndex = data.tasks.findIndex(task => task.id.toString() === taskId.toString());
    console.log('Task index found:', taskIndex);

    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = data.tasks[taskIndex];

    // Find the pending extension request
    const pendingRequestIndex = task.extensionRequests?.findIndex(req => req.status === 'Pending');

    if (pendingRequestIndex === -1 || pendingRequestIndex === undefined) {
      return res.status(404).json({ success: false, message: 'No pending extension request found' });
    }

    // Ensure extensionRequests array exists
    if (!task.extensionRequests) {
      task.extensionRequests = [];
    }

    // Update the request status
    task.extensionRequests[pendingRequestIndex] = {
      ...task.extensionRequests[pendingRequestIndex],
      status: 'Declined',
      declinedDate: new Date().toISOString(),
      declinedBy: req.user?.id || null,
      feedback: feedback || "No feedback provided" // Ensure feedback is added
    };

    // Save the updated data
    data.tasks[taskIndex] = task;
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

    return res.json({ 
      success: true, 
      message: 'Extension request declined successfully', 
      task
    });
  } catch (error) {
    console.error('Error declining extension request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to view uploaded files
app.get('/api/tasks/view/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    // Set appropriate content type for PDFs
    if (filename.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    
    // Send the file
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});





// Route to handle approving cancellation requests
app.put('/api/tasks/:id/cancellation/approve', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Read tasks from data.json
    const data = JSON.parse(fs.readFileSync('./data.json'));
    const taskIndex = data.tasks.findIndex(task => task.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = data.tasks[taskIndex];
    
    // Find the pending cancellation request
    const pendingRequestIndex = task.cancellationRequests?.findIndex(req => req.status === 'Pending');
    
    if (pendingRequestIndex === undefined || pendingRequestIndex === -1) {
      return res.status(404).json({ success: false, message: 'No pending cancellation request found' });
    }
    
    // Update the request status
    task.cancellationRequests[pendingRequestIndex].status = 'Approved';
    
    // Add cancellation date
    task.cancellationRequests[pendingRequestIndex].approvedDate = new Date().toISOString();
    
    // Save the updated data
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    
    return res.json({ 
      success: true, 
      message: 'Cancellation request approved successfully', 
      task
    });
  } catch (error) {
    console.error('Error approving cancellation request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Route to handle declining cancellation requests
app.put('/api/tasks/:id/cancellation/decline', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { feedback } = req.body;
    
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, message: 'Feedback is required when declining a cancellation request' });
    }
    
    // Read tasks from data.json
    const data = JSON.parse(fs.readFileSync('./data.json'));
    const taskIndex = data.tasks.findIndex(task => task.id.toString() === taskId.toString());
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const task = data.tasks[taskIndex];
    
    // Find the pending cancellation request
    const pendingRequestIndex = task.cancellationRequests?.findIndex(req => req.status === 'Pending');
    
    if (pendingRequestIndex === undefined || pendingRequestIndex === -1) {
      return res.status(404).json({ success: false, message: 'No pending cancellation request found' });
    }
    
    // Update the request status and add feedback
    task.cancellationRequests[pendingRequestIndex].status = 'Declined';
    task.cancellationRequests[pendingRequestIndex].feedback = feedback;
    task.cancellationRequests[pendingRequestIndex].declinedDate = new Date().toISOString();
    
    // Save the updated data
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
    
    return res.json({ 
      success: true, 
      message: 'Cancellation request declined successfully', 
      task
    });
  } catch (error) {
    console.error('Error declining cancellation request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint to get cancellation requests for a specific task
app.get('/api/cancellation-requests/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract task ID from URL path
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);

    // Find the specific task
    const task = data.tasks.find(task => task.id === Number(id));
    // Check if task exists
    console.log('Task found:', task); // Debugging
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task has cancellation requests
    if (!task.cancellationRequests || task.cancellationRequests.length === 0) {
      return res.status(200).json({ message: 'No cancellation requests for this task' });
    }

    // Format response
    const cancellationRequests = task.cancellationRequests.map(request => ({
      taskId: task.id,
      taskTitle: task.title,
      ...request
    }));

    res.status(200).json(cancellationRequests);

  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    res.status(500).json({ error: 'Failed to fetch cancellation requests' });
  }
});












// API endpoint to get cancellation requests for a task
app.get('/api/cancellation-requests/:taskId', (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    // Read the current data
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);
    
    // Find the task by ID
    const task = data.tasks.find(task => task.id == taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Return the cancellation requests (or an empty array if none exist)
    const cancellationRequests = task.cancellationRequests || [];
    res.status(200).json(cancellationRequests);
    
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    res.status(500).json({ error: 'Failed to fetch cancellation requests' });
  }
});

// API endpoint to handle cancellation requests
app.post('/api/tasks/:id/cancellation-request', upload.single('file'), async (req, res) => {
  try {
    const taskId = req.params.id;
    let cancellationData;
    
    // Parse cancellation data from request
    if (req.file) {
      // If file was uploaded
      cancellationData = JSON.parse(req.body.cancellationData);
      
      // Add file information to cancellation data
      cancellationData.attachmentFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    } else {
      // If no file was uploaded
      cancellationData = req.body;
    }
    
    console.log('Cancellation data:', cancellationData);  // Debugging
    
    // Read the current data
    const rawData = fs.readFileSync('data.json');
    const data = JSON.parse(rawData);
    
    // Find the task by ID
    const taskIndex = data.tasks.findIndex(task => task.id == taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get the task
    const task = data.tasks[taskIndex];
    
    // Initialize cancellationRequests array if it doesn't exist
    if (!task.cancellationRequests) {
      task.cancellationRequests = [];
    }
    
    // Add the new cancellation request
    task.cancellationRequests.push({
      reason: cancellationData.reason,
      requestedBy: cancellationData.requestedBy,
      requestDate: new Date().toISOString(),
      status: 'Pending', // Initial status is pending
      attachmentFile: cancellationData.attachmentFile || null
    });
    
    // Update the task in the data
    data.tasks[taskIndex] = task;
    
    // Write the updated data back to the file
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    
    // Return success
    res.status(200).json({ 
      message: 'Cancellation request submitted successfully',
      task: task
    });
    
  } catch (error) {
    console.error('Error processing cancellation request:', error);
    res.status(500).json({ error: 'Failed to process cancellation request' });
  }
});







class TaskPrioritizer {
  constructor(tasks, users) {
    this.tasks = tasks;
    this.users = users;
  }

  // Calculate base priority score
  calculateBasePriority(task) {
    const now = moment();
    const dueDate = moment(task.dueDate);
    const daysDiff = dueDate.diff(now, 'days');

    // Base priority calculation
    let priorityScore = 0;

    // Deadline proximity factor
    if (daysDiff <= 3) priorityScore += 30;
    else if (daysDiff <= 7) priorityScore += 20;
    else if (daysDiff <= 14) priorityScore += 10;

    // Status factor
    switch(task.status?.toLowerCase()) {
      case 'pending': priorityScore += 25; break;
      case 'rework': priorityScore += 35; break;
      case 'progress': priorityScore += 15; break;
      case 'completed': priorityScore += 0; break;
    }

    // Dependency and complexity factor
    const tagComplexityMap = {
      'security': 10,
      'api': 8,
      'ui': 6,
      'database': 9,
      'documentation': 5
    };

    const complexityBonus = task.tags?.reduce((total, tag) => {
      return total + (tagComplexityMap[tag.toLowerCase()] || 3);
    }, 0) || 0;

    priorityScore += complexityBonus;

    return this.normalizePriority(priorityScore);
  }

  // Normalize priority to standard levels
  normalizePriority(score) {
    if (score >= 50) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  }

  // Advanced ML-based prioritization
  advancedPrioritization() {
    return this.tasks.map(task => {
      const basePriority = this.calculateBasePriority(task);
      
      // Neural network-like feature weighting
      const features = {
        deadlineProximity: this.getDeadlineProximityFactor(task),
        userWorkload: this.getUserWorkloadFactor(task),
        taskComplexity: this.getTaskComplexityFactor(task)
      };

      // Weighted priority adjustment
      const adjustedPriority = this.applyFeatureWeights(basePriority, features);

      return {
        ...task,
        aiSuggestedPriority: adjustedPriority,
        priorityExplanation: this.generatePriorityExplanation(task, features)
      };
    });
  }

  getDeadlineProximityFactor(task) {
    const now = moment();
    const dueDate = moment(task.dueDate);
    const daysDiff = dueDate.diff(now, 'days');
    
    if (daysDiff <= 3) return 0.9;
    if (daysDiff <= 7) return 0.7;
    if (daysDiff <= 14) return 0.5;
    return 0.3;
  }

  getUserWorkloadFactor(task) {
    const userTasks = this.tasks.filter(t => t.assignedTo === task.assignedTo);
    const pendingTaskCount = userTasks.filter(t => 
      t.status?.toLowerCase() === 'pending' || 
      t.status?.toLowerCase() === 'rework'
    ).length;

    return pendingTaskCount > 3 ? 0.8 : 0.4;
  }

  getTaskComplexityFactor(task) {
    const complexityMap = {
      'security': 0.9,
      'api': 0.8,
      'ui': 0.6,
      'database': 0.7,
      'documentation': 0.5
    };

    const complexity = task.tags?.reduce((max, tag) => {
      const tagComplexity = complexityMap[tag.toLowerCase()] || 0.5;
      return Math.max(max, tagComplexity);
    }, 0.5) || 0.5;

    return complexity;
  }

  applyFeatureWeights(basePriority, features) {
    const weights = {
      deadlineProximity: 0.4,
      userWorkload: 0.3,
      taskComplexity: 0.3
    };

    const priorityMap = {
      'Low': 1,
      'Medium': 2,
      'High': 3
    };

    const baseScore = priorityMap[basePriority];

    const weightedScore = baseScore + (
      (features.deadlineProximity * weights.deadlineProximity) +
      (features.userWorkload * weights.userWorkload) +
      (features.taskComplexity * weights.taskComplexity)
    );

    if (weightedScore >= 2.7) return 'High';
    if (weightedScore >= 1.7) return 'Medium';
    return 'Low';
  }

  generatePriorityExplanation(task, features) {
    const explanations = [];

    if (features.deadlineProximity > 0.7) {
      explanations.push("Urgent deadline approaching");
    }

    if (features.userWorkload > 0.6) {
      explanations.push("High current workload");
    }

    if (features.taskComplexity > 0.7) {
      explanations.push("High complexity task");
    }

    return explanations.length > 0 
      ? `Priority boosted due to: ${explanations.join(", ")}`
      : "Standard priority assessment";
  }
}

// Routes
app.post('/api/tasks/prioritize', (req, res) => {
  try {
    const { tasks, users } = req.body;

    if (!tasks || !users) {
      return res.status(400).json({ 
        error: 'Tasks and users are required' 
      });
    }

    const prioritizer = new TaskPrioritizer(tasks, users);
    const prioritizedTasks = prioritizer.advancedPrioritization();
    
    res.json(prioritizedTasks);
  } catch (error) {
    console.error('Prioritization Error:', error);
    res.status(500).json({ 
      error: 'Internal server error during task prioritization' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!' 
  });
});






// Add this endpoint to your existing routes
app.get('/api/tasks/requests/history/all', (req, res) => {
  try {
    // Read tasks from your data file (assuming you're using JSON files based on your code)
    const tasksFilePath = path.join(__dirname, 'data', 'data.json');
    
    // Check if file exists
    if (!fs.existsSync(tasksFilePath)) {
      return res.status(404).json({ success: false, message: 'Tasks file not found' });
    }
    
    // Read and parse tasks
    const tasksData = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
    const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
    
    // Extract all request history items
    const history = [];
    
    tasks.forEach(task => {
      // Process extension requests
      if (task.extensionRequests && task.extensionRequests.length > 0) {
        task.extensionRequests.forEach(req => {
          history.push({
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description,
            assignedTo: task.assignedTo,
            requestType: "extension",
            requestDate: req.requestDate || req.createdAt,
            status: req.status,
            reason: req.reason,
            requestedDate: req.requestedDate,
            feedback: req.feedback
          });
        });
      }
      
      // Process cancellation requests
      if (task.cancellationRequests && task.cancellationRequests.length > 0) {
        task.cancellationRequests.forEach(req => {
          history.push({
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description,
            assignedTo: task.assignedTo,
            requestType: "cancellation",
            requestDate: req.requestDate || req.createdAt,
            status: req.status,
            reason: req.reason,
            feedback: req.feedback
          });
        });
      }
    });
    
    // Sort by request date (newest first)
    history.sort((a, b) => {
      const dateA = new Date(a.requestDate || a.createdAt || 0);
      const dateB = new Date(b.requestDate || b.createdAt || 0);
      return dateB - dateA;
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching request history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching request history', 
      error: error.message 
    });
  }
});













// Add this endpoint to your backend server (e.g., in routes/taskRoutes.js)
app.get('/admin/tasks/user/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Using callback version of readFile
    fs.readFile('./data.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return res.status(500).json({ message: 'Error fetching user tasks', error: err.message });
      }
      
      try {
        const parsedData = JSON.parse(data);
        const userTasks = parsedData.tasks.filter(task => task.assignedTo == userId);
        
        // Find the user to include their details
        const userData = parsedData.users.find(user => user.id == userId);
        
        // Return both user data and tasks
        res.status(200).json({
          user: userData,
          tasks: userTasks
        });
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        res.status(500).json({ message: 'Error parsing task data', error: parseError.message });
      }
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ message: 'Error fetching user tasks', error: error.message });
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));








app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});