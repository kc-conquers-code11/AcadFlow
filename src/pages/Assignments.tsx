import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Loader2,
  Plus,
  Users,
  Trash2,
  Copy,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateAssignmentModal } from '@/components/teacher/CreateAssignmentModal'; 
import { toast } from 'sonner';

const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-slate-950 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />
);

const StatusPill = ({ status, marks, isOverdue }: { status?: string; marks?: number; isOverdue: boolean }) => {
  if (status === 'evaluated' && marks !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle2 size={12} />
        {marks} Marks
      </span>
    );
  }
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
        <Clock size={12} /> Submitted
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
        <AlertCircle size={12} /> Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
      Pending
    </span>
  );
};

export default function Assignments() {
  const { user } = useAuth();
  const [assignmentsBySubject, setAssignmentsBySubject] = useState<any[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // 1. Get User Profile for filtering
      const { data: profile } = await supabase
        .from('profiles')
        .select('division, batch')
        .eq('id', user!.id)
        .single();

      // 2. Fetch Subjects and Assignments
      // Logic: Hum subjects fetch karenge, lekin unke andar ke assignments par filter lagayenge
      const { data: subjectData, error } = await supabase
        .from('subjects')
        .select('*, assignments (*)');

      if (error) throw error;

      // 3. Fetch Submissions if student
      if (user!.role === 'student') {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user!.id);
        const subMap: Record<string, any> = {};
        subs?.forEach(s => { if(s.assignment_id) subMap[s.assignment_id] = s; });
        setSubmissionsMap(subMap);
      }

      // 4. MAIN FILTERING LOGIC
      const grouped = (subjectData || []).map((subject: any) => {
        const filteredAssignments = (subject.assignments || []).filter((assignment: any) => {
          
          // --- TEACHER FILTER: Only show what they created ---
          if (user!.role === 'teacher' || user!.role === 'hod') {
            return assignment.created_by === user!.id;
          }

          // --- STUDENT FILTER: Only show what matches their Div/Batch ---
          if (user!.role === 'student') {
             // Division Check
             if (assignment.target_division && 
                 assignment.target_division !== 'All' && 
                 assignment.target_division !== profile?.division) {
                 return false;
             }
             // Batch Check
             if (assignment.target_batch && 
                 assignment.target_batch !== 'All' && 
                 assignment.target_batch !== profile?.batch) {
                 return false;
             }
             return true;
          }
          
          return false;
        }).sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        return { subject, assignments: filteredAssignments };
      }).filter((group: any) => group.assignments.length > 0);

      setAssignmentsBySubject(grouped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  // --- TEACHER ACTIONS ---

  const handleDeleteAssignment = async (id: string) => {
      if(!confirm("Are you sure you want to delete this assignment? All submissions will be lost.")) return;
      try {
          const { error } = await supabase.from('assignments').delete().eq('id', id);
          if(error) throw error;
          toast.success("Assignment deleted");
          fetchAssignments();
      } catch (err) {
          toast.error("Failed to delete");
      }
  };

  const handleDuplicateAssignment = async (assignment: any) => {
      try {
          const { id, created_at, ...rest } = assignment;
          const { error } = await supabase.from('assignments').insert([{
              ...rest,
              title: `${rest.title} (Copy)`,
              created_by: user?.id
          }]);
          if(error) throw error;
          toast.success("Assignment duplicated");
          fetchAssignments();
      } catch (err) {
          toast.error("Failed to duplicate");
      }
  };

  const handleEditAssignment = (assignment: any) => {
      setEditingAssignment(assignment);
      setCreateModalOpen(true);
  };

  const handleCreateNew = () => {
      setEditingAssignment(null);
      setCreateModalOpen(true);
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="relative min-h-screen pb-20 animate-in fade-in">
      <GridPattern />
      <div className="space-y-8 max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === 'student' ? 'Track your coursework and submissions.' : 'Manage class assignments and reviews.'}
            </p>
          </div>
          {user?.role !== 'student' && (
            <Button onClick={handleCreateNew} className="gap-2 shadow-sm">
              <Plus size={18} /> New Assignment
            </Button>
          )}
        </div>

        <div className="space-y-12">
          {assignmentsBySubject.length === 0 ? (
              <div className="text-center py-20 bg-white/50 border border-dashed border-slate-300 rounded-xl">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-2"/>
                  <p className="text-slate-500">No assignments found for you.</p>
              </div>
          ) : (
              assignmentsBySubject.map(({ subject, assignments }) => (
                <div key={subject.id} className="space-y-4">
                  <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                    <h2 className="text-xl font-bold text-foreground">{subject.name}</h2>
                    <Badge variant="outline" className="font-mono text-[10px]">{subject.code}</Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {assignments.map((assignment: any) => {
                      const deadline = new Date(assignment.deadline);
                      const isOverdue = deadline < new Date() && !submissionsMap[assignment.id]?.submitted_at;
                      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const targetLink = user?.role === 'student' 
                        ? `/editor/${assignment.id}` 
                        : `/submissions/${assignment.id}`;

                      return (
                        <motion.div 
                          key={assignment.id}
                          whileHover={{ x: 4 }}
                          className="group bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition-all"
                        >
                          <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                            <BookOpen size={22} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-foreground truncate">{assignment.title}</h3>
                              {user?.role !== 'student' && (
                                <div className="flex gap-1">
                                    {assignment.target_division && <Badge variant="secondary" className="text-[9px] h-4">Div {assignment.target_division}</Badge>}
                                    {assignment.target_batch && <Badge variant="secondary" className="text-[9px] h-4">Batch {assignment.target_batch}</Badge>}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={12}/> {deadline.toLocaleDateString()}</span>
                              {!isOverdue && daysLeft <= 2 && <span className="text-amber-600 font-medium">Due soon</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
                            {user?.role === 'student' ? (
                              <>
                                <StatusPill status={submissionsMap[assignment.id]?.status} marks={submissionsMap[assignment.id]?.marks} isOverdue={isOverdue} />
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary" asChild>
                                  <Link to={targetLink}><ChevronRight size={20} /></Link>
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                  {/* TEACHER ACTIONS */}
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEditAssignment(assignment)} title="Edit">
                                      <Pencil size={14} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => handleDuplicateAssignment(assignment)} title="Duplicate">
                                      <Copy size={14} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteAssignment(assignment.id)} title="Delete">
                                      <Trash2 size={14} />
                                  </Button>
                                  <div className="h-4 w-px bg-border mx-1"></div>
                                  <Button variant="outline" size="sm" className="gap-2 text-xs" asChild>
                                      <Link to={`/submissions/${assignment.id}`}><Users size={14} /> Submissions</Link>
                                  </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      
      <CreateAssignmentModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
        onSuccess={fetchAssignments}
        initialValues={editingAssignment} // Pass editing data
      />
    </div>
  );
}