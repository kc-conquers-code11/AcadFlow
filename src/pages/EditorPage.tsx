import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Calendar,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function EditorPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Refs for autosave interval
  const contentRef = useRef(content); // Keep track of latest content for interval
  
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // 1. Initial Data Fetch
  useEffect(() => {
    if (user && assignmentId) {
      fetchData();
    }
  }, [user, assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // A. Fetch Assignment Details (joined with Subject)
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*, subjects(*)')
        .eq('id', assignmentId)
        .single();
      
      if (assignError) throw assignError;
      setAssignment(assignData);

      // B. Fetch Existing Submission (if any)
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user!.id)
        .maybeSingle(); // maybeSingle returns null instead of error if not found

      if (subError && subError.code !== 'PGRST116') throw subError;

      if (subData) {
        setSubmission(subData);
        setContent(subData.content || '');
        setLastSaved(subData.last_saved_at ? new Date(subData.last_saved_at) : null);
      }
      
    } catch (error) {
      console.error("Error fetching editor data:", error);
      toast.error("Could not load assignment details");
    } finally {
      setLoading(false);
    }
  };

  // 2. Save Logic (Upsert)
  const handleSave = useCallback(async (manual = false) => {
    if (!user || !assignmentId) return;
    
    // If saving manually, proceed. If autosaving, only proceed if dirty.
    if (!manual && !isDirty) return;

    try {
      setIsSaving(true);
      const currentContent = contentRef.current;
      const timestamp = new Date().toISOString();

      const payload = {
        assignment_id: assignmentId,
        student_id: user.id,
        content: currentContent,
        last_saved_at: timestamp,
        status: submission?.status === 'submitted' ? 'submitted' : 'draft' // Keep submitted if already submitted
      };

      // Upsert: Updates if exists (based on unique constraint student_id + assignment_id), inserts if new
      const { data, error } = await supabase
        .from('submissions')
        .upsert(payload, { onConflict: 'assignment_id,student_id' })
        .select()
        .single();

      if (error) throw error;

      setSubmission(data);
      setLastSaved(new Date(timestamp));
      setIsDirty(false);
      
      if (manual) toast.success('Draft saved successfully');

    } catch (error) {
      console.error("Save error:", error);
      if (manual) toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  }, [assignmentId, user, isDirty, submission]);

  // 3. Interval Autosave (Every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        handleSave(false);
      }
    }, 30000); 
    return () => clearInterval(interval);
  }, [handleSave, isDirty]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  };

  // 4. Submit Logic
  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit? You won't be able to edit this afterwards.")) return;

    setIsSubmitting(true);
    try {
      // 1. Force a save first with status 'submitted'
      const timestamp = new Date().toISOString();
      
      const { error } = await supabase
        .from('submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: user!.id,
          content: content, // Use current state content
          status: 'submitted',
          submitted_at: timestamp,
          last_saved_at: timestamp
        }, { onConflict: 'assignment_id,student_id' });

      if (error) throw error;

      toast.success('Assignment submitted successfully!');
      navigate('/dashboard/assignments');
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render States ---

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">Assignment not found</p>
        <Button variant="link" asChild className="mt-2 text-blue-600">
          <Link to="/dashboard/assignments">Return to Assignments</Link>
        </Button>
      </div>
    );
  }

  // Computed Status
  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date();
  const isSubmitted = submission?.status === 'submitted';
  const isEvaluated = submission?.status === 'evaluated';
  const isReadOnly = isSubmitted || isEvaluated;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 lg:-m-10"> 
      
      {/* 1. Editor Toolbar (Sticky) */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-800 -ml-2" asChild>
            <Link to="/dashboard/assignments">
              <ChevronLeft size={22} />
            </Link>
          </Button>
          
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {assignment.title}
              <Badge variant="outline" className="font-normal text-[10px] text-slate-500 bg-slate-50 border-slate-200">
                {assignment.subjects?.code}
              </Badge>
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className={cn("flex items-center gap-1", isOverdue && !isSubmitted ? "text-red-600 font-medium" : "")}>
                <Calendar size={12} /> 
                {isOverdue ? "Overdue" : `Due ${deadline.toLocaleDateString()}`}
              </span>
              
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              
              <span className={cn("flex items-center gap-1 transition-colors", isSaving ? "text-blue-600" : "text-slate-400")}>
                {isSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Clock size={12} /> 
                    {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Not saved'}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badges */}
          {isSubmitted && <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Submitted</Badge>}
          {isEvaluated && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Graded: {submission.marks}/{assignment.max_marks}</Badge>}

          {/* Action Buttons */}
          {!isReadOnly && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSave(true)} 
                disabled={isSaving || !isDirty}
                className="hidden sm:flex border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              
              <Button 
                size="sm" 
                onClick={handleSubmit} 
                disabled={isSubmitting || isOverdue}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
              >
                {isSubmitting ? 'Sending...' : 'Submit Work'}
                {!isSubmitting && <Send className="h-4 w-4 ml-2" />}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* 2. Main Workspace (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Instructions Panel */}
        <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
          <div className="p-6 space-y-6">
            
            {/* Feedback Card (If Exists) */}
            {isEvaluated && submission.feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-800">Faculty Feedback</h3>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">
                  {submission.feedback}
                </p>
              </motion.div>
            )}

            {/* Instructions */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={14} /> Assignment Brief
              </h3>
              <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                {assignment.description || "No description provided."}
              </div>
            </div>

            {/* Metadata Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subject</span>
                <span className="font-medium text-slate-700">{assignment.subjects?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Max Points</span>
                <span className="font-medium text-slate-700">{assignment.max_marks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Format</span>
                <span className="font-medium text-slate-700 capitalize">{assignment.type}</span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT: Editor Canvas */}
        <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden relative">
          {/* Engineering Grid Background */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem]" />

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 z-10">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {assignment.type === 'practical' ? (
                <CodeEditor
                  content={content}
                  onChange={handleContentChange}
                  language={assignment.programming_language || 'python'} // Fallback to python
                  readOnly={isReadOnly}
                  height="100%"
                  filename={`solution.${assignment.programming_language === 'python' ? 'py' : 'cpp'}`}
                />
              ) : (
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  editable={!isReadOnly}
                  minHeight="500px"
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}