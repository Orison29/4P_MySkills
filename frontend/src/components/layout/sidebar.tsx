'use client';

import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { 
  Briefcase, 
  Users, 
  Star, 
  BarChart, 
  CheckSquare,
  FileText,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
// Assuming clsx and tailwind-merge are used for cn (needs lib/utils to be created next)

type NavLink = {
  title: string;
  href: string;
  icon: React.ElementType;
};

const RoleLinks: Record<Role, NavLink[]> = {
  EMPLOYEE: [
    { title: 'Dashboard', href: '/employee', icon: LayoutDashboard },
    { title: 'My Skills', href: '/employee/skills', icon: Star },
    { title: 'My Assignments', href: '/employee/assignments', icon: Briefcase },
  ],
  MANAGER: [
    { title: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    { title: 'My Team', href: '/manager/team', icon: Users },
    { title: 'Pending Reviews', href: '/manager/reviews', icon: CheckSquare },
    { title: 'Assignment Requests', href: '/manager/requests', icon: FileText },
  ],
  HR: [
    { title: 'Dashboard', href: '/hr', icon: LayoutDashboard },
    { title: 'Projects', href: '/hr/projects', icon: Briefcase },
    { title: 'Employees', href: '/hr/employees', icon: Users },
    { title: 'Skills Catalog', href: '/hr/skills', icon: Star },
    { title: 'Analytics', href: '/hr/analytics', icon: BarChart },
  ],
  ADMIN: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Manage Users', href: '/admin/users', icon: Users },
    { title: 'Departments', href: '/admin/departments', icon: Briefcase },
  ]
};

export function Sidebar({ className }: { className?: string }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return (
      <aside className={cn("bg-white border-r border-zinc-200 ", className)}>
         <div className="p-6">
          <div className="h-8 w-32 bg-zinc-200 animate-pulse rounded"></div>
         </div>
      </aside>
    );
  }

  const links = RoleLinks[user.role] || [];

  return (
    <aside className={cn("flex flex-col bg-white border-r border-zinc-200 ", className)}>
      <div className="p-6 border-b border-zinc-200 ">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center text-lg">
            4P
          </div>
          MySkills
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-zinc-100 text-zinc-900 " 
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 :text-zinc-50 :bg-zinc-900/50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "")} />
              {link.title}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-zinc-200 text-xs text-zinc-500 flex items-center justify-center">
        4P System v1.0 • {user.role}
      </div>
    </aside>
  );
}
