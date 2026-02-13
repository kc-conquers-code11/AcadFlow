import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Eye, Check, BrainCircuit, X, LayoutTemplate } from 'lucide-react';

interface StudentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  batchDetails: any;
}

export function StudentHistoryModal({ open, onOpenChange, student, batchDetails }: StudentHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completionStats, setCompletionStats] = useState({ completed: 0, total: 0 });
  
  // View State
  const [viewSubmission, setViewSubmission] = useState<any | null>(null);

  useEffect(() => {
    if (open && student?.id && batchDetails) {
      fetchHistory();
    }
  }, [open, student, batchDetails]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 1. Get all practicals for this batch
      const { data: practicals, error: pracError } = await supabase
        .from('batch_practicals')
        .select('id, title, experiment_number, total_points')
        .eq('division', batchDetails.division)
        .eq('batch', batchDetails.batch)
        .neq('status', 'archived');

      if (pracError) throw pracError;
      if (!practicals || practicals.length === 0) {
          setHistory([]);
          setCompletionStats({ completed: 0, total: 0 });
          return;
      }

      // 2. Get submissions (Added content, links for Viewing)
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, practical_id, status, marks, submitted_at, content, image_link, output_link, viva_cleared, viva_score')
        .eq('student_id', student.id)
        .in('practical_id', practicals.map(p => p.id));

      // 3. Merge Data
      let completedCount = 0;
      const merged = practicals.map(p => {
        const sub = submissions?.find(s => s.practical_id === p.id);
        
        if(sub?.status === 'submitted' || sub?.status === 'evaluated') {
            completedCount++;
        }

        return {
          ...p,
          submission_id: sub?.id,
          status: sub?.status || 'pending',
          marks: sub?.marks,
          submitted_at: sub?.submitted_at,
          content: sub?.content,
          image_link: sub?.image_link,
          output_link: sub?.output_link,
          viva_cleared: sub?.viva_cleared,
          viva_score: sub?.viva_score
        };
      });

      // Sort by Experiment Number
      merged.sort((a, b) => {
          const numA = parseInt(a.experiment_number) || 0;
          const numB = parseInt(b.experiment_number) || 0;
          return numA - numB;
      });

      setHistory(merged);
      setCompletionStats({ completed: completedCount, total: practicals.length });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER CONTENT (Reused Logic from EvaluatePage) ---
  const renderSubmissionContent = (item: any) => {
      if (!item.content) return <div className="text-muted-foreground italic p-4">No content submitted.</div>;

      let content = item.content;
      let parsed: { code?: string, output?: string, text?: any } = { code: '', output: '' };

      // 1. Initial Parse
      if (typeof content === 'string') {
        try { parsed = JSON.parse(content); } catch (e) { /* ignore */ }
      } else if (typeof content === 'object' && content !== null) {
          parsed = content;
      }

      // 2. Section Extraction
      let docSections: Record<string, string> = {};
      if (parsed.text) {
          let rawText = parsed.text;
          if (typeof rawText === 'object') {
              docSections = rawText;
          } else if (typeof rawText === 'string') {
              try {
                  const inner = JSON.parse(rawText);
                  if (typeof inner === 'object' && inner !== null && !inner.code) {
                      docSections = inner;
                  } else {
                      docSections = { "Theory / Write-up": rawText };
                  }
              } catch {
                  docSections = { "Theory / Write-up": rawText };
              }
          }
      } else {
          docSections = { "Report": "No written content submitted." };
      }

      // Cleanup
      delete (docSections as any).output;
      delete (docSections as any).code;
      delete (docSections as any).text;

      return (
          <div className="space-y-8">
              {/* Custom Image */}
              {item.image_link && (
                  <div className="mb-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">Attached Output</h4>
                      <img 
                          src={item.image_link} 
                          alt="Student Output" 
                          className="max-h-[300px] w-auto border border-slate-200 rounded p-1 block"
                          onError={(e) => e.currentTarget.style.display = 'none'} 
                      />
                  </div>
              )}

              {/* Sections */}
              {Object.entries(docSections).map(([key, val]) => (
                  <div key={key}>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">{key}</h4>
                      <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: val }} />
                  </div>
              ))}

              {/* Code */}
              {parsed.code && (
                  <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">Source Code</h4>
                      <pre className="bg-slate-50 p-4 rounded border border-slate-200 text-[10px] font-mono whitespace-pre-wrap text-slate-700 leading-snug overflow-x-auto break-all">
                          {parsed.code}
                      </pre>
                  </div>
              )}

              {/* Output */}
              {parsed.output && (
                  <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">Output</h4>
                      <pre className="bg-black text-green-400 p-4 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto break-all">
                          {parsed.output}
                      </pre>
                  </div>
              )}
          </div>
      );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex flex-col gap-1">
              <div className="flex justify-between items-center w-full">
                  <span>{student?.name}</span>
                  <Badge variant="outline" className="text-sm font-normal">
                      Completed: {completionStats.completed} / {completionStats.total}
                  </Badge>
              </div>
              <span className="text-sm font-normal text-muted-foreground">
                  Enrollment: {student?.enrollment_number} | Roll No: {student?.roll_number || 'N/A'}
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Exp</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin h-5 w-5 mx-auto"/></TableCell></TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                              <AlertCircle size={20} />
                              No experiments assigned to this batch yet.
                          </div>
                      </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-bold">{item.experiment_number}</TableCell>
                      <TableCell className="font-medium">
                          {item.title}
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                              Submitted: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '-'}
                          </div>
                      </TableCell>
                      <TableCell>
                        {item.status === 'evaluated' ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Graded</Badge> :
                         item.status === 'submitted' ? <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">Submitted</Badge> :
                         item.status === 'redo_requested' ? <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200">Redo</Badge> :
                         <Badge variant="outline" className="text-slate-400">Pending</Badge>}
                      </TableCell>
                      <TableCell>
                        {item.marks !== undefined && item.marks !== null ? <span className="font-bold text-green-600">{item.marks} / {item.total_points}</span> : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.status === 'submitted' || item.status === 'evaluated') && (
                            <Button size="sm" variant="ghost" onClick={() => setViewSubmission(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Eye size={16} className="mr-1" /> View
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- SUBMISSION VIEW MODAL (NESTED) --- */}
      {viewSubmission && (
          <Dialog open={!!viewSubmission} onOpenChange={(val) => !val && setViewSubmission(null)}>
              <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100">
                  <DialogHeader className="px-6 py-3 border-b flex flex-row items-center justify-between bg-white shrink-0">
                      <div className="flex items-center gap-4">
                          <DialogTitle className="text-lg text-foreground flex items-center gap-2">
                              <LayoutTemplate size={18} className="text-blue-600"/>
                              {viewSubmission.title}
                          </DialogTitle>
                          <Badge variant="outline">Exp {viewSubmission.experiment_number}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setViewSubmission(null)}>
                          <X className="h-4 w-4" />
                      </Button>
                  </DialogHeader>

                  <ScrollArea className="flex-1 bg-slate-200/50 p-8 flex justify-center">
                      <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl p-[15mm] relative flex flex-col">
                          
                          {/* Header Image */}
                          <div className="mb-6 border-b-2 border-slate-900 pb-2">
                              <img 
                                src="/images/letterhead.jpg" 
                                alt="Letterhead" 
                                className="w-full max-h-32 object-contain block mx-auto"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm mb-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                                <span className="text-slate-500 font-medium">Student Name</span>
                                <span className="font-bold">{student?.name}</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                                <span className="text-slate-500 font-medium">Experiment</span>
                                <span className="font-bold">{viewSubmission.experiment_number}</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                                <span className="text-slate-500 font-medium">Roll No</span>
                                <span className="font-bold">{student?.enrollment_number}</span>
                              </div>
                              <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                                <span className="text-slate-500 font-medium">Date</span>
                                <span className="font-bold">{new Date(viewSubmission.submitted_at).toLocaleDateString()}</span>
                              </div>
                          </div>

                          {/* Viva Stamp */}
                          {viewSubmission.viva_cleared && (
                              <div className="absolute top-[35mm] right-[15mm] border-[3px] border-green-600 text-green-700 font-black px-4 py-1 text-sm uppercase rounded rotate-[-12deg] opacity-80 flex items-center gap-1 z-10 bg-white/80">
                                  <BrainCircuit size={16} /> Viva Cleared ({viewSubmission.viva_score}/3)
                              </div>
                          )}

                          {/* Main Content */}
                          <div className="mb-10 min-h-[400px]">
                              {renderSubmissionContent(viewSubmission)}
                          </div>

                          {/* Footer */}
                          <div className="mt-auto pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-400">
                              <div className="space-y-1">
                                  <p>Generated by AcadFlow</p>
                                  <p>Submission ID: <span className="font-mono text-slate-600">{viewSubmission.submission_id?.slice(0,8)}</span></p>
                              </div>
                              {viewSubmission.status === 'evaluated' && (
                                  <div className="w-48 border border-slate-300 rounded bg-slate-50 p-2 text-left relative">
                                      <div className="absolute -top-3 -right-3 bg-green-100 text-green-700 rounded-full p-1 border border-green-200 shadow-sm">
                                          <Check size={16} strokeWidth={3} />
                                      </div>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                      <p className="text-sm font-bold text-slate-900 leading-tight">Graded & Verified</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </ScrollArea>
              </DialogContent>
          </Dialog>
      )}
    </>
  );
}