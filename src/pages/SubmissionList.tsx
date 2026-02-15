import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- 1. PLAGIARISM ALGORITHM (Dice Coefficient) reference: marketplace.uipath.com ---
const calculateSimilarity = (str1: string, str2: string) => {
  if (!str1 || !str2) return 0;
  // Normalize: Lowercase and remove whitespace to focus on logic/content
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');
  
  if (s1 === s2) return 100;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  let intersection = 0;

  bigrams1.forEach(item => {
    if (bigrams2.has(item)) intersection++;
  });

  return Math.floor((2.0 * intersection) / (bigrams1.size + bigrams2.size) * 100);
};

const StatusBadge = ({ status, marks }: { status: string; marks?: number }) => {
  if (status === 'evaluated') {
    return (
      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
        <CheckCircle2 size={12} className="mr-1" /> Graded: {marks}
      </Badge>
    );
  }
  if (status === 'submitted') {
    return (
      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
        <Clock size={12} className="mr-1" /> Needs Review
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-border">
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
  const [plagReport, setPlagReport] = useState<Record<string, { score: number, matchName: string }>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all');

  useEffect(() => {
    if (assignmentId) fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: assignData, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .maybeSingle();

      if (assignError) throw assignError;
      if (!assignData) throw new Error("Assignment not found");

      if (assignData.subject_id) {
        const { data: subData } = await supabase.from('subjects').select('name, code').eq('id', assignData.subject_id).single();
        assignData.subjects = subData;
      }
      setAssignment(assignData);

      // Fetch Submissions WITH CONTENT for analysis
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          marks,
          submitted_at,
          student_id,
          content, 
          profiles:student_id (
            name, 
            enrollment_number
          )
        `)
        .eq('assignment_id', assignmentId);

      if (subError) throw subError;
      const subs = subData || [];
      setSubmissions(subs);

      // --- 2. RUN PLAGIARISM CHECK (Client Side) ---
      runPlagiarismCheck(subs);

    } catch (err: any) {
      console.error("Submission List Error:", err);
      setError(err.message);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const runPlagiarismCheck = (subs: any[]) => {
    const report: Record<string, { score: number, matchName: string }> = {};
    
    // O(N^2) Comparison - Fine for class sizes < 100
    for (let i = 0; i < subs.length; i++) {
        let maxScore = 0;
        let bestMatch = '';
        const currentContent = typeof subs[i].content === 'string' 
            ? subs[i].content 
            : JSON.stringify(subs[i].content || ""); // Handle JSON or String content

        // Skip empty submissions
        if (!currentContent || currentContent.length < 10) continue;

        for (let j = 0; j < subs.length; j++) {
            if (i === j) continue; // Don't compare with self

            const compareContent = typeof subs[j].content === 'string' 
                ? subs[j].content 
                : JSON.stringify(subs[j].content || "");

            const score = calculateSimilarity(currentContent, compareContent);
            
            if (score > maxScore) {
                maxScore = score;
                bestMatch = subs[j].profiles?.name || 'Unknown';
            }
        }
        report[subs[i].id] = { score: maxScore, matchName: bestMatch };
    }
    setPlagReport(report);
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (error || !assignment) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-muted-foreground font-medium">{error || "Assignment not found"}</p>
      <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4 pt-6 animate-in fade-in">

      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2 hover:text-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{assignment.title}</h1>
            <p className="text-muted-foreground mt-1">
              {assignment.subjects?.name} ({assignment.subjects?.code})
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="h-8 px-3 text-sm border-border text-muted-foreground">
              Submissions: <span className="font-bold text-foreground ml-1">{submissions.length}</span>
            </Badge>
            <Badge className="h-8 px-3 text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/10">
              To Review: <span className="font-bold ml-1">{pendingCount}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search student or roll no..."
            className="pl-10 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto">
          {(['all', 'pending', 'evaluated'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all capitalize",
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Submitted At</th>
              <th className="px-6 py-4">Status</th>
              {/* Added Integrity Column */}
              <th className="px-6 py-4">Integrity Check</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                  No submissions found.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((sub) => {
                // Determine Plag Status
                const integrity = plagReport[sub.id] || { score: 0, matchName: '' };
                let IntegrityBadge;

                if (integrity.score > 60) {
                    IntegrityBadge = (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold cursor-help">
                                        <ShieldAlert size={12} /> {integrity.score}% Match
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>High similarity with <span className="font-bold">{integrity.matchName}</span></p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                } else if (integrity.score > 20) {
                    IntegrityBadge = (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                            <Copy size={12} /> {integrity.score}% Similarity
                        </div>
                    );
                } else {
                    IntegrityBadge = (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                            <ShieldCheck size={12} /> Unique Code
                        </div>
                    );
                }

                return (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {sub.profiles?.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{sub.profiles?.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono tracking-tighter">{sub.profiles?.enrollment_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '---'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} marks={sub.marks} />
                    </td>
                    {/* Render Integrity Column */}
                    <td className="px-6 py-4">
                        {sub.status === 'submitted' || sub.status === 'evaluated' ? IntegrityBadge : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" className="h-8 border-border hover:bg-primary/10 hover:text-primary" asChild>
                        <Link to={`/evaluate/${sub.id}`}>
                          Review <ChevronRight size={14} className="ml-1" />
                        </Link>
                      </Button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}