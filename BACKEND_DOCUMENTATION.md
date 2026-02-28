# 4P_MySkills Backend Documentation

**Version:** 1.0.0  
**Last Updated:** February 28, 2026  
**Base URL:** `http://localhost:4000/api`

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Environment Setup](#environment-setup)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Endpoints](#api-endpoints)
8. [Business Logic & Workflows](#business-logic--workflows)
9. [LLM Integration](#llm-integration)
10. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Project Overview

**4P_MySkills** is a comprehensive Employee Skills Management and Project Assignment System designed to:

- Track employee skills with self-rating and manager approval workflows
- Manage projects, deliverables, and skill requirements
- Provide AI-powered employee recommendations for project assignments
- Track skill progression over time with detailed analytics
- Enable manager-employee hierarchies with role-based access control
- Automate project analysis using Google's Gemini LLM

### Key Features

- ✅ **RBAC (Role-Based Access Control)**: 4 roles - EMPLOYEE, MANAGER, HR, ADMIN
- ✅ **Skill Management**: Self-rating, manager review, progress tracking
- ✅ **Project & Deliverable Management**: Full CRUD with status tracking
- ✅ **AI-Powered Recommendations**: Match employees to deliverables based on skills
- ✅ **Assignment Workflow**: Request → Manager Review → Approve/Reject
- ✅ **Analytics Dashboard**: Employee skill progress, timeline tracking
- ✅ **LLM Integration**: Automatic project breakdown into deliverables with required skills

---

## Tech Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **TypeScript** | 5.9.3 | Type-safe development |
| **Express.js** | 5.2.1 | Web framework |
| **Prisma ORM** | 7.3.0 | Database ORM with PostgreSQL adapter |
| **PostgreSQL** | 14+ | Primary database |
| **JWT** | 9.0.3 | Authentication tokens |
| **bcrypt** | 6.0.0 | Password hashing |
| **Google Generative AI** | 0.24.1 | Gemini LLM integration |
| **ts-node-dev** | 2.0.0 | Development server with hot reload |

### Development Tools

- **Prisma Migrate**: Database migrations
- **dotenv**: Environment variable management
- **CORS**: Cross-origin resource sharing

---

## Architecture

### Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── migrations/                # Database migration files
├── src/
│   ├── config/
│   │   └── env.ts                # Environment configuration
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   └── role.middleware.ts    # Role-based authorization
│   ├── modules/
│   │   ├── analytics/            # Analytics & reporting
│   │   ├── assignments/          # Assignment request workflow
│   │   ├── auth/                 # User authentication
│   │   ├── deliverable-skills/   # Skill-deliverable mapping
│   │   ├── deliverables/         # Deliverable management
│   │   ├── departments/          # Department management
│   │   ├── employee-skills/      # Employee skill ratings
│   │   ├── employees/            # Employee profile management
│   │   ├── llm/                  # LLM service integration
│   │   ├── projects/             # Project management
│   │   ├── recommendations/      # AI recommendations
│   │   └── skills/               # Skills catalog
│   ├── routes/
│   │   └── index.ts              # Route registration
│   ├── utils/
│   │   └── db.ts                 # Database connection
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── package.json
└── tsconfig.json
```

### Module Pattern

Each module follows the **Controller → Service → Prisma** pattern:

- **Routes** (`*.routes.ts`): Define HTTP endpoints and middleware
- **Controllers** (`*.controller.ts`): Handle HTTP requests/responses
- **Services** (`*.service.ts`): Business logic and database operations

---

## Environment Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=4000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/4p_myskills

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### Installation & Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Health Check

```
GET /health
Response: { "status": "ok" }
```

---

## Database Schema

### Entity Relationship Overview

```
User (Auth)
  ↓ 1:1
EmployeeProfile
  ↓ belongs to
Department
  ↓ has manager (self-referential)
EmployeeProfile
  ↓ M:N (through EmployeeSkill)
Skill
  ↓ M:N (through DeliverableSkill)
Deliverable
  ↓ belongs to
Project
  ↓ M:N (through EmployeeProjectAssignment)
EmployeeProfile
```

### Key Models

#### User
- **Purpose**: Authentication & Authorization
- **Fields**: `id`, `email`, `passwordHash`, `role`, `createdAt`
- **Enums**: `Role` → `EMPLOYEE | MANAGER | HR | ADMIN`

#### EmployeeProfile
- **Purpose**: Employee information
- **Fields**: `id`, `userId`, `fullname`, `departmentId`, `managerId`, `createdAt`
- **Relations**: User (1:1), Department (M:1), Manager (self M:1), Skills (M:N)

#### Department
- **Purpose**: Organizational units
- **Fields**: `id`, `name`, `createdAt`

#### Project
- **Purpose**: Work initiatives
- **Fields**: `id`, `name`, `description`, `status`, `startDate`, `endDate`, `createdAt`
- **Enums**: `ProjectStatus` → `PLANNED | ACTIVE | COMPLETED`

#### Deliverable
- **Purpose**: Project work units
- **Fields**: `id`, `name`, `description`, `projectId`, `createdAt`
- **Relations**: Project (M:1), Skills (M:N through DeliverableSkill)

#### Skill
- **Purpose**: Skills catalog
- **Fields**: `id`, `name`, `description`, `createdAt`

#### EmployeeSkill
- **Purpose**: Employee skill ratings with approval workflow
- **Fields**: 
  - `id`, `employeeId`, `skillId`
  - `selfRating` (1-10): Employee's self-assessment
  - `approvedRating` (1-10): Manager-approved rating
  - `status`: `PENDING | APPROVED | EDITED | REJECTED`
  - `reviewedBy`, `reviewComment`, `reviewedAt`
- **Workflow**: Employee rates → Manager reviews → Approved/Edited/Rejected

#### DeliverableSkill
- **Purpose**: Skills required for deliverables
- **Fields**: `id`, `deliverableId`, `skillId`, `weight` (importance 0-1)

#### EmployeeProjectAssignment
- **Purpose**: Employee assignments to deliverables
- **Fields**: `id`, `employeeId`, `projectId`, `deliverableId`, `assignedAt`, `releasedAt`

#### AssignmentRequest
- **Purpose**: Assignment request workflow
- **Fields**: 
  - `id`, `employeeId`, `projectId`, `deliverableId`
  - `requestedBy` (HR), `reviewedBy` (Manager)
  - `status`: `PENDING | APPROVED | REJECTED`
  - `createdAt`, `reviewedAt`

#### SkillProgressLog
- **Purpose**: Track all skill rating changes over time
- **Fields**: 
  - `id`, `employeeId`, `skillId`
  - `previousRating`, `newRating`
  - `changeType`: `INITIAL_RATING | SELF_UPDATED | MANAGER_APPROVED | MANAGER_EDITED | MANAGER_REJECTED`
  - `changedBy`, `comment`, `changedAt`

---

## Authentication & Authorization

### Authentication Flow

1. **Registration**: `POST /api/auth/register`
   - Creates `User` with hashed password
   - Creates linked `EmployeeProfile`
   - Returns JWT token

2. **Login**: `POST /api/auth/login`
   - Validates credentials
   - Returns JWT token with `userId` and `role`

3. **JWT Token Structure**:
```json
{
  "userId": "uuid",
  "role": "EMPLOYEE | MANAGER | HR | ADMIN"
}
```

### Authorization Middleware

#### `authMiddleware`
- Validates JWT from `Authorization: Bearer <token>` header
- Attaches `req.user = { userId, role }` to request
- Returns 401 if invalid

#### `requireRole(...roles)`
- Checks if `req.user.role` is in allowed roles
- Returns 403 if forbidden

### Role Hierarchy

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **EMPLOYEE** | Basic | Rate own skills, view own data |
| **MANAGER** | Team | Review team skill ratings, approve assignments |
| **HR** | Organization | Full project/assignment management, AI recommendations |
| **ADMIN** | System | Full system access |

---

## API Endpoints

### Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullname": "John Doe",
  "departmentId": "dept-uuid",
  "managerId": "manager-uuid",  // optional
  "role": "EMPLOYEE"
}

Response 201:
{
  "user": { "id": "uuid", "email": "...", "role": "EMPLOYEE" },
  "profile": { "id": "uuid", "fullname": "John Doe", ... },
  "token": "jwt-token"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "user": { "id": "uuid", "email": "...", "role": "EMPLOYEE" },
  "profile": { "id": "uuid", "fullname": "...", ... },
  "token": "jwt-token"
}
```

---

### Departments (`/api/departments`)

#### Create Department
```http
POST /api/departments
Authorization: Bearer <token>
Role: HR

{
  "name": "Engineering"
}

Response 201:
{
  "id": "uuid",
  "name": "Engineering",
  "createdAt": "2026-02-28T..."
}
```

#### List Departments
```http
GET /api/departments
Authorization: Bearer <token>
Role: Any authenticated

Response 200:
[
  { "id": "uuid", "name": "Engineering", "createdAt": "..." },
  { "id": "uuid", "name": "Marketing", "createdAt": "..." }
]
```

---

### Employees (`/api/employees`)

#### Create Employee
```http
POST /api/employees
Authorization: Bearer <token>
Role: HR

{
  "email": "emp@example.com",
  "password": "pass123",
  "fullname": "Jane Smith",
  "departmentId": "dept-uuid",
  "managerId": "manager-uuid",  // optional
  "role": "EMPLOYEE"
}

Response 201:
{
  "user": { ... },
  "profile": { ... },
  "token": "jwt-token"
}
```

#### Update Employee Department/Manager
```http
PATCH /api/employees/:employeeId
Authorization: Bearer <token>
Role: HR

{
  "departmentId": "new-dept-uuid",  // optional
  "managerId": "new-manager-uuid"   // optional
}

Response 200:
{
  "id": "uuid",
  "userId": "uuid",
  "fullname": "Jane Smith",
  "departmentId": "new-dept-uuid",
  "managerId": "new-manager-uuid",
  ...
}
```

---

### Projects (`/api/projects`)

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Role: HR

{
  "name": "E-commerce Platform",
  "description": "Build a modern e-commerce solution",
  "startDate": "2026-03-01T00:00:00Z",  // optional
  "endDate": "2026-06-30T00:00:00Z"     // optional
}

Response 201:
{
  "id": "uuid",
  "name": "E-commerce Platform",
  "description": "...",
  "status": "PLANNED",
  "startDate": "...",
  "endDate": "...",
  "createdAt": "..."
}
```

#### List Projects
```http
GET /api/projects
Authorization: Bearer <token>
Role: HR

Response 200:
[
  { "id": "uuid", "name": "...", "status": "PLANNED", ... }
]
```

#### Update Project Status
```http
PATCH /api/projects/:id/status
Authorization: Bearer <token>
Role: HR

{
  "status": "ACTIVE"  // PLANNED | ACTIVE | COMPLETED
}

Response 200:
{ "id": "uuid", "status": "ACTIVE", ... }
```

#### Analyze Project with LLM
```http
POST /api/projects/:id/analyze
Authorization: Bearer <token>
Role: HR

{
  "userPrompt": "This project needs a payment gateway, user authentication, and product catalog"
}

Response 200:
{
  "message": "Project analyzed successfully",
  "deliverables": [
    {
      "id": "uuid",
      "name": "Payment Gateway Integration",
      "description": "...",
      "skills": [
        { "skillId": "uuid", "skillName": "Node.js", "weight": 0.8 },
        { "skillId": "uuid", "skillName": "Payment APIs", "weight": 0.9 }
      ]
    },
    ...
  ]
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
Role: HR

Response 200:
{ "message": "Project deleted successfully" }
```

---

### Deliverables (`/api/projects/:projectId/deliverables`, `/api/deliverables/:id`)

#### Create Deliverable
```http
POST /api/projects/:projectId/deliverables
Authorization: Bearer <token>
Role: HR

{
  "name": "User Authentication Module",
  "description": "Implement JWT-based auth system"
}

Response 201:
{
  "id": "uuid",
  "name": "User Authentication Module",
  "description": "...",
  "projectId": "project-uuid",
  "createdAt": "..."
}
```

#### Get Project Deliverables
```http
GET /api/projects/:projectId/deliverables
Authorization: Bearer <token>
Role: HR

Response 200:
[
  {
    "id": "uuid",
    "name": "...",
    "description": "...",
    "projectId": "uuid",
    "requiredSkills": [
      { "id": "uuid", "skillId": "uuid", "skill": { "name": "Node.js" }, "weight": 0.8 }
    ]
  }
]
```

#### Get Deliverable Details
```http
GET /api/deliverables/:id
Authorization: Bearer <token>
Role: HR

Response 200:
{
  "id": "uuid",
  "name": "...",
  "description": "...",
  "projectId": "uuid",
  "project": { "id": "uuid", "name": "..." },
  "requiredSkills": [
    {
      "id": "uuid",
      "skillId": "uuid",
      "weight": 0.8,
      "skill": { "id": "uuid", "name": "Node.js", "description": "..." }
    }
  ]
}
```

#### Update Deliverable
```http
PATCH /api/deliverables/:id
Authorization: Bearer <token>
Role: HR

{
  "name": "Updated Deliverable Name",  // optional
  "description": "Updated description"  // optional
}

Response 200:
{ "id": "uuid", "name": "Updated Deliverable Name", ... }
```

#### Delete Deliverable
```http
DELETE /api/deliverables/:id
Authorization: Bearer <token>
Role: HR

Response 200:
{ "message": "Deliverable deleted successfully" }
```

---

### Deliverable Skills (`/api/deliverables/:deliverableId/skills`)

#### Add Skill to Deliverable
```http
POST /api/deliverables/:deliverableId/skills
Authorization: Bearer <token>
Role: HR

{
  "skillId": "skill-uuid",
  "weight": 0.8  // 0-1, importance of skill
}

Response 201:
{
  "id": "uuid",
  "deliverableId": "uuid",
  "skillId": "uuid",
  "weight": 0.8,
  "skill": { "id": "uuid", "name": "Node.js" }
}
```

#### Get Deliverable Skills
```http
GET /api/deliverables/:deliverableId/skills
Authorization: Bearer <token>
Role: HR

Response 200:
[
  {
    "id": "uuid",
    "deliverableId": "uuid",
    "skillId": "uuid",
    "weight": 0.8,
    "skill": { "id": "uuid", "name": "Node.js", "description": "..." }
  }
]
```

#### Update Skill Weight
```http
PATCH /api/deliverables/:deliverableId/skills/:skillId
Authorization: Bearer <token>
Role: HR

{
  "weight": 0.9
}

Response 200:
{
  "id": "uuid",
  "weight": 0.9,
  ...
}
```

#### Remove Skill from Deliverable
```http
DELETE /api/deliverables/:deliverableId/skills/:skillId
Authorization: Bearer <token>
Role: HR

Response 200:
{ "message": "Skill removed successfully" }
```

---

### Skills (`/api/skills`)

#### Create Skill
```http
POST /api/skills
Authorization: Bearer <token>
Role: HR

{
  "name": "React.js",
  "description": "Frontend JavaScript library"
}

Response 201:
{
  "id": "uuid",
  "name": "React.js",
  "description": "Frontend JavaScript library",
  "createdAt": "..."
}
```

#### List Skills
```http
GET /api/skills
Authorization: Bearer <token>
Role: Any authenticated

Response 200:
[
  { "id": "uuid", "name": "React.js", "description": "...", "createdAt": "..." },
  { "id": "uuid", "name": "Node.js", "description": "...", "createdAt": "..." }
]
```

---

### Employee Skills (`/api/employee-skills`)

#### Create Self-Rating
```http
POST /api/employee-skills
Authorization: Bearer <token>
Role: EMPLOYEE

{
  "skillId": "skill-uuid",
  "selfRating": 7  // 1-10
}

Response 201:
{
  "id": "uuid",
  "employeeId": "uuid",
  "skillId": "uuid",
  "selfRating": 7,
  "approvedRating": null,
  "status": "PENDING",
  "reviewedBy": null,
  "reviewComment": null,
  "reviewedAt": null,
  "skill": { "id": "uuid", "name": "React.js" }
}
```

#### Update Self-Rating (while PENDING)
```http
PATCH /api/employee-skills/:id
Authorization: Bearer <token>
Role: EMPLOYEE

{
  "selfRating": 8
}

Response 200:
{ "id": "uuid", "selfRating": 8, "status": "PENDING", ... }
```

#### Get My Ratings
```http
GET /api/employee-skills/my-ratings
Authorization: Bearer <token>
Role: EMPLOYEE

Response 200:
[
  {
    "id": "uuid",
    "skillId": "uuid",
    "skill": { "id": "uuid", "name": "React.js" },
    "selfRating": 8,
    "approvedRating": 7,
    "status": "APPROVED",
    "reviewComment": "Good progress",
    "reviewedAt": "..."
  }
]
```

#### Get Pending Ratings (Manager)
```http
GET /api/employee-skills/pending
Authorization: Bearer <token>
Role: MANAGER

Response 200:
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employee": { "id": "uuid", "fullname": "John Doe" },
    "skillId": "uuid",
    "skill": { "name": "React.js" },
    "selfRating": 8,
    "status": "PENDING",
    "createdAt": "..."
  }
]
```

#### Review Skill Rating (Manager)
```http
PATCH /api/employee-skills/:id/review
Authorization: Bearer <token>
Role: MANAGER

{
  "action": "APPROVE",  // APPROVE | EDIT | REJECT
  "approvedRating": 7,  // required if action=EDIT
  "reviewComment": "Good work, but needs improvement in testing"
}

Response 200:
{
  "id": "uuid",
  "selfRating": 8,
  "approvedRating": 7,
  "status": "EDITED",
  "reviewedBy": "manager-uuid",
  "reviewComment": "...",
  "reviewedAt": "..."
}
```

---

### Recommendations (`/api`)

#### Get Project-wide Recommendations (SINGLE BUTTON)
```http
GET /api/projects/:projectId/recommendations?topK=5
Authorization: Bearer <token>
Role: HR

Query Params:
  - topK: number of top employees per deliverable (default: 5, max: 50)

Response 200:
{
  "projectId": "uuid",
  "projectName": "E-commerce Platform",
  "deliverables": [
    {
      "deliverableId": "uuid",
      "deliverableName": "Payment Gateway",
      "recommendations": [
        {
          "employeeId": "uuid",
          "fullname": "Jane Smith",
          "overallScore": 85.5,
          "matchPercentage": 95.2,
          "skillsMatched": 8,
          "totalSkillsRequired": 10,
          "skillBreakdown": [
            {
              "skillId": "uuid",
              "skillName": "Node.js",
              "weight": 0.8,
              "employeeRating": 9,
              "contribution": 7.2
            }
          ]
        }
      ]
    }
  ]
}
```

#### Get Deliverable Recommendations
```http
GET /api/deliverables/:deliverableId/recommendations?topK=10
Authorization: Bearer <token>
Role: HR

Query Params:
  - topK: number of top employees (default: 5, max: 50)

Response 200:
{
  "deliverableId": "uuid",
  "deliverableName": "Payment Gateway",
  "topEmployees": [
    {
      "employeeId": "uuid",
      "fullname": "Jane Smith",
      "department": "Engineering",
      "overallScore": 85.5,
      "matchPercentage": 95.2,
      "skillsMatched": 8,
      "totalSkillsRequired": 10,
      "skillBreakdown": [
        {
          "skillId": "uuid",
          "skillName": "Node.js",
          "weight": 0.8,
          "employeeRating": 9,
          "isMatched": true,
          "contribution": 7.2
        }
      ]
    }
  ]
}
```

#### Get Employee Skill Analysis
```http
GET /api/deliverables/:deliverableId/employees/:employeeId/analysis
Authorization: Bearer <token>
Role: HR

Response 200:
{
  "employeeId": "uuid",
  "fullname": "Jane Smith",
  "deliverableId": "uuid",
  "deliverableName": "Payment Gateway",
  "overallScore": 85.5,
  "matchPercentage": 95.2,
  "skillsMatched": 8,
  "totalSkillsRequired": 10,
  "skillDetails": [
    {
      "skillId": "uuid",
      "skillName": "Node.js",
      "weight": 0.8,
      "employeeRating": 9,
      "isMatched": true,
      "contribution": 7.2
    }
  ]
}
```

---

### Assignments (`/api`)

#### Create Assignment Request
```http
POST /api/deliverables/:id/request-assignment
Authorization: Bearer <token>
Role: HR

{
  "employeeId": "employee-uuid"
}

Response 201:
{
  "id": "uuid",
  "employeeId": "employee-uuid",
  "projectId": "project-uuid",
  "deliverableId": "deliverable-uuid",
  "requestedBy": "hr-user-uuid",
  "status": "PENDING",
  "createdAt": "..."
}
```

#### Get Pending Assignment Requests (Manager)
```http
GET /api/assignment-requests/pending
Authorization: Bearer <token>
Role: MANAGER

Response 200:
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "employee": { "id": "uuid", "fullname": "John Doe" },
    "projectId": "uuid",
    "project": { "name": "E-commerce Platform" },
    "deliverableId": "uuid",
    "deliverable": { "name": "Payment Gateway" },
    "requestedBy": "uuid",
    "requester": { "email": "hr@example.com" },
    "status": "PENDING",
    "createdAt": "..."
  }
]
```

#### Review Assignment Request (Manager)
```http
PATCH /api/assignment-requests/:id/review
Authorization: Bearer <token>
Role: MANAGER

