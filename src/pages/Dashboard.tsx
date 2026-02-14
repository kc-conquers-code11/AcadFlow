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
  Beaker,
  Users,
  CalendarDays,
  BarChart3,
  GraduationCap,
  ChevronRight,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';

// --- Shared Components ---

const StatCard = ({ title, value, icon: Icon, bgColor, textColor, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    style={{ backgroundColor: bgColor }}
    className="relative overflow-hidden rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
  >
    <div className="flex justify-between items-start z-10">
      <div className="space-y-1">
        <p className="text-sm font-medium opacity-80" style={{ color: textColor }}>{title}</p>
        <h3 className="text-4xl font-bold tracking-tight" style={{ color: textColor }}>{value}</h3>
      </div>
      <Icon size={32} strokeWidth={2} style={{ color: textColor }} />
    </div>
  </motion.div>
);

const SectionHeader = ({ title, action, link }: { title: string, action?: string, link?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-foreground">{title}</h2>
    {action && link && (
      <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary hover:bg-primary/10" asChild>
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

// --- Faculty Bento Grid Components ---

const BentoCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className={cn("bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow", className)}
  >
    {children}
  </motion.div>
);

const PendingSubmissionRow = ({ sub, index }: { sub: any; index: number }) => {
  const taskTitle = sub.batch_practicals?.title || sub.assignments?.title || 'Untitled';
  const isPractical = !!sub.batch_practicals;
  const studentName = sub.profiles?.name || 'Unknown';
  const enrollment = sub.profiles?.enrollment_number || '';
  const submittedAt = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all group"
    >
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
        {studentName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{studentName}</p>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
            {isPractical ? 'Practical' : 'Theory'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{taskTitle} • {enrollment}</p>
      </div>
      <div className="text-right shrink-0 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{submittedAt}</span>
        {sub.id && (
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
            <Link to={`/evaluate/${sub.id}`}>
              <Eye size={14} />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalAssignments: 0,
    pendingCount: 0,
    submittedCount: 0,
    evaluatedCount: 0
  });

  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Faculty-specific state
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [evaluatedToday, setEvaluatedToday] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentlyEvaluated, setRecentlyEvaluated] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
        return;
      }
      fetchData();
    }
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'student') {
        const { data: profile } = await supabase.from('profiles').select('batch, division').eq('id', user.id).single();
        const { data: theory } = await supabase
          .from('assignments')
          .select('id, title, deadline, subjects(code)')
          .gt('deadline', new Date().toISOString());

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

        const allDeadlines = [
          ...(theory || []).map((t: any) => ({ ...t, type: 'theory', subtitle: t.subjects?.code })),
          ...(practicals).map((p: any) => ({ ...p, type: 'practical', subtitle: `Exp ${p.experiment_number}` }))
        ].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
          .slice(0, 5);

        const { data: submissions } = await supabase
          .from('submissions')
          .select(`id, status, submitted_at, created_at, marks, assignments(title), batch_practicals(title, experiment_number)`)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(5);

        const { count: subCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', user.id);
        const { count: evalCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('status', 'evaluated');

        setUpcomingDeadlines(allDeadlines);
        setRecentActivities(submissions || []);
        setStats({
          totalSubjects: 0,
          totalAssignments: 0,
          pendingCount: allDeadlines.length,
          submittedCount: subCount || 0,
          evaluatedCount: evalCount || 0
        });

      } else {
        // --- FACULTY / HOD DATA FETCH ---
        const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });

        // Step 1: Get teacher's own assignments and practicals
        const { data: myAssignments } = await supabase
          .from('assignments')
          .select('id, title')
          .eq('created_by', user!.id);

        const { data: myPracticals } = await supabase
          .from('batch_practicals')
          .select('id, title, experiment_number')
          .eq('created_by', user!.id);

        const assignmentIds = new Set((myAssignments || []).map((a: any) => a.id));
        const practicalIds = new Set((myPracticals || []).map((p: any) => p.id));
        const theoryCount = assignmentIds.size;
        const pracCount = practicalIds.size;

        // Step 2: Fetch ALL submissions — EXACT same query as working Submissions page (line 63-65)
        const { data: rawSubmissions } = await supabase
          .from('submissions')
          .select('practical_id, assignment_id, status');

        const allSubmissions = rawSubmissions || [];

        // Step 3: Filter client-side EXACTLY like Submissions page does (lines 70, 81)
        const mySubmissions = allSubmissions.filter(s =>
          (s.assignment_id && assignmentIds.has(s.assignment_id)) ||
          (s.practical_id && practicalIds.has(s.practical_id))
        );

        // Count pending — EXACTLY like Submissions page calculateStats (line 103)
        const pendingRevCount = mySubmissions.filter(s => s.status === 'submitted').length;

        // Now fetch detailed submissions for display (with student info)
        const { data: detailedSubs } = await supabase
          .from('submissions')
          .select('id, status, submitted_at, updated_at, marks, student_id, assignment_id, practical_id');

        const detailedAll = (detailedSubs || []).filter(s =>
          (s.assignment_id && assignmentIds.has(s.assignment_id)) ||
          (s.practical_id && practicalIds.has(s.practical_id))
        );

        // Build lookup maps for task titles
        const asgnMap = new Map((myAssignments || []).map((a: any) => [a.id, a]));
        const pracMap = new Map((myPracticals || []).map((p: any) => [p.id, p]));

        // Get pending ones with student info (use detailedAll which has all fields)
        const pendingAll = detailedAll
          .filter((s: any) => s.status === 'submitted')
          .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
        const pendingTop5 = pendingAll.slice(0, 5);

        // Fetch student profiles for pending submissions
        const studentIds = [...new Set(pendingTop5.map((s: any) => s.student_id).filter(Boolean))];
        let profileMap = new Map<string, any>();
        if (studentIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, enrollment_number')
            .in('id', studentIds);
          profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        }

        // Enrich pending submissions with task titles and student info
        const pendingSubs = pendingTop5.map((s: any) => ({
          ...s,
          profiles: profileMap.get(s.student_id) || { name: 'Unknown', enrollment_number: '' },
          assignments: s.assignment_id ? asgnMap.get(s.assignment_id) : null,
          batch_practicals: s.practical_id ? pracMap.get(s.practical_id) : null,
        }));

        // Upcoming Deadlines
        const { data: upcomingAsgn } = await supabase
          .from('assignments')
          .select('id, title, deadline, subjects(code)')
          .eq('created_by', user!.id)
          .gt('deadline', new Date().toISOString())
          .order('deadline', { ascending: true })
          .limit(4);

        // Evaluated Today count
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const evalTodayCount = detailedAll.filter((s: any) =>
          s.status === 'evaluated' && s.updated_at && new Date(s.updated_at) >= todayStart
        ).length;

        // Total Students
        const { count: studCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // Recently evaluated (last 3)
        const evalSorted = detailedAll
          .filter((s: any) => s.status === 'evaluated')
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 3);

        // Fetch profiles for recently evaluated
        const evalStudentIds = [...new Set(evalSorted.map((s: any) => s.student_id).filter(Boolean))];
        let evalProfileMap = new Map<string, any>();
        if (evalStudentIds.length > 0) {
          const { data: evalProfiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', evalStudentIds);
          evalProfileMap = new Map((evalProfiles || []).map((p: any) => [p.id, p]));
        }

        const recentEval = evalSorted.map((s: any) => ({
          ...s,
          profiles: evalProfileMap.get(s.student_id) || { name: 'Unknown' },
          assignments: s.assignment_id ? asgnMap.get(s.assignment_id) : null,
          batch_practicals: s.practical_id ? pracMap.get(s.practical_id) : null,
        }));

        setPendingSubmissions(pendingSubs);
        setUpcomingAssignments(upcomingAsgn || []);
        setEvaluatedToday(evalTodayCount);
        setTotalStudents(studCount || 0);
        setRecentlyEvaluated(recentEval);
        setRecentActivities(pendingSubs);
        setStats({
          totalSubjects: subjectCount || 0,
          totalAssignments: theoryCount + pracCount,
          pendingCount: pendingRevCount,
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

  if (!user || user.role === 'admin') return null;

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      {user.role === 'student' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Pending Tasks" value={stats.pendingCount} icon={Clock} bgColor="#0077B6" textColor="#FFFFFF" delay={0.1} />
            <StatCard title="Submitted" value={stats.submittedCount} icon={CheckCircle2} bgColor="#0077B6" textColor="#FFFFFF" delay={0.2} />
            <StatCard title="Graded" value={stats.evaluatedCount} icon={TrendingUp} bgColor="#90E0EF" textColor="#0077B6" delay={0.3} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <SectionHeader title="Upcoming Deadlines" action="View All" link="/assignments" />
              <div className="space-y-1">
                {upcomingDeadlines.length === 0 ? <p className="text-sm text-muted-foreground italic">No upcoming deadlines.</p> : upcomingDeadlines.map((item: any) => (
                  <ActivityItem key={item.id} title={item.title} subtitle={item.type === 'practical' ? 'Practical Lab' : 'Theory Assignment'} time={`${Math.ceil((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`} icon={item.type === 'practical' ? Beaker : FileText} colorClass="bg-muted text-muted-foreground" />
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <SectionHeader title="Recent Activity" />
              <div className="space-y-1">
                {recentActivities.length === 0 ? <p className="text-sm text-muted-foreground italic">No submissions yet.</p> : recentActivities.map((sub: any) => (
                  <ActivityItem key={sub.id} title={sub.batch_practicals?.title || sub.assignments?.title || 'Unknown Task'} subtitle={sub.status === 'evaluated' ? `Graded: ${sub.marks} Marks` : 'Submitted • Pending Review'} time={new Date(sub.submitted_at || sub.created_at).toLocaleDateString()} icon={!!sub.batch_practicals ? Beaker : FileText} colorClass={sub.status === 'evaluated' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-[#CAF0F8] text-[#0077B6]"} />
                ))}
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <>
          {/* --- FACULTY BENTO GRID --- */}

          {/* Row 1: Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Subjects" value={stats.totalSubjects} icon={BookOpen} bgColor="#0077B6" textColor="#FFFFFF" delay={0.1} />
            <StatCard title="Tasks Created" value={stats.totalAssignments} icon={FileText} bgColor="#0077B6" textColor="#FFFFFF" delay={0.2} />
            <StatCard title="Pending Review" value={stats.pendingCount} icon={Clock} bgColor="#90E0EF" textColor="#0077B6" delay={0.3} />
            <StatCard title="Evaluated Today" value={evaluatedToday} icon={CheckCircle2} bgColor="#CAF0F8" textColor="#0077B6" delay={0.4} />
          </div>

          {/* Row 2: Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Pending Reviews - Large card spanning 2 cols */}
            <BentoCard className="lg:col-span-2" delay={0.5}>
              <SectionHeader title="Pending Reviews" action="View All" link="/submissions" />
              <div className="space-y-0.5">
                {pendingSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
                    <p className="text-sm font-semibold text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No pending submissions to review</p>
                  </div>
                ) : (
                  pendingSubmissions.map((sub, i) => (
                    <PendingSubmissionRow key={sub.id} sub={sub} index={i} />
                  ))
                )}
              </div>
            </BentoCard>

            {/* Quick Stats Column */}
            <div className="flex flex-col gap-4">
              {/* Total Students Card */}
              <BentoCard delay={0.6}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Users size={22} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                  </div>
                </div>
              </BentoCard>

              {/* Defaulters Alert */}
              <BentoCard delay={0.7}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertCircle size={22} className="text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Defaulters Alert</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-[10px] text-muted-foreground">Students with missing work</p>
                  </div>
                </div>
              </BentoCard>

              {/* Completion Rate Mini Card */}
              <BentoCard delay={0.8}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BarChart3 size={22} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Evaluation Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.pendingCount > 0 ? `${stats.pendingCount} left` : '100%'}
                    </p>
                  </div>
                </div>
              </BentoCard>
            </div>

          </div>

          {/* Row 3: Bottom Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

            {/* Upcoming Deadlines */}
            <BentoCard delay={0.9}>
              <SectionHeader title="Upcoming Deadlines" action="View All" link="/assignments" />
              <div className="space-y-2">
                {upcomingAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No upcoming deadlines.</p>
                ) : (
                  upcomingAssignments.map((asgn: any) => {
                    const daysLeft = Math.ceil((new Date(asgn.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 2;
                    return (
                      <div key={asgn.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          isUrgent ? "bg-red-500/10" : "bg-blue-500/10"
                        )}>
                          <CalendarDays size={18} className={isUrgent ? "text-red-500" : "text-blue-500"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{asgn.title}</p>
                          <p className="text-xs text-muted-foreground">{asgn.subjects?.code}</p>
                        </div>
                        <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                          {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </BentoCard>

            {/* Recently Evaluated */}
            <BentoCard delay={1.0}>
              <SectionHeader title="Recently Evaluated" />
              <div className="space-y-2">
                {recentlyEvaluated.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No recent evaluations.</p>
                ) : (
                  recentlyEvaluated.map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <GraduationCap size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {sub.batch_practicals?.title || sub.assignments?.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.profiles?.name || 'Unknown Student'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                          {sub.marks}/{sub.assignments?.total_points || '—'}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {sub.updated_at ? new Date(sub.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </BentoCard>

          </div>
        </>
      )}
    </div>
  );
}