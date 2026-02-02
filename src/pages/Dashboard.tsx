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
const StatCard = ({ title, value, icon: Icon, color, trend, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
        {trend && (
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp size={12} /> {trend}
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={20} />
      </div>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, action, link }: { title: string, action?: string, link?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    {action && link && (
      <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
        <Link to={link}>{action} <ArrowUpRight size={14} className="ml-1" /></Link>
      </Button>
    )}
  </div>
);

const ActivityItem = ({ title, subtitle, time, status, icon: Icon, color }: any) => (
  <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", color)}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
      <p className="text-xs text-slate-500 truncate">{subtitle}</p>
    </div>
    <div className="text-right">
      {status && (
        <span className={cn(
          "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1",
          status === 'High Risk' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {status}
        </span>
      )}
      <p className="text-xs text-slate-400 font-mono">{time}</p>
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
        // 1. Fetch Assignments (Simulating enrolled subjects by fetching all for MVP)
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
        const pending = assignments?.length || 0; // Rough logic for MVP

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
        
        // 1. Fetch My Subjects/Assignments
        const { count: subCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        const { count: assignCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true });
        
        // 2. Fetch Pending Reviews
        const { data: pendingSubs, count: pendingRevCount } = await supabase
          .from('submissions')
          .select('*, assignments(title), profiles(name, enrollment_number)')
          .eq('status', 'submitted')
          .limit(5);

        // 3. Fetch Plagiarism Risks
        const { data: riskySubs, count: riskCount } = await supabase
          .from('submissions')
          .select('*')
          .gt('plagiarism_score', 20);

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
         <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  // --- Render Student View ---
  const renderStudentDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Pending Tasks" value={stats.pendingCount} icon={Clock} color="text-amber-600 bg-amber-50" delay={0.1} />
        <StatCard title="Submitted" value={stats.submittedCount} icon={CheckCircle2} color="text-blue-600 bg-blue-50" delay={0.2} />
        <StatCard title="Graded" value={stats.evaluatedCount} icon={TrendingUp} color="text-emerald-600 bg-emerald-50" delay={0.3} />
        <StatCard title="Attendance" value="94%" icon={Users} color="text-violet-600 bg-violet-50" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deadlines */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader title="Upcoming Deadlines" action="View All" link="/assignments" />
          <div className="space-y-1">
            {recentAssignments.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No upcoming deadlines.</p>
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
                    color={daysLeft <= 2 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}
                  />
                );
              })
            )}
          </div>
        </motion.div>

        {/* Recent Submissions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader title="Your Submissions" />
          <div className="space-y-1">
            {recentSubmissions.length === 0 ? (
               <p className="text-sm text-slate-400 italic">No submissions yet.</p>
            ) : (
              recentSubmissions.map(submission => (
                <ActivityItem 
                  key={submission.id}
                  title={`Submitted: ${submission.assignments?.title}`}
                  subtitle={submission.status === 'evaluated' ? 'Graded • Check feedback' : 'Waiting for review'}
                  time={new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
                  icon={CheckCircle2}
                  color="bg-emerald-50 text-emerald-600"
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
        <StatCard title="Total Subjects" value={stats.totalSubjects} icon={BookOpen} color="text-indigo-600 bg-indigo-50" delay={0.1} />
        <StatCard title="Total Assignments" value={stats.totalAssignments} icon={FileText} color="text-slate-600 bg-slate-100" delay={0.2} />
        <StatCard title="Pending Review" value={stats.pendingCount} icon={Clock} color="text-amber-600 bg-amber-50" delay={0.3} />
        <StatCard title="Plagiarism Alerts" value={0} icon={AlertCircle} color="text-red-600 bg-red-50" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <SectionHeader title="Needs Evaluation" action="View All" link="/submissions" />
            <div className="space-y-1">
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-slate-400 italic">All caught up! No pending reviews.</p>
              ) : (
                recentSubmissions.map(submission => (
                  <ActivityItem 
                    key={submission.id}
                    title={submission.assignments?.title}
                    subtitle={`Student: ${submission.profiles?.name || 'Unknown'}`}
                    time="Submitted recently"
                    icon={FileText}
                    color="bg-blue-50 text-blue-600"
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
    <div className="relative min-h-screen pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
             Academic Year 2024-25
           </span>
        </div>
      </div>

      {user.role === 'student' ? renderStudentDashboard() : renderTeacherDashboard()}
    </div>
  );
}