{
  "action": "APPROVE"  // APPROVE | REJECT
}

Response 200:
{
  "id": "uuid",
  "status": "APPROVED",
  "reviewedBy": "manager-uuid",
  "reviewedAt": "...",
  "assignment": {  // only present if APPROVED
    "id": "uuid",
    "employeeId": "uuid",
    "projectId": "uuid",
    "deliverableId": "uuid",
    "assignedAt": "..."
  }
}
```

---

### Analytics (`/api/analytics`)

#### Get All Employees Overview
```http
GET /api/analytics/employees/overview
Authorization: Bearer <token>
Role: HR, ADMIN

Response 200:
[
  {
    "employeeId": "uuid",
    "fullname": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "manager": "Jane Smith",
    "totalSkills": 12,
    "pendingRatings": 3,
    "approvedRatings": 9,
    "averageRating": 7.5,
    "activeAssignments": 2
  }
]
```

#### Get Employee Skill Progress
```http
GET /api/analytics/employees/:employeeId/skill-progress
Authorization: Bearer <token>
Role: HR, MANAGER, ADMIN

Response 200:
{
  "employeeId": "uuid",
  "fullname": "John Doe",
  "skills": [
    {
      "skillId": "uuid",
      "skillName": "React.js",
      "currentRating": 8,
      "status": "APPROVED",
      "progressHistory": [
        {
          "rating": 6,
          "changeType": "INITIAL_RATING",
          "changedAt": "2026-01-15T...",
          "comment": null
        },
        {
          "rating": 7,
          "changeType": "MANAGER_APPROVED",
          "changedAt": "2026-02-10T...",
          "comment": "Good improvement"
        },
        {
          "rating": 8,
          "changeType": "MANAGER_APPROVED",
          "changedAt": "2026-02-28T...",
          "comment": "Excellent work"
        }
      ]
    }
  ]
}
```

#### Get Skill Progress Timeline
```http
GET /api/analytics/employees/:employeeId/skills/:skillId/timeline
Authorization: Bearer <token>
Role: HR, MANAGER, ADMIN

