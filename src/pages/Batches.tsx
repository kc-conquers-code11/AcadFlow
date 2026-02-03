import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Plus,
  Users,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';

// Temporary in-memory structure for teacher batch display
const DIVISIONS = ['A', 'B'] as const;
const BATCHES = ['A', 'B', 'C'] as const;

const BATCH_CARDS = DIVISIONS.flatMap((div) =>
  BATCHES.map((batch) => ({
    divisionName: `Division ${div}`,
    batchName: `Batch ${batch}`,
    division: div,
    batch,
    id: `div-${div}-batch-${batch}`,
    students: Math.floor(Math.random() * 10) + 15, // Mock student count
    status: 'Active'
  }))
);

export default function Batches() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Batches</h1>
          <p className="text-muted-foreground">
            Manage student divisions and practical batches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BATCH_CARDS.map((item) => (
          <Link key={item.id} to={`/batches/${item.division}/${item.batch}`} className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 border-muted bg-card text-card-foreground overflow-hidden relative">

              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <Badge variant="outline" className="mb-2 font-medium bg-primary/5 text-primary border-primary/20">
                    {item.divisionName}
                  </Badge>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {item.batchName}
                  </CardTitle>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <BookOpen className="h-4 w-4" />
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Users className="mr-2 h-4 w-4 opacity-70" />
                  <span>{item.students} Students Enrolled</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t bg-muted/30 flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  View Details
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
