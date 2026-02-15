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

export function BatchTable({ data }: { data: any[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-4">Batch Name</th>
              <th className="px-6 py-4 text-center">Students</th>
              <th className="px-6 py-4 text-center">Practical Avg</th>
              <th className="px-6 py-4 text-center">Theory Avg</th>
              <th className="px-6 py-4 w-1/4">Submission Consistency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No batches found.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{row.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">Div {row.division} • Batch {row.batchCode}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{row.studentCount}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2 py-1 rounded text-xs font-bold", row.pracAvg >= 15 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                      {row.pracAvg} / 20
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2 py-1 rounded text-xs font-bold", row.theoryAvg >= 15 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                      {row.theoryAvg} / 20
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">{row.consistency}%</span>
                      </div>
                      <ProgressBar 
                        value={row.consistency} 
                        colorClass={row.consistency > 80 ? "bg-blue-500" : row.consistency > 50 ? "bg-amber-500" : "bg-red-500"} 
                      />
                    </div>
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