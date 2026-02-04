import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  MoreVertical,
  Search,
  GraduationCap,
  Briefcase,
  Shield,
  Mail,
  Filter,
  Edit,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { mockStudents } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { NativeTabs } from '@/components/custom/NativeTabs';
import { AddUserModal } from '@/components/users/AddUserModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Visual Components ---



const UserAvatar = ({ name, src, size = "md" }: { name: string, src?: string, size?: "sm" | "md" }) => (
  <Avatar className={cn(
    "border-2 border-background shadow-sm",
    size === "sm" ? "h-8 w-8" : "h-10 w-10"
  )}>
    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} />
    <AvatarFallback className="bg-muted text-muted-foreground font-bold">
      {name.charAt(0)}
    </AvatarFallback>
  </Avatar>
);

export default function UsersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"student" | "faculty" | "admin">("student");

  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  if (!user || user.role !== 'admin') return null;

  // Mock data for teachers 
  const teachers = [
    { id: 't1', name: 'Dr. Sarah Johnson', email: 'sarah.j@college.edu', role: 'Professor', subjects: 3, status: 'Active' },
    { id: 't2', name: 'Prof. Robert Williams', email: 'r.williams@college.edu', role: 'Assistant Prof', subjects: 2, status: 'Active' },
    { id: 't3', name: 'Dr. Emily Davis', email: 'emily.d@college.edu', role: 'Lecturer', subjects: 4, status: 'On Leave' },
  ];

  // Filter Logic
  const filteredStudents = mockStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.enrollmentNumber && s.enrollmentNumber.includes(searchQuery));
    const matchesBatch = batchFilter === 'all' || s.batch === batchFilter;
    const matchesDivision = divisionFilter === 'all' || s.division === divisionFilter;

    return matchesSearch && matchesBatch && matchesDivision;
  });

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (type: "student" | "faculty" | "admin") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const hasActiveFilters = batchFilter !== 'all' || divisionFilter !== 'all';

  const tabItems = [
    {
      id: "faculty",
      label: "Faculty",
      content: (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Faculty Directory</h2>
              <Badge variant="secondary">{filteredTeachers.length}</Badge>
            </div>
            <Button onClick={() => openModal('faculty')} className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" /> Add Faculty
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher, i) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card border rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <UserAvatar name={teacher.name} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Briefcase className="mr-2 h-4 w-4" /> Assign Subjects
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <h3 className="font-bold text-foreground">{teacher.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail size={12} /> {teacher.email}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">{teacher.role}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {teacher.subjects} Subjects
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredTeachers.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-foreground">
                No faculty found matching the search.
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "students",
      label: "Students",
      content: (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Student Directory</h2>
              <Badge variant="secondary">{filteredStudents.length}</Badge>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2", hasActiveFilters && "bg-muted text-foreground border-primary/50")}>
                    <Filter className="h-4 w-4" />
                    Filter
                    {hasActiveFilters && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filter Students</h4>
                      <p className="text-sm text-muted-foreground">Filter directory by batch and division.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Batch</label>
                      <Select value={batchFilter} onValueChange={setBatchFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Batches</SelectItem>
                          <SelectItem value="A">Batch A</SelectItem>
                          <SelectItem value="B">Batch B</SelectItem>
                          <SelectItem value="C">Batch C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Division</label>
                      <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Divisions</SelectItem>
                          <SelectItem value="A">Division A</SelectItem>
                          <SelectItem value="B">Division B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        className="w-full justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setBatchFilter('all');
                          setDivisionFilter('all');
                        }}
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={() => openModal('student')} className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Student Profile</th>
                    <th className="px-6 py-4">Enrolment ID</th>
                    <th className="px-6 py-4">Batch / Div</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={student.name} size="sm" />
                          <div>
                            <div className="font-bold text-foreground">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {student.enrollmentNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {student.batch && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "border opacity-90",
                                student.batch === 'A' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
                                student.batch === 'B' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
                                student.batch === 'C' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
                              )}
                            >
                              Batch {student.batch}
                            </Badge>
                          )}
                          {student.division && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "border opacity-90",
                                student.division === 'A' && "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800",
                                student.division === 'B' && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
                              )}
                            >
                              Div {student.division}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground">Year {student.year}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <div className="bg-muted p-4 rounded-full mb-3">
                          <Search className="h-6 w-6 opacity-40" />
                        </div>
                        <p className="font-medium">No students found.</p>
                        <p className="text-xs opacity-70 max-w-[200px] mt-1">Try adjusting your filters or search query.</p>
                        {hasActiveFilters && (
                          <Button variant="link" size="sm" onClick={() => { setBatchFilter('all'); setDivisionFilter('all'); setSearchQuery(''); }}>
                            Clear all filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "admins",
      label: "Admins",
      content: (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Administrators</h2>
              <Badge variant="secondary">2</Badge>
            </div>
            <Button onClick={() => openModal('admin')} className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" /> Add Admin
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div className="bg-card border rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar name="Admin User" />
                <div>
                  <h3 className="font-bold">Current Admin</h3>
                  <p className="text-sm text-muted-foreground">admin@college.edu</p>
                </div>
              </div>
              <Badge>Super Admin</Badge>
            </motion.div>
            {/* Add more admin cards/list here */}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Personnel Management</h1>
          <p className="text-muted-foreground mt-1">Manage system access, roles, and faculty directory.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search personnel..."
              className="pl-9 bg-background focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Content Items */}
      <NativeTabs
        items={tabItems}
        defaultValue="faculty"
        className="w-full max-w-none"
      />

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
      />
    </div>
  );
}