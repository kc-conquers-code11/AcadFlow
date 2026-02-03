import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Upload, 
  BarChart3, 
  Settings,
  Users,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Define the structure for Nav Items
interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: ('student' | 'teacher' | 'hod')[];
}

// Base nav items. "Subjects" vs "Batches" is resolved per role below.
const baseNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'hod'] },
  { title: 'Assignments', url: '/assignments', icon: FileText, roles: ['student', 'teacher', 'hod'] },
  { title: 'Submissions', url: '/submissions', icon: Upload, roles: ['teacher', 'hod'] },
  { title: 'Reports', url: '/reports', icon: BarChart3, roles: ['teacher', 'hod'] },
  { title: 'Users', url: '/users', icon: Users, roles: ['hod'] },
];

const subjectsItem: NavItem = { title: 'Subjects', url: '/subjects', icon: BookOpen, roles: ['student', 'hod'] };
const batchesItem: NavItem = { title: 'Batches', url: '/batches', icon: BookOpen, roles: ['teacher'] };

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Teachers see "Batches" (→ /batches); students and HoD see "Subjects" (→ /subjects).
  const secondNavItem = user.role === 'teacher' ? batchesItem : subjectsItem;
  const navItems: NavItem[] = [
    baseNavItems[0], // Dashboard
    secondNavItem,
    ...baseNavItems.slice(1), // Assignments, Submissions, Reports, Users
  ];
  const filteredItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-slate-50/50">
      
      {/* 1. HEADER: Brand Identity */}
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-slate-200/60 px-4">
        <div className="flex items-center gap-3 w-full overflow-hidden transition-all group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-slate-800 text-sm">AcadFlow</span>
            <span className="text-[10px] text-slate-500 font-medium">Computer Engg.</span>
          </div>
        </div>
      </SidebarHeader>

      {/* 2. CONTENT: Navigation Links */}
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            Workspace
          </div>
          
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "h-10 transition-all duration-200 mb-1",
                    isActive 
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200 font-medium" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  <Link to={item.url}>
                    <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <SidebarSeparator className="my-4 bg-slate-200/60" />

        {/* System / Settings Group */}
        <SidebarMenu>
          <div className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            System
          </div>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Settings" 
              className={cn(
                "h-10 transition-all duration-200",
                location.pathname === '/settings' 
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200 font-medium" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              <Link to="/settings">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* 3. FOOTER: User & Logout */}
      <SidebarFooter className="border-t border-slate-200/60 bg-white/50 p-2">
        {!user ? null : (
          <div className="flex flex-col gap-2">
            {/* User Info (Hidden when collapsed) */}
            <div className="hidden group-data-[collapsible=icon]:hidden px-2 py-1.5">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}