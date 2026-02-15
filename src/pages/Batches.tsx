import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  ArrowRight,
  Copy,
  Loader2,
  LogIn,
  Layers,
  Trash2,
  User
} from 'lucide-react';
import { toast } from 'sonner';

export default function Batches() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);

  // Create Batch State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2025-26',
    year: '2',
    division: 'A',
    batch: 'A',
    semester: '4'
  });

  // Join Batch State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  if (!user) return null;

  useEffect(() => {
    fetchBatches();
  }, [user]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      if (user.role === 'student') {
        const { data, error } = await supabase
          .from('batch_students')
          .select('*, batches(*, profiles:created_by(name))')
          .eq('student_id', user.id);

        if (error) throw error;

        const myBatches = data.map((item: any) => ({
          ...item.batches,
          joined_at: item.joined_at,
          instructor_name: item.batches.profiles?.name
        }));
        setBatches(myBatches);
      } else {
        const { data, error } = await supabase
          .from('batches')
          .select('*, batch_students(count)')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBatches(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const generateBatchCode = () => {
    return Math.random().toString(36).substring(2, 5).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 5).toUpperCase();
  };

  const handleCreateBatch = async () => {
    if (!formData.name.trim()) {
      toast.error("Batch name is required");
      return;
    }

    setCreating(true);
    try {
      const code = generateBatchCode();
      const { error } = await supabase
        .from('batches')
        .insert({
          name: formData.name,
          academic_year: formData.academicYear,
          year: parseInt(formData.year),
          division: formData.division,
          batch: formData.batch,
          semester: parseInt(formData.semester),
          code: code,
          created_by: user.id
        });

      if (error) throw error;

      toast.success(`Batch created! Code: ${code}`);
      navigator.clipboard.writeText(code);

      setIsCreateOpen(false);
      setFormData({
        name: '',
        academicYear: '2024-25',
        year: '2',
        division: 'A',
        batch: 'A',
        semester: '3'
      });
      fetchBatches();

    } catch (err) {
      console.error(err);
      toast.error("Failed to create batch");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinBatch = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select('id, name')
        .eq('code', joinCode.trim().toUpperCase())
        .single();

      if (batchError || !batch) {
        toast.error("Invalid Batch Code");
        setJoining(false);
        return;
      }

      const { error: joinError } = await supabase
        .from('batch_students')
        .insert({
          batch_id: batch.id,
          student_id: user.id
        });

      if (joinError) {
        if (joinError.code === '23505') toast.info("Already joined this batch");
        else throw joinError;
      } else {
        toast.success(`Joined batch: ${batch.name}`);
        setIsJoinOpen(false);
        setJoinCode('');
        fetchBatches();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to join batch");
    } finally {
      setJoining(false);
    }
  };

  // --- FIXED & SIMPLIFIED DELETE LOGIC ---
  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure? This will remove the batch and un-enroll all students.")) return;

    try {
      // 1. Delete Linked Students first (to avoid FK constraints)
      const { error: linkError } = await supabase
        .from('batch_students')
        .delete()
        .eq('batch_id', batchId);

      if (linkError) {
        console.warn("Link cleanup issue:", linkError);
        // We continue anyway, hoping cascade works or permission allows
      }

      // 2. Delete the Batch (Removed batch_practicals call to fix 400 error)
      const { data, error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Could not delete. Please check if you have permission (RLS Policy).");
      }

      toast.success("Batch deleted successfully");
      setBatches(prev => prev.filter(b => b.id !== batchId));
      
    } catch (err: any) {
      console.error("Delete Error:", err);
      toast.error(err.message || "Failed to delete batch");
      fetchBatches(); // Refresh to show real state
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <div className="flex flex-col gap-8 p-8 min-h-[calc(100vh-4rem)] bg-background/50 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {user.role === 'student' ? 'My Classrooms' : 'Batch Management'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {user.role === 'student'
              ? 'Access your course materials, assignments, and labs from here.'
              : 'Manage your academic divisions and student groups efficiently.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'student' ? (
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <LogIn className="mr-2 h-5 w-5" />
                  Join New Batch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Batch</DialogTitle>
                  <DialogDescription>Enter the unique code provided by your instructor.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Batch Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g. XY7-A2B"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="uppercase font-mono tracking-widest text-center text-lg"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleJoinBatch} disabled={joining} className="w-full">
                    {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Join Classroom
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary text-primary-foreground">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                  <DialogDescription>Set up a new class group for assignments.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                  <div className="grid gap-2">
                    <Label htmlFor="name">Batch Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. DBMS Lab - A1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <Select
                        value={formData.year}
                        onValueChange={(val) => setFormData({ ...formData, year: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">FE (1st Year)</SelectItem>
                          <SelectItem value="2">SE (2nd Year)</SelectItem>
                          <SelectItem value="3">TE (3rd Year)</SelectItem>
                          <SelectItem value="4">BE (4th Year)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Division</Label>
                      <Select
                        value={formData.division}
                        onValueChange={(val) => setFormData({ ...formData, division: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Div" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Div A</SelectItem>
                          <SelectItem value="B">Div B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Practical Batch</Label>
                      <Select
                        value={formData.batch}
                        onValueChange={(val) => setFormData({ ...formData, batch: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Batch A</SelectItem>
                          <SelectItem value="B">Batch B</SelectItem>
                          <SelectItem value="C">Batch C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Semester</Label>
                      <Select
                        value={formData.semester}
                        onValueChange={(val) => setFormData({ ...formData, semester: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sem" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Academic Year</Label>
                    <Input
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder="2024-25"
                    />
                  </div>

                </div>
                <DialogFooter>
                  <Button onClick={handleCreateBatch} disabled={creating} className="w-full">
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Batch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {batches.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/10">
              <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <Layers className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-2xl text-foreground mb-2">No Batches Found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {user.role === 'student' ? "You haven't enrolled in any classrooms yet." : "Get started by creating your first batch."}
              </p>
              {user.role !== 'student' && (
                <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create First Batch</Button>
              )}
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} className="group relative">
                <Card className="h-full flex flex-col justify-between overflow-hidden border border-border/50 bg-background/50 hover:bg-background hover:border-border shadow-sm hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 rounded-2xl">

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary" className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-2">
                        {batch.academic_year}
                      </Badge>

                      {user.role !== 'student' && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.preventDefault(); copyToClipboard(batch.code); }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => { e.preventDefault(); handleDeleteBatch(batch.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-2xl font-bold leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {batch.name}
                    </CardTitle>

                    <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground mt-3">
                      <span className="bg-secondary/30 px-2 py-1 rounded-md border border-secondary/50">Year {batch.year}</span>
                      <span className="bg-secondary/30 px-2 py-1 rounded-md border border-secondary/50">Div {batch.division}</span>
                      <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">Batch {batch.batch}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <Separator className="mb-4" />

                    <div className="flex items-center justify-between">
                      {user.role === 'student' ? (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {(batch.instructor_name || 'F').charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Instructor</span>
                            <span className="text-sm font-medium">{batch.instructor_name || 'Faculty'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-16 rounded-md bg-muted/50 flex items-center justify-center border border-muted">
                            <span className="font-mono text-sm font-bold">{batch.code}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Access Code</span>
                        </div>
                      )}

                      <div className="text-right">
                        {user.role !== 'student' && (
                          <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-foreground">{batch.batch_students?.[0]?.count || 0}</span>
                            <span className="text-xs text-muted-foreground">Students</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6 px-6">
                    <Link to={`/batches/${batch.id}`} className="w-full">
                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm" variant="outline">
                        View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}