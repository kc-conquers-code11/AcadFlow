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
  Users,
  TrendingUp,
  ArrowUpRight,
  Loader2
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
    className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}</h3>
      </div>
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon size={20} />
      </div>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, action, link }: { title: string, action?: string, link?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
    {action && link && (
      <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950" asChild>
        <Link to={link}>{action} <ArrowUpRight size={14} className="ml-1" /></Link>
      </Button>
    )}
  </div>
);

const ActivityItem = ({ title, subtitle, time, status, icon: Icon, colorClass }: any) => (
  <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 transition-all">
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 border border-transparent dark:border-slate-700/30", colorClass)}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
    </div>
    <div className="text-right">
      {status && (
        <span className={cn(
          "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1",
          status === 'High Risk' 
            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20" 
            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
        )}>
          {status}
        </span>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{time}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Dashboard State
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalAssignments: 0,
    pendingCount: 0,
    submittedCount: 0,
    evaluatedCount: 0
  });

  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'student') {
        // 1. Fetch Assignments
        const { data: assignments } = await supabase
          .from('assignments')
          .select('*, subjects(name, code)')
          .gt('deadline', new Date().toISOString())
          .order('deadline', { ascending: true })
          .limit(5);

        // 2. Fetch My Submissions
        const { data: submissions, count: subCount } = await supabase
          .from('submissions')
          .select('*, assignments(title)', { count: 'exact' })
          .eq('student_id', user.id);

        // 3. Calc Stats
        const evaluated = submissions?.filter(s => s.status === 'evaluated').length || 0;
        const pending = assignments?.length || 0; 

        setRecentAssignments(assignments || []);
        setRecentSubmissions(submissions?.slice(0, 5) || []);
        setStats({
          totalSubjects: 0, 
          totalAssignments: 0,
          pendingCount: pending,
          submittedCount: subCount || 0,
          evaluatedCount: evaluated
        });

      } else {
        // --- TEACHER / HOD LOGIC ---
        
        // 1. Fetch Counts
        const { count: subCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        const { count: assignCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true });
        
        // 2. Fetch Pending Reviews
        const { data: pendingSubs, count: pendingRevCount } = await supabase
          .from('submissions')
          .select('*, assignments(title), profiles(name, enrollment_number)')
          .eq('status', 'submitted')
          .limit(5);

        setRecentSubmissions(pendingSubs || []);
        setStats({
          totalSubjects: subCount || 0,
          totalAssignments: assignCount || 0,
          pendingCount: pendingRevCount || 0,
          submittedCount: 0,
          evaluatedCount: 0
        });
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  // --- Render Student View ---
  const renderStudentDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Pending Tasks" 
          value={stats.pendingCount} 
          icon={Clock} 
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" 
          delay={0.1} 
        />
        <StatCard 
          title="Submitted" 
          value={stats.submittedCount} 
          icon={CheckCircle2} 
          colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" 
          delay={0.2} 
        />
        <StatCard 
          title="Graded" 
          value={stats.evaluatedCount} 
          icon={TrendingUp} 
          colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" 
          delay={0.3} 
        />
        <StatCard 
          title="Attendance" 
          value="94%" 
          icon={Users} 
          colorClass="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10" 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deadlines */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.5 }} 
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
        >
          <SectionHeader title="Upcoming Deadlines" action="View All" link="/assignments" />
          <div className="space-y-1">
            {recentAssignments.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No upcoming deadlines.</p>
            ) : (
              recentAssignments.map(assignment => {
                const daysLeft = Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <ActivityItem 
                    key={assignment.id}
                    title={assignment.title}
                    subtitle={`${assignment.subjects?.name} • ${assignment.subjects?.code}`}
                    time={`${daysLeft} days left`}
                    icon={FileText}
                    colorClass={daysLeft <= 2 
                      ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}
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
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
        >
          <SectionHeader title="Your Submissions" />
          <div className="space-y-1">
            {recentSubmissions.length === 0 ? (
               <p className="text-sm text-slate-400 dark:text-slate-500 italic">No submissions yet.</p>
            ) : (
              recentSubmissions.map(submission => (
                <ActivityItem 
                  key={submission.id}
                  title={`Submitted: ${submission.assignments?.title}`}
                  subtitle={submission.status === 'evaluated' ? 'Graded • Check feedback' : 'Waiting for review'}
                  time={new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
                  icon={CheckCircle2}
                  colorClass="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
              ))
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
          colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" 
          delay={0.1} 
        />
        <StatCard 
          title="Total Assignments" 
          value={stats.totalAssignments} 
          icon={FileText} 
          colorClass="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800" 
          delay={0.2} 
        />
        <StatCard 
          title="Pending Review" 
          value={stats.pendingCount} 
          icon={Clock} 
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" 
          delay={0.3} 
        />
        <StatCard 
          title="Plagiarism Alerts" 
          value={0} 
          icon={AlertCircle} 
          colorClass="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10" 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
          >
            <SectionHeader title="Needs Evaluation" action="View All" link="/submissions" />
            <div className="space-y-1">
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">All caught up! No pending reviews.</p>
              ) : (
                recentSubmissions.map(submission => (
                  <ActivityItem 
                    key={submission.id}
                    title={submission.assignments?.title}
                    subtitle={`Student: ${submission.profiles?.name || 'Unknown'}`}
                    time="Submitted recently"
                    icon={FileText}
                    colorClass="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  />
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen pb-20 bg-transparent">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
             Academic Year 2024-25
           </span>
        </div>
      </div>

      {user.role === 'student' ? renderStudentDashboard() : renderTeacherDashboard()}
    </div>
  );
}