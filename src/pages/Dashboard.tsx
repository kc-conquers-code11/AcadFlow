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
  Plus,
  ClipboardCheck,
  Sparkles,
  CalendarDays,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// --- Enhanced Visual Components ---

const StatCard = ({ title, value, icon: Icon, backgroundColor, textColor = "text-white", iconClassName, delay = 0, subtitle }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="group relative overflow-hidden"
  >
    <Card
      className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300"
      style={{ backgroundColor }}
    >
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium opacity-90", textColor)}>{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("text-4xl font-bold tracking-tight", textColor)}>{value}</h3>
              {subtitle && <span className={cn("text-xs opacity-80", textColor)}>{subtitle}</span>}
            </div>
          </div>
          <div className="p-3 rounded-xl  transition-all duration-300 group-hover:scale-110">
            <Icon className={cn("h-6 w-6", iconClassName || "text-white")} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const SectionHeader = ({ title, action, link, icon: Icon }: { title: string, action?: string, link?: string, icon?: any }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      )}
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
    {action && link && (
      <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10" asChild>
        <Link to={link}>{action} <ChevronRight className="h-3 w-3 ml-1" /></Link>
      </Button>
    )}
  </div>
);

const ActivityItem = ({ title, subtitle, time, status, icon: Icon, colorClass, avatar }: any) => (
  <motion.div
    whileHover={{ x: 4 }}
    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all cursor-pointer"
  >
    {avatar ? (
      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {avatar}
        </AvatarFallback>
      </Avatar>
    ) : (
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{title}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
    </div>
    <div className="text-right space-y-1">
      {status && (
        <Badge variant={status === 'evaluated' ? 'default' : 'secondary'} className="text-[10px] font-semibold">
          {status === 'evaluated' ? 'Graded' : 'Pending'}
        </Badge>
      )}
      <p className="text-[11px] text-muted-foreground font-medium">{time}</p>
    </div>
  </motion.div>
);

const QuickActionCard = ({ icon: Icon, title, description, link, gradient }: any) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Link to={link}>
      <Card className="group cursor-pointer border-dashed border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
          <div className={cn("p-4 rounded-2xl transition-all duration-300 group-hover:scale-110", gradient)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

const ProgressRing = ({ pending, submitted, graded }: { pending: number, submitted: number, graded: number }) => {
  const total = pending + submitted + graded;
  const completionPercent = total > 0 ? Math.round(((submitted + graded) / total) * 100) : 0;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-muted stroke-current"
                strokeWidth="8"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <circle
                className="text-primary stroke-current transition-all duration-500"
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
                strokeDasharray={`${completionPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{completionPercent}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-foreground">Your Progress</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{submitted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Graded</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{graded}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ icon: Icon, title, description }: any) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 rounded-full bg-muted/50 mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

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
          .select(`
            id, status, submitted_at, created_at, marks,
            assignments(title),
            batch_practicals(title, experiment_number)
          `)
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
        const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        const { count: theoryCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('created_by', user.id);
        const { count: pracCount } = await supabase.from('batch_practicals').select('*', { count: 'exact', head: true }).eq('created_by', user.id);

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
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // --- Student Dashboard ---
  const renderStudentDashboard = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Pending Tasks"
            value={stats.pendingCount}
            icon={Clock}
            backgroundColor="#0077B6"
            textColor="text-white"
            iconClassName="text-white"
            delay={0.1}
          />
          <StatCard
            title="Submitted"
            value={stats.submittedCount}
            icon={CheckCircle2}
            backgroundColor="#00B4D8"
            textColor="text-white"
            iconClassName="text-white"
            delay={0.2}
          />
          <StatCard
            title="Graded"
            value={stats.evaluatedCount}
            icon={TrendingUp}
            backgroundColor="#90E0EF"
            textColor="text-[#023E8A]"
            iconClassName="text-[#023E8A]"
            delay={0.3}
          />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <ProgressRing
            pending={stats.pendingCount}
            submitted={stats.submittedCount - stats.evaluatedCount}
            graded={stats.evaluatedCount}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <SectionHeader title="Upcoming Deadlines" action="View All" link="/assignments" icon={CalendarDays} />
            </CardHeader>
            <CardContent className="space-y-1">
              {upcomingDeadlines.length === 0 ? (
                <EmptyState icon={Sparkles} title="All caught up!" description="No upcoming deadlines. Great job staying on track!" />
              ) : (
                upcomingDeadlines.map((item: any) => {
                  const daysLeft = Math.ceil((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <ActivityItem
                      key={item.id}
                      title={item.title}
                      subtitle={item.type === 'practical' ? 'Practical Lab' : 'Theory Assignment'}
                      time={daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                      icon={item.type === 'practical' ? Beaker : FileText}
                      colorClass={daysLeft <= 2
                        ? "bg-gradient-to-br from-red-500 to-rose-600 text-white"
                        : "bg-muted text-muted-foreground"}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <SectionHeader title="Recent Activity" icon={Clock} />
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivities.length === 0 ? (
                <EmptyState icon={FileText} title="No submissions yet" description="Start by submitting your first assignment or practical." />
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
                      status={sub.status}
                      icon={isPractical ? Beaker : FileText}
                      colorClass={sub.status === 'evaluated'
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                      }
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );

  // --- Teacher Dashboard ---
  const renderTeacherDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Subjects"
          value={stats.totalSubjects}
          icon={BookOpen}
          backgroundColor="#0077B6"
          textColor="text-white"
          iconClassName="text-white"
          delay={0.1}
        />
        <StatCard
          title="Tasks Created"
          value={stats.totalAssignments}
          icon={FileText}
          backgroundColor="#00B4D8"
          textColor="text-white"
          iconClassName="text-white"
          delay={0.2}
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingCount}
          icon={Clock}
          backgroundColor="#90E0EF"
          textColor="text-[#023E8A]"
          iconClassName="text-[#023E8A]"
          delay={0.3}
        />
        <StatCard
          title="Defaulters"
          value={0}
          icon={AlertCircle}
          backgroundColor="#CAF0F8"
          textColor="text-[#0077B6]"
          iconClassName="text-[#0077B6]"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <SectionHeader title="Needs Evaluation" action="View All" link="/submissions" icon={ClipboardCheck} />
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivities.length === 0 ? (
                <EmptyState icon={Sparkles} title="All caught up!" description="No pending submissions to review. Great work!" />
              ) : (
                recentActivities.map((sub: any) => {
                  const title = sub.batch_practicals?.title || sub.assignments?.title || 'Untitled';
                  const isPractical = !!sub.batch_practicals;
                  const studentName = sub.profiles?.name || 'Unknown';
                  const initials = studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <ActivityItem
                      key={sub.id}
                      title={title}
                      subtitle={`${studentName} • ${isPractical ? 'Practical' : 'Assignment'}`}
                      time={new Date(sub.submitted_at).toLocaleDateString()}
                      icon={isPractical ? Beaker : FileText}
                      avatar={initials}
                      colorClass="bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickActionCard
                icon={Plus}
                title="Create Assignment"
                description="Add a new theory assignment"
                link="/assignments"
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              />
              <QuickActionCard
                icon={Beaker}
                title="Add Practical"
                description="Create a new lab practical"
                link="/batches"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen pb-20 animate-in fade-in">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{getGreeting()}</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
            <p className="text-muted-foreground">
              {user.role === 'student' ? 'Here\'s your academic overview' : 'Manage your classes and submissions'}
            </p>
          </div>
          <Badge variant="outline" className="hidden md:flex gap-2 px-4 py-2 text-sm font-medium border-primary/20 bg-primary/5">
            <CalendarDays className="h-4 w-4" />
            Academic Year 2025-26
          </Badge>
        </div>
      </motion.div>

      {user.role === 'student' ? renderStudentDashboard() : renderTeacherDashboard()}
    </div>
  );
}