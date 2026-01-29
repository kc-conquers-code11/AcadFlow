import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BookOpen,
  Users,
  TrendingUp
} from 'lucide-react';
import { mockSubjects, mockAssignments, mockSubmissions } from '@/data/mockData';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Calculate stats based on role
  const pendingAssignments = mockAssignments.filter(a => {
    const deadline = new Date(a.deadline);
    return deadline > new Date();
  }).length;

  const submittedCount = mockSubmissions.filter(s => s.status === 'submitted').length;
  const evaluatedCount = mockSubmissions.filter(s => s.status === 'evaluated').length;
  const draftCount = mockSubmissions.filter(s => s.status === 'draft').length;

  const renderStudentDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Assignments"
          value={pendingAssignments}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Submitted"
          value={submittedCount}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Evaluated"
          value={evaluatedCount}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Drafts"
          value={draftCount}
          icon={AlertCircle}
          variant="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAssignments
                .filter(a => new Date(a.deadline) > new Date())
                .slice(0, 5)
                .map(assignment => {
                  const subject = mockSubjects.find(s => s.id === assignment.subjectId);
                  const deadline = new Date(assignment.deadline);
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">{subject?.code}</p>
                      </div>
                      <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSubmissions.slice(0, 5).map(submission => {
                const assignment = mockAssignments.find(a => a.id === submission.assignmentId);
                
                return (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{assignment?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.lastSavedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={submission.status} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderTeacherDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Assigned Subjects"
          value={mockSubjects.length}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Total Assignments"
          value={mockAssignments.length}
          icon={FileText}
          variant="muted"
        />
        <StatCard
          title="Pending Evaluation"
          value={submittedCount}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Evaluated"
          value={evaluatedCount}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submissions Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSubmissions
                .filter(s => s.status === 'submitted')
                .slice(0, 5)
                .map(submission => {
                  const assignment = mockAssignments.find(a => a.id === submission.assignmentId);
                  
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{assignment?.title}</p>
                        <p className="text-xs text-muted-foreground">Student ID: {submission.studentId}</p>
                      </div>
                      {submission.plagiarismScore !== undefined && (
                        <Badge variant={submission.plagiarismScore > 30 ? 'destructive' : 'secondary'}>
                          {submission.plagiarismScore}% match
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSubjects.slice(0, 5).map(subject => (
                <div key={subject.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium text-sm">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">{subject.code}</p>
                  </div>
                  <Badge variant="outline">Year {subject.year}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderHodDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Subjects"
          value={mockSubjects.length}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Total Students"
          value={45}
          icon={Users}
          variant="muted"
        />
        <StatCard
          title="Submission Rate"
          value="78%"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Plagiarism Cases"
          value={3}
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Assignments Created</span>
                <span className="font-semibold">{mockAssignments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Submissions</span>
                <span className="font-semibold">{mockSubmissions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Evaluations</span>
                <span className="font-semibold">{submittedCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="font-semibold">72%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plagiarism Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSubmissions
                .filter(s => s.plagiarismScore && s.plagiarismScore > 20)
                .slice(0, 5)
                .map(submission => {
                  const assignment = mockAssignments.find(a => a.id === submission.assignmentId);
                  
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{assignment?.title}</p>
                        <p className="text-xs text-muted-foreground">Student: {submission.studentId}</p>
                      </div>
                      <Badge variant="destructive">
                        {submission.plagiarismScore}% match
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name}</p>
      </div>

      {user.role === 'student' && renderStudentDashboard()}
      {user.role === 'teacher' && renderTeacherDashboard()}
      {user.role === 'hod' && renderHodDashboard()}
    </div>
  );
}

// Helper components
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'success' | 'warning' | 'muted';
}

function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  const variantStyles = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    muted: 'text-muted-foreground',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${variantStyles[variant]}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-primary/10 text-primary',
    evaluated: 'bg-success/10 text-success',
  };

  return (
    <Badge className={styles[status as keyof typeof styles] || styles.draft}>
      {status}
    </Badge>
  );
}
