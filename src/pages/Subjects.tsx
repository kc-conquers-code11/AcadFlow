import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Code2, 
  FileText, 
  ChevronRight, 
  Search, 
  BookOpen, 
  LayoutGrid,
  FlaskConical,
  Library,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Subjects() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      // Simplfied Query string to avoid parsing errors
      const { data, error } = await supabase
        .from('subjects')
        .select('*, assignments(id, type)')
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Academic Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {user.role === 'student' 
              ? 'Access course materials, assignments, and lab work.' 
              : 'Manage curriculum and evaluate student performance.'}
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <Input 
            placeholder="Search by name or code..." 
            className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Library className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No subjects found matching "{searchQuery}"</p>
          <Button variant="link" onClick={() => setSearchQuery('')} className="text-blue-600 dark:text-blue-400">
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject, index) => {
            // Count assignments
            const assignmentCount = subject.assignments?.length || 0;
            const practicalCount = subject.assignments?.filter((a: any) => a.type === 'practical').length || 0;
            
            const isLab = subject.has_code_editor; 
            const Icon = isLab ? Code2 : BookOpen;
            
            // Dynamic Colors (Light & Dark Mode)
            const iconBg = isLab 
              ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" 
              : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
            
            const hoverBorder = isLab 
              ? "group-hover:border-violet-200 dark:group-hover:border-violet-500/30" 
              : "group-hover:border-blue-200 dark:group-hover:border-blue-500/30";

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={cn(
                  "group h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                  hoverBorder
                )}>
                  {/* Card Body */}
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", iconBg)}>
                        <Icon size={20} />
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-xs border border-slate-200 dark:border-slate-700">
                        {subject.code}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1" title={subject.name}>
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                      <span className="flex items-center gap-1">
                        <LayoutGrid size={12} /> Sem {subject.semester}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>Year {subject.year}</span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">
                           <FileText size={12} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <span className="font-semibold">{assignmentCount}</span> Tasks
                      </div>
                      {practicalCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="p-1 rounded bg-slate-50 dark:bg-slate-800">
                             <FlaskConical size={12} className="text-slate-400 dark:text-slate-500" />
                          </div>
                          <span className="font-semibold">{practicalCount}</span> Labs
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group-hover:shadow-sm" 
                      asChild
                    >
                      <Link to={`/subjects/${subject.id}`}>
                        <span className="text-xs font-bold uppercase tracking-wider">View Course</span>
                        <ChevronRight size={16} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}