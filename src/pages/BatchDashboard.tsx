import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  FileText,
  Beaker,
  Users,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Reuse Modal for Create/Edit
import { BatchTaskModal, BatchTaskFormValues } from '@/components/teacher/BatchTaskModal';
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

// Types
export interface BatchTaskRow {
  id: string;
  title: string;
  description: string;
  submittedCount: number;
  totalStudents: number;
  submittedPercent: number;
  deadline?: string;
}

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

  // State
  const [activeTab, setActiveTab] = useState<'practicals' | 'assignments'>('practicals');
  const [practicals, setPracticals] = useState<BatchTaskRow[]>([]);
  const [assignments, setAssignments] = useState<BatchTaskRow[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BatchTaskRow | null>(null);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<BatchTaskRow | null>(null);

  if (!user) return null;
  if (!division || !batch) return null;

  const divisionLabel = `Division ${division.toUpperCase()}`;
  const batchLabel = `Batch ${batch.toUpperCase()}`;

  // Actions
  const openCreate = useCallback(() => {
    setEditingRow(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: BatchTaskRow) => {
    setEditingRow(row);
    setModalOpen(true);
  }, []);

  const openDelete = useCallback((row: BatchTaskRow) => {
    setDeleteTarget(row);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    if (activeTab === 'practicals') {
      setPracticals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } else {
      setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }, [deleteTarget, activeTab]);

  const handleSave = useCallback(
    (values: BatchTaskFormValues) => {
      const id = editingRow?.id || `${activeTab}-${Date.now()}`;
      const row = toRow(values, id, editingRow?.submittedCount ?? 0, editingRow ?? undefined);

      if (activeTab === 'practicals') {
        setPracticals((prev) => editingRow ? prev.map((p) => (p.id === editingRow.id ? row : p)) : [...prev, row]);
      } else {
        setAssignments((prev) => editingRow ? prev.map((a) => (a.id === editingRow.id ? row : a)) : [...prev, row]);
      }
      setEditingRow(null);
      setModalOpen(false);
    },
    [editingRow, activeTab]
  );

  // Data for current view
  const currentData = activeTab === 'practicals' ? practicals : assignments;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-[calc(100vh-4rem)]">

      {/* 1. Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/batches">Batches</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{batchLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{batchLabel}</h1>
            <Badge variant="outline" className="text-muted-foreground">{divisionLabel}</Badge>
          </div>
          <p className="text-muted-foreground">
            Manage course content and track student progress.
          </p>
        </div>

        <Button onClick={openCreate} className="w-full md:w-auto shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add {activeTab === 'practicals' ? 'Practical' : 'Assignment'}
        </Button>
      </div>

      {/* 3. Tabs & Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full space-y-4"
      >
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger
            value="practicals"
            className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm py-2"
          >
            <Beaker className="mr-2 h-4 w-4" />
            Practicals
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm py-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead className="hidden md:table-cell">Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No {activeTab} created yet. Click "Add" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{item.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{item.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {/* Mock Avatars */}
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium ml-1">
                          {item.submittedCount}/{item.totalStudents}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-muted/50 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${item.submittedPercent}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(item)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem>View Submissions</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDelete(item)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>

      {/* Modals */}
      <BatchTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingRow ? {
          title: editingRow.title,
          description: editingRow.description,
          deadline: editingRow.deadline || '',
          type: activeTab === 'practicals' ? 'practical' : 'assignment',
          practicalMode: 'code'
        } : null}
        defaultType={activeTab === 'practicals' ? 'practical' : 'assignment'}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {activeTab === 'practicals' ? 'Practical' : 'Assignment'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all associated student submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