Response 200:
{
  "employeeId": "uuid",
  "fullname": "John Doe",
  "skillId": "uuid",
  "skillName": "React.js",
  "currentRating": 8,
  "timeline": [
    {
      "id": "uuid",
      "previousRating": null,
      "newRating": 6,
      "changeType": "INITIAL_RATING",
      "changedBy": null,
      "comment": null,
      "changedAt": "2026-01-15T..."
    },
    {
      "id": "uuid",
      "previousRating": 6,
      "newRating": 7,
      "changeType": "MANAGER_APPROVED",
      "changedBy": "manager-uuid",
      "reviewer": { "email": "manager@example.com" },
      "comment": "Good improvement",
      "changedAt": "2026-02-10T..."
    }
  ]
}
```

---

## Business Logic & Workflows

### 1. Employee Skill Rating Workflow

```
┌─────────────────────────────────────────────────────┐
│ EMPLOYEE: Rate Skill (selfRating: 7, status: PENDING) │
└───────────────────┬─────────────────────────────────┘
                    │
                    ├─► Can update selfRating while PENDING
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│      MANAGER: Review Pending Ratings                │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ APPROVE │ │  EDIT   │ │ REJECT  │
  └────┬────┘ └────┬────┘ └────┬────┘
       │           │           │
       ▼           ▼           ▼
  approvedRating  approvedRating  status=REJECTED
  = selfRating    = manager's    approvedRating=null
  status=APPROVED value
                  status=EDITED
