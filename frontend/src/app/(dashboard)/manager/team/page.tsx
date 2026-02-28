'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/api/manager.api';
import { Users } from 'lucide-react';

export default function ManagerTeamPage() {
  const { data: team, isLoading } = useQuery({
    queryKey: ['manager', 'team'],
    queryFn: managerApi.getMyTeam,
  });

  return (
    <RoleGuard allowedRoles={['MANAGER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
          <p className="text-muted-foreground mt-2">
            View your direct reports and their skill ratings.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : team?.length === 0 ? (
          <div className="text-center p-12 bg-white border rounded-xl shadow-sm text-zinc-500">
            No team members assigned to you yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {team?.map((member) => (
              <div key={member.id} className="bg-white border rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{member.fullname}</h3>
                    <p className="text-sm text-zinc-500">{member.department?.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">{member.user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Skill Profile</h4>
                  {member.employeeSkills?.length === 0 ? (
                    <p className="text-sm text-zinc-400 italic">No skills rated yet.</p>
                  ) : (
                    member.employeeSkills?.map((es: any) => (
                      <div key={es.id} className="text-sm flex justify-between items-center">
                        <span className="font-medium text-zinc-700">{es.skill?.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          es.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          es.status === 'EDITED' ? 'bg-blue-100 text-blue-700' :
                          es.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-zinc-100 text-zinc-700'
                        }`}>
                          {es.status === 'APPROVED' || es.status === 'EDITED' ? `${es.approvedRating}/5` : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
