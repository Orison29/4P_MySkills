'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import { ChevronRight, User, Briefcase, Mail, Building, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'employee', employeeId],
    queryFn: () => analyticsApi.getEmployeeSkillProgress(employeeId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const employee = data;

  if (!employee) {
    return <div className="p-8 text-center text-zinc-500">Employee not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Link href="/hr/employees" className="hover:text-primary transition">Employees</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-zinc-900 font-medium">{employee.fullname}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white border rounded-xl overflow-hidden shadow-sm h-fit">
          <div className="p-6 text-center border-b bg-zinc-50/50">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl uppercase mx-auto mb-4">
              {employee.fullname.substring(0, 2)}
            </div>
            <h1 className="text-xl font-bold tracking-tight">{employee.fullname}</h1>
            <p className="text-sm text-zinc-500 mt-1">{employee.department?.name || 'No Department'}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-700">
              <Mail className="w-4 h-4 text-zinc-400" />
              {employee.user?.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700">
              <Building className="w-4 h-4 text-zinc-400" />
              {employee.department?.name || 'Unassigned'}
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700">
              <User className="w-4 h-4 text-zinc-400" />
              Manager: {employee.manager?.fullname || 'None'}
            </div>
          </div>
        </div>

        {/* Skills Overview */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Skill Progress
            </h2>

            <h3 className="font-semibold text-sm border-b pb-2 mb-4">Detailed Skill Breakdown</h3>
            {!employee.skills || employee.skills.length === 0 ? (
              <p className="text-sm text-zinc-500 italic text-center py-6">No skills recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {employee.skills.map((skill: any) => (
                  <div key={skill.skillId} className="border border-zinc-100 bg-zinc-50/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-zinc-900">{skill.skillName}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        skill.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        skill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        skill.status === 'EDITED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {skill.status}
                      </span>
                      <div className="text-lg font-black text-zinc-900 w-12 text-right">
                        {skill.currentRating}/5
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