```

**SkillProgressLog** is created for every change:
- `INITIAL_RATING`: First self-rating
- `SELF_UPDATED`: Employee updates rating (while PENDING)
- `MANAGER_APPROVED`: Manager approves as-is
- `MANAGER_EDITED`: Manager changes rating
- `MANAGER_REJECTED`: Manager rejects rating

### 2. Assignment Request Workflow

```
┌────────────────────────────────────────────┐
│ HR: Create Assignment Request              │
│   - Select employee                        │
│   - Select deliverable                     │
│   Status: PENDING                          │
└───────────────┬────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────┐
│ MANAGER: Review Pending Requests           │
│   (only for their direct reports)          │
└───────────┬────────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐    ┌─────────┐
│ APPROVE │    │ REJECT  │
└────┬────┘    └────┬────┘
     │              │
     ▼              ▼
Create            Status=REJECTED
EmployeeProject   No assignment
Assignment        created
```

### 3. Project Analysis with LLM

```
┌────────────────────────────────────────────┐
│ HR: POST /projects/:id/analyze             │
│   userPrompt: "payment system, auth, ..."  │
└───────────────┬────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────┐
│ LLM Service (Google Gemini)                │
│   - Analyzes project + user prompt         │
│   - Breaks down into deliverables          │
│   - Identifies required skills per         │
│     deliverable with weights               │
└───────────────┬────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────┐
│ Backend:                                   │
│   1. Create missing skills in DB           │
│   2. Create deliverables                   │
│   3. Link skills to deliverables with      │
│      weights                               │
└───────────────┬────────────────────────────┘
                │
                ▼
           Return created
           deliverables to HR
