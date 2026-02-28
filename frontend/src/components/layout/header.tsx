'use client';

import { useAuthStore } from '@/store/authStore';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, profile, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted) return <header className="h-16 border-b bg-white flex items-center px-4 md:px-6" />;

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-6 shadow-sm z-10 hidden md:flex">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-zinc-100 :bg-zinc-800 transition-colors">
          <Bell className="w-5 h-5 text-zinc-600 " />
        </button>
        
        <div className="flex items-center gap-3 border-l pl-4 ml-2">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium">{profile?.fullname || 'User'}</span>
            <span className="text-xs text-zinc-500 capitalize">{user?.role.toLowerCase()}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            {profile?.fullname?.charAt(0) || <UserIcon className="w-5 h-5" />}
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 :bg-red-950/30 rounded-full transition-colors ml-2"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
