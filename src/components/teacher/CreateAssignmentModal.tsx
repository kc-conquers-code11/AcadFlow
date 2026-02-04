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
import { Loader2, Calendar as CalendarIcon, Code2, FileText, Layers, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAssignmentModal({ open, onOpenChange, onSuccess }: CreateAssignmentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Form States
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionMode, setSubmissionMode] = useState('both');
  
  // --- DYNAMIC RUBRICS STATE ---
  const [totalPoints, setTotalPoints] = useState<number>(20);
  const [rubrics, setRubrics] = useState<{id: number, criteria: string, max_marks: number}[]>([]);

  // Targeting States
  const [targetType, setTargetType] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  // Fetch Subjects on Mount
  useEffect(() => {
    if (open) {
      const fetchSubjects = async () => {
        const { data } = await supabase.from('subjects').select('id, name, code');
        setSubjects(data || []);
      };
      fetchSubjects();
      
      // Reset All Fields
      setSubjectId('');
      setTitle('');
      setDescription('');
      setDeadline('');
      setSubmissionMode('both');
      setTargetType('all');
      setSelectedDivision('');
      setSelectedBatch('all');
      setTotalPoints(20);
      setRubrics([]); // Start with empty rubrics
    }
  }, [open]);

  // --- RUBRIC LOGIC ---
  
  // 1. Add New Row
  const addRubric = () => {
    setRubrics([...rubrics, { id: Date.now(), criteria: '', max_marks: 5 }]);
    // Optional: Add 5 to total points automatically
    setTotalPoints(prev => prev + 5);
  };

  // 2. Remove Row
  const removeRubric = (id: number) => {
    const rubricToRemove = rubrics.find(r => r.id === id);
    setRubrics(rubrics.filter(r => r.id !== id));
    
    // Deduct marks from total
    if (rubricToRemove) {
      setTotalPoints(prev => Math.max(0, prev - rubricToRemove.max_marks));
    }
  };

  // 3. Update Row & Recalculate Total
  const updateRubric = (id: number, field: 'criteria' | 'max_marks', value: any) => {
    const newRubrics = rubrics.map(r => {
      if (r.id === id) return { ...r, [field]: value };
      return r;
    });
    setRubrics(newRubrics);

    // Auto-update Total Points if marks changed
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

      const { error } = await supabase.from('assignments').insert([
        {
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
          rubrics: rubrics.length > 0 ? rubrics : null // Save dynamic rubrics
        }
      ]);

      if (error) throw error;

      toast.success("Assignment Created Successfully");
      onSuccess();
      onOpenChange(false);

    } catch (err) {
      console.error(err);
      toast.error("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Scroll fix: max-h-[90vh] ensures modal fits in screen */}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-slate-950">
        
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Area */}
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Subject & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject <span className="text-red-500">*</span></Label>
                <Select onValueChange={setSubjectId} value={subjectId}>
                  <SelectTrigger>
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
                <Label>Deadline <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input 
                    type="datetime-local" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="pl-10"
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assignment Title <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. Module 1: Introduction to DSA" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea 
                placeholder="Enter details or questions..." 
                className="h-24 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Targeting & Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
               {/* Targeting */}
               <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-slate-500">Target Audience</Label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      <SelectItem value="division">Specific Division</SelectItem>
                    </SelectContent>
                  </Select>

                  {targetType === 'division' && (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-left-1">
                      <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Div" /></SelectTrigger>
                        <SelectContent>{['A', 'B'].map(d => <SelectItem key={d} value={d}>Div {d}</SelectItem>)}</SelectContent>
                      </Select>
                      
                      {selectedDivision && (
                        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Batch" /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="all">All</SelectItem>
                             {['A', 'B', 'C'].map(b => <SelectItem key={b} value={`${selectedDivision}${b}`}>Batch {selectedDivision}{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
               </div>

               {/* Submission Mode */}
               <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-slate-500">Submission Mode</Label>
                  <div className="flex bg-white dark:bg-slate-950 rounded border p-1 gap-1">
                    {['text', 'code', 'both'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSubmissionMode(mode)}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded text-[10px] font-medium transition-all ${
                          submissionMode === mode 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {mode === 'text' && <FileText size={14} className="mr-1"/>}
                        {mode === 'code' && <Code2 size={14} className="mr-1"/>}
                        {mode === 'both' && <Layers size={14} className="mr-1"/>}
                        <span className="capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* --- DYNAMIC RUBRICS SECTION --- */}
            <div className="space-y-4 pt-2 border-t">
               <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Grading Rubric</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Total Points:</Label>
                    <Input 
                      type="number" 
                      className="w-20 h-8 font-bold text-center" 
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(Number(e.target.value))}
                    />
                  </div>
               </div>
                
               {/* Rubric List */}
               <div className="space-y-3">
                  {rubrics.map((r, index) => (
                    <div key={r.id} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                       <span className="text-xs font-mono text-slate-400 w-4">{index + 1}.</span>
                       
                       <Input 
                         placeholder="Criteria (e.g. Logic / Clean Code)" 
                         value={r.criteria}
                         onChange={(e) => updateRubric(r.id, 'criteria', e.target.value)}
                         className="flex-1 h-9 text-sm"
                       />
                       
                       <div className="relative w-20">
                         <Input 
                           type="number"
                           value={r.max_marks}
                           onChange={(e) => updateRubric(r.id, 'max_marks', Number(e.target.value))}
                           className="h-9 text-sm pr-6" // Space for 'pts'
                         />
                         <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">pts</span>
                       </div>

                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50" 
                         onClick={() => removeRubric(r.id)}
                       >
                          <Trash2 size={16} />
                       </Button>
                    </div>
                  ))}

                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addRubric} 
                    className="w-full border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-200"
                  >
                     <Plus size={14} className="mr-2" /> Add Criteria
                  </Button>
               </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}