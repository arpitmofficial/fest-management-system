# Felicity Event Management System

A centralized platform built on the MERN stack to manage events, clubs, and participants seamlessly, replacing the chaos of Google Forms and spreadsheets in felicity.


## 🚀 Live Demo
Please refer to `deployment.txt` for the live URLs.

---

## 🛠️ Technology Stack & Justifications

### Frontend (React + Vite)
- **React**: Chosen for its component-based architecture, which makes building reusable UI elements (like event cards, dashboards) highly efficient.
- **Vite**: Used instead of Create React App for significantly faster build times and a better developer experience.
- **React Router DOM**: Essential for creating a single-page application (SPA) experience without page reloads.
- **Axios**: Simplifies HTTP requests and allows setting up global interceptors (like automatically attaching the JWT token to every request).
- **React Google reCAPTCHA v3**: Used exclusively on login/registration pages for seamless, invisible bot protection without interrupting the user workflow.
- **jwt-decode**: A small library used to decode JSON Web tokens locally, allowing the frontend to extract user roles and IDs without requiring additional API calls.
- **Vanilla CSS / Inline Styling**: Chosen over UI libraries (like Material-UI) to maintain complete granular control over the application's unique, vibrant aesthetic while keeping the final bundle size small.

### Backend (Node.js + Express)
- **Express.js**: The standard, lightweight, and unopinionated framework for handling RESTful APIs in the Node ecosystem.
- **Mongoose**: Provides a straightforward, schema-based solution to model application data in MongoDB, including built-in type casting and validation.
- **Bcrypt**: A proven, secure hashing algorithm used to securely store all user passwords.
- **JSON Web Token (JWT)**: Used for stateless authentication. It scales well and integrates seamlessly with REST APIs securely.
- **CORS**: Middleware used to enable secure cross-origin requests between the separate frontend and backend deployments.
- **Dotenv**: Loads environment variables from a `.env` file into `process.env`, keeping secrets (like JWT keys and database URIs) secure and out of the source code.
- **Nodemailer**: Used to send automated emails, such as merchandise purchase confirmations containing tickets and automated password provisioning for organizers.
- **Axios**: Included in the backend to send external HTTP requests, specifically to post rich-embed notifications to Discord Webhooks when organizers publish events.
- **QRCode**: Used to dynamically generate QR code data URIs for participant tickets and merchandise purchases.
- **Nodemon (Dev-Dependency)**: A utility that monitors for any changes in the backend source code and automatically restarts the local server during development.

### Database
- **MongoDB Atlas**: A cloud-hosted NoSQL database. Since JavaScript uses JSON natively, MongoDB's BSON documents map perfectly to our MERN stack. Its flexible schema allows for diverse event models (e.g., handling normal events vs. merchandise variants).

---

## 🌟 Advanced Features Implemented

The following advanced features were selected to total the required 30 marks. They are fully implemented with the rationale detailed below:

### Tier A: Core Advanced Features (8 Marks Each)
**1. Merchandise Payment Approval Workflow**
- *Justification*: Festivals frequently sell merchandise. Having a manual approval process for payment proofs ensures accountability and revenue tracking before inventory is released.
- *Implementation*: A user purchases an item and submits proof; the ticket is in a `pending` state. The organizer reviews it on the Manage Event page. Upon approval, stock is decremented, the ticket status updates to `confirmed`, and a QR code is generated. Rejection denies the QR generation.

**2. QR Scanner & Attendance Tracking**
- *Justification*: Prevents unauthorized entry and keeps track of actual footfall versus mere registrations.
- *Implementation*: Built directly into the Organizer Dashboard. The organizer scans a participant's QR code (via camera), which hits the backend to verify the `ticketId`. It prevents duplicate scans and updates a live dashboard showing attended vs. un-attended statistics. Includes manual override with an audit log reason.

### Tier B: Real-time & Communication Features (6 Marks Each)
**1. Real-Time Discussion Forum**
- *Justification*: Enables active engagement between participants and organizers prior to an event without relying on third-party apps like WhatsApp.
- *Implementation*: An interactive discussion component embedded in the Event Details page. Supports threading (replies), multiple emoji reactions, and soft-deletion. Organizers can "Pin" messages and make "Announcements". Built using a short-polling interval to simulate real-time updates seamlessly on serverless/managed deployments without WebSocket connectivity overhead.

**2. Organizer Password Reset Workflow**
- *Justification*: Critical for security and account recovery since organizers cannot self-register.
- *Implementation*: Built predominantly as an administrative tool. Organizers request a reset specifying a reason. Admins view requests in a dedicated dashboard, can leave tracking comments, and upon approval, the system auto-generates a secure password for the Admin to securely share.

### Tier C: Integration & Enhancement Features (2 Marks Each)
**1. Bot Protection (CAPTCHA)**
- *Justification*: Chosen as the singular Tier C enhancement to protect the primary entry points of the application (Registration & Login) from automated attacks or brute force attempts.
- *Implementation*: Integrated Google reCAPTCHA v3. We chose v3 over v2 because it operates invisibly in the background, analyzing user behavior without forcing the user to select images of crosswalks or traffic lights, significantly enhancing the UX.

> **Note**: As per the instructions to implement exactly ONE Tier C feature, only Bot Protection is active.

---

## 💻 Running the Submission (From ZIP)

Follow these steps to run the application natively for evaluation from the downloaded `2024101112.zip` archive.

### Prerequisites
- Node.js (v16 or higher)
- No `.env` configuration is required. The submitted ZIP specifically includes pre-configured `.env` files mapping to a live MongoDB instance and local API URLs specifically for evaluation ease.

### 1. Extract and Start Backend
1. Extract `2024101112.zip` and open a terminal inside the extracted directory.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The backend should now rapidly compile and state it is running on port `5000` via Nodemon.*

### 2. Start Frontend
1. Open a **new** terminal window/tab inside the same extracted directory.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the localhost URL provided by Vite (usually `http://localhost:5173`).

---
> **Note to Evaluator:** The frontend `.env` within this zip explicitly maps `VITE_API_BASE_URL` to `http://localhost:5000/api` to ensure it targets your locally running backend. The deployed live Vercel version targets the live Render backend.