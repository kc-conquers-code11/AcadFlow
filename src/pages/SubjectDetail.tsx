import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getSubjectById, 
  getAssignmentsBySubject, 
  getSubmissionByAssignmentAndStudent 
} from '@/data/mockData';
import { ArrowLeft, FileText, Code, Calendar, Award } from 'lucide-react';

export default function SubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();

  if (!user || !subjectId) return null;

  const subject = getSubjectById(subjectId);
  const assignments = getAssignmentsBySubject(subjectId);

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Subject not found</p>
        <Button variant="link" asChild>
          <Link to="/subjects">Back to Subjects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/subjects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{subject.name}</h1>
            <p className="text-muted-foreground">{subject.code} • Year {subject.year} • Semester {subject.semester}</p>
          </div>
          {subject.hasCodeEditor && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              Code Editor Enabled
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Assignments & Practicals</h2>
        
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No assignments yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assignments.map(assignment => {
              const submission = user.role === 'student' 
                ? getSubmissionByAssignmentAndStudent(assignment.id, user.id)
                : undefined;
              
              const deadline = new Date(assignment.deadline);
              const isOverdue = deadline < new Date() && !submission?.submittedAt;
              const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <Card key={assignment.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {assignment.type === 'practical' ? (
                          <div className="p-2 bg-primary/10 rounded">
                            <Code className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="p-2 bg-muted rounded">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{assignment.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {assignment.type === 'practical' ? 'Practical' : 'Assignment'} • Max: {assignment.maxMarks} marks
                          </CardDescription>
                        </div>
                      </div>
                      
                      {user.role === 'student' && submission && (
                        <SubmissionStatusBadge 
                          status={submission.status} 
                          marks={submission.marks}
                          maxMarks={assignment.maxMarks}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {assignment.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {deadline.toLocaleDateString()}
                        </span>
                        {!isOverdue && daysLeft > 0 && (
                          <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'}>
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                          </Badge>
                        )}
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                      
                      {user.role === 'student' && (
                        <Button size="sm" asChild>
                          <Link to={`/editor/${assignment.id}`}>
                            {submission ? 'Continue' : 'Start'}
                          </Link>
                        </Button>
                      )}
                      
                      {(user.role === 'teacher' || user.role === 'hod') && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/submissions/${assignment.id}`}>
                            View Submissions
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface SubmissionStatusBadgeProps {
  status: string;
  marks?: number;
  maxMarks: number;
}

function SubmissionStatusBadge({ status, marks, maxMarks }: SubmissionStatusBadgeProps) {
  if (status === 'evaluated' && marks !== undefined) {
    return (
      <Badge className="bg-success/10 text-success flex items-center gap-1">
        <Award className="h-3 w-3" />
        {marks}/{maxMarks}
      </Badge>
    );
  }
  
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
