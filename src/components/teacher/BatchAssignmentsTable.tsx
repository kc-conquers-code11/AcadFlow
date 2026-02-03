import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, ExternalLink, Trash2 } from 'lucide-react';
import type { BatchTaskRow } from './BatchPracticalsTable';

interface BatchAssignmentsTableProps {
  division: string;
  batch: string;
  items: BatchTaskRow[];
  onAdd: () => void;
  onEdit: (item: BatchTaskRow) => void;
  onDelete: (item: BatchTaskRow) => void;
}

export function BatchAssignmentsTable({
  division,
  batch,
  items,
  onAdd,
  onEdit,
  onDelete,
}: BatchAssignmentsTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>
        <Button size="sm" onClick={onAdd}>
          Add
        </Button>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-16">Sr. No</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24 text-center">Count</TableHead>
              <TableHead className="w-24 text-center">Submitted %</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  No assignments. Click Add to create one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} className="border-b border-slate-100">
                  <TableCell className="font-medium text-slate-600">{index + 1}</TableCell>
                  <TableCell className="font-medium text-slate-900">{item.title}</TableCell>
                  <TableCell className="text-slate-600 max-w-xs truncate">
                    {item.description || '—'}
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {item.submittedCount}
                  </TableCell>
                  <TableCell className="text-center text-slate-600">
                    {item.submittedPercent}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-slate-600"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8" asChild>
                        <Link
                          to={`/submissions/${item.id}?division=${division}&batch=${batch}`}
                          title="View Submissions"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-600 hover:text-red-700"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
