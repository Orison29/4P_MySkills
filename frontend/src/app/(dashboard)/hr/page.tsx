'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import { Activity } from 'lucide-react';

export default function HRDashboard() {
  const { profile } = useAuthStore();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard-stats'],
    queryFn: analyticsApi.getDashboardStats,
  });
  
  return (
    <RoleGuard allowedRoles={['HR', 'ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.fullname}. Manage projects, skills, and analyze assignments.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Dash stat cards */}
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold text-zinc-500 mb-1">Active Projects</h3>
            <p className="text-3xl font-bold">{isLoading ? '-' : stats?.activeProjects}</p>
          </div>
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold text-zinc-500 mb-1">Total Employees</h3>
            <p className="text-3xl font-bold">{isLoading ? '-' : stats?.totalEmployees}</p>
          </div>
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold text-zinc-500 mb-1">Pending Assignments</h3>
            <p className="text-3xl font-bold">{isLoading ? '-' : stats?.pendingAssignments}</p>
          </div>
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold text-zinc-500 mb-1">New Skills</h3>
            <p className="text-3xl font-bold">{isLoading ? '-' : stats?.newSkills}</p>
          </div>
        </div>

        {/* Activity Graph */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 text-zinc-800">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold">Skill Activity Over Time (30 Days)</h2>
          </div>
          
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : stats?.activityGraphData ? (
             <div className="h-48 flex items-end gap-1 w-full mt-4">
              {stats.activityGraphData.map((day: any) => {
                const maxCount = Math.max(...stats.activityGraphData.map((d: any) => d.count), 1);
                const height = Math.max((day.count / maxCount) * 100, 2); 
                const isZero = day.count === 0;

                return (
                  <div key={day.date} className="flex-1 flex flex-col justify-end h-full group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 transition">
                      {day.date}: {day.count} activities
                    </div>
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${isZero ? 'bg-zinc-100' : 'bg-indigo-500 group-hover:bg-indigo-600'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
             </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-500">
              No activity data available.
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
