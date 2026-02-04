import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { 
  ArrowLeft, CheckCircle2, Save, User, Calendar, 
  Printer, Code, ShieldAlert, Loader2, LayoutTemplate 
} from 'lucide-react';
import { toast } from 'sonner';

export default function EvaluatePage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'print'>('editor');
  
  // Data State
  const [submission, setSubmission] = useState<any>(null);
  
  // Form State
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (submissionId) fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Submission + Assignment (with Rubrics) + Student Profile
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments:assignment_id (title, max_marks, type, programming_language, rubrics),
          profiles:student_id (name, enrollment_number, department, year, division)
        `)
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      setSubmission(data);
      if (data.feedback) setFeedback(data.feedback);
      if (data.rubric_scores) setRubricScores(data.rubric_scores);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Calculate total from rubrics
    const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);
    const maxPossible = submission.assignments.max_marks;

    if (totalScore > maxPossible) {
      toast.warning(`Total score (${totalScore}) exceeds max marks (${maxPossible})`);
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          marks: totalScore,
          rubric_scores: rubricScores,
          feedback: feedback,
          status: 'evaluated',
          evaluated_by: user?.id,
          evaluated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success("Graded Successfully!");
      navigate(-1);
      
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
  const rubrics = assignment.rubrics || [];
  
  // Dynamic Total
  const currentTotal = Object.values(rubricScores).reduce((a, b) => a + b, 0);

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 lg:-m-10 flex flex-col bg-slate-50">
      
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
           {/* View Mode Toggle */}
           <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button 
                size="sm" 
                variant={viewMode === 'editor' ? 'default' : 'ghost'} 
                className={viewMode === 'editor' ? "h-7 bg-white text-slate-900 shadow-sm hover:bg-white" : "h-7 text-slate-500"}
                onClick={() => setViewMode('editor')}
              >
                <Code size={14} className="mr-1.5"/> Code
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'print' ? 'default' : 'ghost'}
                className={viewMode === 'print' ? "h-7 bg-white text-slate-900 shadow-sm hover:bg-white" : "h-7 text-slate-500"}
                onClick={() => setViewMode('print')}
              >
                <LayoutTemplate size={14} className="mr-1.5"/> Letterhead
              </Button>
           </div>

           <Button 
             onClick={handleSave} 
             disabled={submitting}
             className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
           >
             {submitting ? 'Saving...' : `Save Grade (${currentTotal}/${assignment.max_marks})`} 
             {!submitting && <CheckCircle2 size={16} className="ml-2" />}
           </Button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Student Work (Toggle) */}
        <div className="flex-1 bg-slate-200/50 relative border-r border-slate-200 overflow-hidden flex flex-col items-center justify-start overflow-y-auto">
           
           {viewMode === 'editor' ? (
             <div className="w-full h-full bg-slate-50">
                {/* Grid BG for Code */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                <div className="relative z-10 h-full p-6">
                  <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
           ) : (
             // --- LETTERHEAD PDF VIEW ---
             <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-lg my-8 p-[20mm] text-slate-900">
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
                   <h2 className="text-2xl font-bold uppercase tracking-widest font-serif">PVPP College of Engineering</h2>
                   <p className="text-sm font-medium mt-1">Department of {student.department || 'Computer Engineering'}</p>
                   <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Academic Year 2024-25</p>
                </div>

                {/* Meta Info */}
                <div className="flex justify-between text-sm mb-8 font-mono bg-slate-50 p-4 border border-slate-100 rounded">
                   <div className="space-y-1">
                      <p><span className="text-slate-500">Name:</span> {student.name}</p>
                      <p><span className="text-slate-500">Roll No:</span> {student.enrollment_number}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p><span className="text-slate-500">Experiment:</span> {assignment.title}</p>
                      <p><span className="text-slate-500">Date:</span> {new Date(submission.submitted_at).toLocaleDateString()}</p>
                   </div>
                </div>

                {/* Content Body */}
                <div className="prose max-w-none text-sm leading-relaxed">
                   <div className="font-mono whitespace-pre-wrap">
                     {submission.content || "No content submitted."}
                   </div>
                </div>

                {/* Footer Signature */}
                <div className="mt-20 pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-400">
                   <div>
                      <p>Generated via AcadFlow</p>
                      <p>{new Date().toLocaleString()}</p>
                   </div>
                   <div className="text-center">
                      <div className="h-10 w-32 mb-1 border-b border-slate-300"></div>
                      <p>Faculty Signature</p>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Right: Rubric Grading Panel */}
        <div className="w-[350px] bg-white flex flex-col shrink-0 overflow-y-auto border-l border-slate-200 shadow-xl z-20">
          <div className="p-6 space-y-6">
            
            {/* Rubrics Section */}
            <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <LayoutTemplate size={14}/> Grading Rubric
               </h3>
               
               {rubrics.length === 0 ? (
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center text-sm text-slate-500 italic">
                   No rubrics defined. Please enter marks manually below.
                 </div>
               ) : (
                 <div className="space-y-4">
                   {rubrics.map((item: any) => (
                     <div key={item.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between mb-2">
                           <span className="text-sm font-medium text-slate-700">{item.criteria}</span>
                           <span className="text-xs font-bold text-slate-400">Max: {item.max_marks}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <input 
                             type="range" 
                             min="0" 
                             max={item.max_marks}
                             className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                             value={rubricScores[item.id] || 0}
                             onChange={(e) => setRubricScores(prev => ({...prev, [item.id]: parseInt(e.target.value)}))}
                           />
                           <span className="w-6 text-right font-bold text-blue-600">{rubricScores[item.id] || 0}</span>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Total Marks (Read Only if rubrics exist, else editable) */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Total Score
              </label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={currentTotal} 
                  readOnly={rubrics.length > 0}
                  className="text-3xl font-bold h-16 pl-4 bg-slate-50 border-slate-200 text-slate-800"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  / {assignment.max_marks}
                </span>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Feedback
              </label>
              <Textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write constructive feedback..."
                className="min-h-[150px] resize-none text-sm leading-relaxed bg-white"
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}