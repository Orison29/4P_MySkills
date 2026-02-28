export type Role = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

export type User = {
  id: string;
  email: string;
  role: Role;
  createdAt?: string;
};

export type EmployeeProfile = {
  id: string;
  userId: string;
  fullname: string;
  departmentId: string;
  managerId: string | null;
  createdAt?: string;
};

export type Department = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

// ... other models as needed for initial setup
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
};

export type DeliverableSkill = {
  id: string;
  deliverableId: string;
  skillId: string;
  weight: number;
  skill?: Skill;
};

export type Deliverable = {
  id: string;
  name: string;
  description: string;
  projectId: string;
  requiredSkills?: DeliverableSkill[];
  createdAt?: string;
};

export type RatingStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED';

export type EmployeeSkill = {
  id: string;
  employeeId: string;
  skillId: string;
  selfRating: number;
  approvedRating: number | null;
  status: RatingStatus;
  reviewComment: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  skill?: Skill;
};

export type RecommendationItem = {
  employeeId: string;
  fullname: string;
  overallScore: number;
  matchPercentage: number;
  skillBreakdown: {
    skillName: string;
    weight: number;
    employeeRating: number;
    contribution: number;
  }[];
};
