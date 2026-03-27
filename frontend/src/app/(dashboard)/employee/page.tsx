'use client';

import { campaignsApi } from '@/api/campaigns.api';
import { RoleGuard } from '@/components/auth/role-guard';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const { profile } = useAuthStore();
  const { data: campaignProgress, isLoading } = useQuery({
    queryKey: ['assessment-campaigns', 'active-me'],
    queryFn: campaignsApi.getMyActiveProgress,
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
      </div>
    </RoleGuard>
  );
}
