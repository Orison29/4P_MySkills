# Frontend Implementation Checklist

## Setup & Configuration

### Initial Setup
- [ ] Initialize React + TypeScript + Vite project (already done)
- [ ] Install dependencies:
  ```bash
  npm install react-router-dom axios @tanstack/react-query zustand
  npm install -D @types/react-router-dom
  ```
- [ ] Choose UI library (pick one):
  - [ ] Tailwind CSS + Headless UI
  - [ ] Material-UI (MUI)
  - [ ] Ant Design
  - [ ] Chakra UI

### Environment Setup
- [ ] Create `.env` file:
  ```env
  VITE_API_URL=http://localhost:4000
  ```

---

## Core Infrastructure

### API Client
- [ ] Create `src/api/client.ts`
  - [ ] Axios instance with base URL
  - [ ] Request interceptor (add JWT token)
  - [ ] Response interceptor (handle 401/403)
  - [ ] Error handling utilities

### Type Definitions
- [ ] Create `src/types/index.ts`
  - [ ] `Role` enum
  - [ ] `User` interface
  - [ ] `EmployeeProfile` interface
  - [ ] `Project` interface
  - [ ] `Deliverable` interface
  - [ ] `Skill` interface
  - [ ] `EmployeeSkill` interface
  - [ ] `Recommendation` interface
  - [ ] All status enums

### State Management
- [ ] Auth state (Zustand/Context)
  - [ ] `user`, `token`, `profile`
  - [ ] `login()`, `logout()`
  - [ ] `isAuthenticated` getter
  - [ ] Persist token to localStorage

### Routing
- [ ] Create router in `src/App.tsx`
  - [ ] Public routes: `/login`, `/register`
  - [ ] Protected routes with role guards
  - [ ] Redirect to role-specific dashboard after login

---

## Authentication Module

### Components
- [ ] `LoginPage` (`src/pages/auth/LoginPage.tsx`)
  - [ ] Email + Password form
  - [ ] Submit → `POST /auth/login`
  - [ ] Store token + user data
  - [ ] Redirect to dashboard
  - [ ] Error handling

- [ ] `RegisterPage` (optional)
  - [ ] Registration form
  - [ ] Department selection dropdown
  - [ ] Manager selection (optional)
  - [ ] Role selection

- [ ] `PrivateRoute` component
  - [ ] Check if authenticated
  - [ ] Redirect to `/login` if not

- [ ] `RoleRoute` component
  - [ ] Check user role
  - [ ] Show 403 or redirect if unauthorized

### API Services
- [ ] `src/api/auth.api.ts`
  ```typescript
  login(email, password) → { user, profile, token }
  register(data) → { user, profile, token }
  logout()
  ```

---

## Layout Components

### DashboardLayout
- [ ] `src/components/layout/DashboardLayout.tsx`
  - [ ] Navbar with user info + logout
  - [ ] Sidebar with role-based navigation
  - [ ] Main content area with `<Outlet />`

### Navigation
- [ ] `src/components/layout/Navbar.tsx`
  - [ ] Logo/App name
  - [ ] User profile dropdown
  - [ ] Logout button

- [ ] `src/components/layout/Sidebar.tsx`
  - [ ] Navigation links based on `user.role`:
    - **EMPLOYEE**: My Skills, My Assignments
    - **MANAGER**: My Team, Pending Reviews, Assignment Requests
    - **HR**: Projects, Employees, Skills, Analytics

---

## EMPLOYEE Role Features

### My Skills Page
- [ ] `src/pages/employee/MySkillsPage.tsx`
  - [ ] Fetch `GET /employee-skills/my-ratings`
  - [ ] Display skills list with cards
  - [ ] "Add New Skill Rating" button → opens modal
  - [ ] Edit button for PENDING ratings

- [ ] `src/components/skills/SkillCard.tsx`
  - **Props:** `skill, selfRating, approvedRating, status, reviewComment`
  - **Display:**
    - Skill name
    - Self-rating (1-10 stars/slider)
    - Approved rating (if exists)
    - Status badge (color-coded)
    - Review comment (if exists)
  - **Actions:**
    - Edit button (if PENDING)

- [ ] `src/components/skills/AddSkillRatingModal.tsx`
  - [ ] Skill dropdown (fetch from `GET /skills`)
  - [ ] Rating slider (1-10)
  - [ ] Submit → `POST /employee-skills`

- [ ] `src/components/skills/EditSkillRatingModal.tsx`
  - [ ] Update rating slider
  - [ ] Submit → `PATCH /employee-skills/:id`

### API Services
- [ ] `src/api/employeeSkills.api.ts`
  ```typescript
  getMyRatings() → EmployeeSkill[]
  createRating(skillId, selfRating)
  updateRating(id, selfRating)
  ```

---

