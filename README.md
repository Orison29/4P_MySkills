# 4P_MySkills - Employee Skills Management System

**Version:** 1.0.0  
**Status:** Backend Complete ✅ | Frontend In Progress 🚧

---

## 📋 Project Overview

**4P_MySkills** is an AI-powered employee skills management and project assignment system that helps organizations:

- 📊 **Track employee skills** with self-rating and manager approval workflows
- 🤖 **AI-powered project analysis** using Google Gemini to break down projects into deliverables
- 🎯 **Smart employee recommendations** matching skills to project requirements
- 📈 **Analytics & progress tracking** for skill development over time
- 👥 **Manager-employee hierarchy** with role-based access control
- ⚡ **Automated assignment workflows** with manager approval

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  Employee Portal | Manager Dashboard | HR Management        │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JWT Auth)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                │
│  Auth | Projects | Skills | Recommendations | Analytics     │
└────────┬─────────────────────────┬──────────────────────────┘
         │                         │ Google Gemini API
         ▼                         ▼
┌──────────────────┐      ┌────────────────────┐
│   PostgreSQL     │      │   Gemini LLM       │
│   (Prisma ORM)   │      │   (AI Analysis)    │
└──────────────────┘      └────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Google Gemini API Key

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Start development server
npm run dev

# Server runs at http://localhost:4000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000

# Start development server
npm run dev

# Frontend runs at http://localhost:5173
```

---

## 📚 Documentation

### For Developers
- **[Backend Documentation](./BACKEND_DOCUMENTATION.md)** - Complete backend architecture, API reference, database schema
- **[API Quick Reference](./API_QUICK_REFERENCE.md)** - Quick lookup for API endpoints and workflows
- **[Frontend Checklist](./FRONTEND_CHECKLIST.md)** - Step-by-step frontend implementation guide

### Quick Links
- [Database Schema](#database-schema)
- [Role-Based Access](#role-based-access)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints-summary)
- [Workflows](#business-workflows)

---

## 🗄️ Database Schema

### Core Entities

```
User (Auth)
  ├─ EmployeeProfile
  │    ├─ Department
  │    ├─ Manager (self-referential)
  │    ├─ EmployeeSkills (M:N with Skill)
  │    └─ EmployeeProjectAssignments
  │
Project
  ├─ Deliverables
  │    └─ DeliverableSkills (M:N with Skill)
  │
Skill
  ├─ EmployeeSkills
  ├─ DeliverableSkills
  └─ SkillProgressLog (audit trail)

AssignmentRequest (Workflow)
SkillProgressLog (Audit)
```

**See [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md#database-schema) for detailed schema**

---

## 🔐 Role-Based Access

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **EMPLOYEE** | Personal | Rate own skills, view own assignments |
| **MANAGER** | Team | Review team skill ratings, approve assignment requests |
| **HR** | Organization | Full project management, AI analysis, recommendations |
| **ADMIN** | System | Full system access |

---

## ✨ Key Features

### 1. 🤖 AI-Powered Project Analysis

**HR imports a project description → Gemini LLM analyzes → Auto-generates deliverables with required skills**

```
Example Input:
"Build an e-commerce platform with payment processing and user authentication"

AI Output:
✓ Payment Gateway Integration (Node.js, Stripe API, PostgreSQL)
✓ User Authentication System (JWT, bcrypt, Express.js)
✓ Product Catalog Module (React, REST API, Database Design)
```

**API:** `POST /api/projects/:id/analyze`

---

### 2. 🎯 Smart Employee Recommendations

**Single-click recommendations for all project deliverables**

The algorithm scores employees based on:
- **Skill match:** Does the employee have the required skills?
- **Skill ratings:** How proficient are they (1-10 scale)?
- **Weighted scoring:** Critical skills weighted higher

**Formula:**
```
Overall Score = Σ (Employee Rating × Skill Weight)
Match % = (Skills Matched / Total Required Skills) × 100
```

**API:** `GET /api/projects/:projectId/recommendations?topK=5`

**Result:** Top 5 employees per deliverable, ranked by score

---

### 3. 📊 Skill Rating Workflow

```
EMPLOYEE rates skill (1-10)
  ↓
Status: PENDING
  ↓
MANAGER reviews
  ├─ APPROVE → approvedRating = selfRating
  ├─ EDIT → approvedRating = manager's value
  └─ REJECT → Rating not approved
```

**All changes logged in `SkillProgressLog` for analytics**

---

### 4. 👔 Assignment Request Workflow

```
HR selects employee for deliverable
  ↓
Create Assignment Request (PENDING)
  ↓
Notify employee's MANAGER
  ↓
MANAGER reviews
  ├─ APPROVE → Create EmployeeProjectAssignment
  └─ REJECT → Request denied
