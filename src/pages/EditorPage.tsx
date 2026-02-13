import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, Send, Clock, ChevronLeft, Loader2, Info, AlertCircle, 
  CheckCircle2, Terminal as TerminalIcon, ShieldAlert, Play, PlayCircle, 
  Download, Check, CopyPlus, Link as LinkIcon, Image as ImageIcon, BrainCircuit, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- SECURE COMPONENTS ---
import MonacoEditor from '@/components/secure/MonacoEditor';
import DocumentEditor from '@/components/secure/DocumentEditor';
import AIAssistant from '@/components/secure/AIAssistant';
import SecurityEngine, { SecurityEventType } from '@/components/secure/SecurityEngine';
import WebTerminal, { WebTerminalRef } from '@/components/secure/WebTerminal';

// --- API CONFIG ---
const PISTON_API = "https://emkc.org/api/v2/piston/execute";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; 

export default function EditorPage() {
  const { practicalId } = useParams<{ practicalId: string }>(); 
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- UI STATES ---
  const [loading, setLoading] = useState(true);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('code');
  const [violationCount, setViolationCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeDocSection, setActiveDocSection] = useState('theory');
  
  // Dialog States
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [vivaDialogOpen, setVivaDialogOpen] = useState(false);

  // Security & Violation States
  const [violationLogs, setViolationLogs] = useState<any[]>([]); 

  // Viva States
  const [vivaLoading, setVivaLoading] = useState(false);
  const [vivaQuestions, setVivaQuestions] = useState<any[]>([]);
  const [vivaAnswers, setVivaAnswers] = useState<Record<number, string>>({});
  const [vivaCleared, setVivaCleared] = useState(false);
  const [vivaScore, setVivaScore] = useState(0);

  // --- DATA STATES ---
  const [task, setTask] = useState<any>(null);
  const [isPractical, setIsPractical] = useState(false);
  const [subjectName, setSubjectName] = useState('');

  // --- CONTENT STATES ---
  const [codeContent, setCodeContent] = useState('');
  const [docSections, setDocSections] = useState<Record<string, string>>({}); 
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [executionOutput, setExecutionOutput] = useState('');
  const [outputLink, setOutputLink] = useState('');
  const [imageLink, setImageLink] = useState('');

  const [submission, setSubmission] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const terminalRef = useRef<WebTerminalRef>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!practicalId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        let foundTask = null;
        let isPrac = false;

        const { data: prac } = await supabase.from('batch_practicals').select('*').eq('id', practicalId).maybeSingle();
        if (prac) {
          foundTask = prac;
          isPrac = true;
          setSubjectName(prac.subject_code || 'Practical Lab');
        } else {
          const { data: assign } = await supabase.from('assignments').select('*').eq('id', practicalId).maybeSingle();
          if (assign) {
            foundTask = assign;
            isPrac = false;
            if (assign.subject_id) {
                const { data: sub } = await supabase.from('subjects').select('name, code').eq('id', assign.subject_id).single();
                if (sub) setSubjectName(`${sub.name} (${sub.code})`);
            }
          }
        }

        if (!foundTask) throw new Error("Task not found.");
        setTask(foundTask);
        setIsPractical(isPrac);

        // Fetch Submission
        let query = supabase.from('submissions').select(`*, grader:grader_id(name)`).eq('student_id', user.id);
        if (isPrac) query = query.eq('practical_id', practicalId);
        else query = query.eq('assignment_id', practicalId);
        
        const { data: sub } = await query.maybeSingle();

        if (sub) {
          setSubmission(sub);
          setLastSaved(sub.last_saved_at ? new Date(sub.last_saved_at) : null);
          setAiScore(sub.ai_score); 
          setOutputLink(sub.output_link || '');
          setImageLink(sub.image_link || '');
          
          if (sub.violation_logs && Array.isArray(sub.violation_logs)) {
              setViolationLogs(sub.violation_logs);
              setViolationCount(sub.violation_logs.length);
          }
          
          if (sub.viva_cleared) {
              setVivaCleared(true);
              setVivaScore(sub.viva_score || 0);
          }

          if (sub.content) {
             let parsed: any = sub.content;
             if (typeof sub.content === 'string') {
                try { parsed = JSON.parse(sub.content); } catch { /* ignore */ }
             }
             setCodeContent(parsed.code || '');
             setExecutionOutput(parsed.output || ''); 
             
             if (parsed.text) {
                try {
                   const sections = JSON.parse(parsed.text);
                   setDocSections(typeof sections === 'object' ? sections : { theory: parsed.text });
                } catch {
                   setDocSections({ theory: parsed.text });
                }
             }
          }
        }
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [practicalId, user]);

  // --- API: GENERATE VIVA ---
  const generateVivaQuestions = async () => {
      setVivaLoading(true);
      setVivaDialogOpen(true);
      
      const context = `
        Code Snippet: ${codeContent.substring(0, 1500)}
        Theory Concept: ${JSON.stringify(docSections).substring(0, 1000)}
      `;

      try {
          const response = await axios.post(
              GROQ_API_URL,
              {
                  model: "llama-3.3-70b-versatile",
                  messages: [
                      { role: "system", content: "You are an external examiner. Generate 3 multiple-choice questions (MCQs) based strictly on the provided code logic and theory to test if the student truly understands what they wrote. Return JSON format: { 'questions': [{ 'id': 1, 'text': 'Question?', 'options': ['A', 'B', 'C', 'D'], 'correctAnswer': 'The Correct Option Text' }] }." },
                      { role: "user", content: context }
                  ],
                  response_format: { type: "json_object" }
              },
              { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } }
          );

          const result = JSON.parse(response.data.choices[0].message.content);
          if(result.questions && Array.isArray(result.questions)) {
              setVivaQuestions(result.questions.slice(0, 3));
          } else {
              throw new Error("Invalid question format");
          }
      } catch (error) {
          console.error(error);
          toast.error("Failed to generate Viva. Please try again.");
          setVivaDialogOpen(false);
      } finally {
          setVivaLoading(false);
      }
  };

  const handleVivaSubmit = async () => {
      let correctCount = 0;
      vivaQuestions.forEach(q => {
          if (vivaAnswers[q.id] === q.correctAnswer) {
              correctCount++;
          }
      });

      const passed = correctCount >= 2; 
      
      if (passed) {
          setVivaCleared(true);
          setVivaScore(correctCount);
          toast.success("Viva Cleared! Submitting...");
          setVivaDialogOpen(false);
          await upsertSubmission('submitted', undefined, undefined, true, correctCount);
      } else {
          toast.error(`Viva Failed (${correctCount}/3). You must understand your code to submit. Try again.`);
          setVivaAnswers({}); 
      }
  };

  // --- EXECUTION LOGIC ---
  const runCodeOnPiston = async (language: string, code: string) => {
      const langMap: Record<string, { lang: string, ver: string }> = {
          'python': { lang: 'python', ver: '3.10.0' },
          'javascript': { lang: 'javascript', ver: '18.15.0' },
          'java': { lang: 'java', ver: '15.0.2' },
          'cpp': { lang: 'c++', ver: '10.2.0' },
          'c': { lang: 'c', ver: '10.2.0' },
          'sql': { lang: 'sqlite3', ver: '3.36.0' }
      };
      const config = langMap[language] || langMap['python'];
      try {
          const response = await axios.post(PISTON_API, {
              language: config.lang,
              version: config.ver,
              files: [{ content: code }]
          });
          return response.data.run;
      } catch (error: any) {
          return { stderr: "Server Error: " + error.message, stdout: "" };
      }
  };

  const gradeWithGroq = async (code: string, output: string, taskTitle: string, taskDesc: string) => {
      if (!GROQ_API_KEY) return 0;
      const prompt = `Act as a strict Computer Science Professor. Task: ${taskTitle}. Desc: ${taskDesc}. Code: ${code}. Output: ${output}. Analyze logic & correctness. Return ONLY valid JSON: { "score": number (0-100) }`;
      try {
          const response = await axios.post(GROQ_API_URL, {
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_object" }
          }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });
          const result = JSON.parse(response.data.choices[0].message.content);
          return result.score || 0;
      } catch { return 0; }
  };

  const handleRunCode = async () => {
    if (!codeContent.trim()) { toast.error("Write code first!"); return; }
    setIsRunning(true);
    terminalRef.current?.run("Executing...");

    const isSQL = task.title.toLowerCase().includes('sql');
    const lang = isSQL ? 'sql' : 'python'; 

    const result = await runCodeOnPiston(lang, codeContent);
    const output = result.stdout || result.stderr || "No output.";
    
    setExecutionOutput(output);
    terminalRef.current?.run(output);

    terminalRef.current?.run("\n[System] Grading...");
    const score = await gradeWithGroq(codeContent, output, task.title, task.description);
    
    setAiScore(score);
    terminalRef.current?.run(`[System] Grading Complete. AI Estimate: ${score}/100`);
    
    setIsRunning(false);
    toast.success(`Execution Complete.`);
    
    await upsertSubmission('draft', score, output);
  };

  const handleCopyToReport = () => {
      if (!executionOutput) {
          toast.error("No output to copy! Run code first.");
          return;
      }
      const outputHtml = `<pre style="background:#f4f4f5; padding:10px; border-radius:5px;"><code>${executionOutput}</code></pre>`;
      const currentOutputSection = docSections['output'] || '';
      setDocSections(prev => ({
          ...prev,
          output: (currentOutputSection ? currentOutputSection + '<br/>' : '') + `<p><strong>Execution Result:</strong></p>` + outputHtml
      }));
      setActiveTab('report');
      setActiveDocSection('output');
      toast.success("Output appended to Report!");
  };

  // --- SAVE & SUBMIT ---
  const upsertSubmission = async (status: 'draft' | 'submitted', overrideAiScore?: number, overrideOutput?: string, isVivaCleared?: boolean, vivaScoreVal?: number) => {
    if (!user || !task) return;
    setIsSaving(true);
    try {
      const textPayload = JSON.stringify(docSections);
      const contentPayload = { 
          code: codeContent, 
          text: textPayload,
          output: overrideOutput !== undefined ? overrideOutput : executionOutput 
      };
      
      const payload: any = {
        student_id: user.id,
        content: contentPayload,
        status: status,
        last_saved_at: new Date().toISOString(),
        ai_score: overrideAiScore !== undefined ? overrideAiScore : aiScore, 
        output_link: outputLink,
        image_link: imageLink,
        viva_cleared: isVivaCleared !== undefined ? isVivaCleared : vivaCleared,
        viva_score: vivaScoreVal !== undefined ? vivaScoreVal : vivaScore,
        violation_logs: violationLogs
      };

      if (status === 'submitted') payload.submitted_at = new Date().toISOString();
      if (isPractical) payload.practical_id = task.id; else payload.assignment_id = task.id;

      const { data, error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: isPractical ? 'student_id,practical_id' : 'student_id,assignment_id' })
        .select().single();

      if (error) throw error;
      setSubmission(data);
      setLastSaved(new Date(data.last_saved_at));
      
      if (status === 'submitted') {
          toast.success("Submitted Successfully!");
          navigate(-1);
      } else {
          toast.success("Progress Saved");
      }
    } catch (err: any) {
      toast.error("Action failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => upsertSubmission('draft');
  
  const handleSubmitClick = () => {
      if (!vivaCleared) {
          if (!codeContent || Object.keys(docSections).length === 0) {
              toast.error("Please complete code and report before submitting.");
              return;
          }
          generateVivaQuestions();
      } else {
          if (confirm("Submit final version? You cannot edit after this.")) {
              upsertSubmission('submitted');
          }
      }
  };

  const handleStartExam = () => {
    document.documentElement.requestFullscreen().catch(console.error);
    setIsExamStarted(true);
    toast.success("Secure Environment Activated");
  };

  const handlePrint = () => {
      const printWindow = window.open('', '', 'height=800,width=800');
      const printContent = document.getElementById('printable-area');
      if(printWindow && printContent) {
          printWindow.document.write(`<html><head><title>Report</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-4">${printContent.innerHTML}</body></html>`);
          printWindow.document.close();
          printWindow.print();
      }
  };

  // --- RENDER ---
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!task) return <div className="p-10 text-center">Task not found.</div>;

  const isEvaluated = submission?.status === 'evaluated';
  const isSubmitted = submission?.status === 'submitted';
  const isRedoRequested = submission?.status === 'redo_requested'; // Check for Redo status
  const isReadOnly = (isEvaluated || isSubmitted) && !isRedoRequested; // Only read-only if NOT in redo mode

  if (isReadOnly) {
      return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
            <header className="h-14 bg-white border-b flex items-center justify-between px-6 shadow-sm">
                <Button variant="ghost" onClick={() => navigate(-1)}><ChevronLeft className="mr-2 h-4 w-4"/> Back</Button>
                <h1 className="font-bold text-slate-800 flex items-center gap-2">
                    {task.title} 
                    {isEvaluated ? <Badge className="bg-green-600">Graded: {submission.marks}</Badge> : <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">Submitted</Badge>}
                </h1>
                <Button onClick={handlePrint} variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/> Download Report</Button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                <div id="printable-area" className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl p-[15mm] flex flex-col">
                    <div className="mb-6 border-b-2 border-slate-900 pb-2">
                        <img src="/images/letterhead.jpg" alt="Letterhead" className="w-full max-h-32 object-contain mx-auto" onError={(e)=>{e.currentTarget.style.display='none'}} />
                    </div>
                    {vivaCleared && (
                        <div className="absolute top-[15mm] right-[15mm] border-2 border-green-600 text-green-700 font-bold px-3 py-1 text-xs uppercase rounded rotate-12 opacity-80 flex items-center gap-1">
                            <BrainCircuit size={14} /> Viva Cleared ({vivaScore}/3)
                        </div>
                    )}
                    {(outputLink || imageLink) && (
                        <div className="flex gap-4 mb-4">
                            {outputLink && <div className="flex-1 bg-blue-50 border border-blue-200 p-3 rounded text-xs"><span className="font-bold text-blue-700 block mb-1">External Link:</span><a href={outputLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{outputLink}</a></div>}
                            {imageLink && <div className="flex-1 bg-purple-50 border border-purple-200 p-3 rounded text-xs"><span className="font-bold text-purple-700 block mb-1">Attached Image:</span><a href={imageLink} target="_blank" rel="noreferrer" className="text-purple-600 underline break-all block mb-2">{imageLink}</a><img src={imageLink} alt="Screenshot" className="max-h-24 rounded border border-purple-200 object-cover" onError={(e) => e.currentTarget.style.display = 'none'} /></div>}
                        </div>
                    )}
                    <div className="flex-1 space-y-6">
                        {Object.entries(docSections).map(([key, val]) => (
                            <div key={key}><h4 className="text-xs font-bold text-slate-400 uppercase mb-1">{key}</h4><div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: val }} /></div>
                        ))}
                        {codeContent && (<div><h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Source Code</h4><div className="bg-slate-50 p-4 rounded border font-mono text-[10px] whitespace-pre-wrap">{codeContent}</div></div>)}
                        {executionOutput && (<div><h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Execution Output</h4><div className="bg-black text-green-400 p-4 rounded font-mono text-[10px] whitespace-pre-wrap">{executionOutput}</div></div>)}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  if (!isExamStarted) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
              <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center space-y-6">
                  <ShieldAlert className="w-12 h-12 text-blue-600 mx-auto" />
                  <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
                  <p className="text-slate-500">Secure AI-Powered Assessment</p>
                  <Button onClick={handleStartExam} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 gap-2"><Play size={18} /> Start Solving</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-slate-200 overflow-hidden">
      <SecurityEngine 
        submissionId={practicalId || ''} 
        isPaused={linkDialogOpen || vivaDialogOpen} 
        onViolation={(type, details) => {
            setViolationCount(prev => prev + 1);
            setViolationLogs(prev => [...prev, { type, ...details }]); 
            if (type === 'FOCUS_LOST') toast.warning("⚠️ Tab switching detected!");
        }} 
      />

      <header className="h-14 border-b border-slate-800 bg-[#09090b] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></Button>
          <div><h1 className="font-bold text-sm text-slate-100 flex items-center gap-2">{task.title}{violationCount > 0 && <Badge variant="destructive" className="h-5 text-[10px] animate-pulse">{violationCount} Violations</Badge>}</h1><p className="text-[10px] text-slate-500">{subjectName} • Secure Mode</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className={`h-8 border-slate-700 bg-slate-800 text-slate-300 ${(outputLink || imageLink) ? 'border-green-500 text-green-400' : ''}`}><LinkIcon className="h-3 w-3 mr-2" /> {(outputLink || imageLink) ? 'Attached' : 'Add Links'}</Button></DialogTrigger>
              <DialogContent className="bg-[#18181b] border-slate-800 text-slate-200">
                  <DialogHeader><DialogTitle>Attach Assets</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                      <div className="bg-yellow-900/20 border border-yellow-900/50 p-3 rounded text-xs text-yellow-500">⚠️ Security Note: Tab switching is allowed ONLY while this popup is open.</div>
                      <div className="space-y-2"><Label className="text-xs uppercase text-slate-500 font-bold">Output Link</Label><Input placeholder="https://..." value={outputLink} onChange={(e) => setOutputLink(e.target.value)} className="bg-black border-slate-700 text-white" /></div>
                      <div className="space-y-2"><Label className="text-xs uppercase text-slate-500 font-bold">Screenshot Link</Label><Input placeholder="https://imgur.com/..." value={imageLink} onChange={(e) => setImageLink(e.target.value)} className="bg-black border-slate-700 text-white" /></div>
                  </div>
                  <DialogFooter><Button onClick={() => setLinkDialogOpen(false)}>Done</Button></DialogFooter>
              </DialogContent>
          </Dialog>

          {aiScore !== null && <Badge variant="outline" className="text-green-400 border-green-900 bg-green-900/20">AI Score: {aiScore}/100</Badge>}
          <Button variant="outline" size="sm" onClick={() => upsertSubmission('draft')} disabled={isSaving} className="h-8 border-slate-700 bg-slate-800 text-slate-300">{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-2" />} Save</Button>
          <Button size="sm" onClick={handleSubmitClick} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">Submit <Send className="h-3 w-3 ml-2" /></Button>
        </div>
      </header>

      {/* --- REDO REQUEST NOTIFICATION BANNER --- */}
      {isRedoRequested && (
          <div className="bg-orange-500/10 border-b border-orange-500/20 p-2 px-4 flex items-center justify-between text-orange-400 text-xs animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="animate-pulse" />
                  <span className="font-bold">REDO REQUESTED:</span>
                  <span className="italic">"{submission.feedback || 'Please review and resubmit.'}"</span>
              </div>
              <Button variant="ghost" size="sm" className="h-5 text-[10px] text-orange-400 hover:text-orange-300" onClick={() => toast.info("Make changes and click Submit to resolve.")}>How to fix?</Button>
          </div>
      )}

      {/* --- VIVA DIALOG (AI QUIZ) --- */}
      <Dialog open={vivaDialogOpen} onOpenChange={(open) => { if (!open && !vivaCleared) return; setVivaDialogOpen(open); }}>
          <DialogContent className="bg-[#18181b] border-slate-800 text-slate-200 max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl"><BrainCircuit className="text-purple-500" /> AI Viva Assessment</DialogTitle>
                  <DialogDescription className="text-slate-400">
                      To ensure you understand the code you wrote, answer these 3 questions generated from your submission. 
                      You must score at least <strong>2/3</strong> to submit.
                  </DialogDescription>
              </DialogHeader>
              
              {vivaLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                      <p>Analyzing your code & generating questions...</p>
                  </div>
              ) : (
                  <div className="space-y-6 py-4">
                      {vivaQuestions.map((q, idx) => (
                          <div key={q.id} className="space-y-3 border-b border-slate-800 pb-4 last:border-0">
                              <p className="font-medium text-slate-200 text-sm"><span className="text-purple-400 font-bold mr-2">Q{idx+1}.</span> {q.text}</p>
                              {/* Using simple flex layout for options since RadioGroup might be missing */}
                              <div className="space-y-2">
                                  {q.options.map((opt: string, i: number) => (
                                      <label key={i} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-slate-800/50">
                                          <input 
                                            type="radio" 
                                            name={`q${q.id}`} 
                                            value={opt} 
                                            onChange={() => setVivaAnswers(prev => ({...prev, [q.id]: opt}))}
                                            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-500 focus:ring-purple-500 focus:ring-2"
                                          />
                                          <span className="text-slate-300 text-sm">{opt}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <DialogFooter>
                  <Button variant="ghost" onClick={() => setVivaDialogOpen(false)} disabled={vivaLoading}>Cancel (Edit Code)</Button>
                  <Button onClick={handleVivaSubmit} disabled={vivaLoading || Object.keys(vivaAnswers).length < vivaQuestions.length} className="bg-purple-600 hover:bg-purple-700">
                      Submit Answers
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <aside className="col-span-2 border-r border-slate-800 bg-[#0c0c0e] hidden lg:block overflow-y-auto p-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><Info size={14} /> Instructions</h3>
            <div className="prose prose-invert prose-sm text-slate-400 text-sm">{task.description}</div>
        </aside>

        <main className="col-span-12 lg:col-span-7 flex flex-col bg-[#09090b] border-r border-slate-800">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 border-b border-slate-800 bg-[#0c0c0e]">
                <TabsList className="bg-transparent h-10 p-0 gap-4">
                  <TabsTrigger value="code" className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none h-full">Code Solution</TabsTrigger>
                  <TabsTrigger value="report" className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none h-full">Lab Report</TabsTrigger>
                </TabsList>
                {activeTab === 'code' && <Button size="sm" onClick={handleRunCode} disabled={isRunning} className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs gap-2">{isRunning ? <Loader2 className="animate-spin h-3 w-3" /> : <PlayCircle size={14} />} Run & Check</Button>}
              </div>
              <TabsContent value="code" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
                 <div className="flex-1 min-h-0 relative"><MonacoEditor initialValue={codeContent} language={task.title.toLowerCase().includes('sql') ? 'sql' : 'python'} theme="vs-dark" onChange={setCodeContent} /></div>
                 <div className="h-48 border-t border-slate-800 bg-black flex flex-col shrink-0">
                    <div className="px-4 py-1 bg-[#1e1e20] text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between"><div className="flex items-center gap-2"><TerminalIcon size={12} /> Console Output</div><button onClick={handleCopyToReport} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-slate-400 hover:bg-slate-800 px-2 py-0.5 rounded"><CopyPlus size={10} /> <span className="text-[9px]">Append to Report</span></button></div>
                    <div className="flex-1 overflow-hidden relative p-1"><WebTerminal ref={terminalRef} assignmentId={practicalId || ''} /></div>
                 </div>
              </TabsContent>
              <TabsContent value="report" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden bg-[#09090b] p-6 overflow-y-auto">
                 <div className="max-w-4xl mx-auto w-full h-full"><DocumentEditor initialValues={docSections} onChange={(id, val) => setDocSections(prev => ({...prev, [id]: val}))} activeSection={activeDocSection} onSectionChange={setActiveDocSection}/></div>
              </TabsContent>
           </Tabs>
        </main>
        <aside className="col-span-12 lg:col-span-3 bg-[#0c0c0e] flex flex-col h-full overflow-hidden"><AIAssistant mode="FULL_ASSISTANCE" codeContext={codeContent} onLog={(p, r) => console.log(p)} /></aside>
      </div>
    </div>
  );
}