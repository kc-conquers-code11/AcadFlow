import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Check, 
  ChevronsUpDown, 
  LogOut, 
  Bell, 
  Search, 
  Slash 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Helper to make breadcrumbs readable
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path || path === 'dashboard') return 'Overview';
    // Capitalize first letter
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const roleStyles: Record<UserRole, string> = {
    student: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100',
    teacher: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
    hod: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-md backdrop-saturate-150 px-6 flex items-center gap-4 transition-all supports-[backdrop-filter]:bg-white/60">
      
      {/* 1. Left: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-slate-500 hover:bg-slate-100 hover:text-slate-900" />
        
        {/* Breadcrumb Separator */}
        <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block" />

        <div className="hidden md:flex items-center text-sm text-slate-500">
          <span className="hover:text-slate-800 transition-colors cursor-default font-medium">Academics</span>
          <Slash className="mx-2 text-slate-300" size={14} />
          <span className="font-semibold text-slate-900">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* 2. Middle: Search (Hidden on mobile) */}
      <div className="hidden md:flex relative max-w-xs w-full mr-4 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="Search subjects..." 
          className="h-9 w-full pl-9 pr-4 rounded-full bg-slate-100/50 border border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* 3. Right: User Actions */}
      <div className="flex items-center gap-3">
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full relative">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

      

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-white shadow-sm ml-1 hover:bg-slate-100">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-slate-900">{user.name}</p>
                <p className="text-xs leading-none text-slate-500 font-medium">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs font-medium py-2">
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 text-xs font-medium py-2" 
              onClick={logout}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}