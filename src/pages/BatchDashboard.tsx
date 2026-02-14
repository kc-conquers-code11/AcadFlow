import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, LayoutDashboard, BarChart3, Search, Copy, X, CheckSquare, Square, AlertCircle, Users } from 'lucide-react';
import { BatchPracticalsTable, BatchTaskRow } from '@/components/teacher/BatchPracticalsTable';
import { BatchTaskModal, BatchTaskFormValues } from '@/components/teacher/BatchTaskModal';
import { EvaluationModal } from '@/components/teacher/EvaluationModal';
import { SubmissionListModal } from '@/components/teacher/SubmissionListModal';
import { BatchAnalytics } from '@/components/teacher/BatchAnalytics';
import { StudentHistoryModal } from '@/components/teacher/StudentHistoryModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BatchDashboard() {
  const { batchId } = useParams<{ batchId: string }>();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'hod';

  const [loading, setLoading] = useState(true);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [practicals, setPracticals] = useState<BatchTaskRow[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Modals & States
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [selectedPractical, setSelectedPractical] = useState<any>(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedStudentIdForEval, setSelectedStudentIdForEval] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Student History States
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any>(null);

  // Import Feature States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedSourceBatch, setSelectedSourceBatch] = useState<string>('');
  const [sourcePracticals, setSourcePracticals] = useState<any[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!batchId || !user) return;
    setLoading(true);
    try {
      const { data: batch, error: bErr } = await supabase.from('batches').select('*').eq('id', batchId).single();
      if (bErr) throw bErr;
      setBatchDetails(batch);

      // 1. Fetch Students linked to this batch
      const { data: batchStudents } = await supabase
        .from('batch_students')
        .select('student_id, profiles:student_id(*)')
        .eq('batch_id', batchId);

      const studentList = batchStudents?.map((bs: any) => bs.profiles) || [];
      // Sort students by Enrollment number
      studentList.sort((a: any, b: any) => (a.enrollment_number || '').localeCompare(b.enrollment_number || ''));
      setStudents(studentList);

      // 2. Fetch Active Practicals
      const { data: pracs, error: pErr } = await supabase
        .from('batch_practicals')
        .select('*')
        .eq('division', batch.division)
        .eq('batch', batch.batch)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      // 3. Submission Status Map
      let submissionMap: Record<string, { status: string; marks: number | null, feedback?: string }> = {};
      if (!isTeacher && pracs && pracs.length > 0) {
        const practicalIds = pracs.map(p => p.id);
        const { data: subs } = await supabase
          .from('submissions')
          .select('practical_id, status, marks, feedback')
          .eq('student_id', user.id)
          .in('practical_id', practicalIds);

        subs?.forEach(s => {
          submissionMap[s.practical_id] = {
            status: s.status,
            marks: s.marks,
            feedback: s.feedback
          };
        });
      }

      const mergedData: BatchTaskRow[] = (pracs || []).map(p => ({
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
        studentStatus: submissionMap[p.id]?.status || null as any,
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

  // --- SAVE TASK ---
  const handleSave = async (values: BatchTaskFormValues) => {
    if (!batchDetails) return;
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
        created_by: user?.id,
        status: 'active'
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

  // --- ARCHIVE ---
  const handleArchive = async (id: string) => {
    if (!id) {
      toast.error("Error: Item ID is missing.");
      return;
    }

    if (!confirm("Are you sure you want to delete/archive this experiment?")) return;

    try {
      const { error } = await supabase
        .from('batch_practicals')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      toast.success("Experiment moved to archive");
      fetchData();
    } catch (err: any) {
      console.error("Archive error:", err);
      toast.error("Failed to archive: " + err.message);
    }
  };

  // --- IMPORT LOGIC ---
  const openImportModal = async () => {
    setImportModalOpen(true);
    const { data } = await supabase.from('batches').select('id, name, division, batch').neq('id', batchId);
    setAvailableBatches(data || []);
  };

  const handleSourceBatchSelect = async (sourceBatchId: string) => {
    setSelectedSourceBatch(sourceBatchId);
    const sourceBatch = availableBatches.find(b => b.id === sourceBatchId);
    if (!sourceBatch) return;

    const { data } = await supabase
      .from('batch_practicals')
      .select('*')
      .eq('division', sourceBatch.division)
      .eq('batch', sourceBatch.batch)
      .neq('status', 'archived');

    setSourcePracticals(data || []);
    setSelectedImportIds([]);
  };

  const toggleImportSelection = (id: string) => {
    setSelectedImportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const executeImport = async () => {
    if (selectedImportIds.length === 0) return;
    setImporting(true);
    try {
      const toImport = sourcePracticals.filter(p => selectedImportIds.includes(p.id));
      const newRows = toImport.map(p => ({
        division: batchDetails.division,
        batch: batchDetails.batch,
        experiment_number: p.experiment_number,
        title: p.title,
        description: p.description,
        notes: p.notes,
        resource_link: p.resource_link,
        deadline: p.deadline,
        practical_mode: p.practical_mode,
        rubrics: p.rubrics,
        total_points: p.total_points,
        created_by: user?.id,
        status: 'active'
      }));

      const { error } = await supabase.from('batch_practicals').insert(newRows);
      if (error) throw error;

      toast.success(`Imported ${newRows.length} experiments`);
      setImportModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const filteredPracticals = practicals.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.experimentNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.enrollment_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-background transition-colors duration-200">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{batchDetails?.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-md font-mono border border-primary/20 font-medium">Div {batchDetails?.division}</span>
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-2.5 py-1 rounded-md font-mono border border-blue-500/20 font-medium">Batch {batchDetails?.batch}</span>
          </div>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={openImportModal} className="shadow-sm border-dashed border-border hover:bg-muted"><Copy className="mr-2 h-4 w-4" /> Import</Button>
            <Button onClick={() => { setEditingRow(null); setModalOpen(true); }} className="shadow-lg hover:shadow-xl transition-all"><Plus className="mr-2 h-4 w-4" /> Create Practical</Button>
          </div>
        )}
      </header>

      {/* Show REDO Notification for Students */}
      {!isTeacher && practicals.some(p => p.studentStatus === 'redo_requested') && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400">Action Required: Redo Requests</h3>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
              Some submissions have been returned by the faculty for corrections. Please check the list below.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="experiments" className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl gap-1">
            <TabsTrigger value="experiments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2 px-5 py-2.5 text-sm font-medium transition-all"><LayoutDashboard size={16} /> Experiments</TabsTrigger>
            {isTeacher && <TabsTrigger value="students" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2 px-5 py-2.5 text-sm font-medium transition-all"><Users size={16} /> People / Students</TabsTrigger>}
            {isTeacher && <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-2 px-5 py-2.5 text-sm font-medium transition-all"><BarChart3 size={16} /> Analysis</TabsTrigger>}
          </TabsList>
        </div>

        {/* --- 1. EXPERIMENTS TAB --- */}
        <TabsContent value="experiments" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search experiments..." className="pl-9 bg-card border-border rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <BatchPracticalsTable
            items={filteredPracticals}
            userRole={user?.role || 'student'}
            onEdit={(row) => { setEditingRow(row); setModalOpen(true); }}
            onDelete={(id) => handleArchive(id)}
            onViewResponses={(row) => { setSelectedPractical(row); setListModalOpen(true); }}
          />
        </TabsContent>

        {/* --- 2. STUDENTS TAB (UPDATED) --- */}
        {isTeacher && (
          <TabsContent value="students" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9 bg-card border-border rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-28 text-sm font-bold">Enrollment No</TableHead>
                    <TableHead className="text-sm font-bold">Name</TableHead>
                    <TableHead className="text-sm font-bold">Roll No</TableHead>
                    <TableHead className="text-right text-sm font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">No students found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => (
                      <TableRow key={student.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => { setSelectedStudentForHistory(student); setHistoryModalOpen(true); }}>
                        <TableCell className="font-mono font-semibold text-sm py-4">{student.enrollment_number || '-'}</TableCell>
                        <TableCell className="font-medium text-primary text-sm py-4">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm py-4">{student.roll_number || '-'}</TableCell>
                        <TableCell className="text-right py-4">
                          <Button size="sm" variant="ghost" className="text-sm hover:bg-muted">View History</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* --- 3. ANALYTICS TAB --- */}
        {isTeacher && (
          <TabsContent value="analytics">
            <BatchAnalytics batchId={batchId!} totalPracticals={practicals.length} />
          </TabsContent>
        )}
      </Tabs>

      {/* IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground"><Copy size={20} className="text-primary" /> Import Experiments</h2>
              <button onClick={() => setImportModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Select Source Batch</label>
                <select className="w-full p-2.5 rounded-lg border border-border bg-card text-sm text-foreground" value={selectedSourceBatch} onChange={(e) => handleSourceBatchSelect(e.target.value)}>
                  <option value="">-- Choose a Batch --</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Div {b.division} - Batch {b.batch})</option>
                  ))}
                </select>
              </div>
              {selectedSourceBatch && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Select Experiments</label>
                    <button onClick={() => setSelectedImportIds(selectedImportIds.length === sourcePracticals.length ? [] : sourcePracticals.map(p => p.id))} className="text-xs text-primary hover:underline font-medium">
                      {selectedImportIds.length === sourcePracticals.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {sourcePracticals.map(p => (
                      <div key={p.id} className={cn("flex items-center gap-3 p-3.5 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors", selectedImportIds.includes(p.id) && "bg-primary/5")} onClick={() => toggleImportSelection(p.id)}>
                        <div className={cn("text-muted-foreground", selectedImportIds.includes(p.id) && "text-primary")}>
                          {selectedImportIds.includes(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{p.title}</p>
                          <p className="text-xs text-muted-foreground">Exp {p.experiment_number} • {p.total_points} Points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="ghost" onClick={() => setImportModalOpen(false)}>Cancel</Button>
              <Button onClick={executeImport} disabled={importing || selectedImportIds.length === 0}>{importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Import</Button>
            </div>
          </div>
        </div>
      )}

      {isTeacher && (
        <>
          <BatchTaskModal open={modalOpen} onOpenChange={setModalOpen} initialValues={editingRow} onSave={handleSave} saving={saving} />
          <SubmissionListModal open={listModalOpen} onOpenChange={setListModalOpen} task={selectedPractical} type="practical" onEvaluate={(pracId, studentId) => { setSelectedStudentIdForEval(studentId); setEvalModalOpen(true); }} />
          <EvaluationModal open={evalModalOpen} onOpenChange={setEvalModalOpen} taskId={selectedPractical?.id} type="practical" initialStudentId={selectedStudentIdForEval} />

          {/* STUDENT HISTORY MODAL */}
          <StudentHistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            student={selectedStudentForHistory}
            batchDetails={batchDetails}
          />
        </>
      )}
    </div>
  );
}