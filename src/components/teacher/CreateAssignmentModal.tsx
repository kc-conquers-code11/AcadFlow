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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Code2, FileText, Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialValues?: any;
}

export function CreateAssignmentModal({ open, onOpenChange, onSuccess, initialValues }: CreateAssignmentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Form States
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [submissionMode, setSubmissionMode] = useState('both');

  // Rubrics State
  const [totalPoints, setTotalPoints] = useState<number>(20);
  const [rubrics, setRubrics] = useState<{ id: number, criteria: string, max_marks: number }[]>([]);

  // Targeting States
  const [targetType, setTargetType] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name, code');
      setSubjects(data || []);
    };

    if (open) {
      fetchSubjects();

      if (initialValues) {
        setSubjectId(initialValues.subject_id || '');
        setTitle(initialValues.title || '');
        setDescription(initialValues.description || '');

        if (initialValues.deadline) {
          const d = new Date(initialValues.deadline);
          setDeadline(!isNaN(d.getTime()) ? d : undefined);
        }

        setSubmissionMode(initialValues.submission_mode || 'both');
        setTotalPoints(initialValues.total_points || 20);
        setRubrics(initialValues.rubrics || []);

        if (initialValues.target_division) {
          setTargetType('division');
          setSelectedDivision(initialValues.target_division);
          setSelectedBatch(initialValues.target_batch || 'all');
        } else {
          setTargetType('all');
        }
      } else {
        setSubjectId('');
        setTitle('');
        setDescription('');
        setDeadline(undefined);
        setSubmissionMode('both');
        setTargetType('all');
        setSelectedDivision('');
        setSelectedBatch('all');
        setTotalPoints(20);
        setRubrics([]);
      }
    }
  }, [open, initialValues]);

  const addRubric = () => {
    setRubrics([...rubrics, { id: Date.now(), criteria: '', max_marks: 5 }]);
    setTotalPoints(prev => prev + 5);
  };

  const removeRubric = (id: number) => {
    const rubricToRemove = rubrics.find(r => r.id === id);
    setRubrics(rubrics.filter(r => r.id !== id));
    if (rubricToRemove) {
      setTotalPoints(prev => Math.max(0, prev - rubricToRemove.max_marks));
    }
  };

  const updateRubric = (id: number, field: 'criteria' | 'max_marks', value: any) => {
    const newRubrics = rubrics.map(r => {
      if (r.id === id) return { ...r, [field]: value };
      return r;
    });
    setRubrics(newRubrics);
    if (field === 'max_marks') {
      const sum = newRubrics.reduce((acc, curr) => acc + (Number(curr.max_marks) || 0), 0);
      setTotalPoints(sum);
    }
  };

  const handleSubmit = async () => {
    if (!subjectId || !title || !deadline) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const targetDivision = targetType === 'division' ? selectedDivision : null;
      const targetBatch = (targetType === 'division' && selectedBatch !== 'all') ? selectedBatch : null;

      const payload = {
        title,
        description,
        subject_id: subjectId,
        deadline: deadline!.toISOString(),
        created_by: user?.id,
        target_division: targetDivision,
        target_batch: targetBatch,
        submission_mode: submissionMode,
        type: 'theory',
        total_points: totalPoints,
        rubrics: rubrics.length > 0 ? rubrics : null
      };

      let error;
      if (initialValues?.id) {
        const { error: err } = await supabase.from('assignments').update(payload).eq('id', initialValues.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('assignments').insert([payload]);
        error = err;
      }

      if (error) throw error;

      toast.success(initialValues ? "Assignment Updated" : "Assignment Created");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 bg-background border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/30 pr-12">
          <DialogTitle>{initialValues ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-5 overflow-y-auto">
          <div className="space-y-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Subject *</Label>
                <Select onValueChange={setSubjectId} value={subjectId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Deadline *</Label>
                <DateTimePicker
                  date={deadline}
                  onChange={(d) => setDeadline(d)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Assignment Title *</Label>
              <Input
                placeholder="e.g. Logic Building & Flowcharts"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Instructions</Label>
              <Textarea
                placeholder="Briefly explain what needs to be done..."
                className="h-24 resize-none bg-muted/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Target Audience</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Course (All Divs)</SelectItem>
                    <SelectItem value="division">Specific Division/Batch</SelectItem>
                  </SelectContent>
                </Select>

                {targetType === 'division' && (
                  <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1">
                    <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                      <SelectTrigger className="h-9 bg-background"><SelectValue placeholder="Div" /></SelectTrigger>
                      <SelectContent>{['A', 'B'].map(d => <SelectItem key={d} value={d}>Div {d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="h-9 bg-background"><SelectValue placeholder="Batch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {['A', 'B', 'C'].map(b => <SelectItem key={b} value={`${selectedDivision}${b}`}>Batch {selectedDivision}{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Submission Mode</Label>
                <div className="flex bg-background rounded-lg border border-border p-1 gap-1">
                  {['text', 'code', 'both'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSubmissionMode(mode)}
                      className={`flex-1 flex flex-col items-center justify-center py-2 rounded-md transition-all ${submissionMode === mode
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      {mode === 'text' && <FileText size={14} />}
                      {mode === 'code' && <Code2 size={14} />}
                      {mode === 'both' && <Layers size={14} />}
                      <span className="text-[9px] uppercase mt-1 font-bold">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-lg"><Layers size={16} className="text-primary" /></div>
                  <Label className="text-sm font-bold">Grading Rubrics</Label>
                </div>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Total:</span>
                  <span className="text-sm font-black text-primary">{totalPoints}</span>
                </Badge>
              </div>

              <div className="space-y-3">
                {rubrics.map((r, index) => (
                  <div key={r.id} className="flex gap-2 items-center group animate-in slide-in-from-left-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="e.g. Code Efficiency"
                        value={r.criteria}
                        onChange={(e) => updateRubric(r.id, 'criteria', e.target.value)}
                        className="h-10 text-sm"
                      />
                      <span className="absolute -left-6 top-3 text-[10px] font-mono text-muted-foreground/50">{index + 1}</span>
                    </div>

                    <div className="relative w-20">
                      <Input
                        type="number"
                        value={r.max_marks}
                        onChange={(e) => updateRubric(r.id, 'max_marks', Number(e.target.value))}
                        className="h-10 text-sm pr-7 text-center font-bold"
                      />
                      <span className="absolute right-2 top-3 text-[10px] font-bold text-muted-foreground">pts</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => removeRubric(r.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRubric}
                  className="w-full border-dashed border-2 h-10 text-muted-foreground hover:text-primary hover:border-primary/50 bg-transparent"
                >
                  <Plus size={14} className="mr-2" /> Add Criteria
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/30">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Discard</Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px]">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {initialValues ? 'Update Assignment' : 'Post Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}