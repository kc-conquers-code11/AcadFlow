import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BarChart3, CheckCircle2, Beaker, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReportStats({ stats }: { stats: any }) {
  const items = [
    { 
      title: "Total Submissions", 
      value: stats.totalSubmissions, 
      icon: BarChart3, 
      color: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
      delay: 0.1 
    },
    { 
      title: "Overall Avg Score", 
      value: stats.avgScore, 
      icon: CheckCircle2, 
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      delay: 0.2 
    },
    { 
      title: "Active Tasks", 
      value: stats.totalTasks, 
      icon: Beaker, 
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      delay: 0.3 
    },
    { 
      title: "Evaluated Count", 
      value: stats.totalEvaluated, 
      icon: Users, 
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      delay: 0.4 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: item.delay }}
        >
          <Card className="border-border shadow-sm">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <h3 className="text-2xl font-bold mt-2">{item.value}</h3>
              </div>
              <div className={cn("p-2.5 rounded-lg", item.color)}>
                <item.icon size={20} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}