```

### 4. Recommendation Algorithm

**Scoring Formula:**

```
For each employee + deliverable pair:

overallScore = Σ (employeeRating[i] * skillWeight[i])
               for all skills required by deliverable

matchPercentage = (skillsMatched / totalSkillsRequired) * 100

skillsMatched = count of skills where employeeRating > 0

Employees are ranked by overallScore descending
```

**Example:**
- Deliverable requires: Node.js (weight 0.8), PostgreSQL (weight 0.6)
- Employee has: Node.js=9, PostgreSQL=7
- Score = (9 * 0.8) + (7 * 0.6) = 7.2 + 4.2 = **11.4**
- Match = 2/2 skills = **100%**

---

## LLM Integration

### Google Gemini Configuration

**Model:** `gemini-1.5-flash`  
**Purpose:** Analyze project descriptions and generate deliverables with required skills

### LLM Service (`llm.service.ts`)

#### `analyzeProject(projectDescription: string, userPrompt: string)`

**Input:**
```typescript
{
  projectDescription: "Build an e-commerce platform",
  userPrompt: "We need payment processing, user authentication, and product catalog"
}
```

**LLM Prompt:**
```
You are a project analysis assistant. Analyze the following project and break it down into deliverables with required skills.

Project Description: {projectDescription}
User Requirements: {userPrompt}

