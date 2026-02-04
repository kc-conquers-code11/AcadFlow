import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { Save, Send, Clock, ChevronLeft, Loader2, Info, AlertCircle, CheckCircle2, Download, Check, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EditorPage() {
  const { practicalId } = useParams<{ practicalId: string }>(); 
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data States
  const [task, setTask] = useState<any>(null);
  const [isPractical, setIsPractical] = useState(false);
  const [subjectName, setSubjectName] = useState('');

  // Editor States
  const [codeContent, setCodeContent] = useState('');
  const [textContent, setTextContent] = useState('');
  
  const [submission, setSubmission] = useState<any>(null);
  const [graderName, setGraderName] = useState('Faculty');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Safety Check: If Params or User missing, stop loading immediately.
    if (!practicalId) {
        setErrorMsg("Invalid URL: Missing Assignment ID");
        setLoading(false);
        return;
    }
    if (!user) {
        // Wait for user to load, or redirect if needed. 
        // Don't set loading false yet, wait for AuthContext.
        return; 
    }

    const fetchData = async () => {
      // Safety Timeout: Force stop loading after 8 seconds if DB hangs
      const timeoutId = setTimeout(() => {
        setLoading((current) => {
            if (current) {
                setErrorMsg("Request timed out. Please check your internet connection.");
                return false;
            }
            return current;
        });
      }, 8000);

      try {
        setLoading(true);
        setErrorMsg(null);
        console.log("🔍 Fetching Task ID:", practicalId); 

        let foundTask = null;
        let isPrac = false;

        // A. Try Practicals Table
        const { data: prac, error: pracErr } = await supabase
          .from('batch_practicals')
          .select('*')
          .eq('id', practicalId)
          .maybeSingle();

        if (prac) {
          console.log("✅ Found in Practicals");
          foundTask = prac;
          isPrac = true;
          setSubjectName(prac.subject_code || 'Practical Lab');
        } else {
          // B. Try Assignments Table
          console.log("⚠️ Not in Practicals, checking Assignments...");
          const { data: assign, error: assignErr } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', practicalId)
            .maybeSingle();
          
          if (assignErr) {
            console.error("❌ Assignment Error:", assignErr);
            // Don't throw yet, check if assign is null
          }

          if (assign) {
            console.log("✅ Found in Assignments");
            foundTask = assign;
            isPrac = false;
            
            // Fetch Subject Name
            if (assign.subject_id) {
                const { data: sub } = await supabase.from('subjects').select('name, code').eq('id', assign.subject_id).maybeSingle();
                if (sub) setSubjectName(`${sub.name} (${sub.code})`);
            }
          }
        }

        if (!foundTask) {
           throw new Error("Task not found. It may have been deleted or you don't have access.");
        }

        setTask(foundTask);
        setIsPractical(isPrac);

        // C. Fetch Submission
        let query = supabase.from('submissions').select(`*, grader:grader_id(name)`).eq('student_id', user.id);
        
        if (isPrac) query = query.eq('practical_id', practicalId);
        else query = query.eq('assignment_id', practicalId);
        
        const { data: sub, error: subErr } = await query.maybeSingle();
        if (subErr) console.error("Submission fetch warning:", subErr);

        if (sub) {
          setSubmission(sub);
          setLastSaved(sub.last_saved_at ? new Date(sub.last_saved_at) : null);
          if(sub.grader?.name) setGraderName(sub.grader.name);

          let parsedContent = { code: '', text: '' };
          if (typeof sub.content === 'object' && sub.content !== null) {
             parsedContent = sub.content;
          } else if (typeof sub.content === 'string') {
             try { parsedContent = JSON.parse(sub.content); } catch { /* ignore */ }
          }
          setCodeContent(parsedContent.code || '');
          setTextContent(parsedContent.text || '');
        }

      } catch (err: any) {
        console.error("💥 Critical Error:", err);
        setErrorMsg(err.message || "Failed to load assignment");
      } finally {
        clearTimeout(timeoutId); // Clear the safety timer
        setLoading(false); // STOP LOADING
      }
    };

    fetchData();
  }, [practicalId, user]);

  // ... [Rest of the handlers: handleSave, handleSubmit, handlePrint] ...
  // (Inko same rakhna hai, copy below)

  const handleSave = async (manual = false) => {
    if (!user || !task) return;
    setIsSaving(true);
    try {
      const contentPayload = { code: codeContent, text: textContent };
      const timestamp = new Date().toISOString();

      const payload: any = {
        student_id: user.id,
        content: contentPayload,
        status: submission?.status === 'submitted' ? 'submitted' : 'draft',
        last_saved_at: timestamp
      };

      if (isPractical) payload.practical_id = task.id;
      else payload.assignment_id = task.id;

      const { error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: isPractical ? 'student_id,practical_id' : 'student_id,assignment_id' });

      if (error) throw error;
      setLastSaved(new Date());
      if (manual) toast.success("Draft saved");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure? You cannot edit after submitting.")) return;
    setIsSaving(true);
    try {
      const payload: any = {
        student_id: user!.id,
        content: { code: codeContent, text: textContent },
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        last_saved_at: new Date().toISOString()
      };

      if (isPractical) payload.practical_id = task.id;
      else payload.assignment_id = task.id;

      const { error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: isPractical ? 'student_id,practical_id' : 'student_id,assignment_id' });

      if (error) throw error;
      setSubmission({ ...submission, status: 'submitted' });
      toast.success("Submitted Successfully!");
      navigate(-1); 
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Report</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8">${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const renderEvaluatedContent = () => (
    <div className="space-y-6">
       {textContent && <div className="space-y-2"><h4 className="text-xs font-bold uppercase text-slate-400">Theory</h4><div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: textContent }} /></div>}
       {codeContent && <div className="space-y-2"><h4 className="text-xs font-bold uppercase text-slate-400">Code</h4><div className="bg-slate-50 p-4 rounded border font-mono text-xs whitespace-pre-wrap">{codeContent}</div></div>}
    </div>
  );

  // --- RENDER STATES ---

  if (loading) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
            <p className="text-slate-500 animate-pulse">Loading assignment details...</p>
        </div>
      );
  }
  
  // ERROR STATE (User will see this instead of infinite load if 404)
  if (errorMsg || !task) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-3 p-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500"/>
            <h2 className="text-xl font-bold text-slate-800">Unable to load Assignment</h2>
            <p className="text-slate-600 font-medium max-w-md">{errorMsg || "Assignment not found."}</p>
            <div className="flex gap-4 mt-4">
                <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
        </div>
      );
  }

  const isEvaluated = submission?.status === 'evaluated';
  const isReadOnly = isEvaluated || submission?.status === 'submitted'; 
  const mode = task.submission_mode || task.practical_mode || 'both';
  const showCode = mode === 'code' || mode === 'both';
  const showText = mode === 'text' || mode === 'both';

  if (isEvaluated) {
    const totalMarks = submission?.marks || 0;
    const maxMarks = task.total_points || 20;
    return (
      <div className="flex flex-col h-screen bg-slate-100">
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5 text-slate-500" /></Button>
             <h1 className="font-bold text-sm flex items-center gap-2">{task.title} <Badge className="bg-green-100 text-green-700">Graded</Badge></h1>
           </div>
           <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700"><Download size={16} /> Download</Button>
        </header>
        <ScrollArea className="flex-1 p-8 flex justify-center">
           <div id="printable-report" className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl p-[15mm] flex flex-col">
              <div className="mb-6 border-b-2 border-slate-900 pb-2 text-center text-2xl font-bold uppercase">Report</div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-8 p-4 border rounded">
                 <div><strong>Student:</strong> {user?.name || user?.email}</div>
                 <div><strong>Task:</strong> {task.title}</div>
                 <div><strong>Subject:</strong> {subjectName}</div>
                 <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              </div>
              <div className="mb-10 min-h-[300px]">{renderEvaluatedContent()}</div>
              <div className="mt-auto border-t pt-4 flex justify-between items-end">
                 <div><p className="text-xs text-slate-400">Generated by AcadFlow</p></div>
                 <div className="text-right"><div className="text-sm font-bold">Marks: {totalMarks} / {maxMarks}</div><div className="border p-2 inline-block rounded text-left min-w-[150px]"><div className="text-[10px] text-slate-500 uppercase">Signed By</div><div className="font-bold">{graderName}</div></div></div>
              </div>
           </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5 text-slate-500" /></Button>
          <div><h1 className="font-bold text-sm flex items-center gap-2">{task.title} {isPractical && <Badge variant="outline">{task.experiment_number}</Badge>}</h1><p className="text-[11px] text-muted-foreground">{subjectName} • Mode: {mode}</p></div>
        </div>
        <div className="flex items-center gap-3">
          {isReadOnly ? <Badge variant="secondary">Submitted</Badge> : <><div className="text-[11px] text-slate-400 flex items-center gap-1 mr-2"><Clock size={12} /> {lastSaved ? 'Saved' : 'Unsaved'}</div><Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={isSaving}>{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-2" />} Save</Button><Button size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">Submit <Send className="h-3 w-3 ml-2" /></Button></>}
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r bg-white overflow-y-auto p-5 space-y-6 hidden md:block">
          <div><h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Info size={14} /> Instructions</h3><div className="prose prose-sm text-slate-600 text-sm">{task.description || "No instructions."}</div></div>
          {task.notes && (<div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md flex gap-2"><AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" /><p className="text-xs text-yellow-800">{task.notes}</p></div>)}
        </aside>
        <section className="flex-1 p-4 bg-slate-100/50 overflow-hidden flex flex-col">
           <Tabs defaultValue={showCode ? 'code' : 'text'} className="flex-1 flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <TabsList>
                  {showCode && <TabsTrigger value="code">Code Editor</TabsTrigger>}
                  {showText && <TabsTrigger value="text">Write-up</TabsTrigger>}
                </TabsList>
              </div>
              <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden relative">
                 <TabsContent value="code" className="h-full mt-0"><CodeEditor content={codeContent} onChange={setCodeContent} readOnly={isReadOnly} language="javascript" height="100%" /></TabsContent>
                 <TabsContent value="text" className="h-full mt-0 p-4 overflow-y-auto"><RichTextEditor content={textContent} onChange={setTextContent} editable={!isReadOnly} minHeight="100%" /></TabsContent>
              </div>
           </Tabs>
        </section>
      </main>
    </div>
  );
}