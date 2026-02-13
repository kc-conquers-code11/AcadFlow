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
import { Pencil, Eye, Trash2, Play, FileEdit, CheckCircle2, BrainCircuit } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

export interface BatchTaskRow {
  id: string;
  title: string;
  description: string;
  experimentNumber: string;
  submittedCount?: number;
  deadline?: string;
  maxMarks: number;
  rubrics?: any[];
  practicalMode?: 'code' | 'no-code' | 'both';
  studentStatus?: 'draft' | 'submitted' | 'evaluated' | 'redo_requested' | null;
  studentMarks?: number | null;
  // Extra fields
  notes?: string;
  resourceLink?: string;
  viva_cleared?: boolean;
  viva_score?: number;
  ai_score?: number; // New field for AI Score
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface BatchPracticalsTableProps {
  items: BatchTaskRow[];
  userRole: string;
  onEdit: (item: BatchTaskRow) => void;
  onDelete: (id: string) => void;
  onViewResponses: (item: BatchTaskRow) => void;
}

export function BatchPracticalsTable({
  items,
  userRole,
  onEdit,
  onDelete,
  onViewResponses,
}: BatchPracticalsTableProps) {

  const isTeacher = userRole === 'teacher' || userRole === 'hod';

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-20 font-bold">Exp No</TableHead>
            <TableHead className="font-bold">Title & Aim</TableHead>
            <TableHead className="w-32 text-center font-bold">Mode</TableHead>

            {isTeacher ? (
              <TableHead className="w-32 text-center font-bold">Deadline</TableHead>
            ) : (
              <TableHead className="w-40 text-center font-bold">Status / Viva</TableHead>
            )}

            <TableHead className="w-40 text-right font-bold pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                No experiments found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const showScore = item.studentStatus === 'evaluated' || (item.studentMarks !== null && item.studentMarks !== undefined);

              return (
                <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono font-medium text-slate-600">
                    {item.experimentNumber || '-'}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{item.title}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {item.description || 'No description'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal text-[10px] capitalize">
                      {item.practicalMode || 'code'}
                    </Badge>
                  </TableCell>

                  {isTeacher ? (
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {item.deadline ? new Date(item.deadline).toLocaleDateString() : '-'}
                    </TableCell>
                  ) : (
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {/* Main Status */}
                        {showScore ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 px-3">
                            {item.studentMarks ?? 0} / {item.maxMarks}
                          </Badge>
                        ) : item.studentStatus === 'submitted' ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Submitted</Badge>
                        ) : item.studentStatus === 'draft' ? (
                          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
                        ) : item.studentStatus === 'redo_requested' ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Redo Requested</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">-</span>
                        )}

                        {/* VIVA STATUS BADGE */}
                        {item.viva_cleared && (
                          <Badge variant="outline" className="text-[9px] h-4 border-green-500 text-green-600 flex gap-1 items-center px-1 bg-green-50">
                            <BrainCircuit size={8} /> Viva OK
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-2">

                      {!isTeacher && (
                        <Button
                          asChild
                          size="sm"
                          variant={showScore || item.studentStatus === 'submitted' ? "outline" : "default"}
                          className={cn(
                            "transition-all",
                            showScore || item.studentStatus === 'submitted'
                              ? "hover:bg-slate-100"
                              : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                          )}
                        >
                          <Link to={`/practical/${item.id}`}>
                            {showScore || item.studentStatus === 'submitted' ? (
                              <>View Answer</>
                            ) : item.studentStatus === 'draft' ? (
                              <><FileEdit className="mr-2 h-3 w-3" /> Resume</>
                            ) : item.studentStatus === 'redo_requested' ? (
                              <><Play className="mr-2 h-3 w-3" /> Redo</>
                            ) : (
                              <><Play className="mr-2 h-3 w-3" /> Solve</>
                            )}
                          </Link>
                        </Button>
                      )}

                      {isTeacher && (
                        <TooltipProvider>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => onViewResponses(item)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Evaluate</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100" onClick={() => onEdit(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Edit</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    if (item.id) onDelete(item.id);
                                    else console.error("Missing ID");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Archive (Soft Delete)</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}