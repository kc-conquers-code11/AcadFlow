import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';

export type TaskType = 'assignment' | 'practical';
export type PracticalMode = 'code' | 'no-code';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface BatchTaskFormValues {
  title: string;
  description: string;
  deadline: string;
  type: TaskType;
  practicalMode?: PracticalMode;
  quizQuestions?: QuizQuestion[];
}

const emptyForm: BatchTaskFormValues = {
  title: '',
  description: '',
  deadline: '',
  type: 'assignment', // Default, will be overwritten
  practicalMode: 'code',
  quizQuestions: [],
};

interface BatchTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: BatchTaskFormValues | null;
  defaultType?: TaskType;
  onSave: (values: BatchTaskFormValues) => void;
  saving?: boolean;
}

export function BatchTaskModal({
  open,
  onOpenChange,
  initialValues,
  defaultType = 'assignment',
  onSave,
  saving = false,
}: BatchTaskModalProps) {
  const [form, setForm] = useState<BatchTaskFormValues>(
    initialValues || { ...emptyForm, type: defaultType }
  );

  const [date, setDate] = useState<Date | undefined>(undefined);

  // Quiz Editor State
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1);
  const [tempQuestion, setTempQuestion] = useState<QuizQuestion>({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm(initialValues);
        // Date handling
        if (initialValues.deadline) {
          const d = new Date(initialValues.deadline);
          setDate(!isNaN(d.getTime()) ? d : undefined);
        } else {
          setDate(undefined);
        }
      } else {
        // New Task: Force type to defaultType
        setForm({ ...emptyForm, type: defaultType, practicalMode: 'code' });
        setDate(undefined);
      }
      setIsEditingQuiz(false);
      setEditingQuestionIndex(-1);
    }
  }, [open, initialValues, defaultType]);

  // Sync date to form
  useEffect(() => {
    if (date) {
      const y = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      setForm(prev => ({ ...prev, deadline: `${y}-${mo}-${d}T${h}:${m}` }));
    } else {
      // if date is cleared, clear the deadline in form if needed, or keep it optional? 
      // Current logic mimics previous behavior: update if date exists.
    }
  }, [date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  };

  const setTime = (type: 'hours' | 'minutes', value: number) => {
    const newDate = new Date(date || new Date());
    if (type === 'hours') newDate.setHours(value);
    else newDate.setMinutes(value);
    setDate(newDate);
  };

  // --- Quiz Logic ---
  const handleAddQuestion = () => {
    setTempQuestion({
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
    });
    setEditingQuestionIndex(-1);
    setIsEditingQuiz(true);
  };

  const handleEditQuestion = (index: number) => {
    const q = form.quizQuestions?.[index];
    if (q) {
      setTempQuestion({ ...q });
      setEditingQuestionIndex(index);
      setIsEditingQuiz(true);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      quizQuestions: prev.quizQuestions?.filter((_, i) => i !== index),
    }));
  };

  const handleSaveQuestion = () => {
    // Validate
    if (!tempQuestion.question.trim()) return;
    const validOptions = tempQuestion.options.filter(o => o.trim());
    if (validOptions.length < 2) return;

    setForm(prev => {
      const newQuestions = [...(prev.quizQuestions || [])];
      if (editingQuestionIndex >= 0) {
        newQuestions[editingQuestionIndex] = tempQuestion;
      } else {
        newQuestions.push(tempQuestion);
      }
      return { ...prev, quizQuestions: newQuestions };
    });
    setIsEditingQuiz(false);
  };

  const updateTempOption = (idx: number, val: string) => {
    const newOpts = [...tempQuestion.options];
    newOpts[idx] = val;
    setTempQuestion(prev => ({ ...prev, options: newOpts }));
  };

  const addOption = () => {
    setTempQuestion(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (idx: number) => {
    if (tempQuestion.options.length <= 2) return;
    const newOpts = tempQuestion.options.filter((_, i) => i !== idx);
    // Adjust correct index if needed
    let newCorrect = tempQuestion.correctIndex;
    if (idx < newCorrect) newCorrect--;
    else if (idx === newCorrect) newCorrect = 0;

    setTempQuestion(prev => ({
      ...prev,
      options: newOpts,
      correctIndex: Math.min(newCorrect, newOpts.length - 1)
    }));
  };

  if (isEditingQuiz) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && setIsEditingQuiz(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestionIndex >= 0 ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={tempQuestion.question}
                onChange={e => setTempQuestion(p => ({ ...p, question: e.target.value }))}
                placeholder="Enter your question here..."
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {tempQuestion.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="grid place-items-center">
                      <input
                        type="radio"
                        name="correct-opt"
                        className="h-4 w-4 accent-primary"
                        checked={tempQuestion.correctIndex === i}
                        onChange={() => setTempQuestion(p => ({ ...p, correctIndex: i }))}
                      />
                    </div>
                    <Input
                      value={opt}
                      onChange={e => updateTempOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className={cn(tempQuestion.correctIndex === i && "border-primary ring-1 ring-primary")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => removeOption(i)}
                      disabled={tempQuestion.options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2 w-full">
                <Plus className="h-3 w-3 mr-2" /> Add Option
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingQuiz(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion}>Save Question</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialValues ? 'Edit' : 'Add'} {form.type === 'assignment' ? 'Assignment' : 'Practical'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below. {form.type === 'assignment' && "Add questions to create a quiz."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Instructions for students..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP p") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 flex" align="start" side="bottom">
                  <div className="border-r border-border">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) {
                          const newDate = new Date(d);
                          if (date) {
                            newDate.setHours(date.getHours());
                            newDate.setMinutes(date.getMinutes());
                          }
                          setDate(newDate);
                        }
                      }}
                      defaultMonth={date || new Date()}
                      fixedWeeks
                      initialFocus
                      classNames={{
                        month: "space-y-4 mx-0",
                        table: "w-full border-collapse space-y-1 mx-0",
                        head_row: "flex w-full",
                        row: "flex w-full mt-2",
                      }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row p-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <ScrollArea className="w-16 h-[300px]">
                      <div className="flex flex-col p-2 gap-1 items-center">
                        <div className="text-xs font-medium mb-2 text-muted-foreground">Hours</div>
                        {Array.from({ length: 24 }, (_, i) => (
                          <Button
                            key={i}
                            size="icon"
                            variant={date && date.getHours() === i ? "default" : "ghost"}
                            className="h-8 w-8 shrink-0 text-sm"
                            onClick={() => setTime('hours', i)}
                            type="button"
                          >
                            {i.toString().padStart(2, '0')}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="vertical" className="w-0" />
                    </ScrollArea>
                    <ScrollArea className="w-16 h-[300px]">
                      <div className="flex flex-col p-2 gap-1 items-center">
                        <div className="text-xs font-medium mb-2 text-muted-foreground">Mins</div>
                        {Array.from({ length: 60 }, (_, i) => (
                          <Button
                            key={i}
                            size="icon"
                            variant={date && date.getMinutes() === i ? "default" : "ghost"}
                            className="h-8 w-8 shrink-0 text-sm"
                            onClick={() => setTime('minutes', i)}
                            type="button"
                          >
                            {i.toString().padStart(2, '0')}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="vertical" className="w-0" />
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Practical Specifics */}
            {form.type === 'practical' && (
              <div className="space-y-2">
                <Label>Practical mode</Label>
                <RadioGroup
                  value={form.practicalMode || 'code'}
                  onValueChange={(v: PracticalMode) =>
                    setForm((p) => ({ ...p, practicalMode: v }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="code" id="mode-code" />
                    <Label htmlFor="mode-code">Code-based</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no-code" id="mode-no-code" />
                    <Label htmlFor="mode-no-code">No-code</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Assignment Specifics (Quiz Builder) */}
            {form.type === 'assignment' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Quiz Questions</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                </div>

                <div className="space-y-2">
                  {!form.quizQuestions?.length ? (
                    <div className="text-center py-6 border border-dashed rounded-md text-muted-foreground text-sm">
                      No questions added yet.
                    </div>
                  ) : (
                    form.quizQuestions.map((q, i) => (
                      <Card key={i} className="group relative overflow-hidden transition-all hover:shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm line-clamp-2">{q.question}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                                {q.options.length} Options
                              </Badge>
                              <span>•</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                Ans: {q.options[q.correctIndex]}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditQuestion(i)} type="button">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteQuestion(i)} type="button">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
