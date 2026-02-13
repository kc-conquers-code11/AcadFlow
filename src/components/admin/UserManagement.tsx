import { useState } from 'react';
import { Search, UserCog, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function UserManagement({ users, refreshData, loading }: { users: any[], refreshData: () => void, loading: boolean }) {
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast.success(`Role updated to ${newRole}`);
      refreshData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border shadow-md bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <UserCog className="text-primary" /> User Database
        </CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
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
                <TableHead className="font-bold pl-6">Identity</TableHead>
                <TableHead className="font-bold text-center">Role Status</TableHead>
                <TableHead className="font-bold text-center">Batch Info</TableHead>
                <TableHead className="font-bold text-right pr-6">Manage Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow key={u.id} className="group hover:bg-muted/40 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="font-bold text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                      "capitalize font-bold border px-3 py-0.5",
                      u.role === 'admin' ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20" :
                      u.role === 'teacher' ? "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : 
                      "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    )}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {u.division ? <span className="font-mono bg-muted px-2 py-1 rounded">Div {u.division} • {u.batch}</span> : <span className="text-muted-foreground opacity-50">-</span>}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {updatingId === u.id ? (
                       <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
                    ) : (
                      <Select onValueChange={(val) => handleRoleChange(u.id, val)} defaultValue={u.role}>
                        <SelectTrigger className="w-[120px] ml-auto h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}