## MANAGER Role Features

### Pending Skill Reviews
- [ ] `src/pages/manager/PendingSkillReviewsPage.tsx`
  - [ ] Fetch `GET /employee-skills/pending`
  - [ ] Group by employee
  - [ ] Review cards with Approve/Edit/Reject actions

- [ ] `src/components/manager/SkillReviewCard.tsx`
  - **Display:**
    - Employee name
    - Skill name
    - Self-rating
    - Date submitted
  - **Actions:**
    - "Approve" button → approve as-is
    - "Edit Rating" button → opens modal
    - "Reject" button → opens comment modal

- [ ] `src/components/manager/ReviewSkillModal.tsx`
  - **Edit mode:**
    - Show self-rating (read-only)
    - New rating input
    - Comment textarea
    - Submit → `PATCH /employee-skills/:id/review` with action="EDIT"
  - **Reject mode:**
    - Comment textarea (required)
    - Submit → action="REJECT"

### Assignment Requests
- [ ] `src/pages/manager/AssignmentRequestsPage.tsx`
  - [ ] Fetch `GET /assignment-requests/pending`
  - [ ] List of pending requests
  - [ ] Approve/Reject buttons

- [ ] `src/components/manager/AssignmentRequestCard.tsx`
  - **Display:**
    - Employee name
    - Project name
    - Deliverable name
    - Requested by (HR user)
    - Date requested
  - **Actions:**
    - "Approve" → `PATCH /assignment-requests/:id/review` action="APPROVE"
    - "Reject" → action="REJECT"

### API Services
- [ ] `src/api/manager.api.ts`
  ```typescript
  getPendingSkillReviews() → EmployeeSkill[]
  reviewSkillRating(id, action, approvedRating?, reviewComment?)
  getPendingAssignments() → AssignmentRequest[]
  reviewAssignment(id, action)
  ```

---

## HR Role Features

### Projects Management
- [ ] `src/pages/hr/ProjectsPage.tsx`
  - [ ] Fetch `GET /projects`
  - [ ] Project grid/table
  - [ ] "Create Project" button → modal
  - [ ] Click on project → navigate to details

- [ ] `src/components/projects/ProjectCard.tsx`
  - **Display:**
    - Project name
    - Status badge (Planned/Active/Completed)
    - Start/End dates
    - Description (truncated)
  - **Actions:**
    - "View Details" → navigate to `/projects/:id`
    - "Analyze with AI" → opens modal
    - "Delete" button

- [ ] `src/components/projects/CreateProjectModal.tsx`
  - [ ] Form: name, description, startDate, endDate
  - [ ] Submit → `POST /projects`

- [ ] `src/components/projects/AnalyzeProjectModal.tsx`
  - **Input:**
    - Large textarea for user prompt
    - Placeholder: "Describe additional requirements: payment gateway, user auth, product catalog..."
  - **Submit:**
    - `POST /projects/:id/analyze` with `userPrompt`
  - **Loading state:**
    - Show "AI is analyzing project..." spinner
  - **Success:**
    - Show created deliverables count
    - Close modal and refresh deliverables

### Project Details & Deliverables
- [ ] `src/pages/hr/ProjectDetailPage.tsx`
  - [ ] Fetch `GET /projects/:id`
  - [ ] Fetch `GET /projects/:id/deliverables`
  - [ ] Display project info
  - [ ] Deliverables list
  - [ ] "Add Deliverable" button (manual)
  - [ ] "Analyze Project" button (AI)

- [ ] `src/components/deliverables/DeliverableCard.tsx`
  - **Display:**
    - Deliverable name
    - Description
    - Required skills (chips/badges)
  - **Actions:**
    - "Edit" → modal
    - "Delete"
    - "Manage Skills" → navigate to skills page
    - "Get Recommendations" → navigate to recommendations
    - "Request Assignment" → modal

- [ ] `src/components/deliverables/CreateDeliverableModal.tsx`
  - [ ] Form: name, description
  - [ ] Submit → `POST /projects/:projectId/deliverables`

- [ ] `src/components/deliverables/ManageSkillsModal.tsx`
  - [ ] List current skills with weights
  - [ ] Add skill: dropdown + weight slider (0-1)
  - [ ] Submit → `POST /deliverables/:id/skills`
  - [ ] Update weight → `PATCH /deliverables/:id/skills/:skillId`
  - [ ] Remove skill → `DELETE /deliverables/:id/skills/:skillId`

### Recommendations (CRITICAL FEATURE)
- [ ] `src/pages/hr/ProjectRecommendationsPage.tsx`
  - **Single Button:**
    - "Get Recommendations for All Deliverables"
    - `GET /projects/:projectId/recommendations?topK=5`
  - **Loading State:**
    - Show "Analyzing all deliverables..." spinner
  - **Results:**
    - Accordion/tabs for each deliverable
    - Top 5 employees per deliverable
    - Expandable skill breakdown

