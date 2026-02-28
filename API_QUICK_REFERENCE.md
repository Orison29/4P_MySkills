# 4P_MySkills API Quick Reference

**Base URL:** `http://localhost:4000/api`

## Authentication

All endpoints except `/auth/*` require:
```
Authorization: Bearer <jwt-token>
```

---

## Quick Endpoint Reference

### Auth (Public)
```
POST /auth/register     → { email, password, fullname, departmentId, managerId?, role }
POST /auth/login        → { email, password }
```

### Departments
```
POST /departments       → { name } [HR]
GET  /departments       → [] [Any authenticated]
```

### Employees
```
POST   /employees       → { email, password, fullname, departmentId, managerId?, role } [HR]
PATCH  /employees/:id   → { departmentId?, managerId? } [HR]
```

### Skills
```
POST /skills            → { name, description } [HR]
GET  /skills            → [] [Any authenticated]
```

### Projects
```
POST   /projects             → { name, description, startDate?, endDate? } [HR]
GET    /projects             → [] [HR]
PATCH  /projects/:id/status  → { status: "PLANNED|ACTIVE|COMPLETED" } [HR]
POST   /projects/:id/analyze → { userPrompt } [HR] ⚡ LLM
DELETE /projects/:id         → [HR]
```

### Deliverables
```
POST   /projects/:projectId/deliverables  → { name, description } [HR]
GET    /projects/:projectId/deliverables  → [] [HR]
GET    /deliverables/:id                  → {} [HR]
PATCH  /deliverables/:id                  → { name?, description? } [HR]
DELETE /deliverables/:id                  → [HR]
```

### Deliverable Skills
```
POST   /deliverables/:deliverableId/skills               → { skillId, weight } [HR]
GET    /deliverables/:deliverableId/skills               → [] [HR]
PATCH  /deliverables/:deliverableId/skills/:skillId      → { weight } [HR]
DELETE /deliverables/:deliverableId/skills/:skillId      → [HR]
```

### Employee Skills
```
POST  /employee-skills                → { skillId, selfRating } [EMPLOYEE]
PATCH /employee-skills/:id            → { selfRating } [EMPLOYEE] (if PENDING)
GET   /employee-skills/my-ratings     → [] [EMPLOYEE]
GET   /employee-skills/pending        → [] [MANAGER]
PATCH /employee-skills/:id/review     → { action: "APPROVE|EDIT|REJECT", approvedRating?, reviewComment? } [MANAGER]
```

### Recommendations ⭐
```
GET /projects/:projectId/recommendations                        → { deliverables: [...] } [HR] ⚡ KEY FEATURE
GET /deliverables/:deliverableId/recommendations?topK=5         → { topEmployees: [...] } [HR]
GET /deliverables/:delId/employees/:empId/analysis              → { skillDetails: [...] } [HR]
```

### Assignments
```
POST  /deliverables/:id/request-assignment     → { employeeId } [HR]
GET   /assignment-requests/pending             → [] [MANAGER]
PATCH /assignment-requests/:id/review          → { action: "APPROVE|REJECT" } [MANAGER]
```

### Analytics
```
GET /analytics/employees/overview                           → [] [HR, ADMIN]
GET /analytics/employees/:employeeId/skill-progress         → { skills: [...] } [HR, MANAGER, ADMIN]
GET /analytics/employees/:empId/skills/:skillId/timeline    → { timeline: [...] } [HR, MANAGER, ADMIN]
```

---

## Key Workflows

### 1. Employee Rates Skill
```
EMPLOYEE → POST /employee-skills { skillId, selfRating: 7 }
→ status: PENDING
→ EMPLOYEE can PATCH /employee-skills/:id { selfRating: 8 } while PENDING
→ MANAGER → PATCH /employee-skills/:id/review { action: "APPROVE" }
→ status: APPROVED, approvedRating = selfRating
```

### 2. HR Creates Project with LLM
```
HR → POST /projects { name, description }
→ returns { id: projectId }
HR → POST /projects/:projectId/analyze { userPrompt: "payment, auth, catalog" }
→ LLM analyzes and creates deliverables with skills
→ returns { deliverables: [...] }
```

### 3. HR Gets Recommendations & Assigns
```
HR → GET /projects/:projectId/recommendations?topK=5
→ returns all deliverables with top 5 employees each
HR → selects employee from recommendations
HR → POST /deliverables/:deliverableId/request-assignment { employeeId }
→ status: PENDING
MANAGER → GET /assignment-requests/pending
MANAGER → PATCH /assignment-requests/:id/review { action: "APPROVE" }
→ creates EmployeeProjectAssignment
```

