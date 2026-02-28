'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { X, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';

export function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'EMPLOYEE',
    fullname: '',
    departmentId: '',
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: adminApi.getDepartments,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      // 1. Create the User account
      const user = await adminApi.registerUser({
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      // 2. Create the Employee Profile linked to the User and Department
      await adminApi.createEmployeeProfile({
        userId: user.id,
        fullname: formData.fullname,
        departmentId: formData.departmentId
      });
    },
    onSuccess: () => {
      toast.success('User onboarded successfully');
      queryClient.invalidateQueries({ queryKey: ['analytics', 'employees', 'overview'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to onboard user');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) {
      toast.error('Please select a department');
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-bold">Onboard New User</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 rounded-md transition">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input 
                required
                type="text" 
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="John Doe"
                value={formData.fullname}
                onChange={e => setFormData({...formData, fullname: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Email Address</label>
              <input 
                required
                type="email" 
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="john@company.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Temporary Password</label>
              <input 
                required
                type="password" 
                className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">System Role</label>
                <select 
                  className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Department</label>
                <select 
                  required
                  className="w-full rounded-md border p-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                  value={formData.departmentId}
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                >
                  <option value="">Select Dept</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={registerMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white hover:opacity-90 text-sm font-medium rounded-md transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {registerMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
