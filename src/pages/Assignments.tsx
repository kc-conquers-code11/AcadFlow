import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { mockAssignments, mockSubjects, mockSubmissions } from '@/data/mockData';
import { 
  FileText, 
  Code2, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FlaskConical,
  BookOpen
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

const AssignmentCard = ({ assignment, user }: { assignment: any, user: any }) => {
  const submission = user.role === 'student'
    ? mockSubmissions.find(s => s.assignmentId === assignment.id && s.studentId === user.id)
    : undefined;

  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date() && !submission?.submittedAt;
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Icon Logic based on type
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
      {/* Icon Box */}
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shrink-0", iconColor)}>
        <Icon size={20} />
      </div>

      {/* Content */}
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
          
          {!isOverdue && !submission?.submittedAt && (
             <span className={cn(
               "flex items-center gap-1.5",
               daysLeft <= 2 ? "text-amber-600" : "text-slate-500"
             )}>
               <Clock size={13} />
               {daysLeft === 0 ? "Due Today" : `${daysLeft} days left`}
             </span>
          )}
        </div>
      </div>

      {/* Action Area */}
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

  if (!user) return null;

  // Group assignments by subject
  const assignmentsBySubject = mockSubjects.map(subject => ({
    subject,
    assignments: mockAssignments.filter(a => a.subjectId === subject.id),
  })).filter(group => group.assignments.length > 0);

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
                {assignments.map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    user={user} 
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