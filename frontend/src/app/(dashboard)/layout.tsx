'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { RouteGuard } from '@/components/auth/route-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden bg-zinc-50 ">
        <Sidebar className="w-64 flex-shrink-0 hidden md:flex" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
