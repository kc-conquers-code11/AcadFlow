import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { Save, Send, Clock, FileText, ChevronLeft, Loader2, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

export default function EditorPage() {
  // Assuming route is /practical/:practicalId
  const { practicalId } = useParams<{ practicalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [practical, setPractical] = useState<any>(null);
  
  // Editor States
  const [codeContent, setCodeContent] = useState('');
  const [textContent, setTextContent] = useState('');
  
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'submitted' | 'evaluated' | null>(null);
  const [marks, setMarks] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 1. Fetch Practical Details & Existing Submission
  useEffect(() => {
    if (!practicalId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // A. Fetch Practical Info (Updated to match your DB schema)
        const { data: prac, error: pErr } = await supabase
          .from('batch_practicals')
          .select('*')
          .eq('id', practicalId)
          .single();

        if (pErr) throw pErr;
        setPractical(prac);

        // B. Fetch Student Submission (if exists)
        const { data: sub, error: sErr } = await supabase
          .from('submissions')
          .select('*')
          .eq('practical_id', practicalId) // Ensure DB has this column (Foreign Key)
          .eq('student_id', user.id)
          .maybeSingle();

        if (sErr) throw sErr;

        if (sub) {
          // Parse content (Handle legacy string or new JSON object)
          let parsedContent = { code: '', text: '' };
          if (typeof sub.content === 'object' && sub.content !== null) {
             parsedContent = sub.content;
          } else if (typeof sub.content === 'string') {
             try { parsedContent = JSON.parse(sub.content); } catch { /* plain text fallback */ }
          }
          
          setCodeContent(parsedContent.code || '');
          setTextContent(parsedContent.text || '');
          setSubmissionStatus(sub.status);
          setLastSaved(sub.last_saved_at ? new Date(sub.last_saved_at) : null);
          setMarks(sub.marks);
          setFeedback(sub.feedback);
        }

      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Failed to load practical details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [practicalId, user]);

  // 2. Save Draft Logic
  const handleSave = async (manual = false) => {
    if (!user || !practicalId) return;
    
    setIsSaving(true);
    try {
      const contentPayload = { code: codeContent, text: textContent };
      const timestamp = new Date().toISOString();

      const payload = {
        practical_id: practicalId,
        student_id: user.id,
        content: contentPayload, // Stored as JSONB
        status: submissionStatus === 'submitted' ? 'submitted' : 'draft',
        last_saved_at: timestamp
      };

      // Upsert based on practical_id + student_id unique constraint
      // Ensure you have a UNIQUE INDEX on submissions(practical_id, student_id)
      const { error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: 'practical_id,student_id' });

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

  // 3. Submit Logic
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
        }, { onConflict: 'practical_id,student_id' });

      if (error) throw error;

      setSubmissionStatus('submitted');
      toast.success("Practical Submitted Successfully!");
      navigate(-1); // Go back to dashboard

    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!practical) return <div className="p-10 text-center">Practical not found.</div>;

  const isReadOnly = submissionStatus === 'submitted' || submissionStatus === 'evaluated';

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
          {submissionStatus === 'evaluated' && (
             <Badge className="bg-green-100 text-green-700 border-green-200">
               Marks: {marks} / {practical.total_points}
             </Badge>
          )}

          {submissionStatus === 'submitted' && (
             <Badge variant="secondary">Submitted</Badge>
          )}
          
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

          {feedback && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-md">
               <h4 className="text-xs font-bold text-green-800 mb-1 flex items-center gap-1">
                 <CheckCircle2 size={12} /> Feedback
               </h4>
               <p className="text-xs text-green-700">{feedback}</p>
            </div>
          )}
        </aside>

        {/* Right: Editor Area */}
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
                {/* Mobile Info Toggle could go here */}
              </div>

              <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden relative">
                 <TabsContent value="code" className="h-full mt-0">
                    <CodeEditor 
                      content={codeContent} 
                      onChange={setCodeContent} 
                      readOnly={isReadOnly}
                      language="javascript" // Ideally make this dynamic from practical details
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