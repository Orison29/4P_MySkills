'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isPublicAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && !isPublicAuthRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isPublicAuthRoute, router, mounted]);

  if (!mounted) {
    return null; // Prevent hydration errors
  }

  if (!isAuthenticated && !isPublicAuthRoute) {
    return null;
  }

  return <>{children}</>;
}
