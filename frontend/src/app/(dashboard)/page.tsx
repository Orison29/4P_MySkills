'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardIndexPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      if (user.role === 'HR') router.push('/hr');
      else if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'MANAGER') router.push('/manager');
      else if (user.role === 'EMPLOYEE') router.push('/employee');
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !user) return null;

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
