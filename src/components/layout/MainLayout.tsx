import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface MainLayoutProps {
  children: ReactNode;
}

// Reusing the engineering grid pattern here so it applies globally
const GlobalGridPattern = () => (
  <div className="absolute inset-0 z-0 pointer-events-none h-full w-full bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />
);

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      {/* 1. The Navigation Rail */}
      <AppSidebar />

      {/* 2. The Main Content Area (Inset handles the collapse logic) */}
      <SidebarInset className="bg-[#F8F9FC] relative flex flex-col min-h-screen overflow-hidden transition-all duration-300">
        
        {/* Background Layer */}
        <GlobalGridPattern />

        {/* Header (Sticky) */}
        <AppHeader />

        {/* Content Container - Centered and constrained for readability */}
        <main className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto z-10 relative">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}