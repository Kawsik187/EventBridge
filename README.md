# EventBridge 🎓🚀
### Multi-Institution College Event Management & Verifiable Credential Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47a248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

Inter-college technical symposiums, hackathons, workshops, and cultural festivals are cornerstones of higher education. However, managing multi-institution events typically suffers from fragmented tools (Google Forms, disparate spreadsheets, untracked messaging channels), manual paper attendance, venue scheduling clashes, and easily forged participation certificates.

**EventBridge** is an enterprise-grade, full-stack **MERN** web platform designed to unify inter-college event discovery, multi-institution student registration, collaborative cross-college team formation, multi-stage submission workflows, real-time QR attendance verification, and tamper-proof public certificate validation.

---

## 🌟 Core Feature Matrix

### 🎓 1. Student & Participant Experience
* **Centralized Discovery Hub**: Filter campus events by category (Hackathons, Workshops, Technical Symposiums, Cultural), participation format (Online, Offline, Hybrid), and registration status.
* **Institutional Mapping**: Standardized registration linking students with institutional identifiers (AISHE / UDISE codes) and official university email domains.
* **Collaborative Team Hub**: Form teams with customizable sizes (1–10 members), generate unique alphanumeric join codes, invite cross-college peers, and manage team rosters.
* **Digital QR Tickets**: Instant generation of cryptographically tracked QR access passes upon confirmed registration.
* **Multi-Stage Round Submissions**: Track progression through event rounds (Idea Submissions, Quiz, Code Repositories, Offline Evaluations) with deadline enforcement.
* **Student Certificate Vault**: One-click download of high-resolution digital certificates with embedded cryptographic verification IDs.

### 🏛️ 2. College Host & Department Organizer Suite
* **Interactive Event Wizard**: Configure event schedules, registration deadlines, max seat capacities, customized form fields, prizes, and venue assignments.
* **Multi-Stage Round Evaluator**: Unstop-style multi-round management featuring elimination filtering, evaluator assignment, and scorecards.
* **Camera-Based QR Attendance Scanner**: Built-in `html5-qrcode` scanner supporting continuous badge check-in, real-time duplicate attendance blocking, and check-in timestamping.
* **Volunteer Delegation**: Assign student volunteers with scoped privileges for on-ground check-ins and session monitoring.
* **Real-time Announcements**: Broadcast instant updates and schedule changes to registered participants.
* **Automated Certificate Engine**: Batch generate and issue cryptographically verifiable certificates with custom templates for participants and winners.

### 🛡️ 3. Platform Super Administrator
* **Institutional KYC & Organizer Approvals**: Review pending organizer registrations with one-click approval or audited rejection workflows.
* **Department Hierarchy & Rotation**: Manage 15+ academic departments, prevent duplicate active organizers, and execute audited organizer rotations.
* **Venue Conflict Prevention**: System-level concurrency detection preventing double-booking of physical campus auditoriums and labs.
* **System Audit Logs & Analytics**: Comprehensive platform analytics monitoring cross-institution registration trends and attendance metrics.

### 🔍 4. Public Credential Verification Portal
* **Tamper-Proof Verification (`/verify/:id`)**: Publicly accessible validation portal allowing employers, academic institutions, and recruiters to authenticate certificate validity and event credentials via QR scan or unique ID lookup without requiring an account.

---

## 🏗️ System Architecture & Technology Stack

```
                     ┌──────────────────────────────────────────────┐
                     │          React 18 + Vite Frontend            │
                     │  (Vanilla CSS, Lucide Icons, HTML5-QRCode)   │
                     └──────────────────────┬───────────────────────┘
                                            │ REST / JSON (JWT / Cookies)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │           Express.js 4.x REST API            │
                     │  - Helmet / CSP / XSS Security Headers       │
                     │  - Strict CORS Origin Whitelisting           │
                     │  - JWT & Google OAuth 2.0 Authentication     │
                     │  - Role-Based Access Control (RBAC)          │
                     │  - Concurrency & Conflict Validators         │
                     └──────────────────────┬───────────────────────┘
                                            │ Mongoose ODM
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │               MongoDB Database               │
                     │  (15 Relational-Like Schemas with Indexes)   │
                     └──────────────────────────────────────────────┘
```

