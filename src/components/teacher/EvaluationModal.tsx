import { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, X, Printer, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface EvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practicalId: string | null;
  initialStudentId?: string | null;
}

export function EvaluationModal({ open, onOpenChange, practicalId, initialStudentId }: EvaluationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const [teacherName, setTeacherName] = useState('Faculty');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  // 1. Fetch Teacher Name
  useEffect(() => {
    const getTeacherProfile = async () => {
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        if (data?.name) setTeacherName(data.name);
      }
    };
    getTeacherProfile();
  }, [user]);

  // 2. Fetch Submissions
  useEffect(() => {
    if (open && practicalId) {
      fetchSubmissions();
    }
  }, [open, practicalId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:student_id (name, enrollment_number, division, batch, year, department),
          practical:practical_id (title, rubrics, total_points, experiment_number) 
        `)
        .eq('practical_id', practicalId)
        .in('status', ['submitted', 'evaluated'])
        .order('profiles(enrollment_number)', { ascending: true });

      if (error) throw error;

      const subList = data || [];
      setSubmissions(subList);

      let targetIndex = 0;
      if (initialStudentId) {
        const idx = subList.findIndex((s: any) => s.student_id === initialStudentId);
        if (idx !== -1) targetIndex = idx;
      }

      setCurrentIndex(targetIndex);

      if (subList.length > 0) {
        loadSubmissionState(subList[targetIndex]);
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

  const currentSubmission = submissions[currentIndex];

  const displayMaxMarks = useMemo(() => {
    if (!currentSubmission?.practical) return 0;
    let total = currentSubmission.practical.total_points || 0;
    if (total === 0 && currentSubmission.practical.rubrics) {
      total = currentSubmission.practical.rubrics.reduce((sum: number, r: any) => sum + (Number(r.max_marks) || 0), 0);
    }
    return total === 0 ? 20 : total;
  }, [currentSubmission]);

  const handleSaveGrade = async () => {
    if (!currentSubmission) return;
    const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);

    if (totalScore > displayMaxMarks) {
      toast.error(`Score (${totalScore}) exceeds max (${displayMaxMarks})`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          marks: totalScore,
          rubric_scores: rubricScores,
          feedback: feedback,
          status: 'evaluated',
          evaluated_at: new Date().toISOString(),
          grader_id: user?.id // Save who graded it
        })
        .eq('id', currentSubmission.id);

      if (error) throw error;
      toast.success("Graded Successfully");

      const newList = [...submissions];
      newList[currentIndex] = { ...currentSubmission, status: 'evaluated', marks: totalScore, rubric_scores: rubricScores, feedback };
      setSubmissions(newList);
    } catch (err) {
      toast.error("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups to print.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${currentSubmission.profiles?.name}_${currentSubmission.practical?.experiment_number}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
             body { font-family: 'Inter', sans-serif; background: #fff; }
             @page { size: A4; margin: 0; }
             @media print {
               body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
               .no-print { display: none; }
               .break-inside-avoid { break-inside: avoid; }
             }
          </style>
        </head>
        <body class="flex justify-center p-0 m-0">
          <div class="w-[210mm] min-h-[297mm] p-[15mm] flex flex-col">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  const renderContent = () => {
    if (!currentSubmission) return null;

    let content = currentSubmission.content;
    let parsed: { code?: string, text?: string } | null = null;

    if (typeof content === 'string' && (content.trim().startsWith('{'))) {
      try { parsed = JSON.parse(content); } catch (e) { /* ignore */ }
    } else if (typeof content === 'object' && content !== null) {
      parsed = content;
    }

    if (parsed) {
      return (
        <div className="space-y-6">
          {parsed.text && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Theory / Write-up</h4>
              <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: parsed.text }} />
            </div>
          )}
          {parsed.code && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400">Source Code</h4>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs font-mono whitespace-pre-wrap break-all shadow-sm">
                {parsed.code}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="whitespace-pre-wrap font-mono text-sm text-slate-800">
        {typeof content === 'string' ? content : JSON.stringify(content)}
      </div>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100 dark:bg-zinc-900 [&>button]:hidden">

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 bg-white dark:bg-zinc-950">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">No pending submissions found.</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="px-6 py-3 border-b flex flex-row items-center justify-between bg-white dark:bg-zinc-950 shrink-0">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-lg text-foreground">
                  {currentSubmission.profiles?.name}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({currentSubmission.profiles?.enrollment_number})
                  </span>
                </DialogTitle>
                {currentSubmission.status === 'evaluated' ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Graded</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="hidden md:flex gap-2">
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>

                <div className="h-6 w-px bg-border mx-2" />

                <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-16 text-center text-foreground">
                  {currentIndex + 1} / {submissions.length}
                </span>
                <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === submissions.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-border mx-2" />
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex flex-1 overflow-hidden">
              {/* View Area (PDF) */}
              <ScrollArea className="flex-1 bg-slate-200/50 dark:bg-zinc-900/50 p-8 flex justify-center">
                <div id="printable-area" className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl p-[15mm] relative flex flex-col">

                  <div className="mb-6 border-b-2 border-slate-900 pb-2">
                    <img
                      src="/images/letterhead.jpg"
                      alt="Letterhead"
                      className="w-full max-h-32 object-contain block mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML += '<div class="text-center font-bold text-xl uppercase py-4 border-b">College Department Header</div>';
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm mb-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                      <span className="text-slate-500 font-medium">Student Name</span>
                      <span className="font-bold">{currentSubmission.profiles?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                      <span className="text-slate-500 font-medium">Experiment</span>
                      <span className="font-bold">{currentSubmission.practical?.experiment_number}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                      <span className="text-slate-500 font-medium">Roll No</span>
                      <span className="font-bold">{currentSubmission.profiles?.enrollment_number}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                      <span className="text-slate-500 font-medium">Div / Batch</span>
                      <span className="font-bold">
                        {currentSubmission.profiles?.division} / {currentSubmission.profiles?.batch}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 text-center">
                    <h2 className="text-lg font-bold underline decoration-slate-400 underline-offset-4">
                      {currentSubmission.practical?.title}
                    </h2>
                  </div>

                  <div className="mb-10 min-h-[400px]">
                    {renderContent()}
                  </div>

                  {/* FOOTER SECTION */}
                  <div className="mt-auto">

                    {/* --- NEW: RUBRICS TABLE --- */}
                    {currentSubmission.practical?.rubrics?.length > 0 && (
                      <div className="mb-8 break-inside-avoid">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1">Evaluation Details</h4>
                        <table className="w-full text-sm border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700">
                              <th className="border border-slate-300 px-3 py-2 text-left font-semibold w-12">Sr.</th>
                              <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Assessment Criteria</th>
                              <th className="border border-slate-300 px-3 py-2 text-center font-semibold w-24">Max Marks</th>
                              <th className="border border-slate-300 px-3 py-2 text-center font-semibold w-24">Obtained</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentSubmission.practical.rubrics.map((r: any, index: number) => (
                              <tr key={r.id}>
                                <td className="border border-slate-300 px-3 py-2 text-center text-slate-500">{index + 1}</td>
                                <td className="border border-slate-300 px-3 py-2 text-slate-800">{r.criteria}</td>
                                <td className="border border-slate-300 px-3 py-2 text-center text-slate-600">{r.max_marks}</td>
                                <td className="border border-slate-300 px-3 py-2 text-center font-medium text-slate-900">
                                  {rubricScores[r.id] || 0}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                              <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right text-slate-700">Total Score</td>
                              <td className="border border-slate-300 px-3 py-2 text-center text-slate-700">{displayMaxMarks}</td>
                              <td className="border border-slate-300 px-3 py-2 text-center text-slate-900">
                                {Object.values(rubricScores).reduce((a, b) => a + b, 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-400">
                      <div className="space-y-1">
                        <p>Generated by AcadFlow</p>
                        <p>Submission ID: <span className="font-mono text-slate-600">{currentSubmission.id.slice(0, 8)}</span></p>
                        <p>Verified On: {new Date().toLocaleDateString()}</p>
                      </div>

                      <div className="text-right flex flex-col items-end">

                        {/* DIGITAL SIGNATURE BLOCK */}
                        <div className="w-48 border border-slate-300 rounded bg-slate-50 p-2 text-left relative">
                          {/* Checkmark Stamp */}
                          <div className="absolute -top-3 -right-3 bg-green-100 text-green-700 rounded-full p-1 border border-green-200 shadow-sm">
                            <Check size={16} strokeWidth={3} />
                          </div>

                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Digitally Signed By</p>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{teacherName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Faculty, Comp. Dept</p>
                          <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                            <span>{new Date().toLocaleDateString()}</span>
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Grading Sidebar (Unchanged) */}
              <div className="w-[350px] bg-white dark:bg-zinc-950 border-l border-border flex flex-col shadow-xl z-10">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-border font-semibold text-sm flex justify-between">
                  <span>Grading Rubric</span>
                  <Badge variant="secondary">Max: {displayMaxMarks}</Badge>
                </div>

                <ScrollArea className="flex-1 p-5">
                  <div className="space-y-6">
                    {currentSubmission.practical?.rubrics?.map((r: any) => (
                      <div key={r.id} className="space-y-2">
                        <div className="flex justify-between text-sm text-foreground">
                          <span>{r.criteria}</span>
                          <span className="text-muted-foreground text-xs">{rubricScores[r.id] || 0}/{r.max_marks}</span>
                        </div>
                        <input
                          type="range"
                          min="0" max={r.max_marks}
                          value={rubricScores[r.id] || 0}
                          onChange={(e) => setRubricScores({ ...rubricScores, [r.id]: parseInt(e.target.value) })}
                          className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    ))}

                    {!currentSubmission.practical?.rubrics?.length && (
                      <div className="text-sm text-slate-500 italic text-center p-4 border border-dashed rounded bg-muted/30">
                        No rubrics. Using Manual Score out of {displayMaxMarks}.
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border">
                      <Label>Feedback</Label>
                      <Textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Remarks..."
                        className="bg-background"
                      />
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-slate-50 dark:bg-zinc-900">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-muted-foreground">Total Score</span>
                    <div>
                      <span className="text-2xl font-bold text-primary">{Object.values(rubricScores).reduce((a, b) => a + b, 0)}</span>
                      <span className="text-sm text-muted-foreground font-medium ml-1"> / {displayMaxMarks}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleSaveGrade} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {currentSubmission.status === 'evaluated' ? 'Update Grade' : 'Submit Grade'}
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