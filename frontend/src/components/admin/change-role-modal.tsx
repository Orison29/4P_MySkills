'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { analyticsApi } from '@/api/analytics.api';
import { X, ShieldAlert, Save } from 'lucide-react';
import { toast } from 'sonner';

export function ChangeRoleModal({ employeeId, onClose }: { employeeId: string, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState('EMPLOYEE');

  const { data: allEmployees, isLoading } = useQuery({
    queryKey: ['analytics', 'employees', 'overview'],
    queryFn: analyticsApi.getEmployeesOverview,
  });

  const targetEmployee = allEmployees?.find((e: any) => e.id === employeeId);

  // set initial role once loaded
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && targetEmployee?.role && !initialized) {
    setRole(targetEmployee.role);
    setInitialized(true);
  }

  const assignMutation = useMutation({
    mutationFn: () => adminApi.changeUserRole(employeeId, role),
    onSuccess: () => {
      toast.success('System Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['analytics', 'employees', 'overview'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to change role');
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-xl border overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-bold">Change System Role</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 rounded-md transition">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isLoading ? (
             <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div></div>
          ) : (
            <>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-sm">
                <span className="text-zinc-500">Updating privileges for: </span>
                <span className="font-semibold text-zinc-900">{targetEmployee?.fullname}</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select User Role</label>
                <select 
                  className="w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="EMPLOYEE">Employee (Base Access)</option>
                  <option value="MANAGER">Manager (Team Access)</option>
                  <option value="HR">HR (Organization & Projects)</option>
                  <option value="ADMIN">Admin (Full System Config)</option>
                </select>
                <p className="text-xs text-zinc-500 mt-2">
                  Warning: Giving administrative privileges allows this user to modify critical system details and access all records.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending || role === targetEmployee?.role}
                  className="px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white hover:opacity-90 text-sm font-medium rounded-md transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
