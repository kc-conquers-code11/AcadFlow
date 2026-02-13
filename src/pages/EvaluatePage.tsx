import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import {
  ArrowLeft, CheckCircle2, LayoutTemplate, ShieldAlert, 
  Download, Check, Code, Loader2, BrainCircuit, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EvaluatePage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'print'>('editor');

  // Data State
  const [submission, setSubmission] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [graderName, setGraderName] = useState('Faculty In-charge');

  // Form State
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  // Parsed Content
  const [codeContent, setCodeContent] = useState('');
  const [docSections, setDocSections] = useState<Record<string, string>>({}); 
  const [executionOutput, setExecutionOutput] = useState('');
  
  // Extra Features State
  const [violationLogs, setViolationLogs] = useState<any[]>([]);
  const [vivaDetails, setVivaDetails] = useState<{cleared: boolean, score: number}>({ cleared: false, score: 0 });
  const [externalLinks, setExternalLinks] = useState<{output?: string, image?: string}>({});

  useEffect(() => {
    if (submissionId) fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Submission
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select(`*, student:profiles!student_id(*), grader:grader_id(name)`)
        .eq('id', submissionId)
        .single();

      if (subError) throw subError;

      // 2. Fetch Task Details
      if (subData.assignment_id) {
        const { data: assignData } = await supabase
          .from('assignments')
          .select(`id, title, description, total_points, rubrics, subject:subjects(name, code)`)
          .eq('id', subData.assignment_id)
          .single();
        setAssignment(assignData);
      } else if (subData.practical_id) {
         const { data: pracData } = await supabase
          .from('batch_practicals')
          .select(`id, title, description, total_points`)
          .eq('id', subData.practical_id)
          .single();
         if(pracData) setAssignment({ ...pracData, rubrics: [], subject: { code: 'LAB' } });
      }

      setSubmission(subData);
      setStudent(subData.student);
      setFeedback(subData.feedback || '');
      setRubricScores(subData.rubric_scores || {});
      
      // Fix TS Error & Set Grader Name
      setGraderName(subData.grader?.name || (user as any)?.user_metadata?.name || 'Faculty');
      
      // --- LOAD NEW FEATURES ---
      setViolationLogs(subData.violation_logs || []);
      setVivaDetails({ cleared: subData.viva_cleared || false, score: subData.viva_score || 0 });
      setExternalLinks({ output: subData.output_link, image: subData.image_link });

      // --- DEEP PARSING LOGIC ---
      if (subData.content) {
         let parsedContent: any = subData.content;
         
         if (typeof subData.content === 'string') {
            try { parsedContent = JSON.parse(subData.content); } catch { /* ignore */ }
         }
         
         setCodeContent(parsedContent.code || '');
         setExecutionOutput(parsedContent.output || '');

         let rawText = parsedContent.text || parsedContent.theory; 
         let finalSections: Record<string, string> = {};

         if (rawText) {
             if (typeof rawText === 'object') {
                 finalSections = rawText;
             } else if (typeof rawText === 'string') {
                 try {
                     const parsedInner = JSON.parse(rawText);
                     if (typeof parsedInner === 'object' && parsedInner !== null && !parsedInner.code && !parsedInner.output) {
                         finalSections = parsedInner;
                     } else {
                         finalSections = { "Theory / Write-up": rawText };
                     }
                 } catch {
                     finalSections = { "Theory / Write-up": rawText };
                 }
             }
         } else {
             finalSections = { "Report": "No written content submitted." };
         }
         
         delete (finalSections as any).output;
         delete (finalSections as any).code;
         delete (finalSections as any).text;

         setDocSections(finalSections);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const totalScore = Object.values(rubricScores).reduce((a, b) => a + (Number(b) || 0), 0);
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          marks: totalScore,
          rubric_scores: rubricScores,
          feedback: feedback,
          status: 'evaluated',
          grader_id: user?.id,
          evaluated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      toast.success("Graded Successfully!");
      navigate(-1);
    } catch (error) {
      toast.error("Failed to save evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Report_${student?.name}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white flex justify-center"><div class="w-[210mm] min-h-[297mm] p-[15mm] flex flex-col">${printContent.innerHTML}</div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!submission) return <div className="h-screen flex items-center justify-center">Data Not Found</div>;

  const rubrics = assignment?.rubrics || [];
  const currentTotal = Object.values(rubricScores).reduce((a, b) => a + (Number(b) || 0), 0);
  const maxMarks = assignment?.total_points || 20;

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 lg:-m-10 flex flex-col bg-slate-100 overflow-hidden">

      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5 text-slate-500" /></Button>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{assignment?.title}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">{student?.name} • {student?.enrollment_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border">
            <Button size="sm" variant={viewMode === 'editor' ? 'default' : 'ghost'} className="h-7 text-xs" onClick={() => setViewMode('editor')}><Code size={14} className="mr-1.5" /> Editor View</Button>
            <Button size="sm" variant={viewMode === 'print' ? 'default' : 'ghost'} className="h-7 text-xs" onClick={() => setViewMode('print')}><LayoutTemplate size={14} className="mr-1.5" /> PDF View</Button>
          </div>

          {viewMode === 'print' && (
            <Button size="sm" variant="outline" onClick={handleDownload} className="h-9 border-slate-300 hover:bg-slate-50 shadow-sm">
              <Download size={16} className="mr-2" /> Download
            </Button>
          )}

          <Button onClick={handleSave} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs px-4 shadow-sm">
            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Grade ({currentTotal}/{maxMarks})
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-8 flex justify-center min-h-full">
            {viewMode === 'editor' ? (
              <div className="w-full flex flex-col gap-6 max-w-4xl">
                {codeContent && (
                    <div className="bg-white rounded-xl border p-5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Code size={14} className="text-blue-500" /> Source Code</h4>
                        <CodeEditor content={codeContent} readOnly language="javascript" height="400px" />
                    </div>
                )}
                <div className="bg-white rounded-xl border p-5 shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><LayoutTemplate size={14} className="text-purple-500" /> Report Content</h4>
                    <div className="space-y-6">
                        {Object.entries(docSections).map(([key, val]) => (
                            <div key={key} className="border-b border-slate-100 pb-4 last:border-0">
                                <h5 className="text-xs font-bold text-slate-600 uppercase mb-2 bg-slate-50 inline-block px-2 py-1 rounded">{key}</h5>
                                <RichTextEditor content={val} editable={false} onChange={()=>{}} minHeight="auto" />
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            ) : (
              // --- PROFESSIONAL PDF VIEW ---
              <div id="printable-area" className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl p-[15mm] relative flex flex-col">
                <div className="mb-6 border-b-2 border-slate-900 pb-2">
                  <img src="/images/letterhead.jpg" alt="Letterhead" className="w-full max-h-32 object-contain block mx-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-[12px] mb-8 p-5 bg-slate-50 border border-slate-200 rounded-lg font-medium">
                  <div className="flex justify-between border-b border-dashed border-slate-300 pb-1"><span className="text-slate-500 uppercase">Student</span><span className="font-bold">{student?.name}</span></div>
                  <div className="flex justify-between border-b border-dashed border-slate-300 pb-1"><span className="text-slate-500 uppercase">Subject</span><span className="font-bold">{assignment?.subject?.code}</span></div>
                  <div className="flex justify-between border-b border-dashed border-slate-300 pb-1"><span className="text-slate-500 uppercase">Date</span><span className="font-bold">{new Date(submission.submitted_at).toLocaleDateString()}</span></div>
                </div>

                {/* --- VIVA STAMP (UPDATED: WITH SCORE) --- */}
                {vivaDetails.cleared && (
                    <div className="absolute top-[35mm] right-[15mm] border-[3px] border-green-600 text-green-700 font-black px-4 py-1 text-sm uppercase rounded rotate-[-12deg] opacity-80 flex items-center gap-1 z-10 bg-white/80">
                        <BrainCircuit size={16} /> Viva Cleared ({vivaDetails.score}/3)
                    </div>
                )}

                {/* --- CUSTOM IMAGE --- */}
                {externalLinks.image && (
                    <div className="mb-8">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">Attached Output</h4>
                        <img 
                            src={externalLinks.image} 
                            alt="Student Output" 
                            className="max-h-[300px] w-auto border border-slate-200 rounded p-1 block" 
                            onError={(e) => e.currentTarget.style.display = 'none'} 
                        />
                    </div>
                )}

                <div className="flex-1 space-y-8">
                  {/* Clean Sections */}
                  {Object.entries(docSections).map(([key, val]) => (
                    <div key={key}>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">{key}</h4>
                      <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: val }} />
                    </div>
                  ))}

                  {/* Clean Code Block */}
                  {codeContent && (
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">Source Code</h4>
                        <pre className="bg-slate-50 p-4 rounded border border-slate-200 text-[10px] font-mono whitespace-pre-wrap text-slate-700 leading-snug overflow-x-auto break-all">
                            {codeContent}
                        </pre>
                    </div>
                  )}

                  {/* Clean Output Block */}
                  {executionOutput && (
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b pb-1">Output</h4>
                        <pre className="bg-black text-green-400 p-4 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto break-all">
                            {executionOutput}
                        </pre>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 flex items-end justify-between text-[10px] text-slate-400 uppercase font-bold">
                  <p>Generated by AcadFlow</p>
                  <div className="w-52 border border-slate-300 rounded-md bg-slate-50 p-3 text-left relative">
                      <div className="absolute -top-3 -right-3 bg-green-100 text-green-700 rounded-full p-1"><Check size={16}/></div>
                      <p className="text-[8px] text-slate-500 mb-1 tracking-widest uppercase font-black">Verified By</p>
                      <p className="text-[13px] font-bold">{graderName}</p>
                      <p className="text-[8px] text-slate-400">Faculty In-charge</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Right: Grading Panel */}
        <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-2xl z-20 overflow-y-auto">
          <div className="p-6 space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutTemplate size={14} className="text-blue-600" /> Evaluation</h3>
            
            {/* Violations Display */}
            {violationLogs.length > 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <h4 className="text-[10px] font-bold text-red-600 uppercase mb-2 flex items-center gap-2"><ShieldAlert size={12}/> Violations Detected ({violationLogs.length})</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {violationLogs.map((log: any, i: number) => (
                            <div key={i} className="text-[9px] text-red-500 font-mono border-b border-red-100 last:border-0 pb-1">
                                <span className="font-bold">{log.type}</span> at {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-[10px] text-green-600 flex items-center gap-2">
                    <CheckCircle2 size={12} /> No Violations
                </div>
            )}

            {/* Links Section */}
            {(externalLinks.output || externalLinks.image) && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                    <h4 className="text-[10px] font-bold text-blue-600 uppercase">Student Attachments</h4>
                    {externalLinks.output && <a href={externalLinks.output} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline"><ExternalLink size={12}/> Output Link</a>}
                    {externalLinks.image && <a href={externalLinks.image} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-purple-600 hover:underline"><ExternalLink size={12}/> Screenshot</a>}
                </div>
            )}

            <div className="space-y-6">
              {rubrics.map((item: any) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="uppercase tracking-tight">{item.criteria}</span>
                    <span className="text-blue-600 font-black">{rubricScores[item.id] || 0} / {item.max_marks}</span>
                  </div>
                  {/* Slider + Input Group */}
                  <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max={item.max_marks} 
                        className="flex-1 h-1.5 accent-blue-600 bg-slate-100 rounded-full cursor-pointer" 
                        value={rubricScores[item.id] || 0} 
                        onChange={(e) => setRubricScores(prev => ({ ...prev, [item.id]: parseInt(e.target.value) }))} 
                      />
                      <Input 
                        type="number" 
                        min="0" 
                        max={item.max_marks} 
                        className="w-14 h-7 text-xs text-center font-bold border-slate-300" 
                        value={rubricScores[item.id] || 0} 
                        onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if(isNaN(val)) val = 0;
                            val = Math.min(Math.max(0, val), item.max_marks);
                            setRubricScores(prev => ({ ...prev, [item.id]: val }));
                        }} 
                      />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl text-white text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Total Grade</p>
              <div className="flex items-center justify-center gap-2">
                  <span className="text-6xl font-black">{currentTotal}</span>
                  <span className="text-xl text-slate-500 font-bold">/ {maxMarks}</span>
              </div>
              
              {submission.ai_score !== null && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                      <span>AI Evaluated Score:</span>
                      <span className="text-yellow-400 font-bold text-xs">{submission.ai_score} / 100</span>
                  </div>
              )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback</label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Write feedback..." className="min-h-[120px] rounded-xl bg-slate-50 text-sm border-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}