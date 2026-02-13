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
  Sun,
  Moon,
  Layers,
  ShieldCheck,
  UserCog
} from 'lucide-react';
import { useTheme } from 'next-themes';
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

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: ('student' | 'teacher' | 'admin')[];
}

// 1. Shared Items
const dashboardItem: NavItem = { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] };
const settingsItem: NavItem = { title: 'Settings', url: '/settings', icon: Settings, roles: ['student', 'teacher', 'admin'] };

// 2. Role Specific Items
const studentItems: NavItem[] = [
  { title: 'Batches', url: '/batches', icon: Layers, roles: ['student'] },
  { title: 'Assignments', url: '/assignments', icon: FileText, roles: ['student'] },
];

const teacherItems: NavItem[] = [
  { title: 'Batches', url: '/batches', icon: Layers, roles: ['teacher'] },
  { title: 'Assignments', url: '/assignments', icon: FileText, roles: ['teacher'] },
  { title: 'Submissions', url: '/submissions', icon: Upload, roles: ['teacher'] },
  { title: 'Reports', url: '/reports', icon: BarChart3, roles: ['teacher'] },
];

const adminItems: NavItem[] = [
  { title: 'Master Console', url: '/admin', icon: ShieldCheck, roles: ['admin'] },
  // { title: 'Users', url: '/users', icon: UserCog, roles: ['admin'] },
  { title: 'Global Reports', url: '/reports', icon: BarChart3, roles: ['admin'] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  if (!user) return null;

  // Resolve Nav Items based on Role
  let navItems: NavItem[] = [dashboardItem];

  if (user.role === 'student') {
    navItems = [...navItems, ...studentItems];
  } else if (user.role === 'teacher') {
    navItems = [...navItems, ...teacherItems];
  } else if (user.role === 'admin') {
    // Admin ko dashboard item bhi dikhega, plus admin items
    navItems = [...navItems, ...adminItems];
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">

      {/* 1. HEADER */}
      <SidebarHeader className="h-24 flex items-center justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-0 w-full overflow-hidden transition-all group-data-[collapsible=icon]:justify-center">
          <img
            src="/images/logo.png"
            alt="AcadFlow"
            className="h-20 w-auto object-contain shrink-0 transition-all group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10"
          />
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-2xl tracking-tight font-display">
              <span className="text-primary">Acad</span>
              <span className="text-sidebar-foreground">Flow</span>
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* 2. CONTENT */}
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            Workspace
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "h-10 transition-all duration-200 mb-1",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border font-medium"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Link to={item.url}>
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <SidebarSeparator className="my-4 bg-sidebar-border" />

        {/* System Settings */}
        <SidebarMenu>
          <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            System
          </div>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className={cn(
                "h-10 transition-all duration-200",
                location.pathname === '/settings'
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border font-medium"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Link to="/settings">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* 3. FOOTER */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent mb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="ml-2 group-data-[collapsible=icon]:hidden">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </Button>

        {user && (
          <div className="flex flex-col gap-2">
            <div className="hidden group-data-[collapsible=icon]:hidden px-2 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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