```

---

### 5. 📈 Analytics & Progress Tracking

- **Employee Overview Dashboard**: Total skills, pending reviews, average ratings
- **Skill Progress Timeline**: Visual graph of rating changes over time
- **Change Audit Trail**: Who changed what, when, and why

---

## 🌐 API Endpoints Summary

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Projects (HR)
```
POST   /api/projects                    → Create project
GET    /api/projects                    → List all projects
POST   /api/projects/:id/analyze        → AI analysis ⚡
DELETE /api/projects/:id                → Delete project
```

### Deliverables (HR)
```
POST   /api/projects/:id/deliverables   → Create deliverable
GET    /api/projects/:id/deliverables   → Get project deliverables
PATCH  /api/deliverables/:id            → Update deliverable
DELETE /api/deliverables/:id            → Delete deliverable
```

### Recommendations (HR) ⭐
```
GET /api/projects/:projectId/recommendations?topK=5           → All deliverables
GET /api/deliverables/:id/recommendations?topK=10             → Single deliverable
GET /api/deliverables/:delId/employees/:empId/analysis        → Detailed analysis
```

### Skills
```
POST /api/skills                        → Create skill (HR)
GET  /api/skills                        → List all skills (All)
```

### Employee Skills
```
POST  /api/employee-skills              → Self-rate skill (EMPLOYEE)
PATCH /api/employee-skills/:id          → Update rating (EMPLOYEE)
GET   /api/employee-skills/my-ratings   → View my ratings (EMPLOYEE)
GET   /api/employee-skills/pending      → Pending reviews (MANAGER)
PATCH /api/employee-skills/:id/review   → Review rating (MANAGER)
```

### Assignments
```
POST  /api/deliverables/:id/request-assignment     → Request assignment (HR)
GET   /api/assignment-requests/pending              → Pending requests (MANAGER)
PATCH /api/assignment-requests/:id/review           → Approve/Reject (MANAGER)
```

### Analytics
```
GET /api/analytics/employees/overview                      → All employees (HR)
GET /api/analytics/employees/:id/skill-progress            → Skill progress (HR/MANAGER)
GET /api/analytics/employees/:empId/skills/:skillId/timeline  → Timeline (HR/MANAGER)
```

**See [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for full details**

---

## 🎨 Frontend Implementation

### Tech Stack Recommendation
- **React 18+** with TypeScript
- **Vite** (build tool)
- **React Router** (routing)
- **TanStack Query** (server state)
- **Zustand** (auth state)
- **Tailwind CSS / MUI / Ant Design** (UI)
- **Recharts** (analytics charts)

### Core Pages

#### Employee Portal
- 📝 My Skills (self-rating)
- 📋 My Assignments

#### Manager Dashboard
- ⏳ Pending Skill Reviews
- 📩 Assignment Requests

#### HR Management
- 📊 Projects
  - Create, view, delete projects
  - **AI Analysis** button
- 🎯 Deliverables
  - Manage deliverables & skills
- ⭐ **Recommendations** (KEY FEATURE)
  - Single-button project-wide recommendations
  - Employee cards with scores & skill breakdown
- 📈 Analytics
  - Employee overview
  - Skill progress charts

**See [FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md) for detailed implementation guide**

---

## 🔄 Business Workflows

### Complete Project Assignment Flow

```
1. HR creates project
   POST /api/projects { name: "E-commerce Platform" }

2. HR analyzes project with AI
   POST /api/projects/:id/analyze { userPrompt: "payment, auth, catalog" }
   → Deliverables auto-created with skills

3. HR gets recommendations for all deliverables
   GET /api/projects/:id/recommendations?topK=5
   → Shows top 5 employees per deliverable

4. HR selects employee from recommendations
   POST /api/deliverables/:deliverableId/request-assignment { employeeId }
   → Assignment request created (PENDING)

5. Manager reviews assignment request
   GET /api/assignment-requests/pending
   PATCH /api/assignment-requests/:id/review { action: "APPROVE" }
   → EmployeeProjectAssignment created

6. Employee starts work on deliverable
```

### Skill Rating Flow

```
1. Employee rates their skill
   POST /api/employee-skills { skillId, selfRating: 7 }
   → Status: PENDING

2. Employee can update while pending
   PATCH /api/employee-skills/:id { selfRating: 8 }

3. Manager reviews
   GET /api/employee-skills/pending
   PATCH /api/employee-skills/:id/review
     { action: "APPROVE" | "EDIT" | "REJECT", approvedRating, reviewComment }

4. System logs change in SkillProgressLog
   → Used for analytics and timeline

5. Employee sees result
   GET /api/employee-skills/my-ratings
   → Status: APPROVED, approvedRating: 8