- [ ] `src/pages/hr/DeliverableRecommendationsPage.tsx`
  - [ ] `GET /deliverables/:id/recommendations?topK=10`
  - [ ] Top N selector (5, 10, 20)
  - [ ] Employee recommendation cards
  - [ ] "Request Assignment" button on each card

- [ ] `src/components/recommendations/RecommendationCard.tsx`
  - **Display:**
    - Employee name + department
    - Overall score (large number)
    - Match percentage (progress bar)
    - Skills matched: X / Y
    - "View Details" → expands skill breakdown
  - **Actions:**
    - "Request Assignment" button

- [ ] `src/components/recommendations/SkillBreakdownTable.tsx`
  - **Columns:**
    - Skill name
    - Weight (importance)
    - Employee rating
    - Contribution (rating × weight)
    - Status (✓ matched or ✗ missing)
  - **Visual:**
    - Color-code matched/missing
    - Sort by contribution descending

- [ ] `src/components/recommendations/RequestAssignmentModal.tsx`
  - [ ] Confirm employee selection
  - [ ] Show deliverable details
  - [ ] Submit → `POST /deliverables/:id/request-assignment`

### Skills Management
- [ ] `src/pages/hr/SkillsPage.tsx`
  - [ ] Fetch `GET /skills`
  - [ ] Skills table/grid
  - [ ] "Create Skill" button → modal

- [ ] `src/components/skills/CreateSkillModal.tsx`
  - [ ] Form: name, description
  - [ ] Submit → `POST /skills`

### Employees Management
- [ ] `src/pages/hr/EmployeesPage.tsx`
  - [ ] Fetch `GET /analytics/employees/overview`
  - [ ] Employees table
  - [ ] "Create Employee" button → modal

- [ ] `src/components/employees/CreateEmployeeModal.tsx`
  - [ ] Form: email, password, fullname, departmentId, managerId, role
  - [ ] Submit → `POST /employees`

### Analytics Dashboard
- [ ] `src/pages/hr/AnalyticsPage.tsx`
  - [ ] Overview cards:
    - Total employees
    - Total skills
    - Pending reviews
    - Active projects
  - [ ] Employee overview table
  - [ ] Click employee → navigate to progress page

- [ ] `src/pages/hr/EmployeeProgressPage.tsx`
  - [ ] `GET /analytics/employees/:id/skill-progress`
  - [ ] Skills list with progress history
  - [ ] Click skill → show timeline

- [ ] `src/components/analytics/SkillProgressChart.tsx`
  - **Chart type:** Line chart
  - **X-axis:** Date
  - **Y-axis:** Rating (1-10)
  - **Data:** Timeline of rating changes

- [ ] `src/components/analytics/EmployeeOverviewTable.tsx`
  - **Columns:**
    - Name
    - Department
    - Manager
    - Total Skills
    - Pending Ratings
    - Avg Rating
    - Active Assignments
  - **Features:**
    - Sorting
    - Filtering
    - Search

### API Services
- [ ] `src/api/projects.api.ts`
  ```typescript
  getProjects()
  createProject(data)
  analyzeProject(projectId, userPrompt)
  deleteProject(projectId)
  ```

- [ ] `src/api/deliverables.api.ts`
  ```typescript
  getProjectDeliverables(projectId)
  createDeliverable(projectId, data)
  updateDeliverable(id, data)
  deleteDeliverable(id)
  ```

- [ ] `src/api/deliverableSkills.api.ts`
  ```typescript
  addSkillToDeliverable(deliverableId, skillId, weight)
  updateSkillWeight(deliverableId, skillId, weight)
  removeSkillFromDeliverable(deliverableId, skillId)
  ```

- [ ] `src/api/recommendations.api.ts`
  ```typescript
  getProjectRecommendations(projectId, topK)
  getDeliverableRecommendations(deliverableId, topK)
  getEmployeeAnalysis(deliverableId, employeeId)
  ```

- [ ] `src/api/assignments.api.ts`
  ```typescript
  createAssignmentRequest(deliverableId, employeeId)
  ```

- [ ] `src/api/analytics.api.ts`
  ```typescript
  getEmployeesOverview()
  getEmployeeSkillProgress(employeeId)
  getSkillTimeline(employeeId, skillId)
  ```

---

## Shared Components

### UI Components
- [ ] `Loading` spinner
- [ ] `ErrorMessage` component
- [ ] `ConfirmDialog` modal
- [ ] `Toast` notifications
- [ ] `StatusBadge` (for skill status, project status)
- [ ] `RatingDisplay` (stars/slider for 1-10 ratings)