Return JSON array with this structure:
[
  {
    "name": "Deliverable name",
    "description": "Brief description",
    "skills": [
      { "name": "Skill name", "weight": 0.8 }
    ]
  }
]

Rules:
- weight is 0-1 (importance)
- Be specific with skill names
- Include only necessary skills
```

**Output:**
```json
[
  {
    "name": "Payment Gateway Integration",
    "description": "Implement Stripe/PayPal payment processing",
    "skills": [
      { "name": "Node.js", "weight": 0.8 },
      { "name": "Express.js", "weight": 0.7 },
      { "name": "Payment APIs", "weight": 0.9 },
      { "name": "PostgreSQL", "weight": 0.6 }
    ]
  },
  {
    "name": "User Authentication System",
    "description": "JWT-based authentication with role management",
    "skills": [
      { "name": "Node.js", "weight": 0.9 },
      { "name": "JWT", "weight": 0.9 },
      { "name": "bcrypt", "weight": 0.7 }
    ]
  }
]
```

### Database Integration

The backend automatically:
1. **Checks for existing skills** by name (case-insensitive)
2. **Creates missing skills** in the database
3. **Creates deliverables** linked to the project
4. **Creates DeliverableSkill** mappings with weights

---

## Frontend Implementation Guide

### Recommended Tech Stack

- **React 18+** with TypeScript
- **Vite** (already configured in `frontend/`)
- **React Router** for routing
- **Axios** for API calls
- **React Query / TanStack Query** for server state management
- **Zustand / Context API** for auth state
- **Tailwind CSS / Material-UI / Ant Design** for UI components
- **Recharts / Chart.js** for analytics dashboards

### Core Features to Implement

#### 1. Authentication Module

**Pages:**
- Login (`/login`)
- Register (`/register`) - if allowing self-registration

**Components:**
- `AuthProvider` - Context for auth state
- `PrivateRoute` - Route guard for authenticated users
- `RoleRoute` - Route guard for specific roles

**State Management:**
```typescript
interface AuthState {
  user: User | null;
  profile: EmployeeProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**API Integration:**
```typescript
// services/auth.service.ts
export const authService = {
  login: (email: string, password: string) => 
    axios.post('/api/auth/login', { email, password }),
  
  register: (data: RegisterDto) => 
    axios.post('/api/auth/register', data),
};
```

---

#### 2. Role-Based Dashboard Layout

**Layouts:**
```
/dashboard
  ├── /employee    → Employee dashboard
  ├── /manager     → Manager dashboard
  └── /hr          → HR dashboard
```

**Navigation based on role:**
```typescript
const getDashboardRoutes = (role: Role) => {
  switch (role) {
    case 'EMPLOYEE':
      return [
        { path: '/my-skills', label: 'My Skills' },
        { path: '/my-assignments', label: 'Assignments' },
      ];
    case 'MANAGER':
      return [
        { path: '/team', label: 'My Team' },
        { path: '/pending-reviews', label: 'Pending Reviews' },
        { path: '/assignment-requests', label: 'Assignment Requests' },
      ];
    case 'HR':
      return [
        { path: '/projects', label: 'Projects' },
        { path: '/employees', label: 'Employees' },
        { path: '/skills', label: 'Skills' },
        { path: '/analytics', label: 'Analytics' },
      ];
  }
};
```

---

#### 3. Employee Pages (EMPLOYEE role)

##### **My Skills Page**

**Features:**
- List all employee's skills with self-rating and approved rating
- Status badges (Pending, Approved, Edited, Rejected)
- Button to add new skill rating
- Edit button for pending ratings

**Components:**
```tsx
<MySkillsPage>
  <AddSkillModal />
  <SkillsList>
    <SkillCard
      skill={skill}
      selfRating={8}
      approvedRating={7}
      status="APPROVED"
      reviewComment="Good progress"
    />
  </SkillsList>
</MySkillsPage>
```

**API Calls:**
- `GET /api/employee-skills/my-ratings`
- `POST /api/employee-skills` (add new rating)
- `PATCH /api/employee-skills/:id` (update pending rating)

---

#### 4. Manager Pages (MANAGER role)

##### **Pending Skill Reviews**

**Features:**
- List all pending skill ratings from direct reports
- Approve, Edit, or Reject actions
- Comment field for review feedback

**Components:**
```tsx
<PendingSkillReviewsPage>
  <ReviewCard
    employee={employee}
    skill={skill}
    selfRating={8}
    onApprove={() => ...}
    onEdit={(newRating, comment) => ...}
    onReject={(comment) => ...}
  />
</PendingSkillReviewsPage>
```

**API Calls:**
- `GET /api/employee-skills/pending`
- `PATCH /api/employee-skills/:id/review`

##### **Assignment Requests**

**Features:**
- View pending assignment requests for team members
- See employee details, project, deliverable
- Approve or Reject with single click

**API Calls:**
- `GET /api/assignment-requests/pending`
- `PATCH /api/assignment-requests/:id/review`

---

#### 5. HR Pages (HR role)

##### **Projects Management**

**Features:**
- List all projects with status (Planned, Active, Completed)
- Create new project
- Update project status
- Delete project
- **Analyze Project button** → Opens LLM analysis modal

**Components:**
```tsx
<ProjectsPage>
  <CreateProjectModal />
  <ProjectList>
    <ProjectCard
      project={project}
      onAnalyze={() => openAnalysisModal()}
      onDelete={() => ...}
    />
  </ProjectList>
  <AnalyzeProjectModal
    projectId={projectId}
    onSubmit={(userPrompt) => analyzeProject(projectId, userPrompt)}
  />
</ProjectsPage>
```

**API Calls:**
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:id/analyze`
- `DELETE /api/projects/:id`

##### **Deliverables Management**

**Features:**
- View project deliverables
- Add/edit/delete deliverables
- Manage required skills with weights
- **Request Assignment button** → Opens employee selection modal

**Components:**
```tsx
<ProjectDetailPage>
  <DeliverablesList>
    <DeliverableCard
      deliverable={deliverable}
      requiredSkills={skills}
      onRequestAssignment={() => openAssignmentModal()}
    />
  </DeliverablesList>
  <AssignmentRequestModal
    deliverableId={deliverableId}
    onSubmit={(employeeId) => createAssignmentRequest()}
  />
</ProjectDetailPage>
```

**API Calls:**
- `GET /api/projects/:projectId/deliverables`
- `POST /api/projects/:projectId/deliverables`
- `POST /api/deliverables/:id/request-assignment`

##### **Recommendations (KEY FEATURE)**

**Features:**
- **SINGLE BUTTON**: "Get Recommendations for All Deliverables"
- Shows top N employees for each deliverable
- Displays overall score, match percentage, skill breakdown
- Click on recommendation → Request assignment

**Components:**
```tsx
<ProjectRecommendationsPage>
  <Button onClick={() => getProjectRecommendations(projectId)}>
    Get Recommendations for All Deliverables
  </Button>
  
