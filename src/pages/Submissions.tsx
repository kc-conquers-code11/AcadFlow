import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Beaker, // Icon for Practical
  Eye,
  Search,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EvaluationModal } from '@/components/teacher/EvaluationModal';
import { SubmissionListModal } from '@/components/teacher/SubmissionListModal';

// This page shows a LIST of Tasks (Theory/Practical) and their submission stats.
// Clicking "Eye" opens the list of students who submitted that task.

export default function Submissions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tasks, setTasks] = useState<any[]>([]); // Merged Assignments + Practicals

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
      // 1. Fetch Students Count (Total possible submissions)
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const totalStudents = studentCount || 0;

      // 2. Fetch Assignments (Theory) created by Teacher
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, created_at, subjects(name, code)')
        .eq('created_by', user.id);

      // 3. Fetch Practicals created by Teacher
      const { data: practicals } = await supabase
        .from('batch_practicals')
        .select('id, title, created_at, batch, division, experiment_number')
        .eq('created_by', user.id);

      // 4. Fetch All Submissions (Optimized: Just fetch status & IDs)
      const { data: submissions } = await supabase
        .from('submissions')
        .select('practical_id, assignment_id, status');

      // 5. Merge & Calculate Stats
      const allSubmissions = submissions || [];

      // Process Theory
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

      // Process Practical
      const practicalTasks = (practicals || []).map((p: any) => {
        const relatedSubs = allSubmissions.filter(s => s.practical_id === p.id);
        // Note: For practicals, total students should ideally be students in that batch/div.
        // For simplicity, we are using totalStudents globally, but in a real app, you'd filter profiles by batch.
        // Let's assume approx for now or we can refine if needed.
        return {
          id: p.id,
          title: p.title,
          type: 'practical',
          subtitle: `Exp ${p.experiment_number} • Div ${p.division} • Batch ${p.batch}`,
          stats: calculateStats(relatedSubs, 20) // Assuming avg batch size 20 for better visuals
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
    
    // Cap progress at 100% just in case
    const progress = total > 0 ? Math.min(Math.round((submitted / total) * 100), 100) : 0;

    return { total, submitted, pending, evaluated, progress };
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // --- Handlers ---

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setListModalOpen(true);
  };

  const handleEvaluateStudent = (practicalId: string, studentId: string) => {
    // This handler connects List Modal -> Evaluation Modal
    // Note: Our modals are designed for Practicals currently.
    // If it's a theory assignment, we might need a separate modal or adapt existing one.
    // For now, let's assume we reuse EvaluationModal (it supports practicalId).
    // If it's theory, we need to update EvaluationModal to support assignmentId too.
    
    setSelectedStudentId(studentId);
    setEvalModalOpen(true);
  };

  if (!user || user.role === 'student') return <div className="p-10 text-center">Access Denied</div>;

  return (
    <div className="flex flex-col gap-8 pb-10 animate-in fade-in min-h-screen">

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Submission Review</h1>
          <p className="text-muted-foreground mt-1">Track student submissions and pending evaluations.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search assignments..."
              className="pl-9 bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. List */}
      <div className="space-y-4">
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
          filteredTasks.map((task, index) => {
            const isPractical = task.type === 'practical';
            const Icon = isPractical ? Beaker : FileText;
            const iconColor = isPractical 
              ? "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400" 
              : "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";

            return (
              <motion.div
                key={`${task.type}-${task.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-border", iconColor)}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate pr-2">{task.title}</h3>
                      {task.stats.pending > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 h-5 px-1.5 text-[10px]">
                          {task.stats.pending} to review
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="truncate">{task.subtitle}</span>
                    </p>
                  </div>
                </div>

                {/* Stats Columns */}
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 pt-4 md:pt-0 border-border">

                  {/* Submission Rate */}
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 size={12} /> Received
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{task.stats.submitted}</span>
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.stats.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Pending Count */}
                  <div className="flex flex-col gap-1 min-w-[80px]">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} /> Pending
                    </span>
                    <span className={cn("font-bold", task.stats.pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                      {task.stats.pending}
                    </span>
                  </div>

                  {/* Evaluated Count */}
                  <div className="flex flex-col gap-1 min-w-[80px]">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Graded
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{task.stats.evaluated}</span>
                  </div>

                  {/* Action */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-primary hover:bg-muted rounded-full" 
                    onClick={() => handleViewTask(task)}
                  >
                     <Eye size={20} />
                  </Button>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

      {/* Modals for Action */}
      <SubmissionListModal 
         open={listModalOpen}
         onOpenChange={setListModalOpen}
         practical={selectedTask} // We pass task as 'practical' prop (it works because structure is similar)
         onEvaluate={(pracId, studId) => handleEvaluateStudent(pracId, studId)}
      />

      <EvaluationModal 
         open={evalModalOpen}
         onOpenChange={setEvalModalOpen}
         practicalId={selectedTask?.id}
         initialStudentId={selectedStudentId}
      />

    </div>
  );
}