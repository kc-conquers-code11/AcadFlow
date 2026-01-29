import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getAssignmentById,
  getSubjectById,
  mockSubmissions,
  mockStudents
} from '@/data/mockData';
import { ArrowLeft, Eye, AlertTriangle } from 'lucide-react';

export default function SubmissionList() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();

  if (!user || !assignmentId) return null;

  const assignment = getAssignmentById(assignmentId);
  const subject = assignment ? getSubjectById(assignment.subjectId) : undefined;
  const submissions = mockSubmissions.filter(s => s.assignmentId === assignmentId);

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assignment not found</p>
        <Button variant="link" asChild>
          <Link to="/submissions">Back to Submissions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/submissions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Link>
        </Button>
        
        <h1 className="text-2xl font-semibold">{assignment.title}</h1>
        <p className="text-muted-foreground">{subject?.name} • {subject?.code}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-2xl font-semibold">{mockStudents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="text-2xl font-semibold">
              {submissions.filter(s => s.status !== 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-semibold text-primary">
              {submissions.filter(s => s.status === 'submitted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Evaluated</p>
            <p className="text-2xl font-semibold text-success">
              {submissions.filter(s => s.status === 'evaluated').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Enrollment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plagiarism</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Marks</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map(student => {
                  const submission = submissions.find(s => s.studentId === student.id);
                  
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">{student.enrollmentNumber}</td>
                      <td className="py-3 px-4">
                        {submission ? (
                          <StatusBadge status={submission.status} />
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not started</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {submission?.plagiarismScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            {submission.plagiarismScore > 30 && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={submission.plagiarismScore > 30 ? 'text-destructive font-medium' : ''}>
                              {submission.plagiarismScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {submission?.marks !== undefined ? (
                          <span className="font-medium">{submission.marks}/{assignment.maxMarks}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {submission && submission.status !== 'draft' && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/evaluate/${submission.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
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
