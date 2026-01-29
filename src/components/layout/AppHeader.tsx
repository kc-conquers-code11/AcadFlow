import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/types';

export function AppHeader() {
  const { user, switchRole } = useAuth();

  if (!user) return null;

  const roleColors: Record<UserRole, string> = {
    student: 'bg-primary/10 text-primary',
    teacher: 'bg-success/10 text-success',
    hod: 'bg-warning/10 text-warning',
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-4">
      <SidebarTrigger />
      
      <div className="flex-1" />

      {/* Demo role switcher */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Demo:</span>
        <Select value={user.role} onValueChange={(value: UserRole) => switchRole(value)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="hod">HoD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Badge variant="outline" className={roleColors[user.role]}>
        {user.role.toUpperCase()}
      </Badge>
    </header>
  );
}
