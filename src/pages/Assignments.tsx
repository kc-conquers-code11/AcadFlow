import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Pencil,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CreateAssignmentModal } from '@/components/teacher/CreateAssignmentModal';
import { toast } from 'sonner';

const StatusPill = ({ status, marks, isOverdue }: { status?: string; marks?: number; isOverdue: boolean }) => {
  if (status === 'evaluated' && marks !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
        <CheckCircle2 size={12} />
        {marks} Marks
      </span>
    );
  }
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Clock size={12} /> Submitted
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <AlertCircle size={12} /> Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      Pending
    </span>
  );
};

export default function Assignments() {
  const { user } = useAuth();
  const [assignmentsBySubject, setAssignmentsBySubject] = useState<any[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('division, batch')
        .eq('id', user!.id)
        .single();

      const { data: subjectData, error } = await supabase
        .from('subjects')
        .select('*, assignments (*)');

      if (error) throw error;

      if (user!.role === 'student') {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user!.id);
        const subMap: Record<string, any> = {};
        subs?.forEach(s => { if (s.assignment_id) subMap[s.assignment_id] = s; });
        setSubmissionsMap(subMap);
      }

      const grouped = (subjectData || []).map((subject: any) => {
        const filteredAssignments = (subject.assignments || []).filter((assignment: any) => {
          if (user!.role === 'teacher' || user!.role === 'hod') {
            return assignment.created_by === user!.id;
          }
          if (user!.role === 'student') {
            if (assignment.target_division &&
              assignment.target_division !== 'All' &&
              assignment.target_division !== profile?.division) {
              return false;
            }
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

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment? All submissions will be lost.")) return;
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
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
      if (error) throw error;
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

  // Count total assignments across all subjects
  const totalAssignments = assignmentsBySubject.reduce((sum, g) => sum + g.assignments.length, 0);

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background animate-in fade-in">
      <div className="space-y-8 max-w-7xl mx-auto p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Assignments</h1>
            <p className="text-muted-foreground">
              {user?.role === 'student' ? 'Track your coursework and submissions.' : 'Manage class assignments and reviews.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assignments..." className="pl-9 bg-card rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {user?.role !== 'student' && (
              <Button onClick={handleCreateNew} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Plus size={18} /> New Assignment
              </Button>
            )}
          </div>
        </header>

        {/* Stats Bar */}
        {totalAssignments > 0 && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{totalAssignments}</strong> assignments</span>
            <span><strong className="text-foreground">{assignmentsBySubject.length}</strong> subjects</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-10">
          {assignmentsBySubject.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No assignments found for you.</p>
            </div>
          ) : (
            assignmentsBySubject.map(({ subject, assignments }) => {
              // Filter assignments by search
              const filtered = assignments.filter((a: any) =>
                !search || a.title.toLowerCase().includes(search.toLowerCase())
              );
              if (filtered.length === 0) return null;

              return (
                <div key={subject.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold text-foreground">{subject.name}</h2>
                    <Badge variant="secondary" className="font-mono text-xs">{subject.code}</Badge>
                    <Badge variant="outline" className="text-xs text-muted-foreground ml-auto">{filtered.length} assignment{filtered.length !== 1 ? 's' : ''}</Badge>
                  </div>

                  <div className="grid gap-3">
                    {filtered.map((assignment: any) => {
                      const deadline = new Date(assignment.deadline);
                      const isOverdue = deadline < new Date() && !submissionsMap[assignment.id]?.submitted_at;
                      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const targetLink = user?.role === 'student'
                        ? `/editor/${assignment.id}`
                        : `/submissions/${assignment.id}`;

                      return (
                        <motion.div
                          key={assignment.id}
                          whileHover={{ x: 3 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          <Card className="group border-border hover:shadow-md hover:border-primary/20 transition-all bg-card">
                            <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <BookOpen size={22} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h3 className="font-bold text-foreground truncate text-sm">{assignment.title}</h3>
                                  {user?.role !== 'student' && (
                                    <div className="flex gap-1">
                                      {assignment.target_division && <Badge variant="secondary" className="text-[9px] h-5 px-1.5">Div {assignment.target_division}</Badge>}
                                      {assignment.target_batch && <Badge variant="secondary" className="text-[9px] h-5 px-1.5">Batch {assignment.target_batch}</Badge>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar size={12} /> {deadline.toLocaleDateString()}</span>
                                  {!isOverdue && daysLeft <= 2 && daysLeft > 0 && <span className="text-amber-500 font-semibold">Due soon</span>}
                                  {isOverdue && <span className="text-red-500 font-semibold">Overdue</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
                                {user?.role === 'student' ? (
                                  <>
                                    <StatusPill status={submissionsMap[assignment.id]?.status} marks={submissionsMap[assignment.id]?.marks} isOverdue={isOverdue} />
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary" asChild>
                                      <Link to={targetLink}><ChevronRight size={20} /></Link>
                                    </Button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleEditAssignment(assignment)} title="Edit">
                                      <Pencil size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => handleDuplicateAssignment(assignment)} title="Duplicate">
                                      <Copy size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteAssignment(assignment.id)} title="Delete">
                                      <Trash2 size={14} />
                                    </Button>
                                    <div className="h-5 w-px bg-border mx-1"></div>
                                    <Button variant="outline" size="sm" className="gap-2 text-xs rounded-lg" asChild>
                                      <Link to={`/submissions/${assignment.id}`}><Users size={14} /> Submissions</Link>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateAssignmentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchAssignments}
        initialValues={editingAssignment}
      />
    </div>
  );
}