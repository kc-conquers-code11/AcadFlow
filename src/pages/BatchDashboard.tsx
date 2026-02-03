import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BatchPracticalsTable } from '@/components/teacher/BatchPracticalsTable';
import { BatchAssignmentsTable } from '@/components/teacher/BatchAssignmentsTable';
import { BatchTaskModal, BatchTaskFormValues } from '@/components/teacher/BatchTaskModal';
import { CopyToBatchModal } from '@/components/teacher/CopyToBatchModal';
import type { BatchTaskRow } from '@/components/teacher/BatchPracticalsTable';
import type { BatchAssignment, BatchPractical } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const MOCK_TOTAL_STUDENTS = 30;

/** Convert ISO deadline from DB to datetime-local input value (local time) */
function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** Convert datetime-local value to ISO for Supabase */
function deadlineToISO(local: string): string {
  return new Date(local).toISOString();
}

function mapPracticalToRow(row: BatchPractical): BatchTaskRow {
  const total = MOCK_TOTAL_STUDENTS;
  const submittedCount = 0;
  const pct = total ? Math.round((submittedCount / total) * 100) : 0;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    submittedCount,
    totalStudents: total,
    submittedPercent: pct,
    deadline: row.deadline,
    practicalMode: row.practical_mode,
  };
}

function mapAssignmentToRow(row: BatchAssignment): BatchTaskRow {
  const total = MOCK_TOTAL_STUDENTS;
  const submittedCount = 0;
  const pct = total ? Math.round((submittedCount / total) * 100) : 0;
  const quizQuestions = (row.quiz_questions ?? []).map((q) => ({
    question: q.question,
    options: q.options ?? [],
    correctIndex: q.correct_index ?? 0,
  }));
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    submittedCount,
    totalStudents: total,
    submittedPercent: pct,
    deadline: row.deadline,
    quizQuestions,
  };
}

function toRow(
  form: BatchTaskFormValues,
  id: string,
  submittedCount = 0,
  existingRow?: BatchTaskRow
): BatchTaskRow {
  const total = MOCK_TOTAL_STUDENTS;
  const pct = total ? Math.round((submittedCount / total) * 100) : 0;
  return {
    id,
    title: form.title,
    description: form.description,
    submittedCount,
    totalStudents: total,
    submittedPercent: pct,
    deadline: form.deadline || existingRow?.deadline,
    quizQuestions: form.quizQuestions,
    practicalMode: form.practicalMode,
  };
}

/** Normalize division/batch from URL to DB enum values */
function normalizeDivision(division: string): 'A' | 'B' | null {
  const d = division?.toUpperCase();
  return d === 'A' || d === 'B' ? d : null;
}
function normalizeBatch(batch: string): 'A' | 'B' | 'C' | null {
  const b = batch?.toUpperCase();
  return b === 'A' || b === 'B' || b === 'C' ? b : null;
}

