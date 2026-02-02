import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { 
  getAssignmentById, 
  getSubjectById, 
  getSubmissionByAssignmentAndStudent 
} from '@/data/mockData';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function EditorPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Data Fetching
  const assignment = assignmentId ? getAssignmentById(assignmentId) : undefined;
  const subject = assignment ? getSubjectById(assignment.subjectId) : undefined;
  const existingSubmission = assignment && user 
    ? getSubmissionByAssignmentAndStudent(assignment.id, user.id)
    : undefined;

  // Initialize Data
  useEffect(() => {
    if (existingSubmission) {
      setContent(existingSubmission.content);
      setLastSaved(new Date(existingSubmission.lastSavedAt));
    }
  }, [existingSubmission]);

  // Logic: Autosave
  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    
    setIsSaving(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const existingIndex = submissions.findIndex(
      (s: any) => s.assignmentId === assignmentId && s.studentId === user?.id
    );
    
    const submissionData = {
      id: existingSubmission?.id || `sub-${Date.now()}`,
      assignmentId,
      studentId: user?.id,
      content,
      status: 'draft',
      lastSavedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      submissions[existingIndex] = { ...submissions[existingIndex], ...submissionData };
    } else {
      submissions.push(submissionData);
    }
    
    localStorage.setItem('submissions', JSON.stringify(submissions));
    setLastSaved(new Date());
    setIsDirty(false);
    setIsSaving(false);
    toast.success('Draft saved automatically');
  }, [content, assignmentId, user?.id, existingSubmission?.id, isDirty]);

  // Logic: Interval Save
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [handleSave, isDirty]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  };

  // Logic: Submit
  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit? You won't be able to edit this afterwards.")) return;

    setIsSubmitting(true);
    await handleSave(); // Final save
    
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const existingIndex = submissions.findIndex(
      (s: any) => s.assignmentId === assignmentId && s.studentId === user?.id
    );
    
    if (existingIndex >= 0) {
      submissions[existingIndex].status = 'submitted';
      submissions[existingIndex].submittedAt = new Date().toISOString();
      localStorage.setItem('submissions', JSON.stringify(submissions));
    }
    
    setIsSubmitting(false);
    toast.success('Assignment submitted successfully!');
    navigate('/dashboard/assignments');
  };

  if (!assignment || !subject || !user) {
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
  const isSubmitted = existingSubmission?.status === 'submitted';
  const isEvaluated = existingSubmission?.status === 'evaluated';
  const isReadOnly = isSubmitted || isEvaluated;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 lg:-m-10"> {/* Negative margin to break out of main layout padding */}
      
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
                {subject.code}
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
                  <>Saving...</>
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
          {isEvaluated && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Graded: {existingSubmission.marks}/{assignment.maxMarks}</Badge>}

          {/* Action Buttons */}
          {!isReadOnly && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave} 
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
            {isEvaluated && existingSubmission.feedback && (
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
                  {existingSubmission.feedback}
                </p>
              </motion.div>
            )}

            {/* Instructions */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={14} /> Assignment Brief
              </h3>
              <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed">
                {/* We render description as paragraphs for now, could be HTML */}
                {assignment.description.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>
            </div>

            {/* Metadata Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subject</span>
                <span className="font-medium text-slate-700">{subject.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Max Points</span>
                <span className="font-medium text-slate-700">{assignment.maxMarks}</span>
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
                  language={assignment.programmingLanguage}
                  readOnly={isReadOnly}
                  height="100%"
                  filename={`solution.${assignment.programmingLanguage === 'python' ? 'py' : 'cpp'}`}
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