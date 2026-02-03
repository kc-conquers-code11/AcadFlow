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
  Filter
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockStudents } from '@/data/mockData';
import { cn } from '@/lib/utils';

// --- Visual Components ---

const StatCard = ({ title, value, label, icon: Icon, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between"
  >
    <div>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {label && <p className="text-xs text-slate-400 mt-1">{label}</p>}
    </div>
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon size={20} />
    </div>
  </motion.div>
);

const UserAvatar = ({ name, src, size = "md" }: { name: string, src?: string, size?: "sm" | "md" }) => (
  <Avatar className={cn(
    "border-2 border-white shadow-sm",
    size === "sm" ? "h-8 w-8" : "h-10 w-10"
  )}>
    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} />
    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
      {name.charAt(0)}
    </AvatarFallback>
  </Avatar>
);

export default function UsersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user || user.role !== 'admin') return null;

  // Mock data for teachers (expanded for UI demo)
  const teachers = [
    { id: 't1', name: 'Dr. Sarah Johnson', email: 'sarah.j@college.edu', role: 'Professor', subjects: 3, status: 'Active' },
    { id: 't2', name: 'Prof. Robert Williams', email: 'r.williams@college.edu', role: 'Assistant Prof', subjects: 2, status: 'Active' },
    { id: 't3', name: 'Dr. Emily Davis', email: 'emily.d@college.edu', role: 'Lecturer', subjects: 4, status: 'On Leave' },
  ];

  // Filter Logic
  const filteredStudents = mockStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrollmentNumber.includes(searchQuery)
  );

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10">

      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Personnel</h1>
          <p className="text-slate-500 mt-1">Manage access, roles, and user directory.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search by name or ID..."
              className="pl-9 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
            <UserPlus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Students"
          value={mockStudents.length}
          label="Across 4 Years"
          icon={GraduationCap}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Faculty Members"
          value={teachers.length}
          label="Active Staff"
          icon={Briefcase}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Administrators"
          value="2"
          label="System Access"
          icon={Shield}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* 3. Main Content Tabs */}
      <Tabs defaultValue="faculty" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="faculty" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
              Faculty
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
              Students
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500">
              Admins
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200 text-slate-600">
            <Filter className="h-3.5 w-3.5 mr-2" /> Filter List
          </Button>
        </div>

        {/* Tab: Faculty */}
        <TabsContent value="faculty" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher, i) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <UserAvatar name={teacher.name} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                      <DropdownMenuItem>Assign Subjects</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">{teacher.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail size={12} /> {teacher.email}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">{teacher.role}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                      {teacher.subjects} Subjects
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Students */}
        <TabsContent value="students">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Student Profile</th>
                    <th className="px-6 py-4">Enrollment ID</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={student.name} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {student.enrollmentNumber}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600">
                          Year {student.year}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <MoreVertical size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}