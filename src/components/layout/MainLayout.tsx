import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
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

        {/* Sticky Header */}
        <AppHeader />

        {/* Dynamic Content */}
        <main className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto z-10 relative">
          {/* Outlet renders the child route (Dashboard, Settings, etc.) */}
          {children || <Outlet />}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}