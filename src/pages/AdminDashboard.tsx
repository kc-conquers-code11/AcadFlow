import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, RefreshCcw, LayoutDashboard, Users, Ticket } from 'lucide-react'; // Added Ticket Icon
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import Components
import { AdminStats } from '@/components/admin/AdminStats';
import { UserManagement } from '@/components/admin/UserManagement';
import { GlobalAssignments } from '@/components/admin/GlobalAssignments';
import { SupportTickets } from '@/components/admin/SupportTickets'; // Import New Component

const ADMIN_EMAILS = ['admin@acadflow.in', 'admin@pvppcoe.ac.in'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'tickets'>('users'); // Added 'tickets' type
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({ students: 0, teachers: 0, assignments: 0, submissions: 0, tickets: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]); // New State

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Parallel Data Fetching
      const [s, t, a, sub, tick] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('assignments').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).neq('status', 'resolved') // Count open tickets
      ]);

      setStats({
        students: s.count || 0,
        teachers: t.count || 0,
        assignments: a.count || 0,
        submissions: sub.count || 0,
        tickets: tick.count || 0 // New Stat
      });

      // 2. Fetch Users
      const { data: uData } = await supabase.from('profiles').select('*').order('name');
      setUsersList(uData || []);

      // 3. Fetch Assignments
      const { data: aData } = await supabase
        .from('assignments')
        .select('*, profiles:created_by(name), subjects:subject_id(name, code)')
        .order('created_at', { ascending: false });
      setAssignments(aData || []);

      // 4. Fetch Tickets (New Logic)
      const { data: tData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      setTickets(tData || []);

    } catch (err) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in">
      <ShieldAlert size={64} className="text-destructive animate-bounce" />
      <h1 className="text-2xl font-bold">Unauthorized Access</h1>
      <p className="text-muted-foreground">Bhai, ye area sirf Admins ke liye hai!</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-3 py-1">
               <ShieldAlert size={12} /> System Admin
             </Badge>
             <span className="text-xs font-mono text-muted-foreground">{user?.email}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">MASTER Console</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage the entire ecosystem from one place.</p>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} title="Refresh Data">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
           </Button>
           
           <div className="h-9 w-px bg-border mx-2 hidden md:block"></div>
           
           <Button 
             variant={activeTab === 'users' ? 'default' : 'outline'} 
             onClick={() => setActiveTab('users')}
             className="gap-2"
           >
             <Users size={16} /> Users
           </Button>
           
           <Button 
             variant={activeTab === 'assignments' ? 'default' : 'outline'} 
             onClick={() => setActiveTab('assignments')}
             className="gap-2"
           >
             <LayoutDashboard size={16} /> Assignments
           </Button>

           <Button 
             variant={activeTab === 'tickets' ? 'default' : 'outline'} 
             onClick={() => setActiveTab('tickets')}
             className="gap-2 relative"
           >
             <Ticket size={16} /> Support
             {stats.tickets > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                    {stats.tickets}
                </span>
             )}
           </Button>
        </div>
      </header>

      {/* 2. Dynamic Stats Component */}
      <AdminStats stats={stats} />

      {/* 3. Dynamic Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'users' && (
          <UserManagement users={usersList} refreshData={fetchData} loading={loading} />
        )}
        {activeTab === 'assignments' && (
          <GlobalAssignments assignments={assignments} />
        )}
        {activeTab === 'tickets' && (
          <SupportTickets tickets={tickets} refreshData={fetchData} />
        )}
      </div>
    </div>
  );
}