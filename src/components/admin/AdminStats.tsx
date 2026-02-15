import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminStats({ stats }: { stats: any }) {
  const statItems = [
    { title: "Total Students", value: stats.students, icon: Users, color: "bg-blue-500", delay: 0.1 },
    { title: "Faculty Members", value: stats.teachers, icon: ShieldCheck, color: "bg-emerald-500", delay: 0.2 },
    { title: "Active Assignments", value: stats.assignments, icon: BookOpen, color: "bg-purple-500", delay: 0.3 },
    { title: "Total Submissions", value: stats.submissions, icon: CheckCircle, color: "bg-orange-500", delay: 0.4 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: item.delay }}
        >
          <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all group">
            <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2", item.color)} />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.title}</p>
                  <p className="text-3xl font-black mt-2 tracking-tight">{item.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-opacity-10 transition-transform group-hover:scale-110", item.color.replace('bg-', 'bg-opacity-10 text-'))}>
                  <item.icon size={24} className={cn(item.color.replace('bg-', 'text-'))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}