---

## Data Models (Simplified)

### User
```typescript
{
  id: uuid,
  email: string,
  role: "EMPLOYEE" | "MANAGER" | "HR" | "ADMIN"
}
```

### EmployeeProfile
```typescript
{
  id: uuid,
  userId: uuid,
  fullname: string,
  departmentId: uuid,
  managerId: uuid | null
}
```

### Project
```typescript
{
  id: uuid,
  name: string,
  description: string,
  status: "PLANNED" | "ACTIVE" | "COMPLETED"
}
```

### Deliverable
```typescript
{
  id: uuid,
  name: string,
  projectId: uuid,
  requiredSkills: DeliverableSkill[]
}
```

### EmployeeSkill
```typescript
{
  id: uuid,
  employeeId: uuid,
  skillId: uuid,
  selfRating: 1-10,
  approvedRating: 1-10 | null,
  status: "PENDING" | "APPROVED" | "EDITED" | "REJECTED",
  reviewComment: string | null
}
```

### Recommendation Response
```typescript
{
  employeeId: uuid,
  fullname: string,
  overallScore: number,        // Σ(rating * weight)
  matchPercentage: number,     // (skillsMatched / total) * 100
  skillBreakdown: [
    {
      skillName: string,
      weight: number,
      employeeRating: number,
      contribution: number     // rating * weight
    }
  ]
}
```

---

## Environment Variables

```env
PORT=4000
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/4p_myskills
GEMINI_API_KEY=your-gemini-api-key
```

---

## Setup Commands

```bash
# Install
cd backend && npm install

# Generate Prisma
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Dev server
npm run dev

# Build
npm run build

# Production
npm start
```

---

## LLM Integration

**Model:** `gemini-1.5-flash`

**Input:**
```json
{
  "projectDescription": "...",
  "userPrompt": "..."
}
```

**LLM Returns:**
```json
[
  {
    "name": "Payment Integration",
    "description": "...",
    "skills": [
      { "name": "Node.js", "weight": 0.8 },
      { "name": "Stripe API", "weight": 0.9 }
    ]
  }
]
```

**Backend Processing:**
1. Finds or creates skills by name
2. Creates deliverables
3. Links skills with weights

---

## Recommendation Algorithm

```
For deliverable with skills [Node.js(0.8), PostgreSQL(0.6)]:

Employee A: Node.js=9, PostgreSQL=7
  score = (9*0.8) + (7*0.6) = 7.2 + 4.2 = 11.4
  match = 2/2 = 100%

Employee B: Node.js=8, PostgreSQL=null
  score = (8*0.8) + 0 = 6.4
  match = 1/2 = 50%

Ranking: A > B
```

---

## Role Hierarchy

| Role | Capabilities |
|------|--------------|
| EMPLOYEE | Rate own skills, view own data |
| MANAGER | Review team skills, approve assignments |
| HR | Full project/assignment management, AI recommendations |
| ADMIN | Full system access |

---

## Frontend Implementation Priority

### Phase 1: Auth & Basic CRUD
1. Login/Register
2. Role-based routing
3. Projects (list, create, delete)
4. Skills (list, create)
5. Employee Skills (self-rating)

### Phase 2: Workflows
6. Manager skill review interface
7. LLM project analysis UI
8. Deliverables management
9. Assignment request creation

### Phase 3: Recommendations
10. **Project-wide recommendations** (single button)
11. Employee recommendation cards
12. Skill breakdown visualization
13. Assignment from recommendations

### Phase 4: Analytics
14. Employee overview dashboard
15. Skill progress charts
16. Timeline visualization

---

## Error Codes

- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient role)
- **404**: Not Found
- **400**: Bad Request (validation error)
- **500**: Server Error

---

## Testing Endpoints

Use this sequence to test full workflow:

```bash
# 1. Register HR
POST /auth/register { email, password, fullname, departmentId, role: "HR" }

# 2. Login
POST /auth/login { email, password }
→ get token

# 3. Create Project
POST /projects { name: "E-commerce" }
→ get projectId

# 4. Analyze with LLM
POST /projects/:projectId/analyze { userPrompt: "payment, auth, catalog" }
→ deliverables created

# 5. Get Recommendations
GET /projects/:projectId/recommendations?topK=5
→ see top employees per deliverable

# 6. Request Assignment
POST /deliverables/:deliverableId/request-assignment { employeeId }

# 7. Manager Approves
PATCH /assignment-requests/:id/review { action: "APPROVE" }
```

---

**Quick Ref Version 1.0** | Last Updated: Feb 28, 2026
