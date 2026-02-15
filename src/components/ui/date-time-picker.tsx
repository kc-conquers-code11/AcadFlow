import { useState, useRef, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateTimePickerProps {
    date: Date | undefined;
    onChange: (date: Date) => void;
    placeholder?: string;
    className?: string;
}

/** Scrollable column with mouse-wheel support */
const TimeColumn = ({
    label,
    count,
    selected,
    onSelect,
    renderValue,
}: {
    label: string;
    count: number;
    selected: number;
    onSelect: (v: number) => void;
    renderValue?: (i: number) => string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.stopPropagation();
            const direction = e.deltaY > 0 ? 1 : -1;
            const next = Math.max(0, Math.min(count - 1, selected + direction));
            onSelect(next);

            // Scroll the selected button into view
            const container = containerRef.current;
            if (container) {
                const buttons = container.querySelectorAll('button');
                buttons[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        },
        [selected, count, onSelect]
    );

    return (
        <div className="flex flex-col items-center w-16" onWheel={handleWheel}>
            <div className="text-[10px] font-bold py-2 text-muted-foreground uppercase sticky top-0 bg-popover z-10 w-full text-center">
                {label}
            </div>
            <div
                ref={containerRef}
                className="flex flex-col gap-1 items-center px-1 pb-2 overflow-y-auto h-[260px] scrollbar-thin"
            >
                {Array.from({ length: count }, (_, i) => (
                    <Button
                        key={i}
                        size="icon"
                        variant={selected === i ? 'default' : 'ghost'}
                        className="h-8 w-12 text-sm shrink-0 font-mono"
                        onClick={() => onSelect(i)}
                        type="button"
                    >
                        {renderValue ? renderValue(i) : i.toString().padStart(2, '0')}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export function DateTimePicker({ date, onChange, placeholder = 'Pick a date', className }: DateTimePickerProps) {
    const [open, setOpen] = useState(false);

    const setTime = (type: 'hours' | 'minutes', value: number) => {
        const d = date ? new Date(date) : new Date();
        if (type === 'hours') d.setHours(value);
        if (type === 'minutes') d.setMinutes(value);
        onChange(d);
    };

    const handleDateSelect = (d: Date | undefined) => {
        if (!d) return;
        const newDate = new Date(d);
        // Preserve existing time
        if (date) {
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
        }
        onChange(newDate);
    };

    // Format display with AM/PM
    const formatDisplay = (d: Date) => {
        return format(d, "MMM d, yyyy 'at' hh:mm a");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground', className)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? formatDisplay(date) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                <div className="flex">
                    <div className="border-r border-border">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            defaultMonth={date || new Date()}
                            initialFocus
                        />
                    </div>
                    <div className="flex p-1 divide-x divide-border">
                        <TimeColumn
                            label="HR"
                            count={24}
                            selected={date?.getHours() ?? 0}
                            onSelect={(v) => setTime('hours', v)}
                            renderValue={(i) => {
                                const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
                                const ampm = i < 12 ? 'AM' : 'PM';
                                return `${hour12}${ampm}`;
                            }}
                        />
                        <TimeColumn
                            label="MIN"
                            count={60}
                            selected={date?.getMinutes() ?? 0}
                            onSelect={(v) => setTime('minutes', v)}
                        />
                    </div>
                </div>
                <div className="border-t border-border px-3 py-2 flex items-center justify-between bg-muted/30">
                    <span className="text-xs text-muted-foreground">
                        {date ? format(date, "MMM d, yyyy 'at' hh:mm a") : 'No date selected'}
                    </span>
                    <Button size="sm" type="button" className="h-7 px-4 text-xs" onClick={() => setOpen(false)}>
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
