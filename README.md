# JobSpeedy AI Admin Dashboard

A comprehensive admin dashboard for managing job postings, candidates, clients, and AI-powered recruitment tools. This full-stack application provides administrators with powerful tools to streamline the hiring process through intelligent automation and data management.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

JobSpeedy AI Admin is a modern recruitment management system designed to help administrators efficiently manage the entire hiring lifecycle. The platform combines traditional admin capabilities with AI-powered features to automate job posting creation, resume parsing, and candidate matching.

### Key Capabilities

- **Candidate Management**: View, search, and manage candidate profiles with detailed application history
- **Job Management**: Create, update, and track job postings with status management
- **Client Management**: Maintain a directory of client companies and their contact information
- **AI-Powered Tools**: 
  - Generate professional job advertisements from brief descriptions
  - Extract skills and information from uploaded resumes
  - Match candidates to job postings based on qualifications
  - Generate anonymized candidate profiles for privacy-compliant sharing
- **Analytics Dashboard**: Real-time statistics and visualizations of recruitment metrics
- **Multi-language Support**: English and German language interfaces

## ✨ Features

### Dashboard
- Overview statistics (candidates, jobs, clients, applications)
- Weekly application trends visualization
- Distribution charts for key metrics
- Quick navigation to all major sections

### Candidate Management
- Comprehensive candidate listing with search functionality
- Detailed candidate profiles with application history
- Resume viewing and download capabilities
- Application status tracking
- Candidate deletion with cascade application removal

### Job Management
- Create and edit job postings
- Set job status (Open/Closed)
- Manage job requirements and descriptions
- Track applications per job
- Link jobs to client companies

### AI Tools
- **Job Ad Generation**: Input a brief description and generate a complete, professional job posting
- **Resume Parsing**: Upload PDF resumes and automatically extract skills, experience, and qualifications
- **Candidate Matching**: Match candidates to specific job postings based on extracted data
- **Anonymized Profiles**: Generate privacy-compliant candidate profiles for sharing

### Client Management
- Add and manage client companies
- Store contact person and email information
- Link jobs to specific clients

### Authentication & Security
- Separate admin authentication system
- Secure password hashing with bcrypt
- Session management
- Protected routes

## 🛠 Technology Stack

### Frontend
- **React 19.2.0** - Modern UI library
- **React Router 7.9.5** - Client-side routing
- **React Scripts 5.0.1** - Build tooling
- **CSS3** - Styling and responsive design

### Backend
- **Node.js** - Runtime environment
- **Express 4.19.2** - Web framework
- **PostgreSQL** - Relational database
- **pg 8.13.1** - PostgreSQL client

### AI & File Processing
- **OpenAI API 4.52.7** - AI-powered job generation and resume parsing
- **pdf-parse 1.1.4** - PDF document parsing
- **pdfkit 0.15.0** - PDF generation
- **multer 1.4.5** - File upload handling

### Utilities
- **bcryptjs 2.4.3** - Password hashing
- **cors 2.8.5** - Cross-origin resource sharing
- **dotenv 16.4.5** - Environment variable management

## 📁 Project Structure

```
Job-speedy-AI-Admin/
│
├── public/                     # Static assets
│   ├── index.html             # HTML template
│   ├── favicon.ico            # Site icon
│   ├── manifest.json          # PWA manifest
│   └── robots.txt             # SEO robots file
│
├── server/                     # Backend application
│   ├── src/
│   │   ├── index.js           # Express server entry point
│   │   ├── pg.js              # PostgreSQL connection pool
│   │   ├── authRoutes.js      # Authentication endpoints
│   │   ├── candidateRoutes.js # Candidate management endpoints
│   │   ├── clientRoutes.js    # Client management endpoints
│   │   ├── jobRoutes.js       # Job management endpoints
│   │   ├── toolsRoutes.js     # AI tools endpoints
│   │   └── userRoutes.js      # User management endpoints
│   ├── sql/
│   │   └── schema.sql         # Database schema and seed data
│   ├── run-schema.js          # Schema execution script
│   ├── package.json           # Backend dependencies
│   └── .env                   # Backend environment variables (create this)
│
├── src/                        # Frontend React application
│   ├── components/
│   │   ├── AdminDashboard.js           # Main dashboard component
│   │   ├── CandidateManagementPage.js  # Candidate listing page
│   │   ├── CandidateDetailPage.js     # Individual candidate view
│   │   ├── AnonymizedProfilePage.js   # Anonymized profile generator
│   │   ├── JobManagementPage.js       # Job management interface
│   │   ├── AIToolsPage.js             # AI tools interface
│   │   ├── ClientsPage.js             # Client management page
│   │   ├── LoginPage.js               # Admin login
│   │   ├── RegisterPage.js            # Admin registration
│   │   └── Layout.js                  # Main layout wrapper
│   ├── contexts/
│   │   └── LanguageContext.js         # i18n context provider
│   ├── locales/
│   │   ├── en.json                    # English translations
│   │   └── de.json                    # German translations
│   ├── utils/
│   │   └── i18n.js                    # Internationalization utilities
│   ├── assets/                        # Images and static assets
│   ├── App.js                         # Main React component
│   ├── App.css                        # Application styles
│   ├── index.js                       # React entry point
│   └── index.css                      # Global styles
│
├── package.json                # Frontend dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher recommended)
- **npm** (v7 or higher) or **yarn**
- **PostgreSQL** (v12 or higher)
- **OpenAI API Key** (for AI features)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Job-speedy-AI-Admin
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# Server Configuration
PORT=4000

# PostgreSQL Database Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=jobspeedy
PGUSER=postgres
PGPASSWORD=your_password_here
PGSSLMODE=

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Replace placeholder values with your actual credentials.

### Frontend API Configuration

The frontend is configured to connect to `http://localhost:4000` by default. If your backend runs on a different port or host, update the API URLs in the React components.

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE jobspeedy;

