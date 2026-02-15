import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Beaker,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EvaluationModal } from '@/components/teacher/EvaluationModal';
import { SubmissionListModal } from '@/components/teacher/SubmissionListModal';
import { useNavigate } from 'react-router-dom';

export default function Submissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all');

  const [tasks, setTasks] = useState<any[]>([]);

  // Modal States
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'hod')) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const totalStudents = studentCount || 0;

      // 1. Fetch Assignments (Linked to Subjects)
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, created_at, subjects(name, code)')
        .eq('created_by', user.id);

      // 2. Fetch Practicals (Linked to Batches)
      // FIX: Added 'batches!inner(id)' to filter out practicals whose batch is deleted
      const { data: practicals } = await supabase
        .from('batch_practicals')
        .select('id, title, created_at, batch, division, experiment_number, batches!inner(id)')
        .eq('created_by', user.id);

      const { data: submissions } = await supabase
        .from('submissions')
        .select('practical_id, assignment_id, status');

      const allSubmissions = submissions || [];

      const theoryTasks = (assignments || []).map((a: any) => {
        const relatedSubs = allSubmissions.filter(s => s.assignment_id === a.id);
        return {
          id: a.id,
          title: a.title,
          type: 'theory',
          subtitle: `${a.subjects?.code} • ${a.subjects?.name}`,
          stats: calculateStats(relatedSubs, totalStudents)
        };
      });

      const practicalTasks = (practicals || []).map((p: any) => {
        const relatedSubs = allSubmissions.filter(s => s.practical_id === p.id);
        return {
          id: p.id,
          title: p.title,
          type: 'practical',
          subtitle: `Exp ${p.experiment_number} • Div ${p.division} • Batch ${p.batch}`,
          stats: calculateStats(relatedSubs, 20) // Assuming ~20 students per batch
        };
      });

      setTasks([...theoryTasks, ...practicalTasks]);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subs: any[], total: number) => {
    const submitted = subs.length;
    const pending = subs.filter(s => s.status === 'submitted').length;
    const evaluated = subs.filter(s => s.status === 'evaluated').length;
    const progress = total > 0 ? Math.min(Math.round((submitted / total) * 100), 100) : 0;
    return { total, submitted, pending, evaluated, progress };
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === 'pending') return matchesSearch && t.stats.pending > 0;
      if (filter === 'evaluated') return matchesSearch && t.stats.evaluated > 0;
      return matchesSearch;
    });
  }, [tasks, searchQuery, filter]);

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setListModalOpen(true);
  };

  const handleEvaluateStudent = (practicalId: string, studentId: string) => {
    setSelectedStudentId(studentId);
    setEvalModalOpen(true);
  };

  if (!user || user.role === 'student') return <div className="p-10 text-center text-muted-foreground">Access Denied</div>;

  const totalSubmissions = tasks.reduce((sum, t) => sum + t.stats.submitted, 0);
  const totalToReview = tasks.reduce((sum, t) => sum + t.stats.pending, 0);

  return (
    <div className="min-h-screen bg-background animate-in fade-in">
      <div className="max-w-5xl mx-auto p-8 space-y-8">

        {/* Header */}
        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Submission Review</h1>
              <p className="text-muted-foreground mt-2">Track student submissions and pending evaluations.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="h-8 px-3 text-sm border-border text-muted-foreground">
                Submissions: <span className="font-bold text-foreground ml-1">{totalSubmissions}</span>
              </Badge>
              <Badge className="h-8 px-3 text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/10">
                To Review: <span className="font-bold ml-1">{totalToReview}</span>
              </Badge>
            </div>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search student or roll no..."
              className="pl-9 bg-background border-border h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['all', 'pending', 'evaluated'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Evaluated'}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No tasks found.</p>
            </div>
          ) : (
            /* Table Layout */
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Submitted At</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, index) => {
                    const isPractical = task.type === 'practical';
                    const Icon = isPractical ? Beaker : FileText;

                    return (
                      <motion.tr
                        key={`${task.type}-${task.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                              isPractical
                                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            )}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{task.subtitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <BarChart3 size={14} className="text-muted-foreground" />
                              <span className="text-sm text-foreground font-semibold">{task.stats.submitted}</span>
                              <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${task.stats.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-4">
                            <span className="flex items-center gap-1.5 text-xs">
                              <Clock size={12} className="text-amber-500" />
                              <span className={cn("font-bold", task.stats.pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{task.stats.pending}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{task.stats.evaluated}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleViewTask(task)}
                          >
                            <Eye size={16} className="mr-1.5" /> View
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTasks.length === 0 && (
                <div className="py-16 text-center text-muted-foreground italic">
                  No submissions found
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <SubmissionListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        task={selectedTask}
        type={selectedTask?.type === 'practical' ? 'practical' : 'assignment'}
        onEvaluate={(pracId, studId) => handleEvaluateStudent(pracId, studId)}
      />

      <EvaluationModal
        open={evalModalOpen}
        onOpenChange={setEvalModalOpen}
        taskId={selectedTask?.id}
        type={selectedTask?.type === 'practical' ? 'practical' : 'assignment'}
        initialStudentId={selectedStudentId}
      />
    </div>
  );
}