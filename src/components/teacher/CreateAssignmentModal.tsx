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
import { Loader2, Calendar as CalendarIcon, Code2, FileText, Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialValues?: any; // Fixed: Property now exists in interface
}

export function CreateAssignmentModal({ open, onOpenChange, onSuccess, initialValues }: CreateAssignmentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Form States
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionMode, setSubmissionMode] = useState('both');
  
  // Rubrics State
  const [totalPoints, setTotalPoints] = useState<number>(20);
  const [rubrics, setRubrics] = useState<{id: number, criteria: string, max_marks: number}[]>([]);

  // Targeting States
  const [targetType, setTargetType] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  // Fetch Subjects & Handle Initial Values (Edit Mode)
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name, code');
      setSubjects(data || []);
    };

    if (open) {
      fetchSubjects();
      
      if (initialValues) {
        // --- LOAD EXISTING DATA FOR EDITING ---
        setSubjectId(initialValues.subject_id || '');
        setTitle(initialValues.title || '');
        setDescription(initialValues.description || '');
        
        if (initialValues.deadline) {
          const date = new Date(initialValues.deadline);
          const formattedDate = date.toISOString().slice(0, 16);
          setDeadline(formattedDate);
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
        // --- RESET FOR NEW ASSIGNMENT ---
        setSubjectId('');
        setTitle('');
        setDescription('');
        setDeadline('');
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
        deadline: new Date(deadline).toISOString(),
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
        // UPDATE EXISTING
        const { error: err } = await supabase.from('assignments').update(payload).eq('id', initialValues.id);
        error = err;
      } else {
        // INSERT NEW
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <DialogTitle>{initialValues ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="space-y-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Subject *</Label>
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
                <Label className="text-xs font-bold uppercase text-slate-500">Deadline *</Label>
                <div className="relative">
                  <Input 
                    type="datetime-local" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="pl-10 h-10"
                  />
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Assignment Title *</Label>
              <Input 
                placeholder="e.g. Logic Building & Flowcharts" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Instructions</Label>
              <Textarea 
                placeholder="Briefly explain what needs to be done..." 
                className="h-24 resize-none bg-slate-50/50 dark:bg-slate-900/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Audience</Label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-950">
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
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-950"><SelectValue placeholder="Div" /></SelectTrigger>
                        <SelectContent>{['A', 'B'].map(d => <SelectItem key={d} value={d}>Div {d}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-950"><SelectValue placeholder="Batch" /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Batches</SelectItem>
                           {['A', 'B', 'C'].map(b => <SelectItem key={b} value={`${selectedDivision}${b}`}>Batch {selectedDivision}{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Submission Mode</Label>
                  <div className="flex bg-white dark:bg-slate-950 rounded-lg border p-1 gap-1">
                    {['text', 'code', 'both'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSubmissionMode(mode)}
                        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-md transition-all ${
                          submissionMode === mode 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {mode === 'text' && <FileText size={14}/>}
                        {mode === 'code' && <Code2 size={14}/>}
                        {mode === 'both' && <Layers size={14}/>}
                        <span className="text-[9px] uppercase mt-1 font-bold">{mode}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg"><Layers size={16} className="text-blue-600"/></div>
                    <Label className="text-sm font-bold">Grading Rubrics</Label>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Total Marks:</Label>
                    <span className="text-sm font-black text-blue-600">{totalPoints}</span>
                  </div>
               </div>
               
               <div className="space-y-3">
                  {rubrics.map((r, index) => (
                    <div key={r.id} className="flex gap-2 items-center group animate-in slide-in-from-left-2">
                       <div className="flex-1 relative">
                        <Input 
                          placeholder="e.g. Code Efficiency" 
                          value={r.criteria}
                          onChange={(e) => updateRubric(r.id, 'criteria', e.target.value)}
                          className="h-10 text-sm bg-transparent"
                        />
                        <span className="absolute -left-6 top-3 text-[10px] font-mono text-slate-300">{index + 1}</span>
                       </div>
                       
                       <div className="relative w-20">
                         <Input 
                           type="number"
                           value={r.max_marks}
                           onChange={(e) => updateRubric(r.id, 'max_marks', Number(e.target.value))}
                           className="h-10 text-sm pr-7 text-center font-bold"
                         />
                         <span className="absolute right-2 top-3 text-[10px] font-bold text-slate-400">pts</span>
                       </div>

                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" 
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
                    className="w-full border-dashed border-2 h-10 text-slate-500 hover:text-blue-600 hover:border-blue-400 bg-transparent"
                  >
                     <Plus size={14} className="mr-2" /> Add Criteria
                  </Button>
               </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Discard</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
            {initialValues ? 'Update Assignment' : 'Post Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}