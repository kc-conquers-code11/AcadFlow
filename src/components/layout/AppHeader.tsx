import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Bell,
  Search,
  Slash,
  Settings,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  // Fetch Real Profile Data
  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  if (!user) return null;

  // Helper to make breadcrumbs readable
  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    
    if (!lastPart || lastPart === 'dashboard') return 'Overview';
    
    // If it's an ID (UUID), show 'Details'
    if (lastPart.length > 20) return 'Details';
    
    // Capitalize
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  // Role Badge Colors
  const roleColors: Record<string, string> = {
    student: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    teacher: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    hod: 'bg-amber-50 text-amber-700 border-amber-100',
  };

  const displayName = profile?.name || user.email?.split('@')[0] || 'User';
  const displayRole = profile?.role || 'student';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-md backdrop-saturate-150 px-6 flex items-center gap-4 transition-all supports-[backdrop-filter]:bg-background/60">

      {/* 1. Left: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground" />

        {/* Breadcrumb Separator */}
        <div className="h-4 w-px bg-border mx-1 hidden md:block" />

        <div className="hidden md:flex items-center text-sm text-muted-foreground">
          <span className="hover:text-foreground transition-colors cursor-default font-medium">Academics</span>
          <Slash className="mx-2 text-muted-foreground/50" size={14} />
          <span className="font-semibold text-foreground">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* 2. Middle: Search (UI Only for now) */}
      <div className="hidden md:flex relative max-w-xs w-full mr-4 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-full pl-9 pr-4 rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-ring focus:ring-4 focus:ring-ring/10 transition-all text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* 3. Right: User Actions */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full relative">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-background shadow-sm ml-1 hover:bg-muted">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} alt={displayName} />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56 p-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                   <p className="text-sm font-bold leading-none text-foreground">{displayName}</p>
                   <Badge variant="outline" className={`text-[10px] h-5 px-1.5 capitalize ${roleColors[displayRole] || 'bg-slate-100'}`}>
                      {displayRole}
                   </Badge>
                </div>
                <p className="text-xs leading-none text-muted-foreground font-medium truncate">
                  {profile?.email || user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="cursor-pointer text-xs font-medium py-2"
              onClick={() => navigate('/dashboard/settings')}
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
              Account Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="cursor-pointer text-xs font-medium py-2"
              onClick={() => navigate('/dashboard/profile')} // Optional: if you have a public profile page
            >
              <User className="mr-2 h-3.5 w-3.5 text-slate-500" />
              Public Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-medium py-2"
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