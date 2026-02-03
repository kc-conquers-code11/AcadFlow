import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  mockSubmissions,
  mockAssignments,
  mockSubjects,
  mockStudents
} from '@/data/mockData';
import {
  FileText,
  Code2,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  BarChart3,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Submissions() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user || user.role === 'student') return null;

  // 1. Group & Calculate Stats
  const groupedSubmissions = useMemo(() => {
    return mockAssignments.map(assignment => {
      const subject = mockSubjects.find(s => s.id === assignment.subjectId);
      const submissions = mockSubmissions.filter(s => s.assignmentId === assignment.id);

      const totalStudents = mockStudents.length;
      const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'evaluated').length;
      const pendingReviewCount = submissions.filter(s => s.status === 'submitted').length;
      const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;

      return {
        assignment,
        subject,
        stats: {
          total: totalStudents,
          submitted: submittedCount,
          pendingReview: pendingReviewCount,
          evaluated: evaluatedCount,
          progress: Math.round((submittedCount / totalStudents) * 100)
        }
      };
    }).filter(item =>
      item.assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submission Review</h1>
          <p className="text-slate-500 mt-1">Track student submissions and pending evaluations.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search assignments..."
              className="pl-9 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-slate-200 text-slate-500">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      {/* 2. Submissions List */}
      <div className="space-y-4">
        {groupedSubmissions.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No assignments found.</p>
          </div>
        ) : (
          groupedSubmissions.map(({ assignment, subject, stats }, index) => {
            const isPractical = assignment.type === 'practical';
            const Icon = isPractical ? Code2 : FileText;
            const iconColor = isPractical ? "text-violet-600 bg-violet-50" : "text-blue-600 bg-blue-50";

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-slate-100", iconColor)}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 truncate pr-2">{assignment.title}</h3>
                      {stats.pendingReview > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 h-5 px-1.5 text-[10px]">
                          {stats.pendingReview} to review
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <span className="font-medium text-slate-600">{subject?.code}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="truncate">{subject?.name}</span>
                    </p>
                  </div>
                </div>

                {/* Stats Columns */}
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">

                  {/* Submission Rate */}
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 size={12} /> Received
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{stats.submitted}/{stats.total}</span>
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Pending Count */}
                  <div className="flex flex-col gap-1 min-w-[80px]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} /> Pending
                    </span>
                    <span className={cn("font-bold", stats.pendingReview > 0 ? "text-amber-600" : "text-slate-400")}>
                      {stats.pendingReview}
                    </span>
                  </div>

                  {/* Evaluated Count */}
                  <div className="flex flex-col gap-1 min-w-[80px]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Graded
                    </span>
                    <span className="font-bold text-emerald-600">{stats.evaluated}</span>
                  </div>

                  {/* Action */}
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" asChild>
                    <Link to={`/dashboard/submissions/${assignment.id}`}>
                      <Eye size={20} />
                    </Link>
                  </Button>
                </div>

              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}