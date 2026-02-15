import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubmissionListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; // Generic Task Object (Practical or Assignment)
  type: 'practical' | 'assignment'; // To determine query logic
  onEvaluate: (taskId: string, studentId: string) => void;
}

export function SubmissionListModal({ open, onOpenChange, task, type, onEvaluate }: SubmissionListModalProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [redoLoading, setRedoLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open && task?.id) {
      fetchList();
    }
  }, [open, task]);

  const fetchList = async () => {
    setLoading(true);
    try {
      // Dynamic Query based on Type
      const filterKey = type === 'practical' ? 'practical_id' : 'assignment_id';

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id, status, marks, submitted_at, student_id, ${filterKey},
          profiles:student_id (name, enrollment_number)
        `)
        .eq(filterKey, task.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      toast.error("Failed to load submissions list");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedoRequest = async (submissionId: string, studentName: string) => {
    const note = prompt(`Enter reason for Redo request for ${studentName}:`, "Incorrect output, please fix and resubmit.");
    if (note === null) return; // Cancelled

    setRedoLoading(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'redo_requested',
          feedback: note, // Saving note in feedback column temporarily
          marks: 0, // Reset marks
          ai_score: 0 // Reset AI score
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(`Redo requested for ${studentName}`);
      fetchList(); // Refresh list
    } catch (err: any) {
      toast.error("Failed to request redo: " + err.message);
    } finally {
      setRedoLoading(null);
    }
  };

  const filteredList = submissions.filter(sub =>
    (sub.profiles?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (sub.profiles?.enrollment_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const maxMarks = task?.total_points || task?.maxMarks || 20;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-background">

        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/40 pr-14">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <DialogTitle className="text-xl text-foreground">{task?.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Submissions: {submissions.length} | Max Marks: {maxMarks}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Name or Roll No..."
                className="pl-8 bg-background border-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-32 font-bold">Roll No</TableHead>
                  <TableHead className="font-bold">Student Name</TableHead>
                  <TableHead className="text-center font-bold">Submitted At</TableHead>
                  <TableHead className="text-center font-bold">Status</TableHead>
                  <TableHead className="text-center font-bold">Marks</TableHead>
                  <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="animate-spin h-5 w-5" /> Loading submissions...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 opacity-20" />
                        <p>No submissions found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-muted-foreground">
                        {sub.profiles?.enrollment_number || 'N/A'}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        {sub.profiles?.name || 'Unknown Student'}
                      </TableCell>

                      <TableCell className="text-center text-xs text-muted-foreground">
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })
                          : '-'}
                      </TableCell>

                      <TableCell className="text-center">
                        {sub.status === 'evaluated' ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 border-green-200">Graded</Badge>
                        ) : sub.status === 'redo_requested' ? (
                          <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Redo Requested</Badge>
                        ) : sub.status === 'submitted' ? (
                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-50 border-blue-100">Submitted</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold text-foreground">
                        {sub.marks !== null ? (
                          <span className={sub.status === 'evaluated' ? "text-green-600 dark:text-green-400" : ""}>
                            {sub.marks}
                          </span>
                        ) : '-'}
                        <span className="text-muted-foreground font-normal text-xs ml-1">
                          / {maxMarks}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          {/* EVALUATE BUTTON */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEvaluate(task.id, sub.student_id)}
                            className="shadow-sm"
                          >
                            <FileText className="h-4 w-4 mr-2 text-blue-600" />
                            {sub.status === 'evaluated' ? 'Re-Evaluate' : 'View & Grade'}
                          </Button>

                          {/* REDO BUTTON */}
                          {(sub.status === 'submitted' || sub.status === 'evaluated') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 border-orange-500/30"
                                    disabled={redoLoading === sub.id}
                                    onClick={() => handleRedoRequest(sub.id, sub.profiles?.name)}
                                  >
                                    {redoLoading === sub.id ? <Loader2 className="animate-spin h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Request Redo (Unlock for Student)</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}