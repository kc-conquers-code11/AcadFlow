import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, LayoutDashboard, BarChart3, Search } from 'lucide-react';
import { BatchPracticalsTable } from '@/components/teacher/BatchPracticalsTable';
import { BatchTaskModal, BatchTaskFormValues } from '@/components/teacher/BatchTaskModal';
import { EvaluationModal } from '@/components/teacher/EvaluationModal';
import { SubmissionListModal } from '@/components/teacher/SubmissionListModal';
import { BatchAnalytics } from '@/components/teacher/BatchAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function BatchDashboard() {
  const { batchId } = useParams<{ batchId: string }>();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'hod';
  
  const [loading, setLoading] = useState(true);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [practicals, setPracticals] = useState<any[]>([]);
  
  // Modals & States
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); 
  
  const [listModalOpen, setListModalOpen] = useState(false); 
  const [selectedPractical, setSelectedPractical] = useState<any>(null);
  
  const [evalModalOpen, setEvalModalOpen] = useState(false); 
  // NEW: Store specific student ID to open directly
  const [selectedStudentIdForEval, setSelectedStudentIdForEval] = useState<string | null>(null);
  
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    if (!batchId || !user) return;
    setLoading(true);
    try {
      const { data: batch, error: bErr } = await supabase.from('batches').select('*').eq('id', batchId).single();
      if (bErr) throw bErr;
      setBatchDetails(batch);

      const { data: pracs, error: pErr } = await supabase
        .from('batch_practicals')
        .select('*')
        .eq('division', batch.division)
        .eq('batch', batch.batch)
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      let submissionMap: Record<string, { status: string; marks: number | null }> = {}; 
      if (!isTeacher && pracs.length > 0) {
        const practicalIds = pracs.map(p => p.id);
        const { data: subs } = await supabase
          .from('submissions')
          .select('practical_id, status, marks') 
          .eq('student_id', user.id)
          .in('practical_id', practicalIds);
        
        subs?.forEach(s => {
          submissionMap[s.practical_id] = { status: s.status, marks: s.marks };
        });
      }

      const mergedData = pracs.map(p => ({
        id: p.id,
        title: p.title,
        experimentNumber: p.experiment_number,
        description: p.description,
        deadline: p.deadline,
        practicalMode: p.practical_mode,
        maxMarks: p.total_points,
        rubrics: p.rubrics,
        notes: p.notes,
        resourceLink: p.resource_link,
        studentStatus: submissionMap[p.id]?.status || null, 
        studentMarks: submissionMap[p.id]?.marks ?? null,
      }));

      setPracticals(mergedData);

    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [batchId, user, isTeacher]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (values: BatchTaskFormValues) => {
    if(!batchDetails) return;
    setSaving(true);
    try {
      const payload = {
        division: batchDetails.division,
        batch: batchDetails.batch,
        experiment_number: values.experimentNumber,
        title: values.title,
        description: values.description,
        notes: values.notes,
        resource_link: values.resourceLink,
        deadline: values.deadline,
        practical_mode: values.practicalMode,
        rubrics: values.rubrics,
        total_points: Number(values.totalPoints),
        created_by: user?.id
      };

      const { error } = editingRow 
        ? await supabase.from('batch_practicals').update(payload).eq('id', editingRow.id)
        : await supabase.from('batch_practicals').insert([payload]);

      if (error) throw error;
      toast.success(editingRow ? 'Updated' : 'Created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredPracticals = practicals.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.experimentNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen bg-muted/40 transition-colors duration-200">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{batchDetails?.name}</h1>
          <div className="flex items-center gap-2 mt-2">
             <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2 py-0.5 rounded font-mono border border-blue-200 dark:border-blue-800">
                Div {batchDetails?.division}
             </span>
             <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs px-2 py-0.5 rounded font-mono border border-indigo-200 dark:border-indigo-800">
                Batch {batchDetails?.batch}
             </span>
          </div>
        </div>
        
        {isTeacher && (
          <Button onClick={() => { setEditingRow(null); setModalOpen(true); }} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Create Practical
          </Button>
        )}
      </header>

      <Tabs defaultValue="experiments" className="space-y-6">
         
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-1">
            <TabsList className="bg-transparent p-0 gap-2">
               <TabsTrigger 
                 value="experiments" 
                 className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border gap-2 px-4"
               >
                 <LayoutDashboard size={16}/> Experiments
               </TabsTrigger>
               {isTeacher && (
                 <TabsTrigger 
                   value="analytics" 
                   className="data-[state=active]:bg-background data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border gap-2 px-4"
                 >
                   <BarChart3 size={16}/> Analysis & Defaulters
                 </TabsTrigger>
               )}
            </TabsList>
         </div>

         <TabsContent value="experiments" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            <div className="flex items-center gap-4 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search experiments..." 
                  className="pl-9 bg-background border-input" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </div>
            </div>

            <BatchPracticalsTable 
              items={filteredPracticals}
              userRole={user?.role || 'student'}
              onEdit={(row) => { setEditingRow(row); setModalOpen(true); }}
              onDelete={() => {}} 
              onViewResponses={(row) => { 
                setSelectedPractical(row); 
                setListModalOpen(true); 
              }}
            />
         </TabsContent>

         {isTeacher && (
           <TabsContent value="analytics">
              <BatchAnalytics batchId={batchId!} totalPracticals={practicals.length} />
           </TabsContent>
         )}

      </Tabs>

      {isTeacher && (
        <>
          <BatchTaskModal 
            open={modalOpen} 
            onOpenChange={setModalOpen} 
            initialValues={editingRow} 
            onSave={handleSave} 
            saving={saving} 
          />
          
          <SubmissionListModal 
             open={listModalOpen}
             onOpenChange={setListModalOpen}
             practical={selectedPractical}
             onEvaluate={(pracId, studentId) => { 
               // FIX: SubmissionList now passes PracticalID AND StudentID (optional)
               // But wait, the list modal usually passes just the row ID or we need to handle the structure.
               // We will update SubmissionListModal to pass student_id if possible, 
               // or we rely on logic below.
               
               // For now, let's assume we pass the practical ID, but we need to pass the specific student's ID 
               // if we want to jump to them. 
               // Let's update SubmissionListModal to pass the studentID as well (see next file).
               setSelectedStudentIdForEval(studentId); 
               setEvalModalOpen(true);
             }}
          />

          <EvaluationModal 
            open={evalModalOpen} 
            onOpenChange={setEvalModalOpen} 
            practicalId={selectedPractical?.id} 
            initialStudentId={selectedStudentIdForEval} // Pass specific student
          />
        </>
      )}
    </div>
  );
}