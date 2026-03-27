import { apiClient } from '../lib/api-client';

export type CampaignStatus = 'SCHEDULED' | 'ACTIVE' | 'CLOSED';

export type AssessmentCampaign = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  minSkillsRequired: number;
  createdBy: string;
  createdAt: string;
  status?: CampaignStatus;
  creator?: {
    id: string;
    email: string;
  };
};

export type CreateAssessmentCampaignInput = {
  title: string;
  startAt: string;
  endAt: string;
  minSkillsRequired?: number;
};

export type CampaignCoverageDepartmentRow = {
  departmentId: string;
  departmentName: string;
  headcount: number;
  current: {
    compliantEmployees: number;
    nonCompliantEmployees: number;
    coveragePct: number;
  };
  previous: {
    campaignId: string;
    compliantEmployees: number;
    nonCompliantEmployees: number;
    coveragePct: number;
  } | null;
};

export type CampaignCoverageResponse = {
  campaign: AssessmentCampaign;
  previousCampaign: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    minSkillsRequired: number;
  } | null;
  summary: {
    totalEmployees: number;
    compliantEmployees: number;
    nonCompliantEmployees: number;
    coveragePct: number;
  };
  departments: CampaignCoverageDepartmentRow[];
};

export type MyActiveCampaignProgressResponse = {
  activeCampaign: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    minSkillsRequired: number;
    status: CampaignStatus;
  } | null;
  employee?: {
    employeeId: string;
    fullname: string;
    department: {
      id: string;
      name: string;
    };
  };
  progress?: {
    ratedSkillCount: number;
    score: number;
    status: 'GOOD' | 'BAD';
    remainingSkillsToMeetThreshold: number;
  };
};

export const campaignsApi = {
  list: async (): Promise<AssessmentCampaign[]> => {
    const response = await apiClient.get<AssessmentCampaign[]>('/assessment-campaigns');
    return response.data;
  },

  create: async (
    data: CreateAssessmentCampaignInput
  ): Promise<AssessmentCampaign> => {
    const response = await apiClient.post<AssessmentCampaign>('/assessment-campaigns', data);
    return response.data;
  },

  updateState: async (
    campaignId: string,
    state: CampaignStatus
  ): Promise<AssessmentCampaign> => {
    const response = await apiClient.patch<AssessmentCampaign>(
      `/assessment-campaigns/${campaignId}/state`,
      { state }
    );
    return response.data;
  },

  delete: async (campaignId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/assessment-campaigns/${campaignId}`
    );
    return response.data;
  },

  getCoverage: async (campaignId: string): Promise<CampaignCoverageResponse> => {
    const response = await apiClient.get<CampaignCoverageResponse>(
      `/assessment-campaigns/${campaignId}/coverage`
    );
    return response.data;
  },

  getMyActiveProgress: async (): Promise<MyActiveCampaignProgressResponse> => {
    const response = await apiClient.get<MyActiveCampaignProgressResponse>(
      '/assessment-campaigns/active/me'
    );
    return response.data;
  },
};
