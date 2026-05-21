export type TaskStatusValue = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskSummary = {
  id: string;
  title: string;
  status: TaskStatusValue;
  employee: {
    id: string;
    fullname: string;
    email?: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  deliverable: {
    id: string;
    name: string;
  };
};
