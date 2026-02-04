import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Loader2, AlertCircle } from 'lucide-react';
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

interface SubmissionListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practical: any; 
  // UPDATED: Now accepts studentId to open specific evaluation
  onEvaluate: (practicalId: string, studentId: string) => void; 
}

export function SubmissionListModal({ open, onOpenChange, practical, onEvaluate }: SubmissionListModalProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open && practical?.id) {
      fetchList();
    }
  }, [open, practical]);

  const fetchList = async () => {
    setLoading(true);
    try {
      // UPDATED QUERY: Added 'student_id' explicitly to select list
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id, status, marks, submitted_at, practical_id, student_id,
          profiles:student_id (name, enrollment_number)
        `)
        .eq('practical_id', practical.id)
        .order('submitted_at', { ascending: false }); 

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      setSubmissions(data || []);
    } catch (err: any) {
      toast.error("Failed to load submissions list");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = submissions.filter(sub => 
    (sub.profiles?.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (sub.profiles?.enrollment_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <DialogTitle className="text-xl text-foreground">{practical?.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Submissions: {submissions.length} | Max Marks: {practical?.total_points || practical?.maxMarks}
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
                  <TableHead className="text-right font-bold pr-6">Action</TableHead>
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
                        <p>No submissions found for this practical.</p>
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
                          / {practical?.total_points || practical?.maxMarks}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right pr-4">
                        {/* UPDATED CLICK HANDLER: Pass student_id */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onEvaluate(sub.practical_id, sub.student_id)} 
                          className="shadow-sm"
                        >
                          <FileText className="h-4 w-4 mr-2 text-blue-600" />
                          {sub.status === 'evaluated' ? 'Re-Evaluate' : 'View & Grade'}
                        </Button>
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