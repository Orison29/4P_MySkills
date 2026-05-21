'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';
import { managersApi, ManagerIngestSummary } from '@/api/managers.api';
import { Users, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function HREmployeesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'ALL' | 'MANAGERS' | 'EMPLOYEES' | 'DEPARTMENTS'>('ALL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<ManagerIngestSummary | null>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['analytics', 'employees', 'overview'],
    queryFn: analyticsApi.getEmployeesOverview,
  });

  const ingestMutation = useMutation({
    mutationFn: (file: File) => managersApi.ingestManagers(file),
    onSuccess: (summary) => {
      setUploadSummary(summary);
      queryClient.invalidateQueries({ queryKey: ['analytics', 'employees', 'overview'] });
      toast.success('Managers uploaded successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || 'Failed to upload managers';
      toast.error(msg);
    },
  });

  const handleFileChange = async (file: File | null) => {
    setUploadSummary(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only .csv files are allowed');
      setSelectedFile(null);
      return;
    }

    try {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] || '';
      const normalized = firstLine
        .split(',')
        .map((cell) => cell.trim().toLowerCase())
        .join(',');

      if (normalized !== 'managername,department') {
        toast.error('Invalid CSV header. Expected: managerName, department');
        setSelectedFile(null);
        return;
      }
    } catch {
      toast.error('Could not read the file. Please try again.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please choose a CSV file first');
      return;
    }
    ingestMutation.mutate(selectedFile);
  };

  const handleDownload = () => {
    if (!uploadSummary || uploadSummary.managers.length === 0) {
      toast.error('No managers to download yet');
      return;
    }

    const rows = [
      ['name', 'email', 'department'],
      ...uploadSummary.managers.map((manager) => [manager.name, manager.email, manager.department]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'managers-created.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = (emp: any) => {
      if (!term) return true;
      const dept = emp.department || '';
      return (
        (emp.fullname || '').toLowerCase().includes(term) ||
        (dept || '').toLowerCase().includes(term)
      );
    };

    if (category === 'MANAGERS') {
      return employees.filter((emp) => emp.role === 'MANAGER' && matchesSearch(emp));
    }

    if (category === 'EMPLOYEES') {
      return employees.filter((emp) => emp.role === 'EMPLOYEE' && matchesSearch(emp));
    }

    // ALL: include managers and employees
    return employees.filter((emp) => (emp.role === 'EMPLOYEE' || emp.role === 'MANAGER') && matchesSearch(emp));
  }, [employees, searchTerm, category]);

  const departments = useMemo(() => {
    if (!employees) return [];
    const map = new Map<string, number>();
    employees.forEach((emp) => {
      const dept = emp.department || 'Unassigned';
      map.set(dept, (map.get(dept) || 0) + 1);
    });
    return Array.from(map.entries()).map(([department, count]) => ({ department, count }));
  }, [employees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees Overview</h1>
          <p className="text-muted-foreground mt-1">View employee skills, assignments, and analytics.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Upload Managers CSV</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Upload a CSV with two columns: managerName, department. New departments are created automatically.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <label className="block text-sm font-medium">CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-zinc-500">Required header: managerName, department</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || ingestMutation.isPending}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {ingestMutation.isPending ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>

        {uploadSummary && (
          <div className="rounded-lg border bg-zinc-50 p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-zinc-500">Processed</p>
                <p className="font-semibold text-zinc-900">{uploadSummary.processed}</p>
              </div>
              <div>
                <p className="text-zinc-500">Departments Created</p>
                <p className="font-semibold text-emerald-700">{uploadSummary.departmentsCreated}</p>
              </div>
              <div>
                <p className="text-zinc-500">Managers Created</p>
                <p className="font-semibold text-emerald-700">{uploadSummary.managersCreated}</p>
              </div>
              <div>
                <p className="text-zinc-500">Failed</p>
                <p className="font-semibold text-red-600">{uploadSummary.failed}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className="text-zinc-500">Download the created manager emails for sharing</p>
              <button
                onClick={handleDownload}
                className="h-8 px-3 rounded-md border bg-white hover:bg-zinc-50 transition"
              >
                Download CSV
              </button>
            </div>

            {uploadSummary.managers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">Created Managers</p>
                <div className="max-h-48 overflow-auto rounded-md border bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadSummary.managers.map((manager, index) => (
                        <tr key={`${manager.email}-${index}`} className="border-t">
                          <td className="px-3 py-2">{manager.name}</td>
                          <td className="px-3 py-2">{manager.email}</td>
                          <td className="px-3 py-2">{manager.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploadSummary.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-2">Errors</p>
                <div className="max-h-40 overflow-auto rounded-md border bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="text-left px-3 py-2">Row</th>
                        <th className="text-left px-3 py-2">Field</th>
                        <th className="text-left px-3 py-2">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadSummary.errors.map((error, index) => (
                        <tr key={`${error.row}-${index}`} className="border-t">
                          <td className="px-3 py-2">{error.row}</td>
                          <td className="px-3 py-2">{error.field}</td>
                          <td className="px-3 py-2 text-red-600">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search employees or departments..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md bg-zinc-50 p-1">
            <button
              onClick={() => setCategory('ALL')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${category === 'ALL' ? 'bg-white shadow-sm' : 'text-zinc-600'}`}
            >All</button>
            <button
              onClick={() => setCategory('MANAGERS')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${category === 'MANAGERS' ? 'bg-white shadow-sm' : 'text-zinc-600'}`}
            >Managers</button>
            <button
              onClick={() => setCategory('EMPLOYEES')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${category === 'EMPLOYEES' ? 'bg-white shadow-sm' : 'text-zinc-600'}`}
            >Employees</button>
            <button
              onClick={() => setCategory('DEPARTMENTS')}
              className={`px-3 py-1 text-sm font-medium rounded-md ${category === 'DEPARTMENTS' ? 'bg-white shadow-sm' : 'text-zinc-600'}`}
            >Departments</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-zinc-50 :bg-zinc-900 transition bg-white ">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : category === 'DEPARTMENTS' ? (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Headcount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {departments.map((d) => (
                  <tr key={d.department} className="hover:bg-zinc-50 :bg-zinc-900/50 transition">
                    <td className="px-6 py-4 font-medium">{d.department}</td>
                    <td className="px-6 py-4 text-zinc-500">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <td className="px-6 py-4 text-zinc-500">{emp.department || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      {emp.role === 'MANAGER' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 ">—</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 ">
                          {emp.totalSkills || 0} skills
                        </span>
                      )}
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
