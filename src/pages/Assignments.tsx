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
  Loader2,
  Plus,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateAssignmentModal } from '@/components/teacher/CreateAssignmentModal'; 

// --- Visual Assets ---
const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-slate-950 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />
);

// --- Sub-Components ---

const StatusPill = ({ status, marks, isOverdue }: { status?: string; marks?: number; isOverdue: boolean }) => {
  if (status === 'evaluated' && marks !== undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle2 size={12} />
        {marks} / 20
      </span>
    );
  }

  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
        <Clock size={12} />
        Submitted
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
        <AlertCircle size={12} />
        Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
      Pending
    </span>
  );
};

const AssignmentCard = ({ assignment, user, submission }: { assignment: any, user: any, submission?: any }) => {
  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date() && !submission?.submitted_at;
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Icon Logic
  const isPractical = assignment.type === 'practical'; // Or derive from logic
  const Icon = BookOpen;
  const iconColor = "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
    >
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shrink-0", iconColor)}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
            {assignment.title}
          </h3>
          {/* Target Badge for Teachers */}
          {user.role !== 'student' && (
             <span className="text-[10px] flex items-center gap-1 font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <Users size={10} />
                {assignment.target_division ? `Div ${assignment.target_division}` : 'All Divs'} 
                {assignment.target_batch ? `-${assignment.target_batch}` : ''}
             </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          
          {!isOverdue && !submission?.submitted_at && (
             <span className={cn(
               "flex items-center gap-1.5",
               daysLeft <= 2 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"
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
        
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 rounded-full transition-all" asChild>
          {/* Link Logic: Student -> Editor | Teacher -> Submission List */}
          <Link to={`/editor/${assignment.id}`}>  {/*    Sahi Link */}
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
  
  // Modal State for Teacher
  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (!user) return null;

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // 1. Get Profile (For Filtering)
      const { data: profile } = await supabase.from('profiles').select('division, batch').eq('id', user.id).single();

      // 2. Fetch Subjects and Assignments
      let query = supabase.from('subjects').select(`
        *,
        assignments (*)
      `);

      // 3. Fetch User's Submissions (if student)
      if (user.role === 'student') {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user.id);
        
        // Map for fast lookup
        const subMap: Record<string, any> = {};
        subs?.forEach(s => subMap[s.assignment_id] = s);
        setSubmissionsMap(subMap);
      }

      const { data: subjectData, error } = await query;
      if (error) throw error;

      // 4. FILTERING LOGIC (The Twist)
      const grouped = (subjectData || []).map((subject: any) => {
        
        const filteredAssignments = (subject.assignments || []).filter((assignment: any) => {
          // A. Teacher sees everything they created (or everything in subjects they teach - simpler to show all for now)
          if (user.role !== 'student') return true;

          // B. Student Targeting Logic
          const targetDiv = assignment.target_division; // e.g., 'A', 'B' or null (All)
          const targetBatch = assignment.target_batch;  // e.g., 'A1', 'A2' or null (All)

          // 1. Global Assignment (No restrictions)
          if (!targetDiv) return true;

          // 2. Division Check
          if (targetDiv === profile?.division) {
             // 2a. Batch Check (Only if Division Matches)
             if (!targetBatch) return true; // Whole Division
             if (targetBatch === profile?.batch) return true; // Specific Batch
          }

          return false;
        });

        // Sort by deadline
        filteredAssignments.sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        return {
          subject,
          assignments: filteredAssignments
        };
      }).filter((group: any) => group.assignments.length > 0);

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
    <div className="relative min-h-screen pb-20 animate-in fade-in">
      <GridPattern />
      
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Assignments</h1>
            <p className="text-muted-foreground max-w-2xl">
              {user.role === 'student' 
                ? 'Manage your submissions, track deadlines, and view evaluation feedback.' 
                : 'Manage class assignments and target specific divisions.'}
            </p>
          </div>
          
          {/* Create Button for Teacher */}
          {user.role !== 'student' && (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2 shadow-lg hover:shadow-xl transition-all">
               <Plus size={18} /> New Assignment
            </Button>
          )}
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
              <div className="flex items-center gap-3 mb-5 pl-1 border-l-4 border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-foreground pl-2">{subject.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
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
            <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-muted-foreground font-medium">No active assignments found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Create Modal */}
      {user.role !== 'student' && (
        <CreateAssignmentModal 
          open={createModalOpen} 
          onOpenChange={setCreateModalOpen} 
          onSuccess={fetchAssignments}
        />
      )}
    </div>
  );
}