import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockAssignments, mockSubjects, mockSubmissions } from '@/data/mockData';
import { FileText, Code, Calendar, ChevronRight } from 'lucide-react';

export default function Assignments() {
  const { user } = useAuth();

  if (!user) return null;

  // Group assignments by subject
  const assignmentsBySubject = mockSubjects.map(subject => ({
    subject,
    assignments: mockAssignments.filter(a => a.subjectId === subject.id),
  })).filter(group => group.assignments.length > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="text-muted-foreground">
          {user.role === 'student' 
            ? 'All your assignments and practicals' 
            : 'All assignments across subjects'}
        </p>
      </div>

      <div className="space-y-8">
        {assignmentsBySubject.map(({ subject, assignments }) => (
          <div key={subject.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">{subject.name}</h2>
              <Badge variant="outline">{subject.code}</Badge>
            </div>
            
            <div className="grid gap-3">
              {assignments.map(assignment => {
                const submission = user.role === 'student'
                  ? mockSubmissions.find(s => s.assignmentId === assignment.id && s.studentId === user.id)
                  : undefined;
                
                const deadline = new Date(assignment.deadline);
                const isOverdue = deadline < new Date();
                const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded ${assignment.type === 'practical' ? 'bg-primary/10' : 'bg-muted'}`}>
                          {assignment.type === 'practical' ? (
                            <Code className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {deadline.toLocaleDateString()}
                            {!isOverdue && daysLeft > 0 && daysLeft <= 7 && (
                              <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'} className="ml-2">
                                {daysLeft}d left
                              </Badge>
                            )}
                            {isOverdue && !submission?.submittedAt && (
                              <Badge variant="destructive" className="ml-2">Overdue</Badge>
                            )}
                          </p>
                        </div>
                        
                        {user.role === 'student' && submission && (
                          <StatusBadge status={submission.status} marks={submission.marks} />
                        )}
                        
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={user.role === 'student' ? `/editor/${assignment.id}` : `/submissions/${assignment.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, marks }: { status: string; marks?: number }) {
  if (status === 'evaluated' && marks !== undefined) {
    return <Badge className="bg-success/10 text-success">{marks} marks</Badge>;
  }
  
  const styles = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-primary/10 text-primary',
  };

  return (
    <Badge className={styles[status as keyof typeof styles] || styles.draft}>
      {status}
    </Badge>
  );
}
