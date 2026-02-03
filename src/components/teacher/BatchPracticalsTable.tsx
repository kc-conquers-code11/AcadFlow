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
import { Pencil, ExternalLink, Trash2, Copy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface BatchTaskRow {
  id: string;
  title: string;
  description: string;
  submittedCount: number;
  totalStudents: number;
  submittedPercent: number;
  deadline?: string;
  /** For edit prefilling from DB */
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
  practicalMode?: 'code' | 'no-code';
}

interface BatchPracticalsTableProps {
  division: string;
  batch: string;
  items: BatchTaskRow[];
  onAdd: () => void;
  onEdit: (item: BatchTaskRow) => void;
  onCopy?: (item: BatchTaskRow) => void;
  onDelete: (item: BatchTaskRow) => void;
  hideHeader?: boolean;
}

export function BatchPracticalsTable({
  division,
  batch,
  items,
  onAdd,
  onEdit,
  onCopy,
  onDelete,
  hideHeader = false,
}: BatchPracticalsTableProps) {
  return (
    <section className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Practicals</h2>
          <Button size="sm" onClick={onAdd}>
            Add
          </Button>
        </div>
      )}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No practicals. Click Add to create one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {item.description || '—'}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.submittedCount}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.submittedPercent}%
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => onEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" asChild>
                              <Link
                                to={`/submissions/${item.id}?division=${division}&batch=${batch}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">View Submissions</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Submissions</p>
                          </TooltipContent>
                        </Tooltip>

                        {onCopy && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => onCopy(item)}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy to another batch</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy to another batch</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                              onClick={() => onDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
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
