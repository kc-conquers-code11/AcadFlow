// Inside src/components/teacher/EvaluationModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface EvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practicalId: string | null;
}

export function EvaluationModal({ open, onOpenChange, practicalId }: EvaluationModalProps) {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (open && practicalId) {
      fetchSubmissions();
    }
  }, [open, practicalId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // FIX: Ensure we select related Practical details (title, max_marks) correctly
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:student_id (name, enrollment_number, division, batch, year, department),
          practical:practical_id (title, rubrics, total_points, experiment_number) 
        `)
        .eq('practical_id', practicalId) // FIX: Using correct column
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      
      setSubmissions(data || []);
      setCurrentIndex(0);
      
      if (data && data.length > 0) {
        loadSubmissionState(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionState = (sub: any) => {
    setRubricScores(sub.rubric_scores || {});
    setFeedback(sub.feedback || '');
  };

  const handleNext = () => {
    if (currentIndex < submissions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      loadSubmissionState(submissions[next]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      loadSubmissionState(submissions[prev]);
    }
  };

 

  const handleSaveGrade = async () => {
    const sub = submissions[currentIndex];
    if (!sub) return;

    const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);
    
    // --- ROBUST MAX MARKS CALCULATION ---
    let maxPossible = sub.practical?.total_points || 0;

    // Fallback: If DB says 0, calculate sum from Rubrics
    if (maxPossible === 0 && sub.practical?.rubrics?.length > 0) {
      maxPossible = sub.practical.rubrics.reduce((sum: number, r: any) => sum + (Number(r.max_marks) || 0), 0);
    }

    // Fallback 2: If still 0 (Manual Grading mode), assume 100 to prevent blocking
    if (maxPossible === 0) {
       maxPossible = 100; 
    }

    if (totalScore > maxPossible) {
      toast.error(`Total score (${totalScore}) cannot exceed max marks (${maxPossible})`);
      return;
    }
    // -------------------------------------

    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          marks: totalScore,
          rubric_scores: rubricScores,
          feedback: feedback,
          status: 'evaluated',
          evaluated_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      if (error) throw error;
      
      toast.success("Graded Successfully");
      
      // Update local state
      const newList = [...submissions];
      newList[currentIndex] = { ...sub, status: 'evaluated', marks: totalScore, rubric_scores: rubricScores, feedback };
      setSubmissions(newList);

      if (currentIndex < submissions.length - 1) handleNext();

    } catch (err) {
      console.error(err);
      toast.error("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const currentSubmission = submissions[currentIndex];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100">
        
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 bg-white">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">No pending submissions found.</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
             {/* Header */}
            <DialogHeader className="px-6 py-3 border-b flex flex-row items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-4">
                 <DialogTitle className="text-lg">
                    {currentSubmission.profiles?.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({currentSubmission.profiles?.enrollment_number})
                    </span>
                 </DialogTitle>
                 <Badge variant="outline">Pending Eval</Badge>
               </div>
               
               <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <span className="text-sm font-medium w-16 text-center">
                   {currentIndex + 1} / {submissions.length}
                 </span>
                 <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === submissions.length - 1}>
                   <ChevronRight className="h-4 w-4" />
                 </Button>
                 <div className="h-6 w-px bg-slate-200 mx-2" />
                 <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                   <X className="h-4 w-4" />
                 </Button>
               </div>
            </DialogHeader>

            <div className="flex flex-1 overflow-hidden">
               {/* View Area (PDF/Content) */}
               <ScrollArea className="flex-1 bg-slate-200/50 p-8 flex justify-center">
                  <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-[20mm]">
                     {/* Letterhead */}
                     <div className="border-b-2 border-slate-900 pb-4 mb-8 text-center">
                        <h2 className="text-xl font-bold uppercase font-serif">Vasantdada Patil Pratishthan’s College of Engineering</h2>
                        <p className="text-xs uppercase tracking-widest mt-1">Department of {currentSubmission.profiles?.department || 'Engineering'}</p>
                     </div>

                     {/* Student Info */}
                     <div className="grid grid-cols-2 gap-4 text-sm mb-8 p-4 bg-slate-50 border">
                        <p><span className="text-slate-500 w-20 inline-block">Name:</span> <strong>{currentSubmission.profiles?.name}</strong></p>
                        <p><span className="text-slate-500 w-20 inline-block">Exp No:</span> <strong>{currentSubmission.practical?.experiment_number}</strong></p>
                        <p><span className="text-slate-500 w-20 inline-block">Roll No:</span> <strong>{currentSubmission.profiles?.enrollment_number}</strong></p>
                        <p><span className="text-slate-500 w-20 inline-block">Batch:</span> <strong>{currentSubmission.profiles?.division}-{currentSubmission.profiles?.batch}</strong></p>
                     </div>

                     {/* Answer Content */}
                     <div className="mb-10">
                        <h3 className="text-xs font-bold uppercase text-slate-400 border-b mb-4 pb-1">Submission</h3>
                        {typeof currentSubmission.content === 'object' ? (
                           <div className="space-y-4">
                              {currentSubmission.content.code && (
                                <div className="bg-slate-50 p-4 rounded border text-xs font-mono whitespace-pre-wrap break-all">
                                   {currentSubmission.content.code}
                                </div>
                              )}
                              {currentSubmission.content.text && (
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: currentSubmission.content.text}} />
                              )}
                           </div>
                        ) : (
                           <div className="whitespace-pre-wrap font-mono text-sm">{currentSubmission.content}</div>
                        )}
                     </div>
                  </div>
               </ScrollArea>

               {/* Grading Sidebar */}
               <div className="w-[350px] bg-white border-l flex flex-col shadow-xl z-10">
                  <div className="p-4 bg-slate-50 border-b font-semibold text-sm">Grading</div>
                  <ScrollArea className="flex-1 p-5">
                     <div className="space-y-6">
                        {currentSubmission.practical?.rubrics?.map((r: any) => (
                           <div key={r.id} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                 <span>{r.criteria}</span>
                                 <span className="text-muted-foreground text-xs">{rubricScores[r.id] || 0}/{r.max_marks}</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" max={r.max_marks} 
                                value={rubricScores[r.id] || 0}
                                onChange={(e) => setRubricScores({...rubricScores, [r.id]: parseInt(e.target.value)})}
                                className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                              />
                           </div>
                        ))}
                        
                        {!currentSubmission.practical?.rubrics?.length && (
                           <div className="text-sm text-slate-500 italic text-center p-4 border border-dashed">No rubrics defined.</div>
                        )}

                        <div className="space-y-2 pt-4 border-t">
                           <Label>Feedback</Label>
                           <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Good work..." />
                        </div>
                     </div>
                  </ScrollArea>

                  <div className="p-4 border-t bg-slate-50">
                     <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-slate-600">Total</span>
                        <span className="text-2xl font-bold text-primary">{Object.values(rubricScores).reduce((a,b)=>a+b,0)}</span>
                     </div>
                     <Button className="w-full" onClick={handleSaveGrade} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                        Submit Grade
                     </Button>
                  </div>
               </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}