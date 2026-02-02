import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  mockSubjects, 
  mockAssignments, 
  mockSubmissions, 
  mockStudents 
} from '@/data/mockData';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  BookOpen, 
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Visual Components ---

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2.5 rounded-lg", color)}>
        <Icon size={20} />
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", 
          trend === 'up' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        )}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendLabel}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
    </div>
  </motion.div>
);

const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={cn("h-full rounded-full", colorClass)} 
    />
  </div>
);

export default function Reports() {
  const { user } = useAuth();

  // Redirect or null if student
  if (!user || user.role === 'student') return null;

  // --- Analytics Logic ---
  
  const stats = useMemo(() => {
    const totalSubmissions = mockSubmissions.filter(s => s.status !== 'draft').length;
    const totalEvaluated = mockSubmissions.filter(s => s.status === 'evaluated').length;
    const totalPlagiarism = mockSubmissions.filter(s => (s.plagiarismScore || 0) > 30).length;
    
    // Subject-wise Breakdown
    const subjectData = mockSubjects.map(subject => {
      const assignments = mockAssignments.filter(a => a.subjectId === subject.id);
      const submissions = mockSubmissions.filter(s => assignments.some(a => a.id === s.assignmentId));
      
      const totalPossible = assignments.length * mockStudents.length; // Theoretical Max
      const actualCount = submissions.filter(s => s.status !== 'draft').length;
      const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;
      
      // Avg Score Calculation
      const scores = submissions.filter(s => s.marks !== undefined).map(s => s.marks || 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      
      const plagiarismCount = submissions.filter(s => (s.plagiarismScore || 0) > 30).length;

      return {
        ...subject,
        assignmentCount: assignments.length,
        submissionRate: totalPossible > 0 ? Math.round((actualCount / totalPossible) * 100) : 0,
        evaluationRate: actualCount > 0 ? Math.round((evaluatedCount / actualCount) * 100) : 0,
        avgScore: Math.round(avgScore),
        plagiarismCount
      };
    });

    return { totalSubmissions, totalEvaluated, totalPlagiarism, subjectData };
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Analytics</h1>
          <p className="text-slate-500 mt-1">Real-time performance metrics and submission tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200 text-slate-600">
             <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
             <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Subjects" 
          value={mockSubjects.length} 
          icon={BookOpen} 
          color="bg-blue-50 text-blue-600"
          trend="up"
          trendLabel="Active"
        />
        <StatCard 
          title="Total Submissions" 
          value={stats.totalSubmissions} 
          icon={BarChart3} 
          color="bg-violet-50 text-violet-600"
          trend="up"
          trendLabel="+12% vs last week"
        />
        <StatCard 
          title="Evaluated" 
          value={stats.totalEvaluated} 
          icon={CheckCircle2} 
          color="bg-emerald-50 text-emerald-600"
          trend="up"
          trendLabel="92% Coverage"
        />
        <StatCard 
          title="Plagiarism Alerts" 
          value={stats.totalPlagiarism} 
          icon={AlertTriangle} 
          color="bg-red-50 text-red-600"
          trend="down"
          trendLabel="Requires Attention"
        />
      </div>

      {/* 3. Detailed Data Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-slate-400" /> Subject Performance
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-1/4">Subject Name</th>
                <th className="px-6 py-4 text-center">Assignments</th>
                <th className="px-6 py-4 w-1/6">Submission Rate</th>
                <th className="px-6 py-4 w-1/6">Grading Status</th>
                <th className="px-6 py-4 text-center">Avg. Score</th>
                <th className="px-6 py-4 text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.subjectData.map((row, i) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {row.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{row.code}</div>
                  </td>
                  
                  <td className="px-6 py-4 text-center font-medium text-slate-600">
                    {row.assignmentCount}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{row.submissionRate}%</span>
                      </div>
                      <ProgressBar 
                        value={row.submissionRate} 
                        colorClass={row.submissionRate > 80 ? "bg-blue-500" : "bg-amber-400"} 
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{row.evaluationRate}%</span>
                      </div>
                      <ProgressBar 
                        value={row.evaluationRate} 
                        colorClass="bg-emerald-500" 
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-block font-bold px-2 py-1 rounded text-xs",
                      row.avgScore >= 75 ? "bg-emerald-50 text-emerald-700" :
                      row.avgScore >= 50 ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    )}>
                      {row.avgScore}/20
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {row.plagiarismCount > 0 ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                        <AlertTriangle size={12} />
                        {row.plagiarismCount} Cases
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}