### Technology Breakdown

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18.2** with **Vite 5.2** | Blazing-fast component rendering, modern modular architecture |
| **Routing** | **React Router DOM v6** | Declarative route management with role-based guards (`ProtectedRoute`, `OrganizerRoute`, `AdminRoute`) |
| **UI & Styling** | **Vanilla CSS + Glassmorphism** | Responsive design tokens, CSS variables, dark/light harmonious aesthetics |
| **QR Code Engine** | **html5-qrcode** & **qrcode** | In-browser camera scanning and vector QR code ticket generation |
| **Backend Runtime** | **Node.js (ES Modules)** | Asynchronous, event-driven server runtime |
| **Web Framework** | **Express.js 4.19** | RESTful routing, custom middleware pipelines, and error handling |
| **Database & ODM** | **MongoDB** + **Mongoose 8.3** | Indexed schemas, population pipelines, and data consistency models |
| **Authentication** | **JWT** + **Google Auth Library** | Dual-strategy authentication supporting institutional Google OAuth 2.0 & Bcrypt password hashing |
| **Security & Headers** | **CSP, CORS, Cookie-Parser** | Custom Content Security Policy, strict origin reflection, and HttpOnly cookies |

---

## 📂 Project Structure

```
EventBridge-College_Event_Management/
├── client/                               # Frontend Single Page Application (SPA)
│   ├── index.html                        # HTML5 entry template
│   ├── vite.config.js                    # Vite build configuration
│   ├── package.json                      # Client dependencies & scripts
│   └── src/
│       ├── App.jsx                       # Master routing table & role guards
│       ├── main.jsx                      # React root mounting
│       ├── context/
│       │   └── AuthContext.jsx           # Global user authentication state
│       ├── components/
│       │   ├── common/                   # Reusable UI widgets (Navbar, Footer, Modal)
│       │   └── ...
│       ├── pages/
│       │   ├── admin/                    # Admin Dashboard, Approvals, Venues, Departments
│       │   ├── auth/                     # Login, Register, RequestOrganizer
│       │   ├── organizer/                # Event Wizard, Scanner, Evaluator, Analytics
│       │   └── student/                  # Discover, EventsList, TeamHub, Certificates
│       ├── services/                     # Axios API service integrations
│       ├── styles/                       # Modular CSS design system
│       └── utils/                        # Certificate downloaders & formatting helpers
│
├── server/                               # Backend RESTful API Server
│   ├── server.js                         # Server entry point, middleware & route bindings
│   ├── package.json                      # Server dependencies & test scripts
│   ├── config/
│   │   └── db.js                         # Resilient MongoDB connection handler
│   ├── middleware/
│   │   ├── auth.js                       # JWT verification & RBAC role checkers
│   │   └── validate.js                   # Request body schemas & sanitization
│   ├── models/                           # 15 Mongoose Schema Definitions
│   │   ├── Announcement.js               # Event broadcast notifications
│   │   ├── Attendance.js                 # QR check-in logs & timestamping
│   │   ├── AuditLog.js                   # System-wide administrative action logs
│   │   ├── Certificate.js                # Verifiable digital certificate records
│   │   ├── CollegeProfile.js             # Institutional details & AISHE/UDISE registry
│   │   ├── Department.js                 # College departments with organizer mapping
│   │   ├── Event.js                      # Multi-round event configurations & schedules
│   │   ├── Organization.js               # Student clubs & institutional hosting entities
│   │   ├── OrganizerRequest.js           # Host onboarding review queue
│   │   ├── Registration.js               # Participant registrations & QR tickets
│   │   ├── Submission.js                 # Multi-stage round project submissions
│   │   ├── Team.js                       # Cross-college team structures & invite codes
│   │   ├── User.js                       # Student, Organizer, and Admin identities
│   │   ├── Venue.js                      # Campus auditoriums & physical capacities
│   │   └── Volunteer.js                  # Event volunteer roles & permissions
│   ├── routes/                           # Express modular route definitions
│   │   ├── adminRoutes.js                # Super Admin approval & management APIs
│   │   ├── authRoutes.js                 # Login, Google OAuth, organizer signup
│   │   ├── eventRoutes.js                # Event CRUD, lifecycle & round endpoints
│   │   ├── registrationRoutes.js         # Event registration & QR ticket APIs
│   │   ├── teamRoutes.js                 # Team creation, roster & join by code
│   │   ├── attendanceRoutes.js           # QR scanner verification & attendance logs
│   │   ├── certificateRoutes.js          # Certificate issuance & public verify
│   │   └── ...                           # Venues, Departments, Submissions, Announcements
│   └── utils/                            # Testing suites, seed runners & lifecycle helpers
│       ├── seedRunner.js                 # Populates standard departments & demo data
│       ├── testRequirement20.js         # 20-point comprehensive requirement verification
│       ├── testAllFeatures.js            # End-to-end integration test suite
│       ├── testUnstopLifecycle.js        # Multi-round deadline & evaluation test suite
│       └── testConcurrencyAndSecurity.js # Concurrency, venue clashes & RBAC security test
│
├── .env.example                          # Blueprint for environment variables
└── README.md                             # Project documentation
```

