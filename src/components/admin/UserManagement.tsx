import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search, Loader2, KeyRound, User, GraduationCap, ShieldAlert, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id?: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  department?: string;
  // Student Specific Fields
  enrollment_number?: string;
  division?: string;
  batch?: string;
  year?: number;
  semester?: number;
  password?: string;
}

interface UserManagementProps {
  users: any[];
  refreshData: () => void;
  loading: boolean;
}

export function UserManagement({ users, refreshData, loading }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<string>('student');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedDiv, setSelectedDiv] = useState<string>('ALL'); // NEW: Division State

  const [saving, setSaving] = useState(false);
  
  // Initial Empty State
  const initialFormState: UserProfile = {
    email: '',
    name: '',
    role: 'student',
    department: 'Computer Engineering',
    enrollment_number: '',
    division: 'A',
    batch: 'A',
    year: 1,
    semester: 1,
    password: ''
  };

  const [formData, setFormData] = useState<UserProfile>(initialFormState);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // --- FILTER LOGIC (UPDATED) ---
  const filteredUsers = users
    .filter(u => u.role === activeTab) // 1. Filter by Role
    .filter(u => {
        // 2. Filter by Division (Only for Students)
        if (activeTab === 'student' && selectedDiv !== 'ALL') {
            return u.division === selectedDiv;
        }
        return true;
    })
    .filter(u => 
      // 3. Filter by Search Text
      u.name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.enrollment_number && u.enrollment_number.toLowerCase().includes(search.toLowerCase()))
    );

  // --- HANDLERS ---

  const handleEdit = (user: any) => {
    setSelectedUserId(user.id);
    setFormData({
      id: user.id,
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'student',
      department: user.department || 'Computer Engineering',
      enrollment_number: user.enrollment_number || '',
      division: user.division || 'A',
      batch: user.batch || 'A',
      year: user.year || 1,
      semester: user.semester || 1,
      password: ''
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedUserId(null);
    setFormData({ 
        ...initialFormState, 
        role: (activeTab as 'student' | 'teacher' | 'admin') 
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedUserId(id);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUserId);
      if (error) throw error;
      toast.success("User deleted successfully");
      refreshData();
      setIsDeleteOpen(false);
    } catch (err: any) {
      toast.error("Error deleting user: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        email: formData.email,
      };

      if (formData.role === 'student') {
        payload.enrollment_number = formData.enrollment_number;
        payload.division = formData.division;
        payload.batch = formData.batch;
        payload.year = parseInt(String(formData.year));
        payload.semester = parseInt(String(formData.semester));
      }

      if (selectedUserId) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', selectedUserId);
        if (error) throw error;
        
        if (formData.password && formData.password.length > 0) {
           toast.info("Profile updated. Use Admin Console for secure password reset.");
        } else {
           toast.success("User updated successfully");
        }
      } else {
        const { error } = await supabase.from('profiles').insert([payload]);
        if (error) throw error;
        toast.success("User profile created.");
      }

      refreshData();
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper to render the table content
  const renderTable = () => (
    <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name / Email</TableHead>
              {activeTab === 'student' && <TableHead>Enrollment</TableHead>}
              {activeTab === 'student' && <TableHead>Class Info</TableHead>}
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                 <TableCell colSpan={activeTab === 'student' ? 5 : 3} className="h-24 text-center">
                   <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                 </TableCell>
               </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === 'student' ? 5 : 3} className="h-24 text-center text-muted-foreground">
                  No {activeTab}s found {selectedDiv !== 'ALL' && `in Div ${selectedDiv}`}.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  
                  {activeTab === 'student' && (
                      <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                              {user.enrollment_number || 'N/A'}
                          </Badge>
                      </TableCell>
                  )}

                  {activeTab === 'student' && (
                      <TableCell>
                          <div className="text-xs">
                              <span className="font-bold">Div {user.division}</span> • Batch {user.batch}
                              <div className="text-muted-foreground">Year {user.year} (Sem {user.semester})</div>
                          </div>
                      </TableCell>
                  )}

                  <TableCell className="text-sm">{user.department}</TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil size={16} className="text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user.id)}>
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
  );

  return (
    <div className="space-y-4">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedDiv('ALL'); }} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-[400px]">
                <TabsTrigger value="student" className="gap-2"><GraduationCap size={16}/> Students</TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2"><User size={16}/> Teachers</TabsTrigger>
                <TabsTrigger value="admin" className="gap-2"><ShieldAlert size={16}/> Admins</TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="flex gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* NEW: Division Filter (Only shows for Students) */}
            {activeTab === 'student' && (
                <div className="w-[110px] shrink-0">
                    <Select value={selectedDiv} onValueChange={setSelectedDiv}>
                        <SelectTrigger className="pl-3">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-muted-foreground"/>
                                <SelectValue placeholder="Div" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Divs</SelectItem>
                            <SelectItem value="A">Div A</SelectItem>
                            <SelectItem value="B">Div B</SelectItem>
                            <SelectItem value="C">Div C</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder={`Search ${activeTab}s...`} 
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button onClick={handleAddNew} className="gap-2 shrink-0">
                <Plus size={16} /> Add User
            </Button>
        </div>
      </div>

      {/* RENDER TABLE */}
      {renderTable()}

      {/* --- ADD / EDIT DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUserId ? `Edit ${formData.role}` : `Add New ${formData.role}`}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(val: any) => setFormData({...formData, role: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <KeyRound size={14} /> 
                    {selectedUserId ? "Reset Password (Optional)" : "Set Password"}
                </Label>
                <Input 
                  type="password" 
                  placeholder={selectedUserId ? "Leave blank to keep current" : "Enter initial password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!selectedUserId} 
                />
            </div>

            {formData.role === 'student' && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-4 animate-in slide-in-from-top-2">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2"><GraduationCap size={16}/> Academic Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Enrollment Number</Label>
                    <Input value={formData.enrollment_number} onChange={(e) => setFormData({...formData, enrollment_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Division</Label>
                    <Select value={formData.division} onValueChange={(val) => setFormData({...formData, division: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['A','B','C'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <Select value={formData.batch} onValueChange={(val) => setFormData({...formData, batch: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['A','B','C'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" min={1} max={4} value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Input type="number" min={1} max={8} value={formData.semester} onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                {selectedUserId ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
            <p className="text-muted-foreground">Are you sure you want to delete <strong>{users.find(u => u.id === selectedUserId)?.name}</strong>? This cannot be undone.</p>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={executeDelete} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Delete User"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}