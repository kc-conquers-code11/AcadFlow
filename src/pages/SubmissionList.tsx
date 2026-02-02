import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getAssignmentById,
  getSubjectById,
  mockSubmissions,
  mockStudents
} from '@/data/mockData';
import { 
  ArrowLeft, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Users,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// --- Visual Components ---

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between"
  >
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon size={20} />
    </div>
  </motion.div>
);

const StatusPill = ({ status }: { status: string }) => {
  if (status === 'evaluated') return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Graded</Badge>;
  if (status === 'submitted') return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Pending Review</Badge>;
  if (status === 'draft') return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Draft</Badge>;
  return <Badge variant="outline" className="text-slate-400 border-slate-200">Not Started</Badge>;
};

export default function SubmissionList() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();

  // Redirect Logic
  if (!user || !assignmentId) return null;

  const assignment = getAssignmentById(assignmentId);
  const subject = assignment ? getSubjectById(assignment.subjectId) : undefined;
  const submissions = mockSubmissions.filter(s => s.assignmentId === assignmentId);

  // Computed Stats
  const stats = useMemo(() => ({
    total: mockStudents.length,
    submitted: submissions.filter(s => s.status !== 'draft').length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    evaluated: submissions.filter(s => s.status === 'evaluated').length
  }), [submissions]);

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">Assignment not found</p>
        <Button variant="link" asChild className="mt-2 text-blue-600">
          <Link to="/dashboard/submissions">Back to List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* 1. Header & Breadcrumb */}
      <div>
        <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-slate-900 -ml-2" asChild>
          <Link to="/dashboard/submissions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{assignment.title}</h1>
            <p className="text-slate-500 mt-1">{subject?.name} • {subject?.code}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input placeholder="Search student..." className="pl-9 h-9 bg-white border-slate-200" />
             </div>
             <Button variant="outline" className="border-slate-200">Export CSV</Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats.total} 
          icon={Users} 
          color="bg-slate-100 text-slate-600"
        />
        <StatCard 
          title="Submitted" 
          value={stats.submitted} 
          icon={FileText} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Pending Review" 
          value={stats.pending} 
          icon={Clock} 
          color="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Graded" 
          value={stats.evaluated} 
          icon={CheckCircle2} 
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* 3. Submissions Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Enrollment ID</th>
                <th className="px-6 py-4">Submission Status</th>
                <th className="px-6 py-4">Plagiarism Check</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockStudents.map((student) => {
                const submission = submissions.find(s => s.studentId === student.id);
                const isRisk = (submission?.plagiarismScore || 0) > 30;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                    </td>
                    
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {student.enrollmentNumber}
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill status={submission?.status || 'none'} />
                    </td>

                    <td className="px-6 py-4">
                      {submission?.plagiarismScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          {isRisk && <AlertTriangle size={14} className="text-red-500" />}
                          <span className={cn(
                            "font-medium",
                            isRisk ? "text-red-600" : "text-slate-600"
                          )}>
                            {submission.plagiarismScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {submission?.marks !== undefined ? (
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {submission.marks} <span className="text-slate-400 font-normal text-xs">/ {assignment.maxMarks}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {submission && submission.status !== 'draft' ? (
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                          <Link to={`/evaluate/${submission.id}`}>
                            <Eye size={16} className="mr-2" /> Review
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic pr-2">No submission</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}