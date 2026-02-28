'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/api/manager.api';
import { Users, LayoutDashboard, ChevronRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function ManagerDashboard() {
  const { profile } = useAuthStore();
  
  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ['manager', 'team'],
    queryFn: managerApi.getMyTeam,
  });

  const { data: pendingReviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['manager', 'reviews', 'pending'],
    queryFn: managerApi.getPendingSkillReviews,
  });

  const { data: pendingRequests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['manager', 'assignments', 'pending'],
    queryFn: managerApi.getPendingAssignments,
  });

  return (
    <RoleGuard allowedRoles={['MANAGER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.fullname}. Review your team's skills and pending requests.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Team Widget */}
          <Link href="/manager/team" className="block group">
            <div className="bg-white border rounded-xl p-5 shadow-sm transition hover:shadow-md hover:border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-500 transition" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900 mb-1">My Team</h3>
              <p className="text-sm text-zinc-500">
                {isTeamLoading ? "Loading..." : `${team?.length || 0} Members`}
              </p>
            </div>
          </Link>

          {/* Skill Reviews Widget */}
          <Link href="/manager/reviews" className="block group">
            <div className="bg-white border rounded-xl p-5 shadow-sm transition hover:shadow-md hover:border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900 mb-1">Skill Reviews</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-zinc-500">
                  {isReviewsLoading ? "Loading..." : `${pendingReviews?.length || 0} Pending`}
                </p>
                {!isReviewsLoading && (pendingReviews?.length ?? 0) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </div>
            </div>
          </Link>

          {/* Assignment Requests Widget */}
          <Link href="/manager/requests" className="block group">
            <div className="bg-white border rounded-xl p-5 shadow-sm transition hover:shadow-md hover:border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-purple-500 transition" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900 mb-1">Assignment Requests</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-zinc-500">
                   {isRequestsLoading ? "Loading..." : `${pendingRequests?.length || 0} Pending`}
                </p>
                {!isRequestsLoading && (pendingRequests?.length ?? 0) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
