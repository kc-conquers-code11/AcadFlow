import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BatchPracticalsTable } from '@/components/teacher/BatchPracticalsTable';
import { BatchAssignmentsTable } from '@/components/teacher/BatchAssignmentsTable';
import { BatchTaskModal, BatchTaskFormValues } from '@/components/teacher/BatchTaskModal';
import type { BatchTaskRow } from '@/components/teacher/BatchPracticalsTable';
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

const MOCK_TOTAL_STUDENTS = 30;

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
  };
}

export default function BatchDashboard() {
  const { division, batch } = useParams<{ division: string; batch: string }>();
  const { user } = useAuth();
  const [practicals, setPracticals] = useState<BatchTaskRow[]>([]);
  const [assignments, setAssignments] = useState<BatchTaskRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'practical' | 'assignment'>('practical');
  const [editingRow, setEditingRow] = useState<BatchTaskRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ row: BatchTaskRow; type: 'practical' | 'assignment' } | null>(null);

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
    (values: BatchTaskFormValues) => {
      const id = editingRow?.id || `${modalType}-${Date.now()}`;
      const row = toRow(values, id, editingRow?.submittedCount ?? 0, editingRow ?? undefined);
      if (modalType === 'practical') {
        if (editingRow) {
          setPracticals((prev) => prev.map((p) => (p.id === editingRow.id ? row : p)));
        } else {
          setPracticals((prev) => [...prev, row]);
        }
      } else {
        if (editingRow) {
          setAssignments((prev) => prev.map((a) => (a.id === editingRow.id ? row : a)));
        } else {
          setAssignments((prev) => [...prev, row]);
        }
      }
      setEditingRow(null);
      setModalOpen(false);
    },
    [editingRow, modalType]
  );

  const handleDeletePractical = useCallback((row: BatchTaskRow) => {
    setDeleteTarget({ row, type: 'practical' });
  }, []);
  const handleDeleteAssignment = useCallback((row: BatchTaskRow) => {
    setDeleteTarget({ row, type: 'assignment' });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'practical') {
      setPracticals((prev) => prev.filter((p) => p.id !== deleteTarget.row.id));
    } else {
      setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.row.id));
    }
    setDeleteTarget(null);
  }, [deleteTarget]);

  const modalInitialValues: BatchTaskFormValues | null = editingRow
    ? {
        title: editingRow.title,
        description: editingRow.description,
        deadline: editingRow.deadline || '',
        type: modalType,
        practicalMode: 'code',
      }
    : null;

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
        onDelete={handleDeletePractical}
      />

      <BatchAssignmentsTable
        division={division}
        batch={batch}
        items={assignments}
        onAdd={openAddAssignment}
        onEdit={openEditAssignment}
        onDelete={handleDeleteAssignment}
      />

      <BatchTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={modalInitialValues}
        defaultType={modalType}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteTarget?.row.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
