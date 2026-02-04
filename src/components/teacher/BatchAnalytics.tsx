import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, AlertTriangle, CheckCircle2, XCircle, Users, RefreshCcw } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BatchAnalyticsProps {
  batchId: string;
  totalPracticals: number; // Passed dynamically from Dashboard
}

export function BatchAnalytics({ batchId, totalPracticals }: BatchAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'defaulters' | 'completed'>('all');
  const [search, setSearch] = useState('');

  // Fetch on mount or when dependencies change
  useEffect(() => {
    if (batchId) {
      fetchAnalytics();
    }
  }, [batchId, totalPracticals]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Get Batch Info (to filter students)
      const { data: batchDetails, error: bErr } = await supabase.from('batches').select('*').eq('id', batchId).single();
      if (bErr) throw bErr;

      // 2. Get All Students in this Batch
      // NOTE: Ensure your 'profiles' table has 'batch' and 'division' columns populated!
      const { data: allStudents, error: sErr } = await supabase
        .from('profiles')
        .select('id, name, enrollment_number, email, avatar_url')
        .eq('batch', batchDetails.batch)
        .eq('division', batchDetails.division)
        .eq('role', 'student')
        .order('enrollment_number', { ascending: true });

      if (sErr) throw sErr;
      if (!allStudents || allStudents.length === 0) {
        setStudents([]);
        return;
      }

      // 3. Get All Submissions for these students and this batch's practicals
      // First, get practical IDs for this batch
      const { data: batchPracs } = await supabase
        .from('batch_practicals')
        .select('id')
        .eq('batch_id', batchId);
      
      const pracIds = batchPracs?.map(p => p.id) || [];

      // Now fetch submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('student_id, practical_id, marks, status')
        .in('practical_id', pracIds);
        // We fetch ALL status (submitted/evaluated) to count progress. Drafts usually don't count as "Done".

      // 4. Calculate Stats for each student
      const analyticsData = allStudents.map(student => {
        const studentSubs = submissions?.filter(s => s.student_id === student.id && (s.status === 'submitted' || s.status === 'evaluated')) || [];
        
        const submittedCount = new Set(studentSubs.map(s => s.practical_id)).size; // Unique submissions
        const totalMarks = studentSubs.reduce((sum, s) => sum + (s.marks || 0), 0);
        
        // Progress %
        const progress = totalPracticals > 0 ? (submittedCount / totalPracticals) * 100 : 0;
        
        // Status Logic
        const isDefaulter = progress < 75; // Logic: Less than 75% submission is a defaulter (You can change this)
        const isCompleted = submittedCount === totalPracticals && totalPracticals > 0;
        const pending = totalPracticals - submittedCount;

        return {
          ...student,
          submittedCount,
          totalMarks,
          progress,
          isDefaulter,
          isCompleted,
          pending
        };
      });

      setStudents(analyticsData);

    } catch (err) {
      console.error("Analytics Error:", err);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // --- CSV Export Functionality ---
  const downloadCSV = () => {
    const headers = ["Roll No", "Name", "Email", "Submitted", "Total Practicals", "Pending", "Total Marks", "Status"];
    
    const rows = students.map(s => [
      s.enrollment_number || "N/A",
      s.name,
      s.email,
      s.submittedCount,
      totalPracticals,
      s.pending,
      s.totalMarks,
      s.isCompleted ? "Completed" : s.isDefaulter ? "Defaulter" : "In Progress"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Batch_${batchId}_Report.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Filtering Logic ---
  const filteredData = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.enrollment_number || '').toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'defaulters') return matchesSearch && s.isDefaulter;
    if (filter === 'completed') return matchesSearch && s.isCompleted;
    return matchesSearch;
  });

  const defaulterCount = students.filter(s => s.isDefaulter).length;
  const completedCount = students.filter(s => s.isCompleted).length;

  if (loading) return <div className="h-64 flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Generating Report...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Users size={16}/> Total Students
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{students.length}</div></CardContent>
        </Card>
        
        <Card className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={16}/> Defaulters (Pending &gt; 25%)
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600 dark:text-red-400">{defaulterCount}</div></CardContent>
        </Card>
        
        <Card className="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 size={16}/> 100% Completed
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</div></CardContent>
        </Card>
      </div>

      {/* 2. Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={(v: any) => setFilter(v)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="defaulters" className="data-[state=active]:text-red-600">Defaulters List</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:text-green-600">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64 w-full">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search by Name or Roll No..." 
               className="pl-9 bg-background" 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
             />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" size="icon" onClick={fetchAnalytics} title="Refresh Data">
                <RefreshCcw size={16} />
             </Button>
             <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={downloadCSV}>
                <Download size={16} /> Export CSV
             </Button>
          </div>
        </div>
      </div>

      {/* 3. The Data Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
               <TableHead className="font-bold w-24">Roll No</TableHead>
               <TableHead className="font-bold">Student Name</TableHead>
               <TableHead className="w-48 font-bold">Submission Progress</TableHead>
               <TableHead className="text-center font-bold">Submitted</TableHead>
               <TableHead className="text-center font-bold">Pending</TableHead>
               <TableHead className="text-center font-bold">Total Marks</TableHead>
               <TableHead className="text-center font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
               <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No students found.</TableCell></TableRow>
            ) : (
              filteredData.map(student => (
                <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-muted-foreground">{student.enrollment_number || '-'}</TableCell>
                  <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                  
                  {/* Progress Bar */}
                  <TableCell>
                     <div className="flex items-center gap-2">
                       <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                               student.progress === 100 ? 'bg-green-500' : 
                               student.progress < 50 ? 'bg-red-500' : 'bg-yellow-500'
                            }`} 
                            style={{ width: `${student.progress}%` }}
                          />
                       </div>
                       <span className="text-xs text-muted-foreground font-mono w-8 text-right">{Math.round(student.progress)}%</span>
                     </div>
                  </TableCell>

                  <TableCell className="text-center font-bold text-foreground">
                    {student.submittedCount} <span className="text-muted-foreground text-xs font-normal">/ {totalPracticals}</span>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {student.pending > 0 ? (
                       <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20">{student.pending}</Badge>
                    ) : (
                       <CheckCircle2 size={16} className="mx-auto text-green-500"/>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center font-mono font-medium">{student.totalMarks}</TableCell>
                  
                  <TableCell className="text-center">
                     {student.isCompleted ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 hover:bg-green-100">Cleared</Badge>
                     ) : student.isDefaulter ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 hover:bg-red-100">Defaulter</Badge>
                     ) : (
                        <Badge variant="secondary">In Progress</Badge>
                     )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}