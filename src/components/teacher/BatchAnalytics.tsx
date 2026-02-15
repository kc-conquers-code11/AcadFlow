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
import { Search, Download, AlertTriangle, CheckCircle2, Users, RefreshCcw, TrendingUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BatchAnalyticsProps {
  batchId: string;
  totalPracticals: number;
}

export function BatchAnalytics({ batchId, totalPracticals }: BatchAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'defaulters' | 'completed'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (batchId) {
      fetchAnalytics();
    }
  }, [batchId, totalPracticals]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Get Batch Info (Div/Batch Text)
      const { data: batchDetails, error: bErr } = await supabase.from('batches').select('*').eq('id', batchId).single();
      if (bErr) throw bErr;

      // 2. Get Students assigned to this batch
      const { data: batchStudents, error: sErr } = await supabase
        .from('batch_students')
        .select('student_id, profiles:student_id(*)')
        .eq('batch_id', batchId);

      if (sErr) throw sErr;

      const allStudents = batchStudents?.map((bs: any) => bs.profiles).filter(Boolean) || [];

      if (allStudents.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // 3. Get Practical IDs for this batch
      const { data: batchPracs } = await supabase
        .from('batch_practicals')
        .select('id')
        .eq('division', batchDetails.division)
        .eq('batch', batchDetails.batch)
        .neq('status', 'archived');

      const pracIds = batchPracs?.map(p => p.id) || [];

      // 4. Get Submissions
      let submissions: any[] = [];
      if (pracIds.length > 0) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('student_id, practical_id, marks, status')
          .in('practical_id', pracIds)
          .in('status', ['submitted', 'evaluated']);

        submissions = subs || [];
      }

      // 5. Compute Stats
      const analyticsData = allStudents.map(student => {
        const studentSubs = submissions.filter(s => s.student_id === student.id);

        // Count unique practicals submitted
        const submittedCount = new Set(studentSubs.map(s => s.practical_id)).size;
        const totalMarks = studentSubs.reduce((sum, s) => sum + (s.marks || 0), 0);

        const progress = totalPracticals > 0 ? (submittedCount / totalPracticals) * 100 : 0;

        // Logic: 100% means Completed
        const isCompleted = submittedCount === totalPracticals && totalPracticals > 0;
        // Logic: Less than 50% means Defaulter
        const isDefaulter = progress < 50;
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

      // Sort by Enrollment Number
      analyticsData.sort((a, b) => (a.enrollment_number || '').localeCompare(b.enrollment_number || ''));

      setStudents(analyticsData);

    } catch (err) {
      console.error("Analytics Error:", err);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ["Roll No", "Name", "Submitted Count", "Pending", "Total Marks", "Status"];
    const rows = students.map(s => [
      s.enrollment_number || "N/A",
      s.name,
      s.submittedCount,
      s.pending,
      s.totalMarks,
      s.isCompleted ? "Completed" : s.isDefaulter ? "Defaulter" : "In Progress"
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Analytics_Batch_${batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = students.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.enrollment_number || '').toLowerCase().includes(search.toLowerCase());

    if (filter === 'defaulters') return matchesSearch && s.isDefaulter;
    if (filter === 'completed') return matchesSearch && s.isCompleted;
    return matchesSearch;
  });

  const defaulterCount = students.filter(s => s.isDefaulter).length;
  const completedCount = students.filter(s => s.isCompleted).length;
  const avgProgress = students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length) : 0;

  if (loading) return <div className="h-64 flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Generating Report...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">Total</Badge>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{students.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Total Students</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <Badge variant="outline" className="text-xs border-red-200 text-red-500 dark:border-red-800">&lt;50%</Badge>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-red-600 dark:text-red-400">{defaulterCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Defaulters</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs border-green-200 text-green-500 dark:border-green-800">100%</Badge>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-green-600 dark:text-green-400">{completedCount}</div>
            <p className="text-sm text-muted-foreground mt-1">All Cleared</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-500" />
              </div>
              <Badge variant="secondary" className="text-xs">Avg</Badge>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-foreground">{avgProgress}%</div>
            <p className="text-sm text-muted-foreground mt-1">Average Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={(v: any) => setFilter(v)}>
          <TabsList className="bg-muted/50 rounded-lg p-1">
            <TabsTrigger value="all" className="rounded-md text-sm px-4">All Students</TabsTrigger>
            <TabsTrigger value="defaulters" className="rounded-md text-sm px-4 data-[state=active]:text-red-600">Defaulters</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-md text-sm px-4 data-[state=active]:text-green-600">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 bg-background rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" onClick={fetchAnalytics} title="Refresh Data" className="rounded-xl">
              <RefreshCcw size={16} />
            </Button>
            <Button variant="outline" className="gap-2 w-full sm:w-auto rounded-xl" onClick={downloadCSV}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold w-36 text-sm">Enrollment</TableHead>
              <TableHead className="font-bold text-sm">Name</TableHead>
              <TableHead className="w-52 font-bold text-sm">Progress</TableHead>
              <TableHead className="text-center font-bold text-sm">Submitted</TableHead>
              <TableHead className="text-center font-bold text-sm">Pending</TableHead>
              <TableHead className="text-center font-bold text-sm">Total Marks</TableHead>
              <TableHead className="text-center font-bold text-sm">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground text-sm">No matching students found.</TableCell></TableRow>
            ) : (
              filteredData.map(student => (
                <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-muted-foreground text-sm py-4">{student.enrollment_number || '-'}</TableCell>
                  <TableCell className="font-medium text-foreground text-sm py-4">{student.name}</TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${student.progress === 100 ? 'bg-green-500' :
                              student.progress < 50 ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-10 text-right font-medium">{Math.round(student.progress)}%</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center text-sm font-bold text-foreground py-4">
                    {student.submittedCount} <span className="text-muted-foreground text-xs font-normal">/ {totalPracticals}</span>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    {student.pending > 0 ? (
                      <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 font-medium">{student.pending}</Badge>
                    ) : (
                      <CheckCircle2 size={18} className="mx-auto text-green-500" />
                    )}
                  </TableCell>

                  <TableCell className="text-center font-mono font-semibold text-sm py-4">{student.totalMarks}</TableCell>

                  <TableCell className="text-center py-4">
                    {student.isCompleted ? (
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/10 font-medium">All Cleared</Badge>
                    ) : student.isDefaulter ? (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 font-medium">Defaulter</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium">In Progress</Badge>
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