import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Beaker
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// --- Visual Assets ---

const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-card backdrop-blur-sm rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold text-foreground mt-2">{value}</h3>
      </div>
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon size={20} />
      </div>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, action, link }: { title: string, action?: string, link?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-foreground">{title}</h2>
    {action && link && (
      <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950" asChild>
        <Link to={link}>{action} <ArrowUpRight size={14} className="ml-1" /></Link>
      </Button>
    )}
  </div>
);

const ActivityItem = ({ title, subtitle, time, status, icon: Icon, colorClass }: any) => (
  <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all">
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 border border-transparent", colorClass)}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate">{title}</p>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
    <div className="text-right">
      {status && (
        <span className={cn(
          "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1",
          status === 'High Risk' 
            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800" 
            : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
        )}>
          {status}
        </span>
      )}
      <p className="text-xs text-muted-foreground font-mono">{time}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalAssignments: 0, // Theory + Practical
    pendingCount: 0,
    submittedCount: 0,
    evaluatedCount: 0
  });

  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'student') {
        // --- STUDENT LOGIC ---

        // 1. Get Profile (to know Batch/Div for practicals)
        const { data: profile } = await supabase.from('profiles').select('batch, division').eq('id', user.id).single();

        // 2. Fetch Theory Assignments (Future Deadlines)
        const { data: theory } = await supabase
          .from('assignments')
          .select('id, title, deadline, subjects(code)')
          .gt('deadline', new Date().toISOString());

        // 3. Fetch Practical Tasks (Future Deadlines)
        let practicals: any[] = [];
        if (profile?.batch && profile?.division) {
          const { data: pracs } = await supabase
            .from('batch_practicals')
            .select('id, title, deadline, experiment_number')
            .eq('batch', profile.batch)
            .eq('division', profile.division)
            .gt('deadline', new Date().toISOString());
          practicals = pracs || [];
        }

        // 4. Merge & Sort Deadlines
        const allDeadlines = [
          ...(theory || []).map((t: any) => ({ ...t, type: 'theory', subtitle: t.subjects?.code })),
          ...(practicals).map((p: any) => ({ ...p, type: 'practical', subtitle: `Exp ${p.experiment_number}` }))
        ].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
         .slice(0, 5);

        // 5. Fetch Submissions (Both Theory & Practical)
        const { data: submissions } = await supabase
          .from('submissions')
          .select(`
            id, status, submitted_at, created_at, marks,
            assignments(title),
            batch_practicals(title, experiment_number)
          `)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(5);

        // 6. Calc Stats
        // Fetch ALL counts for accurate stats (simplified queries)
        const { count: subCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', user.id);
        const { count: evalCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('status', 'evaluated');
        
        setUpcomingDeadlines(allDeadlines);
        setRecentActivities(submissions || []);
        setStats({
          totalSubjects: 0,
          totalAssignments: 0,
          pendingCount: allDeadlines.length, // Proxy for pending
          submittedCount: subCount || 0,
          evaluatedCount: evalCount || 0
        });

      } else {
        // --- TEACHER / HOD LOGIC ---
        
        // 1. Stats
        const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        const { count: theoryCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('created_by', user.id);
        const { count: pracCount } = await supabase.from('batch_practicals').select('*', { count: 'exact', head: true }).eq('created_by', user.id);
        
        // 2. Pending Reviews (Submissions with status 'submitted')
        const { data: pendingSubs, count: pendingRevCount } = await supabase
          .from('submissions')
          .select(`
             id, status, submitted_at,
             profiles(name, enrollment_number),
             assignments(title),
             batch_practicals(title, experiment_number)
          `)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: true })
          .limit(5);

        setRecentActivities(pendingSubs || []);
        setStats({
          totalSubjects: subjectCount || 0,
          totalAssignments: (theoryCount || 0) + (pracCount || 0),
          pendingCount: pendingRevCount || 0,
          submittedCount: 0,
          evaluatedCount: 0
        });
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Render Student View ---
  const renderStudentDashboard = () => (
    <>
      {/* UPDATED: Removed Attendance, changed grid to cols-3 for better fit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Pending Tasks" 
          value={stats.pendingCount} 
          icon={Clock} 
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" 
          delay={0.1} 
        />
        <StatCard 
          title="Submitted" 
          value={stats.submittedCount} 
          icon={CheckCircle2} 
          colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
          delay={0.2} 
        />
        <StatCard 
          title="Graded" 
          value={stats.evaluatedCount} 
          icon={TrendingUp} 
          colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" 
          delay={0.3} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deadlines */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.5 }} 
          className="bg-card rounded-2xl border border-border p-6 shadow-sm"
        >
          <SectionHeader title="Upcoming Deadlines" action="View All" link="/assignments" />
          <div className="space-y-1">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((item: any) => {
                const daysLeft = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <ActivityItem 
                    key={item.id}
                    title={item.title}
                    subtitle={item.type === 'practical' ? 'Practical Lab' : 'Theory Assignment'}
                    time={`${daysLeft} days left`}
                    icon={item.type === 'practical' ? Beaker : FileText}
                    colorClass={daysLeft <= 2 
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
                      : "bg-muted text-muted-foreground"}
                  />
                );
              })
            )}
          </div>
        </motion.div>

        {/* Recent Submissions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.6 }} 
          className="bg-card rounded-2xl border border-border p-6 shadow-sm"
        >
          <SectionHeader title="Recent Activity" />
          <div className="space-y-1">
            {recentActivities.length === 0 ? (
               <p className="text-sm text-muted-foreground italic">No submissions yet.</p>
            ) : (
              recentActivities.map((sub: any) => {
                const title = sub.batch_practicals?.title || sub.assignments?.title || 'Unknown Task';
                const isPractical = !!sub.batch_practicals;

                return (
                  <ActivityItem 
                    key={sub.id}
                    title={title}
                    subtitle={sub.status === 'evaluated' ? `Graded: ${sub.marks} Marks` : 'Submitted • Pending Review'}
                    time={new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}
                    icon={isPractical ? Beaker : FileText}
                    colorClass={sub.status === 'evaluated' 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    }
                  />
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </>
  );

  // --- Render Teacher View ---
  const renderTeacherDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Subjects" 
          value={stats.totalSubjects} 
          icon={BookOpen} 
          colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20" 
          delay={0.1} 
        />
        <StatCard 
          title="Tasks Created" 
          value={stats.totalAssignments} 
          icon={FileText} 
          colorClass="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800" 
          delay={0.2} 
        />
        <StatCard 
          title="Pending Evaluation" 
          value={stats.pendingCount} 
          icon={Clock} 
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" 
          delay={0.3} 
        />
        <StatCard 
          title="Defaulters Alert" 
          value={0} 
          icon={AlertCircle} 
          colorClass="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          >
            <SectionHeader title="Needs Evaluation" action="View All" link="/submissions" />
            <div className="space-y-1">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">All caught up! No pending reviews.</p>
              ) : (
                recentActivities.map((sub: any) => {
                  const title = sub.batch_practicals?.title || sub.assignments?.title || 'Untitled';
                  const isPractical = !!sub.batch_practicals;
                  
                  return (
                    <ActivityItem 
                      key={sub.id}
                      title={title}
                      subtitle={`Student: ${sub.profiles?.name || 'Unknown'} • ${isPractical ? 'Practical' : 'Assignment'}`}
                      time={new Date(sub.submitted_at).toLocaleDateString()}
                      icon={isPractical ? Beaker : FileText}
                      colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    />
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen pb-20 bg-transparent animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-medium text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border shadow-sm">
             Academic Year 2025-26
           </span>
        </div>
      </div>

      {user.role === 'student' ? renderStudentDashboard() : renderTeacherDashboard()}
    </div>
  );
}