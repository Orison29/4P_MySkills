'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AddEmployeeModal } from '@/components/admin/add-employee-modal';
import { AssignManagerModal } from '@/components/admin/assign-manager-modal';
import { ChangeRoleModal } from '@/components/admin/change-role-modal';
import { adminApi } from '@/api/admin.api';
import { toast } from 'sonner';
import { ShieldCheck, Building, User, Edit3, Search, Filter, UserPlus } from 'lucide-react';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [activeAssignManagerUserId, setActiveAssignManagerUserId] = useState<string | null>(null);
  const [activeChangeRoleUserId, setActiveChangeRoleUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | string>('ALL');
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['analytics', 'employees', 'overview'],
    queryFn: analyticsApi.getEmployeesOverview,
  });

  const departmentOptions = useMemo(() => {
    const values = new Set<string>();
    (employees ?? []).forEach((emp) => {
      values.add(emp.department || 'Unassigned');
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredEmployees = (employees ?? []).filter((emp) => {
    const name = (emp.fullname || '').toLowerCase();
    const department = (emp.department || 'Unassigned').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search) || department.includes(search);
    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchesDepartment = departmentFilter === 'ALL' || (emp.department || 'Unassigned') === departmentFilter;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const deleteMutation = useMutation({
    mutationFn: (employeeId: string) => adminApi.deleteUser(employeeId),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['analytics', 'employees', 'overview'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete user');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground mt-1">Onboard new employees and organize the company structure.</p>
        </div>
        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white px-4 py-2 rounded-md hover:opacity-90 transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Onboard User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium bg-white">
            <Filter className="w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE')}
              className="bg-transparent outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div className="px-3 py-2 border rounded-md text-sm font-medium bg-white">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="ALL">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm">
          <ShieldCheck className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">No users found</h3>
          <p className="text-zinc-500 mt-1">Try adjusting your search criteria or add a new user.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {emp.fullname.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900">{emp.fullname}</div>
                          <div className="text-xs text-zinc-500">{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase
                        ${emp.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 
                         emp.role === 'HR' ? 'bg-purple-100 text-purple-800' :
                         emp.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                         'bg-zinc-100 text-zinc-800'}`}>
                        {emp.role || 'EMPLOYEE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800">
                        <Building className="w-3.5 h-3.5 text-zinc-500" />
                        {emp.department || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200 text-zinc-700 bg-white">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        {emp.manager?.fullname || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-sm font-medium">
                        <button 
                          onClick={() => setActiveChangeRoleUserId(emp.id)}
                          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Role
                        </button>
                        {(!emp.role || emp.role === 'EMPLOYEE') && (
                          <button 
                            onClick={() => setActiveAssignManagerUserId(emp.id)}
                            className="text-primary hover:text-primary/80 transition"
                          >
                            Manager
                          </button>
                        )}
                        <Link 
                          href={`/hr/employees/${emp.id}`}
                          className="text-zinc-500 hover:text-zinc-900 transition"
                        >
                          Skills
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`Delete user ${emp.fullname}? This action cannot be undone.`)) {
                              deleteMutation.mutate(emp.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        >
                          Delete
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

      {isAddUserModalOpen && (
        <AddEmployeeModal onClose={() => setIsAddUserModalOpen(false)} />
      )}
      
      {activeAssignManagerUserId && (
        <AssignManagerModal 
          employeeId={activeAssignManagerUserId} 
          onClose={() => setActiveAssignManagerUserId(null)} 
        />
      )}

      {activeChangeRoleUserId && (
        <ChangeRoleModal 
          employeeId={activeChangeRoleUserId} 
          onClose={() => setActiveChangeRoleUserId(null)} 
        />
      )}
    </div>
  );
}
