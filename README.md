# 🚀 Task Manager – Full-Stack Setup Guide + Feature Breakdown

**Task Manager** is an intelligent, full-stack solution designed for modern teams to manage tasks with ease. From assignment to automated reminders, everything is streamlined with AI-powered insights and seamless third-party integrations.  
This guide will walk you through setting up the app locally and exploring all its powerful features.

---

## ⚡️ Why Task Manager?

> 💼 Built for productivity  
> 🤖 Enhanced with AI  
> 📈 Insightful analytics  
> 🔗 Packed with integrations

---

## 🔧 Prerequisites

Ensure the following are installed:

- ✅ **Node.js (v20+)** → [Download Node.js](https://nodejs.org/)
- ✅ **npm** → Comes bundled with Node.js

---

## 📁 Project Structure Overview

```
TaskFlow/
├── backend/    ← Express.js backend logic
├── frontend/   ← React-based interactive UI
└── README.md
```

---

## ⚙️ Backend Setup (Terminal #1)

1. Navigate to the backend folder:
   ```bash
   cd your_path/TaskFlow/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install required packages:
   ```bash
   npm install express cors body-parser multer twilio dotenv googleapis fast2sms
   ```

4. Create a `.env` file inside the `backend/` folder and add your configuration values:
   ```env
   # WhatsApp
   WHATSAPP_APPKEY=your_key
   WHATSAPP_AUTHKEY=your_key

   # Fast2SMS
   FAST2SMS_API_KEY=your_key
   FAST2SMS_API_URL=https://www.fast2sms.com/dev/bulkV2

   # Twilio
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+123456789
   TWILIO_CALL_URL=cloudinary_audio_url

   # Email
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Server
   PORT=5000

   # Google OAuth
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret
   REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   ```
   🔸 **Make sure the `.env` file is placed inside the `backend/` folder**.

5. **Update hardcoded configs**  
   In `backend/index.js`, search for `"Change as per your need"` and **change values** like:

   - API keys  
   - Auth tokens  
   - Email addresses  
   - Twilio URLs  
   - Google OAuth credentials  

   🔍 This step is essential to ensure your app uses correct and secure environment variables, but here we use environment variables.

6. Start the backend server:
   ```bash
   node index.js
   ```

🔗 App running at: [http://localhost:5000](http://localhost:5000)

---

## 💻 Frontend Setup (Terminal #2)

1. Navigate to the frontend folder:
   ```bash
   cd your_path/TaskFlow/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install libraries:
   ```bash
   npm install react-select lucide-react react-icons recharts react-chartjs-2 chart.js react-toastify tone date-fns
   ```

4. Start the frontend app:
   ```bash
   npm start
   ```

🌐 View the UI at: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Initial Credentials

You can use the following test credentials after setup:

### 👨‍💼 Admin Login
- **Username**: `admin`  
- **Password**: `4321`

### 👤 User Login
- **Username**: `kavin`  
- **Password**: `123`

---

## ➕ Create a New User

To create a new user, navigate to:  
👉 [http://localhost:3000/users](http://localhost:3000/users)

There you can add user details and assign roles.

---

## 🔌 Third-Party Integration Highlights

| Service           | Purpose               | Setup Link |
|------------------|------------------------|-------------|
| **WhatsApp API** | Real-time messaging     | [RCSoft API](https://whats-api.rcsoft.in/user/dashboard) |
| **Fast2SMS**     | SMS Notifications       | [Fast2SMS Setup](https://www.fast2sms.com/dashboard/dlt-intro) |
| **Twilio**       | Voice Call Alerts       | [Twilio Console](https://console.twilio.com/) |
| **Nodemailer**   | Email Services          | Use Gmail with 2FA & App Password |
| **Google OAuth** | Calendar Sync & Login   | [Google Cloud Console](https://console.cloud.google.com/) |

---

## ✨ Key Features At a Glance

### 🗂️ Task Management
- Assign, edit, and submit tasks
- Rework requests & completion tracking

### 🤖 AI Features
- **Feedback Summarization**
- **Smart Task Ordering**
- **Intelligent Priority Detection**

### 🔁 Workflow Controls
- Extension & cancellation requests (with admin decisions)
- Attachments & detailed feedback support

### 📊 Dashboard & Analytics
- Productivity insights for admins & users
- Visual charts: progress, overdue tasks, completion rate, etc.

### 🔔 Notifications System
- Multi-channel alerts: **Email**, **SMS**, **WhatsApp**, **Voice Calls**
- Deadlines + reminders

### 🧾 Audit History
- Complete submission & revision logs

---

## 📫 Reach Out

Have questions or want to collaborate? Let’s connect!

📧 **Email**: [kavin.apm2003@gmail.com](mailto:kavin.apm2003@gmail.com)