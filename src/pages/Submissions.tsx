import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  mockSubmissions, 
  mockAssignments, 
  mockSubjects, 
  mockStudents 
} from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Eye, FileText, Code } from 'lucide-react';

export default function Submissions() {
  const { user } = useAuth();

  if (!user || user.role === 'student') return null;

  // Group submissions by assignment
  const submissionsByAssignment = mockAssignments.map(assignment => {
    const subject = mockSubjects.find(s => s.id === assignment.subjectId);
    const submissions = mockSubmissions.filter(s => s.assignmentId === assignment.id);
    
    return {
      assignment,
      subject,
      submissions,
      stats: {
        total: mockStudents.length,
        submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'evaluated').length,
        evaluated: submissions.filter(s => s.status === 'evaluated').length,
        pendingReview: submissions.filter(s => s.status === 'submitted').length,
      },
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Submissions</h1>
        <p className="text-muted-foreground">Review and evaluate student submissions</p>
      </div>

      <div className="space-y-4">
        {submissionsByAssignment.map(({ assignment, subject, stats }) => (
          <Card key={assignment.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${assignment.type === 'practical' ? 'bg-primary/10' : 'bg-muted'}`}>
                    {assignment.type === 'practical' ? (
                      <Code className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{subject?.name} • {subject?.code}</p>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/submissions/${assignment.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Submitted:</span>
                  <Badge variant="secondary">{stats.submitted}/{stats.total}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Pending Review:</span>
                  <Badge variant={stats.pendingReview > 0 ? 'default' : 'secondary'}>
                    {stats.pendingReview}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Evaluated:</span>
                  <Badge className="bg-success/10 text-success">{stats.evaluated}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