---

## 🗄️ Database Models Summary

| Model | Primary Purpose |
| :--- | :--- |
| `User` | Stores profile data, hashed passwords, OAuth IDs, role (`student`, `organizer`, `college_admin`, `admin`), and institutional affiliation. |
| `Event` | Contains event metadata, multi-stage rounds (`quiz`, `idea_submission`, `code_repo`, `presentation`), eligibility criteria, dates, and capacities. |
| `Team` | Organizes participants under a leader with members, unique invite codes, and submission records. |
| `Registration` | Maps students or teams to events, assigns status (`confirmed`, `waitlisted`, `cancelled`), and stores dynamic QR code payloads. |
| `Submission` | Stores team artifacts, file attachments, GitHub/demo links, and scores per round. |
| `Attendance` | Logs timestamped check-ins linked to specific registrations and volunteers. |
| `Certificate` | Cryptographic certificate records containing unique certificate numbers, issue dates, student IDs, and verification hashes. |
| `Department` | Academic departments (e.g. CSE, ECE, MECH, IT) linked to an active organizer. |
| `Venue` | Physical campus auditoriums/halls with capacity limits and conflict-checking capabilities. |
| `OrganizerRequest`| Captures organizer applications with institutional proof for administrative review. |
| `AuditLog` | Immutable audit trail of administrative approvals, rejections, and organizer rotations. |

---

## 🔌 Primary REST API Endpoints

### 🔐 Authentication & Accounts
* `POST /api/auth/register` - Create a student account with institutional affiliation
* `POST /api/auth/login` - Authenticate using email and password
* `POST /api/auth/google` - Authenticate or register using Google OAuth 2.0 token
* `POST /api/auth/request-organizer` - Submit organizer KYC application
* `GET  /api/auth/me` - Retrieve authenticated user session details

### 🎪 Events & Lifecycle
* `GET  /api/events` - Query published events with search, category, and date filtering
* `GET  /api/events/:id` - Fetch comprehensive event details, rounds, and rules
* `POST /api/events` - Create a new event (*Organizer / Admin*)
* `PUT  /api/events/:id` - Update existing event details (*Owning Organizer only*)
* `POST /api/events/:id/publish` - Transition approved event to live status

### 👥 Teams & Registrations
* `POST /api/registrations/events/:id/register` - Register individual or team for an event
* `GET  /api/registrations/my-registrations` - Retrieve current student's registered events & QR tickets
* `POST /api/teams` - Create a new team with an auto-generated invite code
* `POST /api/teams/join` - Join an existing team using an alphanumeric invite code

### 📷 Attendance & Volunteers
* `POST /api/attendance/scan` - Validate scanned participant QR code and record attendance
* `GET  /api/attendance/event/:id` - View live attendance headcount and attendee logs
* `POST /api/volunteers` - Assign volunteer responsibilities for an event

