import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

// Temporary in-memory structure for teacher batch display (no DB yet)
const DIVISIONS = ['A', 'B'] as const;
const BATCHES = ['A', 'B', 'C'] as const;

const BATCH_CARDS = DIVISIONS.flatMap((div) =>
  BATCHES.map((batch) => ({
    divisionName: `Div ${div}`,
    batchName: `Batch ${batch}`,
    division: div,
    batch,
    id: `div-${div}-batch-${batch}`,
  }))
);

export default function Batches() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batches</h1>
        <p className="text-slate-500 mt-1">
          View and manage students by division and batch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {BATCH_CARDS.map((item) => (
          <Link key={item.id} to={`/batches/${item.division}/${item.batch}`}>
            <Card
              className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:bg-slate-50/50"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-800 m-0">
                    {item.divisionName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-slate-600">{item.batchName}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