### Utilities
- [ ] `src/utils/formatters.ts`
  - [ ] Date formatting
  - [ ] Number formatting (scores, percentages)
  - [ ] Status color mapping

- [ ] `src/utils/constants.ts`
  - [ ] Role labels
  - [ ] Status enums
  - [ ] Color schemes

---

## Testing Checklist

### Unit Tests
- [ ] API client interceptors
- [ ] Auth state management
- [ ] Utility functions

### Integration Tests
- [ ] Login flow
- [ ] Skill rating workflow
- [ ] Project analysis with LLM
- [ ] Recommendation flow → assignment request

### E2E Tests (Optional)
- [ ] Complete employee skill rating flow
- [ ] Complete assignment request workflow
- [ ] Complete project creation with AI analysis

---

## UI/UX Guidelines

### Color Coding
```typescript
const STATUS_COLORS = {
  // Skill Status
  PENDING: 'yellow',
  APPROVED: 'green',
  EDITED: 'blue',
  REJECTED: 'red',
  
  // Project Status
  PLANNED: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  
  // Match Percentage
  EXCELLENT: 'green',  // 90%+
  GOOD: 'yellow',      // 70-90%
  FAIR: 'orange',      // 50-70%
  POOR: 'red',         // <50%
};
```

### Responsive Design Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Loading States
- Skeleton loaders for cards
- Spinners for async actions
- Progress bars for recommendations

### Error Handling
- Toast notifications for errors
- Inline validation messages
- 404 pages
- 403 Forbidden pages

---

## Performance Optimizations

- [ ] React Query caching
- [ ] Lazy load routes with `React.lazy()`
- [ ] Virtualize long lists (react-virtual)
- [ ] Debounce search inputs
- [ ] Optimize images (if any)
- [ ] Code splitting by role-based routes

---

## Deployment Checklist

- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Set production API URL in `.env.production`
- [ ] Configure CORS on backend for frontend URL
- [ ] Deploy frontend (Vercel/Netlify/AWS)
- [ ] Test end-to-end in production

---

## Feature Priority Matrix

### MVP (Must Have)
1. ✅ Authentication (Login)
2. ✅ Projects CRUD
3. ✅ Skills CRUD
4. ✅ Employee Skills (self-rating)
5. ✅ LLM Project Analysis
6. ✅ Recommendations (project-wide)
7. ✅ Assignment Requests

### Phase 2 (Should Have)
8. Manager skill review
9. Manager assignment approval
10. Analytics dashboard
11. Deliverable management

### Phase 3 (Nice to Have)
12. Skill progress charts
13. Employee overview table
14. Advanced filtering/search
15. Email notifications (future)

---

## API Integration Testing

Use these test cases to verify frontend-backend integration:

### Test 1: Login Flow
```
1. Enter email + password
2. Click "Login"
3. Verify token stored in localStorage
4. Verify redirected to /dashboard
5. Verify user info displayed in navbar
```

### Test 2: Skill Rating
```
1. Navigate to "My Skills"
2. Click "Add New Rating"
3. Select skill, set rating to 8
4. Submit
5. Verify new skill appears with PENDING status
6. Click "Edit"
7. Change rating to 9
8. Verify updated rating
```

### Test 3: LLM Analysis
```
1. Create new project "E-commerce"
2. Click "Analyze with AI"
3. Enter prompt: "payment, auth, product catalog"
4. Submit
5. Verify loading indicator
6. Verify deliverables created (should be 3+)
7. Verify each has skills assigned
```

### Test 4: Recommendations → Assignment
```
1. Navigate to project details
2. Click "Get Recommendations for All Deliverables"
3. Verify all deliverables show top 5 employees
4. Verify scores and match percentages
5. Click "View Details" on top employee
6. Verify skill breakdown
7. Click "Request Assignment"
8. Confirm request
9. Verify success message
```

---

## Quick Start Template

### Sample `App.tsx` Structure
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import EmployeeDashboard from './pages/employee/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';
import HRDashboard from './pages/hr/Dashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route index element={<RoleBasedDashboard />} />
            </Route>
            
            <Route path="/employee/*" element={<RoleRoute roles={['EMPLOYEE']} />}>
              {/* Employee routes */}
            </Route>
            
            <Route path="/manager/*" element={<RoleRoute roles={['MANAGER']} />}>
              {/* Manager routes */}
            </Route>
            
            <Route path="/hr/*" element={<RoleRoute roles={['HR']} />}>
              {/* HR routes */}
            </Route>
            
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 'EMPLOYEE': return <Navigate to="/employee" />;
    case 'MANAGER': return <Navigate to="/manager" />;
    case 'HR': return <Navigate to="/hr" />;
    default: return <Navigate to="/login" />;
  }
}
```

---

**Frontend Checklist Version 1.0** | Last Updated: Feb 28, 2026
