'use client';

import { campaignsApi } from '@/api/campaigns.api';
import { employeeApi } from '@/api/employee.api';
import { RoleGuard } from '@/components/auth/role-guard';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const { profile } = useAuthStore();
  const { data: campaignProgress, isLoading } = useQuery({
    queryKey: ['assessment-campaigns', 'active-me'],
    queryFn: campaignsApi.getMyActiveProgress,
  });
  const queryClient = useQueryClient();
  const { data: employeeProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['employee', 'profile'],
    queryFn: employeeApi.getMyProfile,
  });
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['employee', 'tasks'],
    queryFn: employeeApi.getMyTasks,
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }) =>
      employeeApi.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'tasks'] });
    },
  });
  const activeCampaign = campaignProgress?.activeCampaign;
  const progress = campaignProgress?.progress;
  
  return (
    <RoleGuard allowedRoles={['EMPLOYEE']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.fullname}. View your skills and assignments.
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Reporting Manager</h2>
          {profileLoading ? (
            <p className="text-sm text-zinc-500 mt-2">Loading manager details...</p>
          ) : employeeProfile?.manager ? (
            <div className="mt-3 grid gap-2 text-sm text-zinc-700">
              <div>
                <span className="text-zinc-500">Name:</span> {employeeProfile.manager.fullname}
              </div>
              <div>
                <span className="text-zinc-500">Email:</span> {employeeProfile.manager.user?.email || '—'}
              </div>
              <div>
                <span className="text-zinc-500">Department:</span> {employeeProfile.manager.department?.name || '—'}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 mt-2">No manager assigned yet.</p>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white border rounded-xl p-5 shadow-sm text-zinc-500">
            Checking active skill requests...
          </div>
        ) : activeCampaign ? (
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Active Skill Rating Request</h2>
                <p className="text-zinc-600 mt-1">
                  {activeCampaign.title} is currently active. Please complete your skill ratings before{' '}
                  <span className="font-semibold">
                    {new Date(activeCampaign.endAt).toLocaleString()}
                  </span>
                  .
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  progress?.status === 'GOOD'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {progress?.status === 'GOOD' ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-zinc-50 border">
                <p className="text-xs text-zinc-500">Skills Rated</p>
                <p className="text-xl font-bold">{progress?.ratedSkillCount ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border">
                <p className="text-xs text-zinc-500">Campaign Status</p>
                <p className="text-xl font-bold">{activeCampaign.status}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/employee/skill-request"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
              >
                Open Skill Request
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-5 shadow-sm text-zinc-600">
            No active skill rating request at the moment.
          </div>
        )}

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">My Tasks</h2>
            <p className="text-sm text-zinc-500 mt-1">Your assigned tasks by project and deliverable.</p>
          </div>

          {tasksLoading ? (
            <div className="text-zinc-500">Loading tasks...</div>
          ) : tasks?.length === 0 ? (
            <div className="text-zinc-500">No tasks assigned yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="text-left px-4 py-2">Project</th>
                    <th className="text-left px-4 py-2">Deliverable</th>
                    <th className="text-left px-4 py-2">Task</th>
                    <th className="text-left px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks?.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-2 font-medium text-zinc-700">{task.project.name}</td>
                      <td className="px-4 py-2 text-zinc-600">{task.deliverable.name}</td>
                      <td className="px-4 py-2 text-zinc-700">{task.title}</td>
                      <td className="px-4 py-2">
                        <select
                          value={task.status}
                          onChange={(event) =>
                            updateTaskMutation.mutate({ taskId: task.id, status: event.target.value as any })
                          }
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