  <RecommendationsList>
    {deliverables.map(deliverable => (
      <DeliverableRecommendations
        deliverable={deliverable}
        recommendations={deliverable.recommendations}
      >
        <EmployeeRecommendationCard
          employee={rec.employee}
          overallScore={rec.overallScore}
          matchPercentage={rec.matchPercentage}
          skillBreakdown={rec.skillBreakdown}
          onRequestAssignment={() => ...}
        />
      </DeliverableRecommendations>
    ))}
  </RecommendationsList>
</ProjectRecommendationsPage>
```

**API Calls:**
- `GET /api/projects/:projectId/recommendations?topK=5`
- `GET /api/deliverables/:id/recommendations?topK=10` (individual view)
- `GET /api/deliverables/:deliverableId/employees/:employeeId/analysis` (detailed view)

##### **Analytics Dashboard**

**Features:**
- Employee overview table (all employees)
- Skill progress charts for individual employees
- Timeline graphs showing rating evolution

**Components:**
```tsx
<AnalyticsDashboard>
  <EmployeeOverviewTable
    employees={employees}
    onViewProgress={(employeeId) => navigate(`/analytics/employee/${employeeId}`)}
  />
</AnalyticsDashboard>

<EmployeeProgressPage>
  <SkillProgressChart
    skillData={skillProgressData}
  />
  <SkillTimelineGraph
    skillId={skillId}
    timeline={timeline}
  />
</EmployeeProgressPage>
```

**API Calls:**
- `GET /api/analytics/employees/overview`
- `GET /api/analytics/employees/:id/skill-progress`
- `GET /api/analytics/employees/:id/skills/:skillId/timeline`

---

### Folder Structure Suggestion

```
frontend/src/
├── api/
│   ├── client.ts              # Axios instance with interceptors
│   ├── auth.api.ts
│   ├── projects.api.ts
│   ├── skills.api.ts
│   ├── employeeSkills.api.ts
│   ├── recommendations.api.ts
│   ├── assignments.api.ts
│   └── analytics.api.ts
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PrivateRoute.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── AnalyzeProjectModal.tsx
│   │   └── DeliverableCard.tsx
│   ├── skills/
│   │   ├── SkillCard.tsx
│   │   ├── SkillRatingModal.tsx
│   │   └── ReviewSkillModal.tsx
│   ├── recommendations/
│   │   ├── RecommendationCard.tsx
│   │   └── SkillBreakdown.tsx
│   └── analytics/
│       ├── ProgressChart.tsx
│       └── TimelineGraph.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProjects.ts
│   ├── useSkills.ts
│   └── useRecommendations.ts
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── employee/
│   │   ├── MySkills.tsx
│   │   └── MyAssignments.tsx
│   ├── manager/
│   │   ├── PendingSkillReviews.tsx
│   │   └── AssignmentRequests.tsx
│   ├── hr/
│   │   ├── Projects.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── Recommendations.tsx
│   │   ├── Employees.tsx
│   │   └── Analytics.tsx
│   └── Dashboard.tsx
├── types/
│   ├── auth.types.ts
│   ├── project.types.ts
│   ├── skill.types.ts
│   └── recommendation.types.ts
├── utils/
│   ├── constants.ts
│   └── helpers.ts
├── App.tsx
└── main.tsx
```

---

### Key TypeScript Types

```typescript
// types/auth.types.ts
export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR = 'HR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  fullname: string;
  departmentId: string;
  managerId: string | null;
  department?: Department;
  manager?: EmployeeProfile;
}

// types/skill.types.ts
export enum SkillRatingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EDITED = 'EDITED',
  REJECTED = 'REJECTED',
}

export interface Skill {
  id: string;
  name: string;
  description: string | null;
}

export interface EmployeeSkill {
  id: string;
  employeeId: string;
  skillId: string;
  skill: Skill;
  selfRating: number;
  approvedRating: number | null;
  status: SkillRatingStatus;
  reviewComment: string | null;
  reviewedAt: string | null;
}

// types/project.types.ts
export enum ProjectStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  requiredSkills?: DeliverableSkill[];
}

export interface DeliverableSkill {
  id: string;
  deliverableId: string;
  skillId: string;
  skill: Skill;
  weight: number;
}

