import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockSubjects, mockAssignments } from '@/data/mockData';
import { Code, FileText, ChevronRight } from 'lucide-react';

export default function Subjects() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <p className="text-muted-foreground">
          {user.role === 'student' 
            ? 'Your enrolled subjects for this semester' 
            : 'Subjects in the Computer Engineering department'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockSubjects.map(subject => {
          const assignmentCount = mockAssignments.filter(a => a.subjectId === subject.id).length;
          const practicalCount = mockAssignments.filter(
            a => a.subjectId === subject.id && a.type === 'practical'
          ).length;
          
          return (
            <Card key={subject.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{subject.code}</p>
                  </div>
                  {subject.hasCodeEditor && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      Code
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Year {subject.year} • Semester {subject.semester}</span>
                  <span>{assignmentCount} assignments • {practicalCount} practicals</span>
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/subjects/${subject.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Assignments
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
