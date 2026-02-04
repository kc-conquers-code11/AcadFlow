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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, LayoutList, Loader2, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";

export type PracticalMode = 'code' | 'no-code' | 'both';

export interface RubricItem {
  id: string;
  criteria: string;
  max_marks: number;
}

export interface BatchTaskFormValues {
  experimentNumber: string;
  title: string;
  description: string;
  notes: string;
  resourceLink: string;
  deadline: string;
  practicalMode: PracticalMode;
  rubrics: RubricItem[];
  totalPoints: number;
}

const emptyForm: BatchTaskFormValues = {
  experimentNumber: '',
  title: '',
  description: '',
  notes: '',
  resourceLink: '',
  deadline: '',
  practicalMode: 'code',
  rubrics: [],
  totalPoints: 0,
};

interface BatchTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: BatchTaskFormValues | null;
  onSave: (values: BatchTaskFormValues) => void;
  saving?: boolean;
}

export function BatchTaskModal({
  open,
  onOpenChange,
  initialValues,
  onSave,
  saving = false,
}: BatchTaskModalProps) {
  
  const [form, setForm] = useState<BatchTaskFormValues>(emptyForm);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [manualTotal, setManualTotal] = useState<number>(20);

  // Load Initial Values
  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm(initialValues);
        if (initialValues.deadline) {
          const d = new Date(initialValues.deadline);
          setDate(!isNaN(d.getTime()) ? d : undefined);
        }
        const rubricSum = (initialValues.rubrics || []).reduce((sum, r) => sum + r.max_marks, 0);
        if (rubricSum === 0 && initialValues.totalPoints > 0) {
          setManualTotal(initialValues.totalPoints);
        }
      } else {
        setForm({
          ...emptyForm,
          rubrics: [
            { id: crypto.randomUUID(), criteria: 'Logic & Implementation', max_marks: 10 },
            { id: crypto.randomUUID(), criteria: 'Output & Correctness', max_marks: 5 },
            { id: crypto.randomUUID(), criteria: 'Documentation / Comments', max_marks: 5 },
          ]
        });
        setDate(undefined);
        setManualTotal(20);
      }
    }
  }, [open, initialValues]);

  // Sync Deadline String
  useEffect(() => {
    if (date) {
      setForm(prev => ({ ...prev, deadline: date.toISOString() }));
    }
  }, [date]);

  const rubricTotal = form.rubrics.reduce((sum, r) => sum + (Number(r.max_marks) || 0), 0);
  const finalTotal = form.rubrics.length > 0 ? rubricTotal : manualTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    onSave({ ...form, totalPoints: finalTotal });
  };

  const setTime = (type: 'hours' | 'minutes', value: number) => {
    const newDate = new Date(date || new Date());
    if (type === 'hours') newDate.setHours(value);
    else newDate.setMinutes(value);
    setDate(newDate);
  };

  const addRubricRow = () => {
    setForm(prev => ({
      ...prev,
      rubrics: [...prev.rubrics, { id: crypto.randomUUID(), criteria: '', max_marks: 5 }]
    }));
  };

  const removeRubricRow = (id: string) => {
    setForm(prev => ({ ...prev, rubrics: prev.rubrics.filter(r => r.id !== id) }));
  };

  const updateRubric = (id: string, field: keyof RubricItem, value: any) => {
    setForm(prev => ({
      ...prev,
      rubrics: prev.rubrics.map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Practical' : 'Create New Practical'}</DialogTitle>
          <DialogDescription>Set experiment details, grading criteria, and submission rules.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          
          <div className="grid gap-4 p-1">
            <div className="flex gap-4">
               <div className="w-1/3 space-y-2">
                  <Label htmlFor="expNo">Exp. No</Label>
                  <Input
                    id="expNo"
                    value={form.experimentNumber}
                    onChange={(e) => setForm((p) => ({ ...p, experimentNumber: e.target.value }))}
                    placeholder="e.g. Exp-01"
                    required
                  />
               </div>
               <div className="w-2/3 space-y-2">
                  <Label htmlFor="title">Title / Aim</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Implement Stack using Array"
                    required
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Submission Mode</Label>
                <div className="flex flex-col gap-2 p-3 border rounded-md bg-slate-50/50">
                   <div className="flex items-center space-x-2">
                      <input type="radio" id="mode-code" name="mode" checked={form.practicalMode === 'code'} onChange={() => setForm(p => ({...p, practicalMode: 'code'}))} className="accent-primary h-4 w-4 cursor-pointer"/>
                      <Label htmlFor="mode-code" className="font-normal cursor-pointer">Code Compiler Only</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <input type="radio" id="mode-nocode" name="mode" checked={form.practicalMode === 'no-code'} onChange={() => setForm(p => ({...p, practicalMode: 'no-code'}))} className="accent-primary h-4 w-4 cursor-pointer"/>
                      <Label htmlFor="mode-nocode" className="font-normal cursor-pointer">Text / File Only</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <input type="radio" id="mode-both" name="mode" checked={form.practicalMode === 'both'} onChange={() => setForm(p => ({...p, practicalMode: 'both'}))} className="accent-primary h-4 w-4 cursor-pointer"/>
                      <Label htmlFor="mode-both" className="font-normal cursor-pointer">Both (Code + Text)</Label>
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP p") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 flex" align="start">
                    <div className="border-r border-border">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(new Date(d))} defaultMonth={date || new Date()} initialFocus />
                    </div>
                    <div className="flex flex-col sm:flex-row p-2 divide-x divide-border">
                      <ScrollArea className="w-16 h-[300px]">
                        <div className="flex flex-col p-2 gap-1 items-center">
                          <div className="text-[10px] font-bold mb-2 text-muted-foreground uppercase">Hr</div>
                          {Array.from({ length: 24 }, (_, i) => (
                            <Button key={i} size="icon" variant={date?.getHours() === i ? "default" : "ghost"} className="h-8 w-8 text-sm" onClick={() => setTime('hours', i)} type="button">
                              {i.toString().padStart(2, '0')}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                      <ScrollArea className="w-16 h-[300px]">
                        <div className="flex flex-col p-2 gap-1 items-center">
                          <div className="text-[10px] font-bold mb-2 text-muted-foreground uppercase">Min</div>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((i) => (
                            <Button key={i} size="icon" variant={date?.getMinutes() === i ? "default" : "ghost"} className="h-8 w-8 text-sm" onClick={() => setTime('minutes', i)} type="button">
                              {i.toString().padStart(2, '0')}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="desc">Description / Instructions</Label>
                  <Textarea id="desc" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Step-by-step instructions..." className="h-24 resize-none" />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="notes">Important Note (Optional)</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="e.g. Plagiarism will lead to 0 marks." className="h-24 bg-yellow-50/30 border-yellow-100 resize-none" />
               </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="resource">Resource Link / File URL (Optional)</Label>
                <div className="relative">
                   <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input id="resource" className="pl-9" value={form.resourceLink} onChange={(e) => setForm((p) => ({ ...p, resourceLink: e.target.value }))} placeholder="https://drive.google.com/..." />
                </div>
            </div>
          </div>

          <div className="border-t pt-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LayoutList size={18} className="text-primary" />
                  <Label className="text-lg font-semibold">Grading Rubrics</Label>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
                  Total Points: <span className="font-bold ml-1">{finalTotal}</span>
                </Badge>
             </div>

             <Card className="bg-slate-50/50 border shadow-none">
                <CardContent className="p-4 space-y-3">
                  {form.rubrics.length > 0 ? (
                    form.rubrics.map((item, index) => (
                      <div key={item.id} className="flex gap-2 items-start group">
                        <div className="flex-1 space-y-1">
                          {index === 0 && <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Criteria</span>}
                          <Input value={item.criteria} onChange={(e) => updateRubric(item.id, 'criteria', e.target.value)} placeholder="e.g. Code Logic" className="bg-white" />
                        </div>
                        <div className="w-24 space-y-1">
                          {index === 0 && <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Marks</span>}
                          <Input type="number" value={item.max_marks} onChange={(e) => updateRubric(item.id, 'max_marks', parseInt(e.target.value) || 0)} className="bg-white text-center font-medium" />
                        </div>
                        <div className="space-y-1 pt-0">
                          {index === 0 && <span className="text-[10px] opacity-0 block">Del</span>}
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => removeRubricRow(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border-dashed border-2 rounded-lg bg-white/50">
                      <p className="text-sm text-muted-foreground mb-3">No rubrics defined. Using Manual Score.</p>
                      <div className="flex items-center justify-center gap-2">
                        <Label>Manual Score:</Label>
                        <Input type="number" value={manualTotal} onChange={(e) => setManualTotal(parseInt(e.target.value) || 0)} className="w-24 bg-white text-center" />
                      </div>
                    </div>
                  )}

                  <Button type="button" variant="outline" size="sm" onClick={addRubricRow} className="mt-2 w-full border-dashed border-2 hover:bg-white hover:border-primary/50 hover:text-primary transition-all">
                    <Plus size={14} className="mr-2" /> Add Criteria Row
                  </Button>
                </CardContent>
             </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.title || !form.experimentNumber || !date} className="min-w-[140px]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialValues ? 'Update Practical' : 'Create Practical')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}