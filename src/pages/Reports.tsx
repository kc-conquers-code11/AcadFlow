import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  BookOpen, 
  Download,
  Filter,
  Loader2,
  Beaker,
  Users,
  LayoutGrid,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Visual Components ---

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2.5 rounded-lg", color)}>
        <Icon size={20} />
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", 
          trend === 'up' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendLabel}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
    </div>
  </motion.div>
);

const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('batches'); // Track active tab for export logic
  const [filterMode, setFilterMode] = useState<'all' | 'risk' | 'top'>('all');

  // Stats State
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalTasks: 0,
    totalSubmissions: 0,
    totalEvaluated: 0,
    avgScore: 0
  });

  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [batchPerformance, setBatchPerformance] = useState<any[]>([]);

  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'hod')) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Basic Data
      const { data: students } = await supabase.from('profiles').select('id, batch, division').eq('role', 'student');
      const { data: subjects } = await supabase.from('subjects').select('*');
      const { data: batches } = await supabase.from('batches').select('*');
      
      const { data: assignments } = await supabase.from('assignments').select('id, title, subject_id');
      const { data: practicals } = await supabase.from('batch_practicals').select('id, title, division, batch');

      // 2. Fetch All Submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id, marks, status, practical_id, assignment_id, student_id
        `);

      const allSubmissions = submissions || [];
      const totalStudents = students?.length || 1;

      // --- AGGREGATE STATS ---
      const evaluatedCount = allSubmissions.filter(s => s.status === 'evaluated').length;
      const totalMarks = allSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0);
      const avgGlobalScore = evaluatedCount > 0 ? Math.round(totalMarks / evaluatedCount) : 0;

      setStats({
        totalSubjects: subjects?.length || 0,
        totalTasks: (assignments?.length || 0) + (practicals?.length || 0),
        totalSubmissions: allSubmissions.length,
        totalEvaluated: evaluatedCount,
        avgScore: avgGlobalScore
      });

      // --- A. SUBJECT WISE BREAKDOWN ---
      if (subjects && assignments) {
        const subData = subjects.map(sub => {
          const subAssignments = assignments.filter(a => a.subject_id === sub.id);
          const subAssignIds = subAssignments.map(a => a.id);
          const subSubs = allSubmissions.filter(s => s.assignment_id && subAssignIds.includes(s.assignment_id));
          
          const totalExpected = subAssignments.length * totalStudents;
          const actualCount = subSubs.length;
          const subEvaluated = subSubs.filter(s => s.status === 'evaluated').length;
          const marks = subSubs.filter(s => s.marks).map(s => s.marks);
          const subAvg = marks.length > 0 ? marks.reduce((a:any, b:any) => a + b, 0) / marks.length : 0;

          return {
            id: sub.id,
            name: sub.name,
            code: sub.code,
            assignmentCount: subAssignments.length,
            submissionRate: totalExpected > 0 ? Math.round((actualCount / totalExpected) * 100) : 0,
            evaluationRate: actualCount > 0 ? Math.round((subEvaluated / actualCount) * 100) : 0,
            avgScore: Math.round(subAvg),
            risk: subAvg < 10 ? 'High' : 'Low'
          };
        });
        setSubjectPerformance(subData);
      }

      // --- B. BATCH WISE BREAKDOWN ---
      if (batches && students) {
        const batchData = batches.map(batch => {
          const batchStudents = students.filter(s => s.batch === batch.batch && s.division === batch.division);
          const studentIds = batchStudents.map(s => s.id);
          const studentCount = batchStudents.length;

          const batchPracs = practicals?.filter(p => p.batch === batch.batch && p.division === batch.division) || [];
          const batchSubs = allSubmissions.filter(s => s.student_id && studentIds.includes(s.student_id));
          
          const practicalSubs = batchSubs.filter(s => s.practical_id);
          const theorySubs = batchSubs.filter(s => s.assignment_id);

          const pracMarks = practicalSubs.filter(s => s.marks).map(s => s.marks);
          const pracAvg = pracMarks.length > 0 ? Math.round(pracMarks.reduce((a:any,b:any)=>a+b,0) / pracMarks.length) : 0;

          const theoryMarks = theorySubs.filter(s => s.marks).map(s => s.marks);
          const theoryAvg = theoryMarks.length > 0 ? Math.round(theoryMarks.reduce((a:any,b:any)=>a+b,0) / theoryMarks.length) : 0;

          const totalTasks = (assignments?.length || 0) + batchPracs.length;
          const totalExpected = totalTasks * studentCount;
          const totalActual = batchSubs.length;
          const consistency = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

          return {
            id: batch.id,
            name: batch.name,
            division: batch.division,
            batchCode: batch.batch,
            studentCount,
            practicalCount: batchPracs.length,
            pracAvg,
            theoryAvg,
            consistency
          };
        });
        setBatchPerformance(batchData);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER LOGIC ---
  const filteredBatches = useMemo(() => {
    if (filterMode === 'all') return batchPerformance;
    if (filterMode === 'risk') return batchPerformance.filter(b => b.consistency < 50 || b.pracAvg < 10);
    if (filterMode === 'top') return batchPerformance.filter(b => b.consistency > 80 && b.pracAvg > 15);
    return batchPerformance;
  }, [filterMode, batchPerformance]);

  const filteredSubjects = useMemo(() => {
    if (filterMode === 'all') return subjectPerformance;
    if (filterMode === 'risk') return subjectPerformance.filter(s => s.risk === 'High' || s.submissionRate < 50);
    if (filterMode === 'top') return subjectPerformance.filter(s => s.avgScore > 15 && s.submissionRate > 80);
    return subjectPerformance;
  }, [filterMode, subjectPerformance]);

  // --- CSV EXPORT LOGIC ---
  const handleExport = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = '';

    if (activeTab === 'batches') {
      headers = ["Batch Name", "Division", "Batch Code", "Student Count", "Practical Avg", "Theory Avg", "Consistency %"];
      rows = filteredBatches.map(b => [b.name, b.division, b.batchCode, b.studentCount, b.pracAvg, b.theoryAvg, b.consistency]);
      filename = `Batch_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ["Subject Name", "Code", "Assignments", "Submission Rate %", "Eval Rate %", "Avg Score", "Risk Factor"];
      rows = filteredSubjects.map(s => [s.name, s.code, s.assignmentCount, s.submissionRate, s.evaluationRate, s.avgScore, s.risk]);
      filename = `Subject_Report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully!`);
  };

  if (!user || user.role === 'student') return <div className="p-10 text-center">Access Denied</div>;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10 animate-in fade-in min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground mt-1">Deep dive into Subject and Batch-wise analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          
          {/* Dynamic Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn("hidden sm:flex border-border text-muted-foreground", filterMode !== 'all' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800")}>
                 <Filter className="h-4 w-4 mr-2" /> 
                 {filterMode === 'all' ? 'Filter View' : filterMode === 'risk' ? 'Risk View' : 'Top View'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter Data By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterMode('all')}>
                 Show All
                 {filterMode === 'all' && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('risk')} className="text-red-600 focus:text-red-700">
                 <AlertTriangle className="mr-2 h-4 w-4" /> At Risk / Low
                 {filterMode === 'risk' && <CheckCircle2 className="ml-auto h-4 w-4 text-red-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('top')} className="text-green-600 focus:text-green-700">
                 <TrendingUp className="mr-2 h-4 w-4" /> Top Performers
                 {filterMode === 'top' && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />}
              </DropdownMenuItem>
              {filterMode !== 'all' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterMode('all')}>
                    <X className="mr-2 h-4 w-4" /> Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dynamic Export Button */}
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted" onClick={handleExport}>
             <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Batches" 
          value={batchPerformance.length} 
          icon={Users} 
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          trend="up"
          trendLabel="Active"
          delay={0.1}
        />
        <StatCard 
          title="Total Submissions" 
          value={stats.totalSubmissions} 
          icon={BarChart3} 
          color="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
          trend="up"
          trendLabel="All time"
          delay={0.2}
        />
        <StatCard 
          title="Overall Avg" 
          value={stats.avgScore} 
          icon={CheckCircle2} 
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          trend="up"
          trendLabel="Class Performance"
          delay={0.3}
        />
        <StatCard 
          title="Active Tasks" 
          value={stats.totalTasks} 
          icon={Beaker} 
          color="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          trend="up"
          trendLabel="Theory + Labs"
          delay={0.4}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="batches" className="w-full" onValueChange={(val) => setActiveTab(val)}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
          <TabsTrigger value="batches">Batch Reports</TabsTrigger>
          <TabsTrigger value="subjects">Subject Reports</TabsTrigger>
        </TabsList>

        {/* --- BATCH REPORT TAB --- */}
        <TabsContent value="batches" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <LayoutGrid size={18} className="text-muted-foreground" /> Batch Performance 
                {filterMode !== 'all' && <span className="text-xs font-normal text-muted-foreground bg-background border px-2 py-0.5 rounded-full capitalize">Filtered: {filterMode}</span>}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Batch Name</th>
                    <th className="px-6 py-4 text-center">Students</th>
                    <th className="px-6 py-4 text-center">Practical Avg</th>
                    <th className="px-6 py-4 text-center">Theory Avg</th>
                    <th className="px-6 py-4 w-1/4">Submission Consistency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBatches.length === 0 ? (
                     <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No batches match the filter criteria.</td></tr>
                  ) : (
                    filteredBatches.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{row.name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">Div {row.division} • Batch {row.batchCode}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{row.studentCount}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={cn("px-2 py-1 rounded text-xs font-bold", row.pracAvg >= 15 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                             {row.pracAvg} / 20
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={cn("px-2 py-1 rounded text-xs font-bold", row.theoryAvg >= 15 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                             {row.theoryAvg} / 20
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground">{row.consistency}%</span>
                            </div>
                            <ProgressBar 
                              value={row.consistency} 
                              colorClass={row.consistency > 80 ? "bg-blue-500" : row.consistency > 50 ? "bg-amber-500" : "bg-red-500"} 
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

        {/* --- SUBJECT REPORT TAB --- */}
        <TabsContent value="subjects" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <BookOpen size={18} className="text-muted-foreground" /> Subject Performance
                {filterMode !== 'all' && <span className="text-xs font-normal text-muted-foreground bg-background border px-2 py-0.5 rounded-full capitalize">Filtered: {filterMode}</span>}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-4 w-1/4">Subject Name</th>
                    <th className="px-6 py-4 text-center">Assignments</th>
                    <th className="px-6 py-4 w-1/6">Submission Rate</th>
                    <th className="px-6 py-4 text-center">Avg. Score</th>
                    <th className="px-6 py-4 text-center">Risk Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubjects.length === 0 ? (
                     <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No subjects match the filter criteria.</td></tr>
                  ) : (
                    filteredSubjects.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors">{row.name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{row.code}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-foreground">{row.assignmentCount}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground">{row.submissionRate}%</span>
                            </div>
                            <ProgressBar value={row.submissionRate} colorClass={row.submissionRate > 80 ? "bg-blue-500" : "bg-amber-400"} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block font-bold px-2 py-1 rounded text-xs bg-muted border border-border">
                            {row.avgScore} / 20
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.risk === 'High' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100">
                              <AlertTriangle size={12} /> High Risk
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

      </Tabs>
    </div>
  );
}