'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Plus, Building, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminDepartmentsPage() {
  const queryClient = useQueryClient();
  const [newDeptName, setNewDeptName] = useState('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: adminApi.getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createDepartment(newDeptName),
    onSuccess: () => {
      toast.success('Department created');
      setNewDeptName('');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to create department')
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage company departments and view their size.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-zinc-50 flex items-center gap-3">
          <input 
            type="text" 
            placeholder="New department name (e.g., Engineering)..." 
            className="flex-1 rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
          />
          <button 
            onClick={() => createMutation.mutate()}
            disabled={!newDeptName || createMutation.isPending}
            className="flex items-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : departments?.length === 0 ? (
          <div className="text-center p-12">
            <Building className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900">No departments</h3>
            <p className="text-zinc-500 mt-1">Create your first department above.</p>
          </div>
        ) : (
          <div className="divide-y">
            {departments?.map((dept: any) => (
              <div key={dept.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 transition group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-lg">{dept.name}</h3>
                    <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5" /> ID: {dept.id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
