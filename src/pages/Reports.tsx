import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Download,
  Filter,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
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

// Import Modular Components
import { ReportStats } from '@/components/reports/ReportStats';
import { BatchTable } from '@/components/reports/BatchTable';
import { SubjectTable } from '@/components/reports/SubjectTable';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('batches');
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
    if (user && (user.role === 'teacher' || user.role === 'hod' || user.role === 'admin')) {
      fetchAnalytics();
    } else {
        setLoading(false); // Stop loading if unauthorized
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
      const { data: submissions } = await supabase.from('submissions').select('id, marks, status, practical_id, assignment_id, student_id');

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
          const marks = subSubs.filter(s => s.marks).map(s => s.marks);
          const subAvg = marks.length > 0 ? marks.reduce((a:any, b:any) => a + b, 0) / marks.length : 0;

          return {
            id: sub.id,
            name: sub.name,
            code: sub.code,
            assignmentCount: subAssignments.length,
            submissionRate: totalExpected > 0 ? Math.round((actualCount / totalExpected) * 100) : 0,
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

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = '';

    if (activeTab === 'batches') {
      headers = ["Batch Name", "Division", "Batch Code", "Student Count", "Practical Avg", "Theory Avg", "Consistency %"];
      rows = filteredBatches.map(b => [b.name, b.division, b.batchCode, b.studentCount, b.pracAvg, b.theoryAvg, b.consistency]);
      filename = `Batch_Report.csv`;
    } else {
      headers = ["Subject Name", "Code", "Assignments", "Submission Rate %", "Avg Score", "Risk Factor"];
      rows = filteredSubjects.map(s => [s.name, s.code, s.assignmentCount, s.submissionRate, s.avgScore, s.risk]);
      filename = `Subject_Report.csv`;
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
    toast.success(`${filename} exported!`);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Only Admin/Teacher/HOD can see this ---
  if (!user || user.role === 'student') return <div className="p-10 text-center font-bold text-lg">Access Denied</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Deep dive into academic performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn("hidden sm:flex", filterMode !== 'all' && "bg-blue-50 text-blue-600 border-blue-200")}>
                 <Filter className="h-4 w-4 mr-2" /> 
                 {filterMode === 'all' ? 'Filter' : filterMode === 'risk' ? 'Risk View' : 'Top View'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>View Mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterMode('all')}>
                 Show All
                 {filterMode === 'all' && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('risk')} className="text-red-600">
                 <AlertTriangle className="mr-2 h-4 w-4" /> At Risk
                 {filterMode === 'risk' && <CheckCircle2 className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('top')} className="text-green-600">
                 <TrendingUp className="mr-2 h-4 w-4" /> Top Performers
                 {filterMode === 'top' && <CheckCircle2 className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              {filterMode !== 'all' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterMode('all')}>
                    <X className="mr-2 h-4 w-4" /> Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default" size="sm" onClick={handleExport}>
             <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <ReportStats stats={stats} />

      {/* Main Tabs */}
      <Tabs defaultValue="batches" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
          <TabsTrigger value="batches">Batch Performance</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="batches">
          <BatchTable data={filteredBatches} />
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectTable data={filteredSubjects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}