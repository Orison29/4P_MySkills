'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import { Users, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function HREmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['analytics', 'employees', 'overview'],
    queryFn: analyticsApi.getEmployeesOverview,
  });

  const filteredEmployees = employees?.filter(emp => 
    (emp.role === 'EMPLOYEE' || emp.role === 'MANAGER') &&
    (emp.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees Overview</h1>
          <p className="text-muted-foreground mt-1">View employee skills, assignments, and analytics.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-zinc-50 :bg-zinc-900 transition bg-white ">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEmployees?.length === 0 ? (
        <div className="text-center p-12 bg-white border rounded-xl shadow-sm">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 ">No employees found</h3>
          <p className="text-zinc-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Total Skills</th>
                  <th className="px-6 py-4">Pending Reviews</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-50 :bg-zinc-900/50 transition">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                        {emp.fullname.substring(0, 2)}
                      </div>
                      {emp.fullname}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{emp.department?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 ">
                        {emp.totalSkills || 0} skills
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.pendingSkills > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ">
                          {emp.pendingSkills} pending
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs text-center block w-10">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/hr/employees/${emp.id}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm transition"
                      >
                        View Profile
                      </Link>
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
