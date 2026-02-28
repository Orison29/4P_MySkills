'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import { LineChart, LayoutDashboard, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function HRAnalyticsPage() {
  const { data: employees, isLoading } = useQuery({
    queryKey: ['analytics', 'employees', 'overview'],
    queryFn: analyticsApi.getEmployeesOverview,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Organization-wide skill insights and tracking.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Dash stat cards */}
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <LayoutDashboard className="w-5 h-5" />
            <h3 className="font-semibold text-zinc-700 ">Total Employees</h3>
          </div>
          <p className="text-3xl font-bold">{isLoading ? '-' : employees?.length || 0}</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-3 text-blue-500 mb-2">
            <LineChart className="w-5 h-5" />
            <h3 className="font-semibold text-zinc-700 ">Skill Progression</h3>
          </div>
          <div className="mt-4">
            <p className="text-sm text-zinc-500 mb-2">Select an employee to view their detailed skill timeline.</p>
            <Link 
              href="/hr/employees"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 :text-blue-300 transition flex items-center gap-1"
            >
              Browse Employees &rarr;
            </Link>
          </div>
        </div>
      </div>
      
      {/* Placeholder for complex charts if we add a charting library later */}
      <div className="bg-white border rounded-xl shadow-sm p-6 mt-6 min-h-[400px] flex items-center justify-center border-dashed">
         <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <LineChart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">Organization Skill Growth</h3>
          <p className="text-zinc-500 text-sm mb-6">Connect a charting library (like Recharts or Chart.js) to visualize aggregate skill improvements over time.</p>
         </div>
      </div>
    </div>
  );
}
