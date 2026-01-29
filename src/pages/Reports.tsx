import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  mockSubjects, 
  mockAssignments, 
  mockSubmissions, 
  mockStudents 
} from '@/data/mockData';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();

  if (!user || user.role === 'student') return null;

  // Calculate statistics
  const subjectStats = mockSubjects.map(subject => {
    const assignments = mockAssignments.filter(a => a.subjectId === subject.id);
    const submissions = mockSubmissions.filter(s => 
      assignments.some(a => a.id === s.assignmentId)
    );
    
    const totalPossibleSubmissions = assignments.length * mockStudents.length;
    const actualSubmissions = submissions.filter(s => s.status !== 'draft').length;
    const evaluated = submissions.filter(s => s.status === 'evaluated').length;
    const avgScore = submissions
      .filter(s => s.marks !== undefined)
      .reduce((acc, s) => acc + (s.marks || 0), 0) / (evaluated || 1);
    const plagiarismCases = submissions.filter(s => (s.plagiarismScore || 0) > 30).length;
    
    return {
      subject,
      assignments: assignments.length,
      submissionRate: totalPossibleSubmissions > 0 
        ? Math.round((actualSubmissions / totalPossibleSubmissions) * 100) 
        : 0,
      evaluationRate: actualSubmissions > 0 
        ? Math.round((evaluated / actualSubmissions) * 100) 
        : 0,
      avgScore: Math.round(avgScore),
      plagiarismCases,
    };
  });

  // Overall stats
  const totalSubmissions = mockSubmissions.filter(s => s.status !== 'draft').length;
  const totalEvaluated = mockSubmissions.filter(s => s.status === 'evaluated').length;
  const totalPlagiarism = mockSubmissions.filter(s => (s.plagiarismScore || 0) > 30).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">Department-wide statistics and reports</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-semibold">{mockSubjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-semibold">{totalSubmissions}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Evaluated</p>
                <p className="text-2xl font-semibold">{totalEvaluated}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plagiarism Cases</p>
                <p className="text-2xl font-semibold text-destructive">{totalPlagiarism}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subject-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Code</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Assignments</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Submission Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Evaluation Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg. Score</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Plagiarism</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map(({ subject, assignments, submissionRate, evaluationRate, avgScore, plagiarismCases }) => (
                  <tr key={subject.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{subject.name}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{subject.code}</td>
                    <td className="py-3 px-4 text-center text-sm">{assignments}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={submissionRate >= 80 ? 'default' : submissionRate >= 50 ? 'secondary' : 'destructive'}
                        className={submissionRate >= 80 ? 'bg-success/10 text-success' : ''}
                      >
                        {submissionRate}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="secondary"
                        className={evaluationRate >= 80 ? 'bg-success/10 text-success' : ''}
                      >
                        {evaluationRate}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium">{avgScore}%</span>
                        {avgScore >= 70 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-success" />
                        ) : avgScore < 50 ? (
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {plagiarismCases > 0 ? (
                        <Badge variant="destructive">{plagiarismCases}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
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
