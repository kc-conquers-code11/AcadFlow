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
  User,
  ExternalLink,
  LifeBuoy, // Added Icon
  ShieldCheck // Added Icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // --- 1. FUNCTIONAL SEARCH LOGIC ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // --- 2. DYNAMIC BREADCRUMBS LOGIC ---
  const getPageTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    
    if (!lastPart || lastPart === 'dashboard') return 'Overview';
    
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lastPart);
    if (isId || lastPart.length > 25) return 'Details View';
    
    return lastPart
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Role Badge Colors
  const roleColors: Record<string, string> = {
    student: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300',
    teacher: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300',
    hod: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300',
  };

  const displayName = profile?.name || user.email?.split('@')[0] || 'User';
  const displayRole = profile?.role || 'student';

  const handleLogout = async () => {
    try {
        await logout();
        toast.success("Logged out successfully");
        navigate('/login');
    } catch (error) {
        toast.error("Error logging out");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-md backdrop-saturate-150 px-6 flex items-center gap-4 transition-all supports-[backdrop-filter]:bg-background/60">

      {/* Left Area: Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground" />

        <div className="h-4 w-px bg-border mx-1 hidden md:block" />

        <div className="hidden md:flex items-center text-sm text-muted-foreground">
          <span className="hover:text-foreground transition-colors cursor-pointer font-medium" onClick={() => navigate('/dashboard')}>
            Academics
          </span>
          <Slash className="mx-2 text-muted-foreground/50" size={14} />
          <span className="font-semibold text-foreground">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Middle Area: Search Bar (Functional) */}
      <form onSubmit={handleSearch} className="hidden md:flex relative max-w-xs w-full mr-4 group">
        <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors cursor-pointer" 
            size={16} 
            onClick={handleSearch}
        />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full pl-9 pr-4 rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-ring focus:ring-4 focus:ring-ring/10 transition-all text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-2">

        {/* --- NEW: Quick Links (Visible on Desktop) --- */}
        <div className="hidden md:flex items-center gap-1 mr-2">
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary h-9 px-3"
                onClick={() => navigate('/support')}
            >
                <LifeBuoy size={16} className="mr-2" />
                Support
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-primary h-9 px-3"
                onClick={() => navigate('/privacy')}
            >
                <ShieldCheck size={16} className="mr-2" />
                Privacy
            </Button>
        </div>
        
        <div className="h-5 w-px bg-border mx-1 hidden md:block" />

        {/* Notifications */}
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full relative"
            onClick={() => navigate('/dashboard/notifications')}
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-background shadow-sm ml-1 hover:bg-muted p-0">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                   <p className="text-sm font-bold leading-none text-foreground">{displayName}</p>
                   <Badge variant="outline" className={`text-[10px] h-5 px-1.5 capitalize font-bold ${roleColors[displayRole]}`}>
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
              className="cursor-pointer text-xs font-medium py-2.5 rounded-md"
              onClick={() => navigate('/settings')}
            >
              <User className="mr-2 h-4 w-4 text-slate-500" />
              My Profile
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="cursor-pointer text-xs font-medium py-2.5 rounded-md md:hidden" 
              onClick={() => navigate('/support')}
            >
              <ExternalLink className="mr-2 h-4 w-4 text-slate-500" />
              Help & Support
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="cursor-pointer text-xs font-medium py-2.5 rounded-md md:hidden" 
              onClick={() => navigate('/privacy')}
            >
               <ShieldCheck className="mr-2 h-4 w-4 text-slate-500" />
               Privacy Policy
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-bold py-2.5 rounded-md"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}