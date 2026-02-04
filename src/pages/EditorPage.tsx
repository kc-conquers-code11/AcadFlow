import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { Save, Send, Clock, ChevronLeft, Loader2, Info, AlertCircle, CheckCircle2, Printer, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EditorPage() {
  const { practicalId } = useParams<{ practicalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [practical, setPractical] = useState<any>(null);

  // Editor States
  const [codeContent, setCodeContent] = useState('');
  const [textContent, setTextContent] = useState('');

  const [submission, setSubmission] = useState<any>(null);
  const [graderName, setGraderName] = useState('Faculty');

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!practicalId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Fetch Practical
        const { data: prac, error: pErr } = await supabase
          .from('batch_practicals')
          .select('*')
          .eq('id', practicalId)
          .single();

        if (pErr) throw pErr;
        setPractical(prac);

        // B. Fetch Submission with Grader Info
        const { data: sub, error: sErr } = await supabase
          .from('submissions')
          .select(`*, grader:grader_id(name)`) // Fetch grader name if exists
          .eq('practical_id', practicalId)
          .eq('student_id', user.id)
          .maybeSingle();

        if (sErr) throw sErr;

        if (sub) {
          setSubmission(sub);
          setLastSaved(sub.last_saved_at ? new Date(sub.last_saved_at) : null);

          if (sub.grader?.name) setGraderName(sub.grader.name);

          // Parse Content
          let parsedContent = { code: '', text: '' };
          if (typeof sub.content === 'object' && sub.content !== null) {
            parsedContent = sub.content;
          } else if (typeof sub.content === 'string') {
            try { parsedContent = JSON.parse(sub.content); } catch { /* plain text fallback */ }
          }
          setCodeContent(parsedContent.code || '');
          setTextContent(parsedContent.text || '');
        }

      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Failed to load details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [practicalId, user]);

  // Save Draft Logic
  const handleSave = async (manual = false) => {
    if (!user || !practicalId) return;
    setIsSaving(true);
    try {
      const contentPayload = { code: codeContent, text: textContent };
      const timestamp = new Date().toISOString();

      const payload = {
        practical_id: practicalId,
        student_id: user.id,
        content: contentPayload,
        status: submission?.status === 'submitted' ? 'submitted' : 'draft',
        last_saved_at: timestamp
      };

      const { error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: 'student_id,practical_id' });

      if (error) throw error;

      setLastSaved(new Date());
      if (manual) toast.success("Draft saved");
    } catch (err) {
      console.error(err);
      if (manual) toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Logic
  const handleSubmit = async () => {
    if (!confirm("Are you sure? You cannot edit after submitting.")) return;
    setIsSaving(true);
    try {
      const contentPayload = { code: codeContent, text: textContent };
      const { error } = await supabase
        .from('submissions')
        .upsert({
          practical_id: practicalId,
          student_id: user!.id,
          content: contentPayload,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          last_saved_at: new Date().toISOString()
        }, { onConflict: 'student_id,practical_id' });

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

  // --- PDF PRINT LOGIC (Same as Teacher Side) ---
  const handlePrint = () => {
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error("Pop-up blocked. Allow pop-ups to download PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${practical.title}_Report</title>
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

  // --- RENDER HELPERS ---
  const renderEvaluatedContent = () => {
    return (
      <div className="space-y-6">
        {textContent && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400">Theory / Write-up</h4>
            <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: textContent }} />
          </div>
        )}
        {codeContent && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400">Source Code</h4>
            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs font-mono whitespace-pre-wrap break-all shadow-sm">
              {codeContent}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!practical) return <div className="p-10 text-center">Practical not found.</div>;

  const isEvaluated = submission?.status === 'evaluated';
  // If submitted but not evaluated, it's read-only but not yet a report
  const isSubmittedOnly = submission?.status === 'submitted';
  const isReadOnly = isEvaluated || isSubmittedOnly;

  // --- MODE 1: EVALUATED REPORT VIEW (PDF STYLE) ---
  if (isEvaluated) {
    const totalMarks = submission?.marks || 0;
    // Calculate max marks logic
    let maxMarks = practical.total_points || 0;
    if (maxMarks === 0 && practical.rubrics) {
      maxMarks = practical.rubrics.reduce((a: any, b: any) => a + b.max_marks, 0);
    }
    if (maxMarks === 0) maxMarks = 20;

    return (
      <div className="flex flex-col h-screen bg-slate-100">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="font-bold text-sm flex items-center gap-2">
                {practical.title}
                <Badge className="bg-green-100 text-green-700 border-green-200">Graded</Badge>
              </h1>
            </div>
          </div>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Download size={16} /> Download Report
          </Button>
        </header>

        {/* PDF Viewport */}
        <ScrollArea className="flex-1 p-8 flex justify-center overflow-y-auto">
          <div className="flex justify-center pb-20">
            <div id="printable-report" className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl p-[15mm] relative flex flex-col">

              {/* Letterhead */}
              <div className="mb-6 border-b-2 border-slate-900 pb-2">
                <img src="/images/letterhead.png" alt="Letterhead" className="w-full max-h-32 object-contain block mx-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>

              {/* Info Table */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm mb-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-500 font-medium">Student Name</span>
                  <span className="font-bold">{user?.name || 'Student'}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-500 font-medium">Experiment</span>
                  <span className="font-bold">{practical.experiment_number}</span>
                </div>
                {/* We can fetch profile details if needed, but keeping it simple for now */}
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-500 font-medium">Date</span>
                  <span className="font-bold">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mb-6 text-center">
                <h2 className="text-lg font-bold underline decoration-slate-400 underline-offset-4">{practical.title}</h2>
              </div>

              <div className="mb-10 min-h-[400px]">
                {renderEvaluatedContent()}
              </div>

              {/* Footer Section */}
              <div className="mt-auto">

                {/* Rubrics Table */}
                {practical.rubrics?.length > 0 && submission.rubric_scores && (
                  <div className="mb-8 break-inside-avoid">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b pb-1">Evaluation Details</h4>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-300 px-3 py-2 text-left w-12">Sr.</th>
                          <th className="border border-slate-300 px-3 py-2 text-left">Criteria</th>
                          <th className="border border-slate-300 px-3 py-2 text-center w-24">Max</th>
                          <th className="border border-slate-300 px-3 py-2 text-center w-24">Obtained</th>
                        </tr>
                      </thead>
                      <tbody>
                        {practical.rubrics.map((r: any, idx: number) => (
                          <tr key={r.id}>
                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                            <td className="border border-slate-300 px-3 py-2">{r.criteria}</td>
                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500">{r.max_marks}</td>
                            <td className="border border-slate-300 px-3 py-2 text-center font-bold">
                              {submission.rubric_scores[r.id] || 0}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right">Total</td>
                          <td className="border border-slate-300 px-3 py-2 text-center">{maxMarks}</td>
                          <td className="border border-slate-300 px-3 py-2 text-center text-slate-900">{totalMarks}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Remarks */}
                {submission.feedback && (
                  <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm break-inside-avoid">
                    <span className="font-bold text-yellow-800">Faculty Remarks:</span> {submission.feedback}
                  </div>
                )}

                {/* Signature Block */}
                <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-400 break-inside-avoid">
                  <div className="space-y-1">
                    <p>Generated by AcadFlow</p>
                    <p>ID: <span className="font-mono">{submission.id.slice(0, 8)}</span></p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="w-48 border border-slate-300 rounded bg-slate-50 p-2 text-left relative">
                      <div className="absolute -top-3 -right-3 bg-green-100 text-green-700 rounded-full p-1 border border-green-200 shadow-sm">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Digitally Signed By</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{graderName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Faculty, Comp. Dept</p>
                      <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                        <span>{new Date(submission.evaluated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // --- MODE 2: REGULAR EDITOR (Pending/Submitted) ---
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="font-bold text-sm leading-none flex items-center gap-2">
              {practical.title}
              <Badge variant="outline">{practical.experiment_number}</Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              Mode: <span className="capitalize">{practical.practical_mode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSubmittedOnly && <Badge variant="secondary">Submitted (Read Only)</Badge>}

          {!isReadOnly && (
            <>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mr-2">
                <Clock size={12} /> {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
                Save Draft
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                Submit <Send className="h-3 w-3 ml-2" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Instructions */}
        <aside className="w-80 border-r bg-white overflow-y-auto p-5 space-y-6 hidden md:block">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
              <Info size={14} /> Instructions
            </h3>
            <div className="prose prose-sm text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
              {practical.description || "No instructions provided."}
            </div>
          </div>
          {practical.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md flex gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">{practical.notes}</p>
            </div>
          )}
        </aside>

        {/* Right: Editor */}
        <section className="flex-1 p-4 bg-slate-100/50 overflow-hidden flex flex-col">
          <Tabs defaultValue={practical.practical_mode === 'no-code' ? 'text' : 'code'} className="flex-1 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <TabsList>
                {(practical.practical_mode === 'code' || practical.practical_mode === 'both') && (
                  <TabsTrigger value="code">Code Editor</TabsTrigger>
                )}
                {(practical.practical_mode === 'no-code' || practical.practical_mode === 'both') && (
                  <TabsTrigger value="text">Write-up / Report</TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden relative">
              <TabsContent value="code" className="h-full mt-0">
                <CodeEditor
                  content={codeContent}
                  onChange={setCodeContent}
                  readOnly={isReadOnly}
                  language="javascript"
                  height="100%"
                />
              </TabsContent>

              <TabsContent value="text" className="h-full mt-0 p-4 overflow-y-auto">
                <RichTextEditor
                  content={textContent}
                  onChange={setTextContent}
                  editable={!isReadOnly}
                  minHeight="100%"
                />
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </main>
    </div>
  );
}