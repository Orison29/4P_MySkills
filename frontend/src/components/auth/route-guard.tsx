'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && !pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, mounted]);

  if (!mounted) {
    return null; // Prevent hydration errors
  }

  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return null;
  }

  return <>{children}</>;
}
