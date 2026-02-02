import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Save, 
  User, 
  Calendar,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function EvaluatePage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data State
  const [submission, setSubmission] = useState<any>(null);
  
  // Form State
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (submissionId) fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Submission + Assignment (for Max Marks) + Student Profile
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments (title, max_marks, type, programming_language),
          profiles:student_id (name, enrollment_number)
        `)
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      setSubmission(data);
      if (data.marks) setMarks(data.marks.toString());
      if (data.feedback) setFeedback(data.feedback);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const numMarks = parseInt(marks);
    const maxMarks = submission.assignments.max_marks;

    if (isNaN(numMarks) || numMarks < 0 || numMarks > maxMarks) {
      toast.error(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          marks: numMarks,
          feedback: feedback,
          status: 'evaluated',
          evaluated_by: user?.id,
          evaluated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success("Evaluation saved!");
      navigate(-1); // Go back to list
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to save evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!submission) return null;

  const assignment = submission.assignments;
  const student = submission.profiles;

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 lg:-m-10 flex flex-col">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} className="text-slate-500" />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{assignment.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
               <span className="flex items-center gap-1">
                 <User size={12} /> {student?.name} ({student?.enrollment_number})
               </span>
               <span>•</span>
               <span className="flex items-center gap-1">
                 <Calendar size={12} /> Submitted: {new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
              <ShieldAlert size={12} />
              Plagiarism: {submission.plagiarism_score || 0}%
           </div>
           <Button 
             onClick={handleSave} 
             disabled={submitting}
             className="bg-emerald-600 hover:bg-emerald-700 text-white"
           >
             {submitting ? 'Saving...' : 'Save & Grade'} 
             {!submitting && <CheckCircle2 size={16} className="ml-2" />}
           </Button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Student Work (Read Only) */}
        <div className="flex-1 bg-slate-50/50 relative border-r border-slate-200 overflow-hidden flex flex-col">
           {/* Grid BG */}
           <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem]" />
           
           <div className="flex-1 overflow-y-auto p-8 z-10">
              <div className="max-w-4xl mx-auto h-full">
                {assignment.type === 'practical' ? (
                  <CodeEditor
                    content={submission.content || ''}
                    language={assignment.programming_language || 'python'}
                    readOnly={true}
                    height="100%"
                    onChange={() => {}} 
                  />
                ) : (
                  <RichTextEditor
                    content={submission.content || ''}
                    editable={false}
                    onChange={() => {}}
                    minHeight="100%"
                  />
                )}
              </div>
           </div>
        </div>

        {/* Right: Grading Panel */}
        <div className="w-[350px] bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Score / {assignment.max_marks}
              </label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={marks} 
                  onChange={(e) => setMarks(e.target.value)}
                  className="text-2xl font-bold h-14 pl-4"
                  placeholder="0"
                  max={assignment.max_marks}
                  min={0}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  / {assignment.max_marks}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Feedback
              </label>
              <Textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write constructive feedback here..."
                className="min-h-[200px] resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-blue-800 font-bold text-xs mb-1">Grading Guidelines</h4>
              <p className="text-blue-600 text-xs leading-normal">
                Ensure code quality, logic, and output are verified. Check plagiarism report before finalizing marks.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}