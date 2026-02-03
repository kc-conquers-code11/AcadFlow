import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  type: 'assignment',
  practicalMode: 'code',
  quizQuestions: [],
};

interface BatchTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: BatchTaskFormValues | null;
  defaultType?: TaskType;
  onSave: (values: BatchTaskFormValues) => void;
}

export function BatchTaskModal({
  open,
  onOpenChange,
  initialValues,
  defaultType = 'assignment',
  onSave,
}: BatchTaskModalProps) {
  const [form, setForm] = useState<BatchTaskFormValues>(
    initialValues || { ...emptyForm, type: defaultType }
  );

  useEffect(() => {
    if (open) {
      setForm(
        initialValues || { ...emptyForm, type: defaultType, practicalMode: 'code' }
      );
    }
  }, [open, initialValues, defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  };

  const addQuizQuestion = () => {
    setForm((prev) => ({
      ...prev,
      quizQuestions: [
        ...(prev.quizQuestions || []),
        { question: '', options: ['', '', ''], correctIndex: 0 },
      ],
    }));
  };

  const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: string | string[] | number) => {
    setForm((prev) => {
      const qs = [...(prev.quizQuestions || [])];
      qs[index] = { ...qs[index], [field]: value };
      return { ...prev, quizQuestions: qs };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Task' : 'Add Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="description">Description / Instructions</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Instructions for students"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v: TaskType) =>
                setForm((p) => ({ ...p, type: v, practicalMode: v === 'practical' ? 'code' : undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.type === 'practical' && (
            <div className="space-y-2">
              <Label>Practical mode</Label>
              <Select
                value={form.practicalMode || 'code'}
                onValueChange={(v: PracticalMode) =>
                  setForm((p) => ({ ...p, practicalMode: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Code-based practical</SelectItem>
                  <SelectItem value="no-code">No-code practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {form.type === 'assignment' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quiz (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion}>
                  Add question
                </Button>
              </div>
              {(form.quizQuestions || []).map((q, i) => (
                <div key={i} className="border border-slate-200 rounded-md p-3 space-y-2">
                  <Input
                    placeholder="Question"
                    value={q.question}
                    onChange={(e) => updateQuizQuestion(i, 'question', e.target.value)}
                  />
                  {q.options.map((opt, j) => (
                    <Input
                      key={j}
                      placeholder={`Option ${j + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...q.options];
                        opts[j] = e.target.value;
                        updateQuizQuestion(i, 'options', opts);
                      }}
                    />
                  ))}
                  <Select
                    value={String(q.correctIndex)}
                    onValueChange={(v) => updateQuizQuestion(i, 'correctIndex', Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map((_, j) => (
                        <SelectItem key={j} value={String(j)}>
                          Option {j + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
