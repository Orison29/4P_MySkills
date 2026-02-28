'use client';

import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '@/api/employee.api';
import { Briefcase, Calendar, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeAssignmentsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['employee', 'assignments'],
    queryFn: employeeApi.getMyAssignments,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
          <p className="text-muted-foreground mt-1">View your current and past project deliverables.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Assignments */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Active Assignments
            </h2>
            
            {assignments?.active.length === 0 ? (
              <div className="text-center p-8 bg-white border rounded-xl shadow-sm text-zinc-500">
                You have no active project assignments at this time.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignments?.active.map((assignment) => (
                  <div key={assignment.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assignment.project.status}
                      </div>
                      <Briefcase className="w-5 h-5 text-zinc-400" />
                    </div>
                    
                    <h3 className="font-bold text-lg text-zinc-900 mb-1">{assignment.project.name}</h3>
                    <p className="text-sm font-medium text-primary mb-3">{assignment.deliverable.title}</p>
                    <p className="text-sm text-zinc-600 line-clamp-2 mb-4">
                      {assignment.deliverable.description}
                    </p>
                    
                    <div className="flex items-center text-xs text-zinc-500 gap-2 mt-auto pt-4 border-t border-zinc-100">
                      <Calendar className="w-4 h-4" />
                      Assigned: {format(new Date(assignment.assignedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past Assignments */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Past Assignments
            </h2>
            
            {assignments?.past.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-xl text-zinc-500">
                You have no past assignments.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                {assignments?.past.map((assignment) => (
                  <div key={assignment.id} className="bg-zinc-50 border rounded-xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Completed
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-zinc-900 mb-1">{assignment.project.name}</h3>
                    <p className="text-sm font-medium text-emerald-600 mb-2">{assignment.deliverable.title}</p>
                    
                    <div className="flex items-center text-xs text-zinc-500 gap-2 mt-4 pt-4 border-t border-zinc-200">
                      <Calendar className="w-4 h-4" />
                      Completed: {assignment.releasedAt ? format(new Date(assignment.releasedAt), 'MMM d, yyyy') : 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
