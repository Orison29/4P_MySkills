'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck, Users, Database, LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuthStore();
  
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, Administrator {profile?.fullname}. Full system access granted.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-primary transition group">
            <LayoutDashboard className="w-8 h-8 text-zinc-400 group-hover:text-primary transition" />
            <h3 className="font-medium text-zinc-900">System Overview</h3>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-primary transition group">
            <Users className="w-8 h-8 text-zinc-400 group-hover:text-primary transition" />
            <h3 className="font-medium text-zinc-900">Manage Users</h3>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-primary transition group">
            <ShieldCheck className="w-8 h-8 text-zinc-400 group-hover:text-primary transition" />
            <h3 className="font-medium text-zinc-900">Security Logs</h3>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-primary transition group">
            <Database className="w-8 h-8 text-zinc-400 group-hover:text-primary transition" />
            <h3 className="font-medium text-zinc-900">Database Options</h3>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
