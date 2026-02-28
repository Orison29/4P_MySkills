'use client';

import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function RoleGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: Role[] }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, allowedRoles, router, mounted]);

  if (!mounted) {
    return null; // Prevent hydration errors
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