# Exit psql
\q
```

### 2. Run Database Schema

Execute the schema file to create tables and seed initial data:

```bash
cd server
npm run schema
```

Alternatively, you can run the SQL file directly:

```bash
psql -U postgres -d jobspeedy -f sql/schema.sql
```

### Default Credentials

The schema seeds the following default accounts:

- **Admin User**: `admin@example.com` / `Password123!`
- **Test User**: `john@example.com` / `Password123!`

**⚠️ Security Note**: Change these default credentials in production!

## ▶️ Running the Application

### Development Mode

#### 1. Start the Backend Server

```bash
cd server
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or your configured PORT).

#### 2. Start the Frontend Development Server

In a new terminal window:

```bash
npm start
```

The React app will open in your browser at `http://localhost:3000`.

### Verify Installation

1. **Backend Health Check**: Visit `http://localhost:4000/api/health`
2. **Database Health Check**: Visit `http://localhost:4000/api/db-health`
3. **Frontend**: Navigate to `http://localhost:3000` and log in with admin credentials

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration

### Candidates
- `GET /api/users/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate details
- `GET /api/candidates/:id/applications` - Get candidate applications
- `DELETE /api/candidates/:id` - Delete candidate

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/stats/weekly` - Get weekly statistics
- `POST /api/jobs/generate-ad` - Generate job ad using AI

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### AI Tools
- `POST /api/tools/parse-resume` - Parse uploaded resume PDF
- `POST /api/tools/match-candidates` - Match candidates to job
- `POST /api/tools/generate-anonymized` - Generate anonymized profile

### Health Checks
- `GET /api/health` - Server health status
- `GET /api/db-health` - Database connection status

## 💻 Development

### Code Structure

- **Frontend**: Component-based React architecture with routing and context for state management
- **Backend**: RESTful API with Express, organized by feature routes
- **Database**: PostgreSQL with normalized schema and proper indexing

### Adding New Features

1. **New API Endpoint**: Add route handler in appropriate `*Routes.js` file
2. **New Frontend Page**: Create component in `src/components/` and add route in `App.js`
3. **Database Changes**: Update `server/sql/schema.sql` and run migration

### Internationalization

The application supports multiple languages through the `LanguageContext`. To add a new language:

1. Create a new JSON file in `src/locales/` (e.g., `fr.json`)
2. Copy the structure from `en.json` and translate the values
3. Update `LanguageContext.js` to include the new language

## 🏗️ Building for Production

### Build Frontend

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Deploy Backend

1. Set production environment variables
2. Ensure PostgreSQL is accessible
3. Run database migrations
4. Start the server with a process manager (PM2, systemd, etc.)

```bash
cd server
npm start
```

### Environment-Specific Configuration

- Use different `.env` files for development, staging, and production
- Update API URLs in frontend components for production
- Configure CORS settings in `server/src/index.js` for production domains

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify PostgreSQL is running: `pg_isready`
- Check `.env` file has correct database credentials
- Ensure database exists: `psql -U postgres -l`

#### Port Already in Use
- Change `PORT` in `server/.env` for backend
- React dev server will prompt to use a different port automatically

#### Module Not Found Errors
- Run `npm install` in both root and `server/` directories
- Delete `node_modules` and `package-lock.json`, then reinstall

#### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly in `server/.env`
- Check API key has sufficient credits
- Review API rate limits

#### CORS Issues
- Ensure backend CORS is configured in `server/src/index.js`
- Check frontend is making requests to correct backend URL

### Getting Help

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database schema is up to date
4. Review browser console for frontend errors

## 📝 License

[Specify your license here]

## 👥 Contributors

[Add contributor information]

## 📧 Contact

[Add contact information]

---

**Note**: This is an admin dashboard application. Ensure proper security measures are in place before deploying to production, including:
- Strong password policies
- HTTPS/SSL encryption
- Rate limiting
- Input validation and sanitization
- Regular security updates
