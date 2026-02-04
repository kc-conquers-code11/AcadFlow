import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DIVISIONS: ('A' | 'B')[] = ['A', 'B'];
const BATCHES: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

interface CopyToBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  currentDivision: 'A' | 'B' | null;
  currentBatch: 'A' | 'B' | 'C' | null;
  onConfirm: (division: 'A' | 'B', batch: 'A' | 'B' | 'C') => void;
  copying?: boolean;
}

export function CopyToBatchModal({
  open,
  onOpenChange,
  taskTitle,
  currentDivision,
  currentBatch,
  onConfirm,
  copying = false,
}: CopyToBatchModalProps) {
  const [selectedDivision, setSelectedDivision] = useState<'A' | 'B' | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<'A' | 'B' | 'C' | null>(null);

  const isSameBatch =
    selectedDivision === currentDivision && selectedBatch === currentBatch;
  const canConfirm =
    selectedDivision !== null && selectedBatch !== null && !isSameBatch;

  useEffect(() => {
    if (open) {
      setSelectedDivision(null);
      setSelectedBatch(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!canConfirm || !selectedDivision || !selectedBatch) return;
    onConfirm(selectedDivision, selectedBatch);
    // Parent closes modal and clears state on success
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedDivision(null);
      setSelectedBatch(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Copy to another batch</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Copy &quot;{taskTitle}&quot; to:
        </p>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Division</Label>
            <Select
              value={selectedDivision ?? ''}
              onValueChange={(v) => setSelectedDivision(v as 'A' | 'B')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    Div {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Batch</Label>
            <Select
              value={selectedBatch ?? ''}
              onValueChange={(v) => setSelectedBatch(v as 'A' | 'B' | 'C')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {BATCHES.map((b) => {
                  const isCurrent = selectedDivision === currentDivision && b === currentBatch;
                  return (
                    <SelectItem key={b} value={b} disabled={isCurrent}>
                      Batch {b}
                      {isCurrent ? ' (current)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {isSameBatch && (
            <p className="text-xs text-amber-600">
              Choose a different division or batch than the current one.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={copying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || copying}
          >
            {copying ? 'Copying…' : 'Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