export default function BatchDashboard() {
  const { division, batch } = useParams<{ division: string; batch: string }>();
  const { user } = useAuth();
  const [practicals, setPracticals] = useState<BatchTaskRow[]>([]);
  const [assignments, setAssignments] = useState<BatchTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'practical' | 'assignment'>('practical');
  const [editingRow, setEditingRow] = useState<BatchTaskRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ row: BatchTaskRow; type: 'practical' | 'assignment' } | null>(null);
  const [copyTarget, setCopyTarget] = useState<{ row: BatchTaskRow; type: 'practical' | 'assignment' } | null>(null);
  const [copying, setCopying] = useState(false);

  const divNorm = normalizeDivision(division ?? '');
  const batchNorm = normalizeBatch(batch ?? '');

  const fetchData = useCallback(async () => {
    if (!user?.id || !divNorm || !batchNorm) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [practicalsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('batch_practicals')
          .select('*')
          .eq('division', divNorm)
          .eq('batch', batchNorm)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('batch_assignments')
          .select('*')
          .eq('division', divNorm)
          .eq('batch', batchNorm)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (practicalsRes.error) throw practicalsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      setPracticals((practicalsRes.data ?? []).map(mapPracticalToRow));
      setAssignments((assignmentsRes.data ?? []).map(mapAssignmentToRow));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load batch data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, divNorm, batchNorm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;
  if (!division || !batch) {
    return (
      <div className="py-10 text-slate-500">
        Missing division or batch. <Link to="/batches" className="text-blue-600 underline">Back to Batches</Link>
      </div>
    );
  }

  const divisionLabel = `Div ${division.toUpperCase()}`;
  const batchLabel = `Batch ${batch.toUpperCase()}`;

  const openAddPractical = useCallback(() => {
    setEditingRow(null);
    setModalType('practical');
    setModalOpen(true);
  }, []);
  const openAddAssignment = useCallback(() => {
    setEditingRow(null);
    setModalType('assignment');
    setModalOpen(true);
  }, []);

  const openEditPractical = useCallback((row: BatchTaskRow) => {
    setEditingRow(row);
    setModalType('practical');
    setModalOpen(true);
  }, []);
  const openEditAssignment = useCallback((row: BatchTaskRow) => {
    setEditingRow(row);
    setModalType('assignment');
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (values: BatchTaskFormValues) => {
      if (!user?.id || !divNorm || !batchNorm) return;
      setSaving(true);
      try {
        const deadlineISO = values.deadline ? deadlineToISO(values.deadline) : '';
        if (modalType === 'practical') {
          if (editingRow) {
            const { error } = await supabase
              .from('batch_practicals')
              .update({
                title: values.title,
                description: values.description || null,
                deadline: deadlineISO,
                practical_mode: values.practicalMode ?? 'code',
              })
              .eq('id', editingRow.id);
            if (error) throw error;
            setPracticals((prev) =>
              prev.map((p) =>
                p.id === editingRow.id
                  ? toRow(values, p.id, p.submittedCount, p)
                  : p
              )
            );
          } else {
            const { data, error } = await supabase
              .from('batch_practicals')
              .insert({
                title: values.title,
                description: values.description || null,
                deadline: deadlineISO,
                division: divNorm,
                batch: batchNorm,
                practical_mode: values.practicalMode ?? 'code',
                created_by: user.id,
              })
              .select('id')
              .single();
            if (error) throw error;
            const row = toRow(values, data.id, 0);
            setPracticals((prev) => [...prev, row]);
          }
        } else {
          const quiz_questions = (values.quizQuestions ?? []).map((q) => ({
            question: q.question,
            options: q.options ?? [],
            correct_index: q.correctIndex ?? 0,
          }));
          if (editingRow) {
            const { error } = await supabase
              .from('batch_assignments')
              .update({
                title: values.title,
                description: values.description || null,
                deadline: deadlineISO,
                quiz_questions,
              })
              .eq('id', editingRow.id);
            if (error) throw error;
            setAssignments((prev) =>
              prev.map((a) =>
                a.id === editingRow.id
                  ? toRow(values, a.id, a.submittedCount, a)
                  : a
              )
            );
          } else {
            const { data, error } = await supabase
              .from('batch_assignments')
              .insert({
                title: values.title,
                description: values.description || null,
                deadline: deadlineISO,
                division: divNorm,
                batch: batchNorm,
                quiz_questions,
                created_by: user.id,
              })
              .select('id')
              .single();
            if (error) throw error;
            const row = toRow(values, data.id, 0);
            setAssignments((prev) => [...prev, row]);
          }
        }
        setEditingRow(null);
        setModalOpen(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [user?.id, divNorm, batchNorm, editingRow, modalType]
  );

  const handleDeletePractical = useCallback((row: BatchTaskRow) => {
    setDeleteTarget({ row, type: 'practical' });
  }, []);
  const handleDeleteAssignment = useCallback((row: BatchTaskRow) => {
    setDeleteTarget({ row, type: 'assignment' });
  }, []);

  const handleCopyPractical = useCallback((row: BatchTaskRow) => {
    setCopyTarget({ row, type: 'practical' });
  }, []);
  const handleCopyAssignment = useCallback((row: BatchTaskRow) => {
    setCopyTarget({ row, type: 'assignment' });
  }, []);

  const handleCopyConfirm = useCallback(
    async (targetDivision: 'A' | 'B', targetBatch: 'A' | 'B' | 'C') => {
      if (!copyTarget || !user?.id) return;
      setCopying(true);
      try {
        const { row } = copyTarget;
        const deadlineISO = row.deadline || new Date().toISOString();
        if (copyTarget.type === 'practical') {
          const { error } = await supabase.from('batch_practicals').insert({
            title: row.title,
            description: row.description || null,
            deadline: deadlineISO,
            division: targetDivision,
            batch: targetBatch,
            practical_mode: row.practicalMode ?? 'code',
            created_by: user.id,
          });
          if (error) throw error;
        } else {
          const quiz_questions = (row.quizQuestions ?? []).map((q) => ({
            question: q.question,
            options: q.options ?? [],
            correct_index: q.correctIndex ?? 0,
          }));
          const { error } = await supabase.from('batch_assignments').insert({
            title: row.title,
            description: row.description || null,
            deadline: deadlineISO,
            division: targetDivision,
            batch: targetBatch,
            quiz_questions,
            created_by: user.id,
          });
          if (error) throw error;
        }
        toast.success(`Copied to Div ${targetDivision} Batch ${targetBatch}`);
        setCopyTarget(null);
      } catch (err) {
        console.error(err);
        toast.error('Failed to copy');
      } finally {
        setCopying(false);
      }
    },
    [copyTarget, user?.id]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const table = deleteTarget.type === 'practical' ? 'batch_practicals' : 'batch_assignments';
      const { error } = await supabase.from(table).delete().eq('id', deleteTarget.row.id);
      if (error) throw error;
      if (deleteTarget.type === 'practical') {
        setPracticals((prev) => prev.filter((p) => p.id !== deleteTarget.row.id));
      } else {
        setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.row.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const modalInitialValues: BatchTaskFormValues | null = editingRow
    ? {
        title: editingRow.title,
        description: editingRow.description,
        deadline: editingRow.deadline ? toLocalDateTimeInput(editingRow.deadline) : '',
        type: modalType,
        practicalMode: editingRow.practicalMode ?? 'code',
        quizQuestions: editingRow.quizQuestions ?? [],
      }
    : null;

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-slate-500 -ml-2" asChild>
          <Link to="/batches">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Link>
        </Button>
      </div>

      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {divisionLabel} · {batchLabel}
        </h1>
        <p className="text-slate-500 mt-1">Manage practicals and assignments for this batch.</p>
      </header>

      <BatchPracticalsTable
        division={division}
        batch={batch}
        items={practicals}
        onAdd={openAddPractical}
        onEdit={openEditPractical}
        onCopy={handleCopyPractical}
        onDelete={handleDeletePractical}
      />

      <BatchAssignmentsTable
        division={division}
        batch={batch}
        items={assignments}
        onAdd={openAddAssignment}
        onEdit={openEditAssignment}
        onCopy={handleCopyAssignment}
        onDelete={handleDeleteAssignment}
      />

      <CopyToBatchModal
        open={!!copyTarget}
        onOpenChange={(open) => !open && setCopyTarget(null)}
        taskTitle={copyTarget?.row.title ?? ''}
        currentDivision={divNorm ?? null}
        currentBatch={batchNorm ?? null}
        onConfirm={handleCopyConfirm}
        copying={copying}
      />

      <BatchTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={modalInitialValues}
        defaultType={modalType}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteTarget?.row.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
