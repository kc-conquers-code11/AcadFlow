import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function GlobalAssignments({ assignments }: { assignments: any[] }) {
  const [search, setSearch] = useState('');

  const filtered = assignments.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.profiles?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border shadow-md bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="text-purple-500" /> Global Assignment Feed
        </CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search assignments..." 
            className="pl-9 h-9" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow>
                <TableHead className="font-bold pl-6">Assignment Details</TableHead>
                <TableHead className="font-bold">Subject Code</TableHead>
                <TableHead className="font-bold text-center">Faculty</TableHead>
                <TableHead className="font-bold text-right pr-6">Target Audience</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6 py-4">
                    <div className="font-bold text-foreground">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                       {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">{a.subjects?.code}</Badge>
                    <div className="text-xs mt-1 text-muted-foreground">{a.subjects?.name}</div>
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="flex items-center justify-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                           {a.profiles?.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-sm">{a.profiles?.name}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                      {a.target_division ? `Div ${a.target_division}` : 'All Div'}
                      {a.target_batch && ` • ${a.target_batch}`}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No assignments found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}