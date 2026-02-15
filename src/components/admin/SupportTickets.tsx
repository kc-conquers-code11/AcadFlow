import { useState } from 'react';
import { MessageCircle, Search, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SupportTickets({ tickets, refreshData }: { tickets: any[], refreshData: () => void }) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleResolve = async (ticketId: number) => {
    setLoadingId(ticketId);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved' }) // Assuming you have a 'status' column. If not, we can add it or just delete.
        .eq('id', ticketId);

      if (error) throw error;
      toast.success("Ticket marked as resolved");
      refreshData();
    } catch (err: any) {
      toast.error("Failed to update ticket");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = tickets.filter(t => 
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border shadow-md bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <MessageCircle className="text-pink-500" /> Support Desk
        </CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets..." 
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
                <TableHead className="font-bold pl-6">User Details</TableHead>
                <TableHead className="font-bold">Issue / Subject</TableHead>
                <TableHead className="font-bold w-[300px]">Message</TableHead>
                <TableHead className="font-bold text-center">Date</TableHead>
                <TableHead className="font-bold text-right pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id} className="hover:bg-muted/40 group">
                  <TableCell className="pl-6 py-4 align-top">
                    <div className="font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{t.email}</div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline" className="mb-1 border-primary/20 text-primary">{t.subject}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top">
                     <p className="line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                        {t.message}
                     </p>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground align-top pt-4">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right pr-6 align-top">
                    {t.status === 'resolved' ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                            <CheckCircle size={12} className="mr-1" /> Resolved
                        </Badge>
                    ) : (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                            onClick={() => handleResolve(t.id)}
                            disabled={loadingId === t.id}
                        >
                            {loadingId === t.id ? '...' : 'Mark Done'}
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}