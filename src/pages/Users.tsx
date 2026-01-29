import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockStudents } from '@/data/mockData';
import { Users, UserPlus, MoreVertical } from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'hod') return null;

  // Mock data for users
  const teachers = [
    { id: 'teacher-1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@college.edu', subjects: 3 },
    { id: 'teacher-2', name: 'Prof. Robert Williams', email: 'robert.williams@college.edu', subjects: 2 },
    { id: 'teacher-3', name: 'Dr. Emily Davis', email: 'emily.davis@college.edu', subjects: 2 },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground">Manage department users and access</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{mockStudents.length}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{teachers.length}</p>
                <p className="text-sm text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">1</p>
                <p className="text-sm text-muted-foreground">HoD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Faculty Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teachers.map(teacher => (
              <div key={teacher.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{teacher.subjects} subjects</Badge>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Enrollment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Year</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map(student => (
                  <tr key={student.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 font-medium text-sm">{student.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{student.email}</td>
                    <td className="py-3 px-4 text-sm">{student.enrollmentNumber}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">Year {student.year}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
