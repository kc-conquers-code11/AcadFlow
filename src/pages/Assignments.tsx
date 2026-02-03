import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Code2, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FlaskConical,
  BookOpen,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Visual Assets ---
const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />
);

// --- Sub-Components ---

const StatusPill = ({ status, marks, isOverdue }: { status?: string; marks?: number; isOverdue: boolean }) => {
  if (status === 'evaluated' && marks !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={12} />
        {marks} / 100
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

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
        <AlertCircle size={12} />
        Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      Pending
    </span>
  );
};

const AssignmentCard = ({ assignment, user, submission }: { assignment: any, user: any, submission?: any }) => {
  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date() && !submission?.submitted_at;
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const isPractical = assignment.type === 'practical';
  const Icon = isPractical ? FlaskConical : BookOpen;
  const iconColor = isPractical ? "text-violet-600 bg-violet-50 border-violet-100" : "text-blue-600 bg-blue-50 border-blue-100";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group bg-white rounded-xl border border-slate-200 p-4 transition-all hover:shadow-lg hover:shadow-slate-200/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
    >
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shrink-0", iconColor)}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {assignment.title}
          </h3>
          {isPractical && (
             <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">Lab</span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          
          {!isOverdue && !submission?.submitted_at && (
             <span className={cn(
               "flex items-center gap-1.5",
               daysLeft <= 2 ? "text-amber-600" : "text-slate-500"
             )}>
               <Clock size={13} />
               {daysLeft <= 0 ? "Due Today" : `${daysLeft} days left`}
             </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pl-14 sm:pl-0">
        {user.role === 'student' && (
          <StatusPill status={submission?.status} marks={submission?.marks} isOverdue={isOverdue} />
        )}
        
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-full transition-all" asChild>
          <Link to={user.role === 'student' ? `/editor/${assignment.id}` : `/submissions/${assignment.id}`}>
            <ChevronRight size={18} />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default function Assignments() {
  const { user } = useAuth();
  const [assignmentsBySubject, setAssignmentsBySubject] = useState<any[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Subjects and Assignments
      let query = supabase.from('subjects').select(`
        *,
        assignments (*)
      `);

      // 2. Fetch User's Submissions (if student)
      let mySubmissions: any[] = [];
      if (user.role === 'student') {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user.id);
        mySubmissions = subs || [];
        
        // Create Map for fast lookup: { assignment_id: submission }
        const subMap: Record<string, any> = {};
        mySubmissions.forEach(s => subMap[s.assignment_id] = s);
        setSubmissionsMap(subMap);
      }

      const { data: subjectData, error } = await query;
      if (error) throw error;

      // 3. Filter & Group Logic
      const grouped = (subjectData || []).map((subject: any) => {
        // Filter assignments based on Target Audience
        const filteredAssignments = (subject.assignments || []).filter((assignment: any) => {
          // If Teacher -> Show all
          if (user.role !== 'student') return true;

          // If Student -> Check targeting logic
          const targetDiv = assignment.target_division;
          const targetBatch = assignment.target_batch;

          // Logic:
          // 1. If target_division is null -> Open to everyone
          // 2. If target_division matches user.division:
          //    a. If target_batch is null -> Open to whole division
          //    b. If target_batch matches user.batch -> Open to batch
          
          const isCommon = !targetDiv;
          const isMyDivision = targetDiv === user.division;
          const isMyBatch = targetBatch === user.batch;
          const isWholeDivision = targetDiv === user.division && !targetBatch;

          return isCommon || isWholeDivision || (isMyDivision && isMyBatch);
        });

        // Sort by deadline
        filteredAssignments.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        return {
          subject,
          assignments: filteredAssignments
        };
      }).filter((group: any) => group.assignments.length > 0); // Remove subjects with no relevant assignments

      setAssignmentsBySubject(grouped);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      <GridPattern />
      
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Assignments</h1>
          <p className="text-slate-500 max-w-2xl">
            {user.role === 'student' 
              ? 'Manage your submissions, track deadlines, and view evaluation feedback.' 
              : 'Monitor student progress and evaluate submissions across your subjects.'}
          </p>
        </div>

        {/* Assignments List */}
        <div className="space-y-10">
          {assignmentsBySubject.map(({ subject, assignments }, groupIndex) => (
            <motion.div 
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              {/* Subject Header */}
              <div className="flex items-center gap-3 mb-5 pl-1 border-l-4 border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 pl-2">{subject.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  {subject.code}
                </span>
              </div>
              
              {/* Cards Grid */}
              <div className="grid gap-3">
                {assignments.map((assignment: any) => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    user={user} 
                    submission={submissionsMap[assignment.id]}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {assignmentsBySubject.length === 0 && (
            <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-slate-200">
              <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No pending assignments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}