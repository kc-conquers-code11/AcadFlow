import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Breadcrumbs } from './Breadcrumbs'; // Import the new component
import { Outlet } from 'react-router-dom';

interface MainLayoutProps {
  children?: ReactNode;
}

// Global Engineering Grid Pattern
const GlobalGridPattern = () => (
  <div className="absolute inset-0 z-0 pointer-events-none h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.4]" />
);

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      {/* 1. Navigation Rail */}
      <AppSidebar />

      {/* 2. Main Content Area */}
      <SidebarInset className="relative flex flex-col min-h-screen overflow-hidden transition-all duration-300">

        {/* Background Layer */}
        <GlobalGridPattern />

        {/* 3. Pro Header (Trigger + Breadcrumbs) */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 bg-background/60 backdrop-blur-md sticky top-0 z-20">
          <SidebarTrigger className="-ml-1" />
          <div className="mr-2 h-4 w-px bg-border" /> {/* Vertical Separator */}
          <Breadcrumbs />
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto z-10 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Outlet renders the child route (Dashboard, Settings, etc.) */}
          {children || <Outlet />}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}