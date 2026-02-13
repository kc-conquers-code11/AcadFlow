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
  BookOpen,
  Plus,
  Users,
  ArrowRight,
  Copy,
  Loader2,
  LogIn,
  GraduationCap,
  Calendar,
  Layers,
  Trash2
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
    batch: 'A', // New Field
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
          batch: formData.batch, // Sending Batch A/B/C
          semester: parseInt(formData.semester),
          code: code,
          created_by: user.id
        });

      if (error) throw error;
      
      toast.success(`Batch created! Code: ${code}`, {
        description: "Share this code with students.",
      });
      navigator.clipboard.writeText(code);
      
      setIsCreateOpen(false);
      // Reset form
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

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch? All associated data will be removed.")) return;

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      toast.success("Batch deleted successfully");
      setBatches(prev => prev.filter(b => b.id !== batchId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete batch");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {user.role === 'student' ? 'My Batches' : 'Manage Batches'}
          </h1>
          <p className="text-muted-foreground">
            {user.role === 'student' 
              ? 'Join classrooms to access assignments and labs.' 
              : 'Create dynamic groups and manage student divisions.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {user.role === 'student' ? (
            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button>
                  <LogIn className="mr-2 h-4 w-4" />
                  Join Batch
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
                      className="uppercase font-mono tracking-widest"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleJoinBatch} disabled={joining}>
                    {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Join
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                  <DialogDescription>Set up a new class group for assignments.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  
                  {/* Batch Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Batch Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. DBMS Lab - A1"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  {/* Row 1: Year & Div */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <Select 
                        value={formData.year} 
                        onValueChange={(val) => setFormData({...formData, year: val})}
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
                        onValueChange={(val) => setFormData({...formData, division: val})}
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

                  {/* Row 2: Batch & Sem */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Practical Batch</Label>
                      <Select 
                        value={formData.batch} 
                        onValueChange={(val) => setFormData({...formData, batch: val})}
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
                        onValueChange={(val) => setFormData({...formData, semester: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sem" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(s => (
                            <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div className="grid gap-2">
                    <Label>Academic Year</Label>
                    <Input
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      placeholder="2024-25"
                    />
                  </div>

                </div>
                <DialogFooter>
                  <Button onClick={handleCreateBatch} disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Batch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Separator className="my-2" />

      {/* Content */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed rounded-xl bg-muted/20">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">No Batches Found</h3>
              <p className="text-muted-foreground">
                {user.role === 'student' ? "Join a batch to get started." : "Create your first batch above."}
              </p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} className="group block h-full">
                <Card className="h-full transition-all duration-200 hover:shadow-lg border-muted bg-card text-card-foreground overflow-hidden relative flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/40 to-blue-500/10" />
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="outline" className="mb-2 font-mono text-xs bg-secondary/50">
                          {user.role === 'student' ? 'Enrolled' : batch.code}
                        </Badge>
                        <CardTitle className="text-xl font-bold line-clamp-1" title={batch.name}>
                          {batch.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><GraduationCap size={12}/> Year {batch.year}</span>
                          <span>•</span>
                          <span>Div {batch.division}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 px-1 rounded"><Layers size={10}/> Batch {batch.batch}</span>
                        </p>
                      </div>
                      
                      {user.role !== 'student' && (
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                            onClick={(e) => { e.preventDefault(); copyToClipboard(batch.code); }}
                            title="Copy Code"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => { e.preventDefault(); handleDeleteBatch(batch.id); }}
                            title="Delete Batch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-3 mt-2">
                      {user.role === 'student' ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-2 h-4 w-4 opacity-70" />
                            <span>Instructor: {batch.instructor_name || 'Faculty'}</span>
                          </div>
                      ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-2 h-4 w-4 opacity-70" />
                          <span>{batch.batch_students?.[0]?.count || 0} Students</span>
                        </div>
                      )}
                      
                      {user.role !== 'student' && (
                        <div className="p-2 bg-muted/50 rounded-md border border-muted flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</span>
                          <code className="text-sm font-bold font-mono text-foreground tracking-widest">{batch.code}</code>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t bg-muted/20 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} /> {batch.academic_year}
                    </div>
                    <Link to={`/batches/${batch.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                        <ArrowRight className="h-4 w-4" />
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