import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { 
  mockSubmissions, 
  mockAssignments, 
  mockSubjects,
  mockStudents 
} from '@/data/mockData';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  User, 
  GraduationCap, 
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function EvaluatePage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const submission = mockSubmissions.find(s => s.id === submissionId);
  const assignment = submission ? mockAssignments.find(a => a.id === submission.assignmentId) : undefined;
  const subject = assignment ? mockSubjects.find(s => s.id === assignment.subjectId) : undefined;
  const student = submission ? mockStudents.find(s => s.id === submission.studentId) : undefined;
  
  const [marks, setMarks] = useState(submission?.marks?.toString() || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [isSaving, setIsSaving] = useState(false);

  // Security Check
  if (!user || user.role === 'student' || !submission || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">Submission record unavailable</p>
        <Button variant="link" asChild className="mt-2 text-blue-600">
          <Link to="/dashboard/submissions">Return to Submissions</Link>
        </Button>
      </div>
    );
  }

  const handleSaveEvaluation = async () => {
    const numericMarks = parseInt(marks);
    if (!marks || isNaN(numericMarks) || numericMarks < 0 || numericMarks > assignment.maxMarks) {
      toast.error(`Please enter valid marks (0 - ${assignment.maxMarks})`);
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API
    
    // In real app: API call here
    toast.success('Evaluation saved successfully');
    setIsSaving(false);
    navigate(`/dashboard/submissions`);
  };

  const plagiarismRisk = (submission.plagiarismScore || 0) > 30 ? 'high' : (submission.plagiarismScore || 0) > 15 ? 'medium' : 'low';
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 lg:-m-10 bg-slate-50/50">
      
      {/* 1. Grading Header (Sticky) */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-800 -ml-2" asChild>
            <Link to={`/dashboard/submissions`}>
              <ChevronLeft size={22} />
            </Link>
          </Button>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900">{student?.name}</h1>
              <span className="text-xs text-slate-400">• {student?.enrollmentNumber}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{assignment.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 mr-4">
             <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status:</span>
             {submission.status === 'evaluated' ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Evaluated</Badge>
             ) : (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">Pending Review</Badge>
             )}
           </div>
           
           <Button 
             onClick={handleSaveEvaluation} 
             disabled={isSaving}
             className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
           >
             <CheckCircle2 className="h-4 w-4 mr-2" />
             {isSaving ? 'Saving...' : 'Finalize Grade'}
           </Button>
        </div>
      </header>

      {/* 2. Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Student Work (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Student Meta Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
               <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <User size={20} />
               </div>
               <div>
                  <h3 className="text-sm font-bold text-slate-800">Submission Content</h3>
                  <p className="text-xs text-slate-500">Submitted on {new Date(submission.submittedAt || new Date()).toLocaleString()}</p>
               </div>
            </div>

            {/* The Actual Work */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {assignment.type === 'practical' ? (
                <CodeEditor
                  content={submission.content}
                  language={assignment.programmingLanguage}
                  readOnly
                  height="600px"
                  filename={`submission.${assignment.programmingLanguage === 'python' ? 'py' : 'cpp'}`}
                />
              ) : (
                <RichTextEditor
                  content={submission.content}
                  onChange={() => {}}
                  editable={false}
                  minHeight="500px"
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Grading Panel (Fixed Width) */}
        <div className="w-[360px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto shadow-xl z-10">
          <div className="p-6 space-y-8">
            
            {/* 1. Plagiarism Score */}
            <div className={cn(
              "rounded-xl border p-4",
              plagiarismRisk === 'high' ? "bg-red-50 border-red-100" : 
              plagiarismRisk === 'medium' ? "bg-amber-50 border-amber-100" : 
              "bg-emerald-50 border-emerald-100"
            )}>
               <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={18} className={cn(
                    plagiarismRisk === 'high' ? "text-red-600" : 
                    plagiarismRisk === 'medium' ? "text-amber-600" : 
                    "text-emerald-600"
                  )} />
                  <span className="text-sm font-bold text-slate-800">Plagiarism Check</span>
               </div>
               
               <div className="flex items-end gap-2">
                 <span className={cn(
                   "text-3xl font-extrabold",
                   plagiarismRisk === 'high' ? "text-red-700" : 
                   plagiarismRisk === 'medium' ? "text-amber-700" : 
                   "text-emerald-700"
                 )}>
                   {submission.plagiarismScore}%
                 </span>
                 <span className="text-xs font-medium text-slate-500 mb-1.5">Similarity Score</span>
               </div>
               
               {plagiarismRisk === 'high' && (
                 <p className="text-xs text-red-600 mt-2 font-medium bg-white/50 p-2 rounded">
                   High risk detected. Review matched sources manually.
                 </p>
               )}
            </div>

            {/* 2. Marks Input */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <GraduationCap size={14} /> Grading
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                   <Input 
                      type="number" 
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="h-12 text-lg font-bold pl-4 pr-12"
                      placeholder="0"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                     / {assignment.maxMarks}
                   </span>
                </div>
              </div>
            </div>

            {/* 3. Feedback Input */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Detailed Feedback
              </label>
              <Textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write constructive feedback for the student..."
                className="flex-1 min-h-[200px] resize-none p-4 text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-2 text-right">Markdown supported</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}