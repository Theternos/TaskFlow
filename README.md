# Task Manager - Setup Guide

## Prerequisites
Ensure you have the following installed on your system:
- **Node.js (v20 or later)** – [Download Here](https://nodejs.org/)
- **npm (Node Package Manager)** – Comes with Node.js

## Project Setup
Follow these steps to set up the Task Manager application.

---

## **Backend Setup** (CMD 1)
1. Open a terminal (**CMD 1**) and navigate to the backend directory:
   ```sh
   cd C:\Users\Anusuya J\Desktop\task-manager\task-manager\backend
   ```
2. Install the necessary dependencies:
   ```sh
   npm install
   ```
3. Install required libraries:
   ```sh
   npm install express cors body-parser multer twilio dotenv googleapis
   npm i fast2sms
   npm i wbm
   ```
4. Start the backend server:
   ```sh
   node index.js
   ```
   The backend should now be running.

---

## **Frontend Setup** (CMD 2)
1. Open a second terminal (**CMD 2**) and navigate to the frontend directory:
   ```sh
   cd C:\Users\Anusuya J\Desktop\task-manager\task-manager\frontend
   ```
2. Install the necessary dependencies:
   ```sh
   npm install
   ```
3. Install required libraries:
   ```sh
   npm install react-select lucide-react react-icons recharts react-chartjs-2 chart.js react-toastify tone date-fns
   ```
4. Start the frontend application:
   ```sh
   npm start
   ```
   The frontend should now be running.
---