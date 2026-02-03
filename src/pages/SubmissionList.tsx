import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Helper for Status Badge
const StatusBadge = ({ status, marks }: { status: string; marks?: number }) => {
  if (status === 'evaluated') {
    return (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
        <CheckCircle2 size={12} className="mr-1" /> Graded: {marks}
      </Badge>
    );
  }
  if (status === 'submitted') {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
        <Clock size={12} className="mr-1" /> Needs Review
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">
      Not Submitted
    </Badge>
  );
};

export default function SubmissionList() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [loading, setLoading] = useState(true);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]); // To list non-submitters too if needed
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all');

  useEffect(() => {
    if (assignmentId) fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Assignment Details
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*, subjects(name, code)')
        .eq('id', assignmentId)
        .single();
      
      if (assignError) throw assignError;
      setAssignment(assignData);

      // 2. Fetch Submissions with Student Profiles
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:student_id (name, enrollment_number, avatar_url)
        `)
        .eq('assignment_id', assignmentId);

      if (subError) throw subError;
      setSubmissions(subData || []);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredSubmissions = submissions.filter(sub => {
    const nameMatch = sub.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const rollMatch = sub.profiles?.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSearch = nameMatch || rollMatch;
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && sub.status === 'submitted';
    if (filter === 'evaluated') return matchesSearch && sub.status === 'evaluated';
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4 text-slate-500 -ml-2" asChild>
          <Link to="/dashboard/assignments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
            <p className="text-slate-500 mt-1">
              {assignment.subjects?.name} • {assignment.subjects?.code}
            </p>
          </div>
          <div className="flex gap-2 text-sm">
             <div className="px-3 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <span className="text-slate-500">Total:</span> <span className="font-bold">{submissions.length}</span>
             </div>
             <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-md shadow-sm text-blue-700">
                <span className="opacity-70">Pending:</span> <span className="font-bold">{submissions.filter(s => s.status === 'submitted').length}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Search student..." 
            className="pl-9 border-slate-200 focus:ring-blue-500/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {['all', 'pending', 'evaluated'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                filter === f 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-[40%]">Student</th>
              <th className="px-6 py-4">Submitted At</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No submissions found matching filters.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((sub) => (
                <motion.tr 
                  key={sub.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                        {sub.profiles?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{sub.profiles?.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{sub.profiles?.enrollment_number || 'No ID'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {sub.submitted_at 
                      ? new Date(sub.submitted_at).toLocaleDateString() + ' ' + new Date(sub.submitted_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                      : <span className="italic text-slate-400">Draft saved</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} marks={sub.marks} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="outline" className="h-8 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" asChild>
                      <Link to={`/evaluate/${sub.id}`}>
                        Evaluate <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </Button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}