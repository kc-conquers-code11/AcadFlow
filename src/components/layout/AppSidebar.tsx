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
  UserCog,
  Search,
  User,
  LifeBuoy, // Icon for Support
  Shield    // Icon for Privacy
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

// 1. Workspace Items
const dashboardItem: NavItem = { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] };

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
  { title: 'God Console', url: '/admin', icon: ShieldCheck, roles: ['admin'] },
  { title: 'Users', url: '/users', icon: UserCog, roles: ['admin'] },
  { title: 'Global Reports', url: '/reports', icon: BarChart3, roles: ['admin'] },
];

// 3. System Items (Settings, Support, Privacy)
const systemItems: NavItem[] = [
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['student', 'teacher', 'admin'] },
  { title: 'Support', url: '/support', icon: LifeBuoy, roles: ['student', 'teacher', 'admin'] },
  { title: 'Privacy Policy', url: '/privacy', icon: Shield, roles: ['student', 'teacher', 'admin'] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  if (!user) return null;

  // Resolve Workspace Items
  let workspaceItems: NavItem[] = [dashboardItem];
  if (user.role === 'student') {
    workspaceItems = [...workspaceItems, ...studentItems];
  } else if (user.role === 'teacher') {
    workspaceItems = [...workspaceItems, ...teacherItems];
  } else if (user.role === 'admin') {
    workspaceItems = [...workspaceItems, ...adminItems];
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">

      {/* HEADER */}
      <SidebarHeader className="h-14 flex items-center justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-2 w-full overflow-hidden transition-all group-data-[collapsible=icon]:justify-center">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-8 w-8 object-contain shrink-0"
          />
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg tracking-tight font-display">
              <span className="text-primary">Acad</span>
              <span className="text-sidebar-foreground">Flow</span>
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="px-2 py-4">

        {/* SEARCH BUTTON */}
        <div className="px-2 mb-4 group-data-[collapsible=icon]:hidden">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground bg-sidebar-accent/30 border-sidebar-border shadow-sm px-3 relative hover:bg-sidebar-accent hover:text-foreground transition-all"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <span className="text-sm">Search...</span>
            <kbd className="pointer-events-none absolute right-2 top-2.5 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* WORKSPACE MENU */}
        <SidebarMenu>
          <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            Workspace
          </div>

          {workspaceItems.map((item) => {
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

        {/* SYSTEM MENU (Settings, Support, Privacy) */}
        <SidebarMenu>
          <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            System
          </div>

          {systemItems.map((item) => {
            const isActive = location.pathname === item.url;
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
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            // Calculate the maximum radius needed to cover the entire screen
            const maxRadius = Math.hypot(
              Math.max(x, window.innerWidth - x),
              Math.max(y, window.innerHeight - y)
            );

            // Set CSS custom properties for the animation origin
            document.documentElement.style.setProperty('--theme-x', `${x}px`);
            document.documentElement.style.setProperty('--theme-y', `${y}px`);
            document.documentElement.style.setProperty('--theme-r', `${maxRadius}px`);

            if (document.startViewTransition) {
              document.startViewTransition(() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
              });
            } else {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }
          }}
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent mb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="ml-2 group-data-[collapsible=icon]:hidden">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </Button>

        {user && (
          <div className="mt-2 border-t border-sidebar-border/50 pt-2 flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-col">

            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">
              {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </div>

            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold text-foreground truncate leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{user.role}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:hidden ml-auto"
              onClick={logout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}