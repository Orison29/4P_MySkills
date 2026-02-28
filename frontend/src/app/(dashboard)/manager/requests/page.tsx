'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { managerApi } from '@/api/manager.api';
import { UserCheck, FileText, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignmentRequestsPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['manager', 'assignments', 'pending'],
    queryFn: managerApi.getPendingAssignments,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'APPROVE' | 'REJECT' }) => managerApi.reviewAssignment(id, action),
    onSuccess: () => {
      toast.success('Assignment request reviewed');
      queryClient.invalidateQueries({ queryKey: ['manager', 'assignments', 'pending'] });
    },
    onError: () => toast.error('Failed to process request')
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Requests</h1>
          <p className="text-muted-foreground mt-1">Review AI-recommended HR project assignments for your team.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : requests?.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm border-dashed">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">No pending requests</h3>
          <p className="text-zinc-500 mt-1">There are no assignment requests requiring your approval right now.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Deliverable</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests?.map((req: any) => (
                  <tr key={req.id} className="hover:bg-zinc-50 :bg-zinc-900/50 transition">
                    <td className="px-6 py-4 font-medium">{req.employee?.fullname}</td>
                    <td className="px-6 py-4 text-zinc-700 ">{req.project?.name}</td>
                    <td className="px-6 py-4 text-zinc-600 ">{req.deliverable?.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <UserCheck className="w-3.5 h-3.5" />
                        {req.requestedByAdmin?.profile?.fullname || 'HR User'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => reviewMutation.mutate({ id: req.id, action: 'REJECT' })}
                          className="p-2 text-red-600 hover:bg-red-50 :bg-red-900/20 rounded-md transition"
                          title="Reject Assignment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => reviewMutation.mutate({ id: req.id, action: 'APPROVE' })}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md flex items-center gap-1.5 transition shadow-sm"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