// types/recommendation.types.ts
export interface SkillBreakdown {
  skillId: string;
  skillName: string;
  weight: number;
  employeeRating: number;
  isMatched: boolean;
  contribution: number;
}

export interface EmployeeRecommendation {
  employeeId: string;
  fullname: string;
  department?: string;
  overallScore: number;
  matchPercentage: number;
  skillsMatched: number;
  totalSkillsRequired: number;
  skillBreakdown: SkillBreakdown[];
}

export interface ProjectRecommendations {
  projectId: string;
  projectName: string;
  deliverables: {
    deliverableId: string;
    deliverableName: string;
    recommendations: EmployeeRecommendation[];
  }[];
}
```

---

### API Client Setup

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Sample Hook: useProjects

```typescript
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../api/projects.api';

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const createProjectMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const analyzeProjectMutation = useMutation({
    mutationFn: ({ projectId, userPrompt }: { projectId: string; userPrompt: string }) =>
      projectsApi.analyzeProject(projectId, userPrompt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', variables.projectId] });
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProjectMutation.mutate,
    analyzeProject: analyzeProjectMutation.mutate,
  };
};
```

---

### UI/UX Recommendations

#### Color Coding for Skill Status
- **PENDING**: Yellow/Orange badge
- **APPROVED**: Green badge
- **EDITED**: Blue badge
- **REJECTED**: Red badge

#### Recommendation Display
- Show employees in cards sorted by `overallScore`
- Display match percentage with progress bar
- Use color gradient: 90%+ (green), 70-90% (yellow), <70% (red)
- Show skill breakdown in expandable section

#### Analytics Charts
- Line chart for skill progress timeline
- Bar chart for rating comparison (self vs approved)
- Table with sorting for employee overview

---

## Development Guidelines

### Error Handling

All API responses follow this structure:

**Success (2xx):**
```json
{
  "id": "...",
  "data": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error message"
}
```

### Database Best Practices

1. **Use transactions** for multi-step operations (e.g., assignment approval)
2. **Include relations** in queries to avoid N+1 problems
3. **Index frequently queried fields** (already done in schema)
4. **Soft delete** for important records (consider adding `deletedAt` field)

### Security Considerations

1. **Never expose passwords** in responses
2. **Validate all inputs** at controller level
3. **Rate limit** authentication endpoints
4. **Use HTTPS** in production
5. **Sanitize LLM outputs** before saving to database

---

## Testing Checklist

### Backend API Testing

- [ ] Authentication (register, login, token validation)
- [ ] RBAC (unauthorized role access returns 403)
- [ ] Skill rating workflow (create, update, approve, edit, reject)
- [ ] Assignment request workflow (create, approve, reject)
- [ ] LLM integration (project analysis, deliverable creation)
- [ ] Recommendation algorithm (score calculation, ranking)
- [ ] Analytics endpoints (progress tracking, timeline)

### Frontend Testing

- [ ] Login/logout flow
- [ ] Role-based routing and navigation
- [ ] CRUD operations for all entities
- [ ] Real-time updates after mutations
- [ ] Error handling and user feedback
- [ ] Responsive design (mobile, tablet, desktop)

---

## Deployment

### Environment Variables (Production)

```env
PORT=4000
JWT_SECRET=<strong-random-secret>
DATABASE_URL=<production-postgres-url>
GEMINI_API_KEY=<production-gemini-key>
NODE_ENV=production
```

### Database Migration

```bash
# Run migrations in production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Build & Start

```bash
npm run build
npm start
```

---

## Future Enhancements

### Potential Features

1. **Email Notifications**
   - Notify employees when skill rating is reviewed
   - Notify managers of new pending reviews

2. **Skill Endorsements**
   - Peers can endorse employee skills
   - Weight endorsements in recommendations

3. **Project Templates**
   - Save LLM-generated deliverable structures as templates
   - Reuse for similar projects

4. **Skill Gap Analysis**
   - Compare employee skills with project requirements
   - Suggest training/learning paths

5. **Time Tracking**
   - Track time spent on deliverables
   - Correlate with skill improvement

6. **Advanced Analytics**
   - Department-wise skill distribution
   - Skill demand forecasting
   - Employee utilization rates

7. **Multi-language Support**
   - Internationalization (i18n)
   - LLM prompts in different languages

---

## API Reference Summary

| Module | Endpoints | Roles |
|--------|-----------|-------|
| **Auth** | `POST /auth/register`, `POST /auth/login` | Public |
| **Departments** | `POST /departments`, `GET /departments` | HR (create), All (read) |
| **Employees** | `POST /employees`, `PATCH /employees/:id` | HR |
| **Projects** | CRUD projects, `POST /:id/analyze` | HR |
| **Deliverables** | CRUD deliverables | HR |
| **Skills** | `POST /skills`, `GET /skills` | HR (create), All (read) |
| **Employee Skills** | Self-rating CRUD, Manager review | EMPLOYEE, MANAGER |
| **Recommendations** | Get project/deliverable recommendations | HR |
| **Assignments** | Request, Approve/Reject | HR (request), MANAGER (review) |
| **Analytics** | Employee overview, Skill progress | HR, MANAGER, ADMIN |

---

## Support & Contact

For questions or issues:
- Check API error messages in responses
- Review Prisma logs for database issues
- Test LLM integration with sample prompts
- Verify JWT token structure if auth fails

---

**End of Documentation**

This documentation provides everything needed for:
- ✅ Understanding the backend architecture
- ✅ Implementing frontend features
- ✅ Testing API endpoints
- ✅ Deploying to production
- ✅ Extending with new features

**Happy Coding! 🚀**
