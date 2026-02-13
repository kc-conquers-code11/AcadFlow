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
  FileText, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [error, setError] = useState<string | null>(null);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all');

  useEffect(() => {
    if (assignmentId) fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Assignment Details (Simplified query to avoid join error)
      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .maybeSingle();
      
      if (assignError) throw assignError;
      if (!assignData) throw new Error("Assignment not found");

      // Fetch Subject details separately for safety
      if (assignData.subject_id) {
          const { data: subData } = await supabase.from('subjects').select('name, code').eq('id', assignData.subject_id).single();
          assignData.subjects = subData;
      }
      setAssignment(assignData);

      // 2. Fetch Submissions with Profiles (Using explicit profiles join)
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          marks,
          submitted_at,
          student_id,
          profiles:student_id (
            name, 
            enrollment_number
          )
        `)
        .eq('assignment_id', assignmentId);

      if (subError) throw subError;
      setSubmissions(subData || []);

    } catch (err: any) {
      console.error("Submission List Error:", err);
      setError(err.message);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const nameMatch = sub.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const rollMatch = sub.profiles?.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || rollMatch;
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && sub.status === 'submitted';
    if (filter === 'evaluated') return matchesSearch && sub.status === 'evaluated';
    return matchesSearch;
  });

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  if (error || !assignment) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-slate-600 font-medium">{error || "Assignment not found"}</p>
      <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4 pt-6 animate-in fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4 text-slate-500 -ml-2" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
            <p className="text-slate-500 mt-1">
              {assignment.subjects?.name} ({assignment.subjects?.code})
            </p>
          </div>
          <div className="flex gap-2">
             <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm">
                <span className="text-slate-500">Submissions:</span> <span className="font-bold">{submissions.length}</span>
             </div>
             <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg shadow-sm text-sm text-blue-700">
                <span className="opacity-70">To Review:</span> <span className="font-bold">{submissions.filter(s => s.status === 'submitted').length}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Search student or roll no..." 
            className="pl-10 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          {['all', 'pending', 'evaluated'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize",
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Submitted At</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  No submissions found.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {sub.profiles?.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{sub.profiles?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{sub.profiles?.enrollment_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '---'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} marks={sub.marks} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm" className="h-8 border-slate-200" asChild>
                      <Link to={`/evaluate/${sub.id}`}>
                        Review <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}