// SubjectTable.tsx
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1 }}
      className={cn("h-full rounded-full", colorClass)} 
    />
  </div>
);

export function SubjectTable({ data }: { data: any[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-4 w-1/4">Subject Name</th>
              <th className="px-6 py-4 text-center">Assignments</th>
              <th className="px-6 py-4 w-1/6">Submission Rate</th>
              <th className="px-6 py-4 text-center">Avg. Score</th>
              <th className="px-6 py-4 text-center">Risk Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No subjects found.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">{row.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{row.code}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{row.assignmentCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">{row.submissionRate}%</span>
                      </div>
                      <ProgressBar value={row.submissionRate} colorClass={row.submissionRate > 80 ? "bg-blue-500" : "bg-amber-400"} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block font-bold px-2 py-1 rounded text-xs bg-muted border border-border">
                      {row.avgScore} / 20
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.risk === 'High' ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100">
                        <AlertTriangle size={12} /> High Risk
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Normal</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}