### 📜 Certificates & Public Verification
* `POST /api/certificates/generate` - Batch-issue certificates to attended participants / winners
* `GET  /api/certificates/my-certificates` - List all certificates earned by logged-in student
* `GET  /api/certificates/verify/:id` - **Public verification endpoint** (Returns certificate authenticity)

### ⚙️ Platform Administration
* `GET  /api/admin/organizer-requests` - List pending host / organizer applications
* `POST /api/admin/organizer-requests/:id/approve` - Approve organizer & activate department role
* `POST /api/admin/organizer-requests/:id/reject` - Reject organizer with documented reason
* `POST /api/admin/departments/:id/replace-organizer` - Rotate active department organizer
* `GET  /api/admin/analytics` - View cross-platform metrics, registrations, and venue utilization

---

## 🚀 Getting Started

### 📋 Prerequisites
* **Node.js**: Version 18.x or later installed
* **npm**: Version 9.x or later
* **MongoDB**: Local MongoDB community service running at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

---

### ⚙️ 1. Environment Configuration

Copy the example environment configuration into both project roots:

```bash
cp .env.example .env
cp .env.example server/.env
```

Ensure `.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/eventbridge
JWT_SECRET=your_super_secret_jwt_key_here_at_least_32_characters

# Platform Super Admin Initial Credentials
INITIAL_ADMIN_EMAIL=admin@campus.edu
INITIAL_ADMIN_PASSWORD=AdminSecurePassword2026!

# College Official Domain Configuration
ALLOWED_COLLEGE_EMAIL_DOMAIN=srmeaswari.ac.in

# Client Origin
CLIENT_URL=http://localhost:3000

# Google OAuth 2.0 (Optional for local testing)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

---

### 📦 2. Installation

Install dependencies for the root, server, and client:

```bash
# Install root orchestration packages
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

cd ..
```

---

### 🗄️ 3. Seed the Database

Populate default campus departments (CSE, ECE, MECH, IT, etc.), campus venues, sample hackathons, and demo accounts:

```bash
npm run seed
```

---

### 💻 4. Running the Application

You can run both client and server concurrently or in separate terminals:

#### Option A: Run via Root Scripts
```bash
# Terminal 1: Start Backend API (runs on port 5000)
npm run server:dev

# Terminal 2: Start Frontend Vite Server (runs on port 3000 / 5173)
npm run client
```

#### Option B: Run Directly
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`** (or the port indicated by Vite).

---

## 🧪 Comprehensive Verification & Test Suite

The platform includes built-in test suites validating end-to-end functionality, security controls, and concurrency:

```bash
cd server

# 1. Run 20-Point Core Requirement Test Suite
npm run test

# 2. Run Multi-Round Unstop Lifecycle & Deadline Test
npm run test:lifecycle

# 3. Run Concurrency, Venue Clashing & RBAC Security Suite
npm run test:security

# 4. Run Full Feature Verification
npm run test:features
```

---

## 🔒 Security & Data Integrity

1. **Role-Based Access Control (RBAC)**: Strict segregation between `student`, `organizer`, `college_admin`, and `admin` roles enforced on every API route.
2. **Venue Conflict Prevention**: Database transactions and pre-save locks verify that no two events can reserve the same venue on overlapping dates.
3. **Cross-Department Protection**: Department organizers can only manage events belonging to their assigned department ID.
4. **Credential Forgery Prevention**: Certificates are indexed with unique UUIDs and cryptographically verifiable IDs, making tampering impossible.
5. **Hardened HTTP Headers**: Strict Content-Security-Policy (CSP), `nosniff`, `X-Frame-Options: DENY`, and XSS filtering.

---

## 👥 Contributors & Institutional Attribution

* **Project**: EventBridge - Multi-Institution College Event Management & Verification Platform
* **Institution**: Easwari Engineering College (Autonomous), Ramapuram, Chennai
* **Department**: Department of Information Technology (Affiliated to Anna University)
* **Author / Developer**: Kawsik M

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
