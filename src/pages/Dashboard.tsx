import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BookOpen,
  Users,
  TrendingUp,
  ArrowUpRight,
  MoreHorizontal,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';
import { mockSubjects, mockAssignments, mockSubmissions } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Visual Assets ---
const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />
);

// --- Sub-Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string; // Tailwind color classes e.g. "text-blue-600 bg-blue-50"
  trend?: string;
  delay?: number;
}

const StatCard = ({ title, value, icon: Icon, color, trend, delay = 0 }: StatCardProps) => (
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

const SectionHeader = ({ title, action }: { title: string, action?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    {action && (
      <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
        {action} <ArrowUpRight size={14} className="ml-1" />
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

  if (!user) return null;

  // --- Calculations ---
  const pendingAssignments = mockAssignments.filter(a => new Date(a.deadline) > new Date()).length;
  const submittedCount = mockSubmissions.filter(s => s.status === 'submitted').length;
  const evaluatedCount = mockSubmissions.filter(s => s.status === 'evaluated').length;
  
  // --- Render Logic ---

  const renderStudentDashboard = () => (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Pending Tasks" 
          value={pendingAssignments} 
          icon={Clock} 
          color="text-amber-600 bg-amber-50" 
          delay={0.1}
        />
        <StatCard 
          title="Submitted" 
          value={submittedCount} 
          icon={CheckCircle2} 
          color="text-blue-600 bg-blue-50" 
          delay={0.2}
        />
        <StatCard 
          title="Avg. Score" 
          value="82%" 
          icon={TrendingUp} 
          color="text-emerald-600 bg-emerald-50" 
          trend="+4% this sem"
          delay={0.3}
        />
        <StatCard 
          title="Attendance" 
          value="94%" 
          icon={Users} 
          color="text-violet-600 bg-violet-50" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deadlines Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <SectionHeader title="Upcoming Deadlines" action="View Calendar" />
          <div className="space-y-1">
            {mockAssignments
              .filter(a => new Date(a.deadline) > new Date())
              .slice(0, 4)
              .map(assignment => {
                const subject = mockSubjects.find(s => s.id === assignment.subjectId);
                const daysLeft = Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <ActivityItem 
                    key={assignment.id}
                    title={assignment.title}
                    subtitle={`${subject?.name} • ${subject?.code}`}
                    time={`${daysLeft} days left`}
                    icon={FileText}
                    color={daysLeft <= 2 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}
                  />
                );
              })}
          </div>
        </motion.div>

        {/* Recent Activity Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <SectionHeader title="Recent Activity" />
          <div className="space-y-1">
            {mockSubmissions.slice(0, 4).map(submission => {
              const assignment = mockAssignments.find(a => a.id === submission.assignmentId);
              return (
                <ActivityItem 
                  key={submission.id}
                  title={`Submitted: ${assignment?.title}`}
                  subtitle={submission.status === 'evaluated' ? 'Graded • Check feedback' : 'Waiting for review'}
                  time={new Date(submission.lastSavedAt).toLocaleDateString()}
                  icon={CheckCircle2}
                  color="bg-emerald-50 text-emerald-600"
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );

  const renderTeacherDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Subjects" 
          value={mockSubjects.length} 
          icon={BookOpen} 
          color="text-indigo-600 bg-indigo-50" 
          delay={0.1}
        />
        <StatCard 
          title="Assignments" 
          value={mockAssignments.length} 
          icon={FileText} 
          color="text-slate-600 bg-slate-100" 
          delay={0.2}
        />
        <StatCard 
          title="Pending Review" 
          value={submittedCount} 
          icon={Clock} 
          color="text-amber-600 bg-amber-50" 
          delay={0.3}
        />
        <StatCard 
          title="Plagiarism Alerts" 
          value={2} 
          icon={AlertCircle} 
          color="text-red-600 bg-red-50" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <SectionHeader title="Needs Evaluation" action="Start Grading" />
            <div className="space-y-1">
              {mockSubmissions
                .filter(s => s.status === 'submitted')
                .slice(0, 5)
                .map(submission => {
                  const assignment = mockAssignments.find(a => a.id === submission.assignmentId);
                  return (
                    <ActivityItem 
                      key={submission.id}
                      title={assignment?.title}
                      subtitle={`Student ID: ${submission.studentId}`}
                      time="Submitted 2h ago"
                      icon={FileText}
                      color="bg-blue-50 text-blue-600"
                    />
                  );
                })}
            </div>
          </motion.div>
        </div>

        {/* Side Panel (1 col) - Plagiarism */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="text-red-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Risk Analysis</h2>
          </div>
          
          <div className="space-y-4">
            {mockSubmissions
              .filter(s => s.plagiarismScore && s.plagiarismScore > 10)
              .slice(0, 3)
              .map(submission => {
                const assignment = mockAssignments.find(a => a.id === submission.assignmentId);
                return (
                  <div key={submission.id} className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          {submission.plagiarismScore}% Match
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-700 -mt-1 -mr-1">
                           <MoreHorizontal size={14} />
                        </Button>
                     </div>
                     <p className="text-sm font-semibold text-slate-800 mt-2 truncate">{assignment?.title}</p>
                     <p className="text-xs text-slate-500">Student: {submission.studentId}</p>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen pb-20">
      <GridPattern />
      
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

      {user.role === 'student' && renderStudentDashboard()}
      {user.role === 'teacher' && renderTeacherDashboard()}
      {/* HOD dashboard can reuse the Teacher Layout structure */}
      {user.role === 'hod' && renderTeacherDashboard()} 
    </div>
  );
}