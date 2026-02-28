'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { useAuthStore } from '@/store/authStore';

export default function EmployeeDashboard() {
  const { profile } = useAuthStore();
  
  return (
    <RoleGuard allowedRoles={['EMPLOYEE']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {profile?.fullname}. View your skills and assignments.
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
