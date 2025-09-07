# Supervisor Dashboard - Kamero Research Portal

**🔒 CONFIDENTIAL - PROPRIETARY SOFTWARE**
**© 2025 Kamero Research Base Ltd, Rwanda - All Rights Reserved**

A comprehensive supervisor dashboard built with Next.js, TypeScript, and PostgreSQL for managing research papers, assignments, student supervision, and academic oversight.

> **⚠️ IMPORTANT:** This is proprietary software with intellectual property registered in Rwanda. Unauthorized access, use, or distribution is prohibited.

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Dashboard Components](#dashboard-components)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [UI Components &amp; Features](#ui-components--features)
- [Assignment Management](#assignment-management)
- [Installation &amp; Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Development Guide](#development-guide)

## 🎯 Overview

The Supervisor Dashboard is the administrative interface where supervisors can:

- Review and approve/reject research submissions from students
- Create and manage assignments with rich text descriptions using TinyMCE
- Grade student assignment submissions and provide feedback
- View assigned students and their academic progress
- Access dashboard analytics with assignment and research statistics
- Manage their own profile including biography and profile picture

## ✨ Features

### Core Features

- **📊 Dashboard Analytics**: Assignment and research statistics with trend indicators
- **🔬 Research Review System**: Approve, reject, hold, or unreject research submissions
- **📝 Assignment Management**: Create and manage assignments with TinyMCE editor
- **📋 Assignment Grading**: Grade student submissions and provide feedback
- **👥 Student Oversight**: View assigned students and their progress
- **💬 Research Comments**: Add comments and feedback to research submissions
- **👤 Profile Management**: Edit supervisor profile with biography and photo upload
- **📱 Responsive Design**: Mobile-first approach with Tailwind CSS

### Additional Features

- **🔍 Research Similarity Checking**: Check for similar titles, abstracts, and researchers
- **📄 Research Validation**: Review research papers for quality and compliance
- **⏰ Assignment Deadlines**: Track assignment due dates and submission status
- **🗂️ File Attachments**: Upload and manage assignment materials via Supabase
- **🔒 Secure Authentication**: JWT-based login and session management
- **📈 Analytics Dashboard**: View assignment and research statistics

## 🛠 Tech Stack

### Frontend

- **Next.js 15.1.6** - React framework with App Router
- **React 19** - Latest React version
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **TinyMCE 6.3.0** - Self-hosted rich text editor for assignments
- **Bootstrap Icons** - Icon library
- **Lucide React** - Modern icon components

### Backend

- **Next.js API Routes** - Server-side API endpoints
- **PostgreSQL** - Primary database
- **Connection Pooling** - Database optimization
- **Supabase Storage** - File and document storage

### Development Tools

- **ESLint** - Code linting
- **TypeScript Config** - Type checking
- **Hot Reload** - Development server

## 📁 Project Structure

```
supervisor_dash/
├── app/
│   ├── api/                      # API endpoints
│   │   ├── research/            # Research management APIs
│   │   ├── assignments/         # Assignment management APIs
│   │   ├── students/            # Student management APIs
│   │   ├── auth/                # Authentication & profile APIs
│   │   └── utils/               # Shared utilities
│   ├── components/              # Reusable components
│   │   ├── toggles/             # Modal/popup components
│   │   ├── app/                 # App-level components
│   │   └── ui/                  # UI components
│   ├── pages/                   # Page components
│   │   ├── App.tsx              # Main dashboard
│   │   └── navBar.tsx           # Navigation sidebar
│   ├── auth/                    # Authentication pages
│   ├── researches/              # Research management pages
│   ├── assignments/             # Assignment management pages
│   ├── students/                # Student management pages
│   ├── profile/                 # Profile management page
│   └── globals.css              # Global styles
├── public/
│   ├── tinymce/                 # Self-hosted TinyMCE assets
│   └── assets/                  # Static assets
├── README.md                    # This file
└── package.json                 # Dependencies
```

## 🏠 Dashboard Components

### Main Dashboard (`app/pages/App.tsx`)

The central supervisor hub containing:

#### 1. Research Management Section

```typescript
interface ResearchOverview {
  total_researches: number;
  pending_approval: number;
  approved_researches: number;
  rejected_researches: number;
  percentage_changes: {
    [key: string]: number;
  };
}
```

**Features:**

- Research approval workflow management
- Status-based categorization and filtering
- Bulk approval/rejection operations
- Progress analytics with trend indicators

#### 2. Assignment Management

```typescript
interface AssignmentStats {
  total_assignments: number;
  active_assignments: number;
  total_submissions: number;
  pending_grading: number;
}
```

**Displays:**

- Assignment creation and management
- Submission tracking and grading
- Deadline management and notifications
- Student participation analytics

#### 3. Student Supervision Overview

- Assigned student list with progress indicators
- Recent student activities and submissions
- Academic performance tracking
- Communication and feedback system

#### 4. Recent Activities Dashboard

Real-time feed showing:

- New research submissions requiring approval
- Assignment submissions needing grading
- Student requests and communications
- System notifications and alerts

### Navigation Sidebar (`app/pages/navBar.tsx`)

**Main Menu Items:**

- **Dashboard (/)** - Main overview with analytics and recent activities
- **Assignments (/assignments)** - Create, manage, and grade assignments  
- **Researches (/researches)** - Review and approve student research submissions

**Management Section:**

- **Students (/students)** - View and manage assigned students

**User Settings:**

- **Profile (/profile)** - Manage supervisor profile, biography, and photo
- **Log out (/auth/logout)** - End current session

## 🔌 API Endpoints

### Research Management APIs

#### `GET /api/research`

**Purpose:** Fetch research submissions for supervisor review
**Query:**

```sql
SELECT r.*, s.first_name, s.last_name, i.name AS institute, sc.name AS school
FROM researches r
JOIN students s ON r.user_id = s.id
JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
JOIN schools sc ON CAST(sc.id AS TEXT) = r.school
WHERE r.progress_status IN ('under review', 'pending')
ORDER BY r.created_at DESC
```

**Response:**

```typescript
interface ResearchSubmission {
  id: number;
  title: string;
  researcher: string;
  status: string;
  progress_status: string;
  abstract: string;
  category: string;
  student_name: string;
  institution: string;
  school: string;
  created_at: string;
}
```

#### `POST /api/research/approve`

**Purpose:** Approve research submission
**Parameters:** `{ research_id: number, supervisor_id: number, comments?: string }`

#### `POST /api/research/reject`

**Purpose:** Reject research submission with feedback
**Parameters:** `{ research_id: number, supervisor_id: number, reason: string }`

#### `POST /api/research/hold`

**Purpose:** Put research on hold for further review
**Parameters:** `{ research_id: number, supervisor_id: number, notes: string }`

### Assignment Management APIs

#### `POST /api/assignments/create`

**Purpose:** Create new assignment
**Features:**

- Rich text description with TinyMCE
- File attachment support via Supabase
- Due date management
- Student targeting (individual/group/department)

#### `GET /api/assignments/list`

**Purpose:** Get supervisor's assignments
**Response:**

```typescript
interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  is_active: boolean;
  submissions_count: number;
  invited_students_count: number;
  average_score: number;
  created_at: string;
}
```

#### `POST /api/assignments/grade`

**Purpose:** Grade assignment submission
**Parameters:** `{ submission_id: number, score: number, feedback: string }`

### Student Management APIs

#### `GET /api/students`

**Purpose:** Get assigned students
**Features:**

- Student academic progress tracking
- Research submission history
- Assignment completion status

#### `POST /api/students/approve`

**Purpose:** Approve student registration/requests

### Authentication & Profile APIs

#### `GET /api/auth/current-user`

**Purpose:** Get current supervisor profile
**Response:**

```typescript
interface SupervisorProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  biography: string;
  profile_picture: string;
  department_name: string;
  school_name: string;
  institution_name: string;
}
```

#### `POST /api/auth/upload-photo`

**Purpose:** Upload supervisor profile picture
**Features:**

- Supabase storage integration
- Image validation and resizing
- Secure file handling

## 🗄 Database Schema

### Core Tables

#### `supervisors`

```sql
CREATE TABLE supervisors (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  biography TEXT,
  profile_picture TEXT,
  department_id INTEGER,
  school_id INTEGER,
  institution_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `assignments`

```sql
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  max_score INTEGER DEFAULT 100,
  attachments TEXT[],
  created_by INTEGER REFERENCES supervisors(id),
  updated_by INTEGER REFERENCES supervisors(id),
  hashed_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `assignment_submissions`

```sql
CREATE TABLE assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id),
  student_id INTEGER REFERENCES students(id),
  submission_text TEXT,
  attachments TEXT[],
  score INTEGER,
  feedback TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at TIMESTAMP,
  graded_by INTEGER REFERENCES supervisors(id)
);
```

#### `research_approvals`

```sql
CREATE TABLE research_approvals (
  id SERIAL PRIMARY KEY,
  research_id INTEGER REFERENCES researches(id),
  supervisor_id INTEGER REFERENCES supervisors(id),
  action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'hold'
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_assignments_supervisor_created ON assignments(created_by, created_at DESC);
CREATE INDEX idx_submissions_assignment_status ON assignment_submissions(assignment_id, status);
CREATE INDEX idx_research_approvals_supervisor ON research_approvals(supervisor_id, created_at DESC);
CREATE INDEX idx_researches_status_created ON researches(progress_status, created_at DESC);
```

## 🎨 UI Components & Features

### Assignment Creation Modal (`addAssignment.tsx`)

**Multi-step Process:**

1. **Basic Info**: Title, description with TinyMCE editor
2. **Settings**: Due date, max score, assignment type (individual/group)
3. **Students**: Select target students or departments
4. **Attachments**: Upload supporting materials via Supabase
5. **Review**: Final validation and publishing

**Key Features:**

- Self-hosted TinyMCE rich text editor for assignment instructions
- File upload with drag-and-drop support
- Student selection with department filtering
- Real-time validation and preview
- Duplicate assignment detection

### Research Review Interface (`reviewResearch.tsx`)

**Review Tabs:**

- **Content**: Full research abstract and details with HTML rendering
- **Metadata**: Research information, student details, institutional data
- **History**: Previous review actions and comments
- **Actions**: Approve, reject, or hold with comment system

**Features:**

- Similarity checking integration
- Comment and feedback system
- Bulk review operations
- Status change notifications

### TinyMCE Self-hosted Integration

**Configuration:**

```javascript
{
  height: 300,
  menubar: false,
  branding: false,
  plugins: [
    'anchor', 'autolink', 'charmap', 'code', 'fullscreen', 'help',
    'image', 'insertdatetime', 'link', 'lists', 'preview',
    'searchreplace', 'table', 'visualblocks', 'wordcount'
  ],
  toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image table | align lineheight | checklist numlist bullist indent outdent | charmap | removeformat'
}
```

**Features:**

- Completely self-hosted (no external API keys required)
- Dynamic loading with error handling
- Custom styling and focus states
- Image upload integration with Supabase
- HTML content validation

### Profile Management System

**Profile Features:**

- **Personal Information**: Name, email, phone, biography
- **Profile Picture**: Supabase-powered image upload with loading states
- **Institutional Affiliation**: Department, school, institution details
- **Biography Editor**: Self-hosted TinyMCE for rich text biography
- **Success Notifications**: Professional green modal instead of browser alerts

**Profile Picture Upload:**

- **Loading States**: Spinner and "Uploading..." text during upload
- **Error Handling**: Proper error messages and retry functionality
- **File Validation**: Type and size validation
- **Supabase Integration**: Secure cloud storage

## 🔧 Assignment Management

### Assignment Creation Workflow

**Assignment Types:**

- **Individual**: Single student assignments
- **Group**: Collaborative assignments with group management
- **Department-wide**: Assignments for entire departments

**Rich Text Features:**

- **Instructions**: Detailed assignment instructions with formatting
- **Attachments**: Supporting materials and resources
- **Rubrics**: Grading criteria and expectations
- **Templates**: Reusable assignment templates

### Grading System

**Grading Features:**

```typescript
interface GradingCriteria {
  max_score: number;
  rubric_items: RubricItem[];
  late_penalty: number;
  feedback_required: boolean;
}

interface RubricItem {
  criteria: string;
  points: number;
  description: string;
}
```

**Bulk Grading:**

- Grade multiple submissions simultaneously
- Apply consistent feedback templates
- Export grades to CSV/Excel formats
- Send notification emails to students

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation Steps

1. **Clone Repository**

```bash
git clone <repository-url>
cd supervisor_dash
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

3. **Setup Database**

```bash
# Create PostgreSQL database
createdb kamero_supervisor_db

# Run migrations (if available)
# npm run migrate
```

4. **Configure Environment**

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

5. **Setup TinyMCE**

```bash
# TinyMCE is already self-hosted in public/tinymce/
# No additional setup required
```

6. **Start Development Server**

```bash
npm run dev
# or
yarn dev
```

7. **Access Application**
   Open [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Create `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=your_postgresql_connection_string

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Service Configuration
BREVO_API_KEY=your_brevo_api_key

# Next.js Configuration
NEXTJS_URL=http://localhost:3000

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png
```

**Important Notes:**

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Configure Supabase policies for secure file access
- Set up proper database user permissions

## 👨‍💻 Development Guide

### Code Style Guidelines

**Component Architecture:**

```typescript
// Supervisor-specific interfaces
interface SupervisorDashboard {
  research_stats: ResearchStats;
  assignment_stats: AssignmentStats;
  student_stats: StudentStats;
  recent_activities: Activity[];
}

// Assignment management types
interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  is_active: boolean;
  max_score: number;
  attachments: string[];
  assignment_type: 'individual' | 'group';
  invited_students: Student[];
  submissions: Submission[];
}
```

### API Development Patterns

**Standard Supervisor API Response:**

```typescript
// Research approval response
{
  success: true,
  data: {
    research_id: number,
    action: 'approved' | 'rejected' | 'hold',
    supervisor_id: number,
    comments?: string
  },
  message: "Research approved successfully"
}

// Assignment creation response
{
  success: true,
  data: {
    assignment: Assignment,
    invited_count: number,
    attachments_uploaded: number
  },
  message: "Assignment created and published"
}
```

### Database Best Practices

**Supervisor-specific Optimizations:**

```sql
-- Optimize research review queries
CREATE INDEX idx_research_supervisor_review ON researches(progress_status, created_at DESC) 
WHERE progress_status IN ('under review', 'pending');

-- Assignment performance
CREATE INDEX idx_assignments_supervisor_active ON assignments(created_by, is_active, due_date)
WHERE is_active = true;

-- Submission tracking
CREATE INDEX idx_submissions_grading ON assignment_submissions(assignment_id, status, submitted_at)
WHERE status = 'submitted';
```

### Self-hosted TinyMCE Maintenance

**TinyMCE Update Process:**

1. **Download**: Get latest TinyMCE Community version
2. **Extract**: Replace contents of `public/tinymce/`
3. **Test**: Verify all editor functionality works
4. **Configure**: Update configuration if needed
5. **Deploy**: Update production environment

**TinyMCE Configuration Management:**

- Keep editor configs in separate utility files
- Test with different content types and sizes
- Ensure proper error handling for loading failures
- Maintain consistent styling across all editors

## 📊 Performance Monitoring

### Key Metrics for Supervisors

- Assignment creation time (< 2 seconds)
- Research approval processing (< 1 second)
- Student list loading (< 3 seconds)
- File upload completion (depends on size)
- Dashboard analytics loading (< 2 seconds)

### Optimization Strategies

- **Database**: Use proper indexes for supervisor queries
- **File Storage**: Implement Supabase CDN for faster file access
- **Frontend**: Lazy load assignment and research lists
- **API**: Cache frequently accessed data (student lists, departments)
- **TinyMCE**: Optimize editor loading and initialization

## 🔒 Security Considerations

### Access Control

- **Role Verification**: Validate supervisor permissions on all endpoints
- **Data Isolation**: Ensure supervisors only access their assigned data
- **File Security**: Implement proper Supabase row-level security
- **API Rate Limiting**: Prevent abuse of sensitive endpoints

### Data Protection

- **Student Privacy**: Protect student personal information
- **Research Confidentiality**: Secure research content and reviews
- **Assignment Integrity**: Prevent unauthorized assignment modifications
- **Profile Security**: Secure supervisor profile and credentials

## 📄 Intellectual Property & License

**This is a proprietary commercial software product.**

- **Copyright:** © 2025 Kamero Research Base Ltd, Rwanda
- **Intellectual Property:** Registered and protected under Rwandan IP law
- **License:** Private commercial license - All rights reserved
- **Usage:** Authorized personnel only
- **Distribution:** Strictly prohibited without explicit written permission

**Confidentiality Notice:**
This software and its documentation contain confidential and proprietary information. Any unauthorized access, use, reproduction, or distribution is strictly prohibited and may result in legal action.

## 🤝 Internal Support

For internal team support and questions:

**Development Issues:**

- Contact the development team lead directly
- Use internal issue tracking system
- Include error messages and reproduction steps
- Provide system information and environment details

**Feature Requests:**

- Submit requests through internal channels
- Coordinate with project manager
- Include business justification and mockups
- Follow internal approval process

**Emergency Support:**

- Contact: Kamero Research Base Ltd IT Department
- Development Team Lead: [Internal Contact]
- System Administrator: [Internal Contact]
- Business Hours: Monday - Friday, 8:00 AM - 6:00 PM (CAT)

---

**Last Updated:** September 2025
**Development Status:** Pre-Release (Internal Development)
**Next.js Version:** 15.1.6
**React Version:** 19.0.0
**TypeScript Version:** 5
**Node.js Version:** 18+
**Database:** PostgreSQL 12+
**Storage:** Supabase Storage

**Development Team:** Kamero Research Base Ltd Internal Development Team
**Maintained by:** Kamero Research Base Ltd IT Department
**Technical Lead:** [Internal Team Lead Name]
**Project Manager:** [Internal PM Name]

---

**PROPRIETARY SOFTWARE NOTICE**
This software is the exclusive property of Kamero Research Base Ltd, Rwanda. It contains confidential and proprietary information protected by intellectual property laws. Any unauthorized access, copying, distribution, or use is strictly prohibited and may result in legal action.

**For authorized access only.**
