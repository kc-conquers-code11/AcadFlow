import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    admin: 'God Console',
    users: 'User Management',
    batches: 'Batches',
    assignments: 'Assignments',
    submissions: 'Submissions',
    reports: 'Analytics',
    settings: 'Settings',
    subjects: 'Subjects',
    support: 'Support Center'
  };

  return (
    // REMOVED 'mb-4' and ensured flex alignment
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center h-full">
      <ol className="flex items-center space-x-2">
        <li>
          <Link 
            to="/dashboard" 
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home size={14} />
          </Link>
        </li>
        
        {pathnames.length > 0 && (
          <li>
            <ChevronRight size={14} className="text-muted-foreground/50" />
          </li>
        )}

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          let displayName = routeNameMap[value] || value;
          if (value.length > 20) displayName = 'Details'; 
          if (!isNaN(Number(value))) displayName = `ID: ${value}`;

          return (
            <li key={to} className="flex items-center space-x-2">
              {isLast ? (
                <span className="text-sm font-semibold text-foreground capitalize px-2 py-0.5 rounded-md bg-muted/50 border border-border/50">
                  {displayName}
                </span>
              ) : (
                <>
                  <Link 
                    to={to} 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors capitalize"
                  >
                    {displayName}
                  </Link>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}