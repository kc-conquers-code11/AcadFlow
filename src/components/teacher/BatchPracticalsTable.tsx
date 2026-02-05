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
import { Pencil, Eye, Play, FileEdit, CheckCircle2 } from 'lucide-react';
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
  studentStatus?: 'draft' | 'submitted' | 'evaluated' | null;
  studentMarks?: number | null;
}

interface BatchPracticalsTableProps {
  items: BatchTaskRow[];
  userRole: string;
  onEdit: (item: BatchTaskRow) => void;
  onDelete: (item: BatchTaskRow) => void;
  onViewResponses: (item: BatchTaskRow) => void;
}

export function BatchPracticalsTable({
  items,
  userRole,
  onEdit,
  onViewResponses,
}: BatchPracticalsTableProps) {

  const isTeacher = userRole === 'teacher' || userRole === 'hod';

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 font-bold">Exp No</TableHead>
            <TableHead className="font-bold">Title & Aim</TableHead>
            <TableHead className="w-32 text-center font-bold">Mode</TableHead>

            {isTeacher ? (
              <TableHead className="w-32 text-center font-bold">Deadline</TableHead>
            ) : (
              <TableHead className="w-36 text-center font-bold">Status / Score</TableHead>
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
              // LOGIC FIX: If status is evaluated OR marks exist (not null), show score
              const showScore = item.studentStatus === 'evaluated' || (item.studentMarks !== null && item.studentMarks !== undefined);

              return (
                <TableRow key={item.id} className="group transition-colors">
                  <TableCell className="font-mono font-medium text-muted-foreground">
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
                    <Badge variant="outline" className="font-normal text-[10px] capitalize">
                      {item.practicalMode || 'code'}
                    </Badge>
                  </TableCell>

                  {isTeacher ? (
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {item.deadline ? new Date(item.deadline).toLocaleDateString() : '-'}
                    </TableCell>
                  ) : (
                    <TableCell className="text-center">
                      {/* STUDENT STATUS DISPLAY */}
                      {showScore ? (
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10 px-3">
                            {item.studentMarks ?? 0} / {item.maxMarks}
                          </Badge>
                          <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Graded
                          </span>
                        </div>
                      ) : item.studentStatus === 'submitted' ? (
                        <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10">Submitted</Badge>
                      ) : item.studentStatus === 'draft' ? (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10">Draft</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">-</span>
                      )}
                    </TableCell>
                  )}

                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-2">

                      {/* --- STUDENT ACTIONS --- */}
                      {!isTeacher && (
                        <Button
                          asChild
                          size="sm"
                          variant={showScore || item.studentStatus === 'submitted' ? "outline" : "default"}
                          className={cn(
                            "transition-all",
                            showScore || item.studentStatus === 'submitted'
                              ? ""
                              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 shadow-sm"
                          )}
                        >
                          <Link to={`/practical/${item.id}`}>
                            {showScore || item.studentStatus === 'submitted' ? (
                              <>View Answer</>
                            ) : item.studentStatus === 'draft' ? (
                              <><FileEdit className="mr-2 h-3 w-3" /> Resume</>
                            ) : (
                              <><Play className="mr-2 h-3 w-3" /> Solve</>
                            )}
                          </Link>
                        </Button>
                      )}

                      {/* --- TEACHER ACTIONS --- */}
                      {isTeacher && (
                        <TooltipProvider>
                          <div className="flex gap-1 justify-end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 dark:text-blue-400" onClick={() => onViewResponses(item)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Evaluate</p></TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Edit</p></TooltipContent>
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