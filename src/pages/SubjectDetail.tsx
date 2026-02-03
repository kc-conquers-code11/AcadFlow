import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase'; // Real DB
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Code2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  FlaskConical,
  BookOpen,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Sub-Components ---
const StatusPill = ({ status, marks, maxMarks }: { status: string; marks?: number; maxMarks: number }) => {
  if (status === 'evaluated' && marks !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={12} />
        {marks} / {maxMarks}
      </span>
    );
  }
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <Clock size={12} />
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      Pending
    </span>
  );
};

export default function SubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  
  const [subject, setSubject] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]); // To map status
  const [loading, setLoading] = useState(true);

  if (!user || !subjectId) return null;

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      // 1. Fetch Subject Info
      const { data: subData, error: subError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();
      
      if (subError) throw subError;
      setSubject(subData);

      // 2. Fetch Assignments for this subject
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .order('deadline', { ascending: true });

      if (assignError) throw assignError;
      setAssignments(assignData || []);

      // 3. Fetch My Submissions for these assignments (to show status)
      if (assignData && assignData.length > 0) {
        const { data: submisData } = await supabase
          .from('submissions')
          .select('assignment_id, status, marks')
          .eq('student_id', user.id)
          .in('assignment_id', assignData.map(a => a.id));
        
        setSubmissions(submisData || []);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to find status for a specific assignment
  const getMySubmission = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">Subject not found</p>
        <Button variant="link" asChild className="mt-2 text-blue-600">
          <Link to="/dashboard/subjects">Back to Subjects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* 1. Header Section */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-6 text-slate-500 hover:text-slate-900 -ml-2" asChild>
          <Link to="/dashboard/subjects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600">
                {subject.code}
              </span>
              {subject.has_code_editor && (
                <Badge variant="outline" className="gap-1.5 bg-violet-50 text-violet-700 border-violet-100">
                  <Code2 size={12} /> Lab Enabled
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{subject.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <LayoutGrid size={14} /> Year {subject.year}, Sem {subject.semester}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{assignments.length} Tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Assignments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-slate-400" /> 
            Coursework
          </h2>
        </div>
        
        {assignments.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-xl">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No assignments posted yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {assignments.map((assignment, index) => {
              const submission = getMySubmission(assignment.id);
              
              const deadline = new Date(assignment.deadline);
              const isOverdue = deadline < new Date() && !submission; // Logic refined
              const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              
              const isPractical = assignment.type === 'practical';
              const Icon = isPractical ? FlaskConical : BookOpen;
              const iconColor = isPractical ? "text-violet-600 bg-violet-50" : "text-blue-600 bg-blue-50";

              return (
                <motion.div 
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-xl border border-slate-200 p-4 transition-all hover:shadow-md hover:border-slate-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  {/* Icon Box */}
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-slate-100", iconColor)}>
                    <Icon size={20} />
                  </div>

                  {/* Main Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {assignment.title}
                      </h3>
                      {isPractical && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Lab</Badge>}
                    </div>
                    
                    <p className="text-sm text-slate-500 line-clamp-1 mb-2">
                      {assignment.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <Calendar size={12} />
                        {deadline.toLocaleDateString()}
                      </span>
                      
                      {!isOverdue && daysLeft > 0 && (
                        <span className={cn("flex items-center gap-1.5", daysLeft <= 3 ? "text-amber-600" : "text-slate-400")}>
                          <Clock size={12} />
                          {daysLeft} days left
                        </span>
                      )}
                      
                      {isOverdue && <span className="text-red-600 font-bold">Overdue</span>}
                    </div>
                  </div>

                  {/* Right Action Area */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    {user.role === 'student' && (
                      <StatusPill 
                        status={submission?.status || 'pending'} 
                        marks={submission?.marks} 
                        maxMarks={assignment.max_marks} 
                      />
                    )}
                    
                    <div className="flex gap-2">
                      {user.role === 'student' ? (
                          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm" asChild>
                            <Link to={`/editor/${assignment.id}`}>
                              {submission ? 'View' : 'Start'} <ChevronRight size={14} className="ml-1" />
                            </Link>
                          </Button>
                      ) : (
                          <Button size="sm" variant="outline" className="border-slate-200" asChild>
                            <Link to={`/dashboard/submissions/${assignment.id}`}>
                              Submissions
                            </Link>
                          </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}