```

---

## 🔒 Security

- **JWT Authentication**: Token-based auth with role claims
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Middleware**: `requireRole()` guards endpoints
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **Environment Variables**: Sensitive data in `.env`

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Test authentication
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@example.com","password":"password123"}'

# Test AI analysis (with token)
curl -X POST http://localhost:4000/api/projects/{id}/analyze \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userPrompt":"payment gateway and user authentication"}'

# Test recommendations
curl http://localhost:4000/api/projects/{id}/recommendations?topK=5 \
  -H "Authorization: Bearer {token}"
```

### Frontend Testing

1. **Login Flow**: Login → Dashboard redirect
2. **Skill Rating**: Add skill → Update → Manager review
3. **AI Analysis**: Create project → Analyze → View deliverables
4. **Recommendations**: Get recommendations → Request assignment
5. **Analytics**: View employee progress → Skill timeline

---

## 📦 Project Structure

```
4P_MySkills/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── analytics/
│   │   │   ├── assignments/
│   │   │   ├── auth/
│   │   │   ├── deliverable-skills/
│   │   │   ├── deliverables/
│   │   │   ├── departments/
│   │   │   ├── employee-skills/
│   │   │   ├── employees/
│   │   │   ├── llm/
│   │   │   ├── projects/
│   │   │   ├── recommendations/
│   │   │   └── skills/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/              # API client & services
│   │   ├── components/       # React components
│   │   ├── contexts/         # Auth context
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Route pages
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── BACKEND_DOCUMENTATION.md     # Complete backend docs
├── API_QUICK_REFERENCE.md       # API endpoints quick ref
├── FRONTEND_CHECKLIST.md        # Frontend implementation guide
└── README.md                    # This file
```

---

## 🛠️ Tech Stack Summary

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.9+
- **Framework:** Express.js 5.2+
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 7.3+
- **Auth:** JWT + bcrypt
- **AI:** Google Gemini (gemini-1.5-flash)

### Frontend
- **Framework:** React 18+
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router
- **State:** TanStack Query + Zustand
- **UI:** Tailwind/MUI/Ant Design (choose one)
- **Charts:** Recharts/Chart.js

---

## 🚀 Deployment

### Backend Deployment

**Option 1: Railway / Render / Fly.io**
```bash
# Build
npm run build

# Start
npm start
```

**Environment Variables:**
```env
PORT=4000
JWT_SECRET=<production-secret>
DATABASE_URL=<postgres-url>
GEMINI_API_KEY=<gemini-key>
NODE_ENV=production
```

### Frontend Deployment

**Option 1: Vercel**
```bash
npm run build
# Deploy dist/ folder
```

**Option 2: Netlify**
```bash
npm run build
# Deploy dist/ folder
```

**Environment Variables:**
```env
VITE_API_URL=https://your-backend-url.com
```

---

## 📊 Sample Data

### Creating Test Data

```sql
-- Insert departments
INSERT INTO "Department" (id, name) VALUES
  ('dept-1', 'Engineering'),
  ('dept-2', 'Product'),
  ('dept-3', 'Design');

-- Insert skills
INSERT INTO "Skill" (id, name, description) VALUES
  ('skill-1', 'React.js', 'Frontend JavaScript library'),
  ('skill-2', 'Node.js', 'Backend JavaScript runtime'),
  ('skill-3', 'PostgreSQL', 'Relational database'),
  ('skill-4', 'TypeScript', 'Typed JavaScript');
```

### Using the API

```bash
# Register HR user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@example.com",
    "password": "password123",
    "fullname": "HR Manager",
    "departmentId": "dept-1",
    "role": "HR"
  }'
```

---

## 🐛 Troubleshooting

### Common Issues

**Database connection error**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npx prisma migrate deploy`

**JWT token invalid**
- Check `JWT_SECRET` is set
- Verify token in Authorization header: `Bearer <token>`

**LLM not working**
- Verify `GEMINI_API_KEY` is correct
- Check Gemini API quota
- Review `/api/projects/:id/analyze` error response

**CORS errors**
- Backend `app.ts` has `cors()` enabled
- Check frontend URL is allowed

---

## 📝 License

MIT License - See LICENSE file

---

## 👥 Contributors

- Backend Architecture & API Development
- Database Schema Design
- AI Integration (Google Gemini)
- Documentation

---

## 🎯 Next Steps

### For Backend Developers
- ✅ Backend is complete and ready
- Review [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
- Test all API endpoints

### For Frontend Developers
- 📖 Read [FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md)
- 🚀 Start with authentication module
- 🎨 Build role-based dashboards
- ⭐ Implement key feature: Recommendations page

### For LLMs/AI Assistants
- 📚 Parse [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for endpoint specs
- 🔍 Use [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) for detailed workflows
- ✅ Follow [FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md) for implementation tasks

---

## 📞 Support

For questions or issues:
- Check documentation files
- Review API error messages
- Test with curl/Postman
- Verify environment variables

---

**Built with ❤️ using TypeScript, React, Node.js, and AI**

**Happy Coding! 🚀**
