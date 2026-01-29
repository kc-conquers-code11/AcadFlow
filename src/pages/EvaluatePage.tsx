import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { 
  mockSubmissions, 
  mockAssignments, 
  mockSubjects,
  mockStudents 
} from '@/data/mockData';
import { ArrowLeft, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EvaluatePage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const submission = mockSubmissions.find(s => s.id === submissionId);
  const assignment = submission ? mockAssignments.find(a => a.id === submission.assignmentId) : undefined;
  const subject = assignment ? mockSubjects.find(s => s.id === assignment.subjectId) : undefined;
  const student = submission ? mockStudents.find(s => s.id === submission.studentId) : undefined;
  
  const [marks, setMarks] = useState(submission?.marks?.toString() || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user || user.role === 'student' || !submission || !assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Submission not found</p>
        <Button variant="link" asChild>
          <Link to="/submissions">Back to Submissions</Link>
        </Button>
      </div>
    );
  }

  const handleSaveEvaluation = async () => {
    if (!marks || parseInt(marks) > assignment.maxMarks) {
      toast.error('Please enter valid marks');
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would save to the database
    toast.success('Evaluation saved successfully');
    setIsSaving(false);
    navigate(`/submissions/${assignment.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to={`/submissions/${assignment.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{assignment.title}</h1>
            <p className="text-muted-foreground">{subject?.name} • {subject?.code}</p>
          </div>
          
          {submission.status === 'evaluated' && (
            <Badge className="bg-success/10 text-success flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Evaluated
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Content */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Student Submission</CardTitle>
              <CardDescription>
                Submitted by {student?.name} ({student?.enrollmentNumber})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignment.type === 'practical' ? (
                <CodeEditor
                  content={submission.content}
                  onChange={() => {}}
                  language={assignment.programmingLanguage}
                  readOnly
                />
              ) : (
                <RichTextEditor
                  content={submission.content}
                  onChange={() => {}}
                  editable={false}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evaluation Panel */}
        <div className="space-y-4">
          {/* Plagiarism Report */}
          {submission.plagiarismScore !== undefined && (
            <Card className={submission.plagiarismScore > 30 ? 'border-destructive/50' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {submission.plagiarismScore > 30 && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  Plagiarism Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className={`text-4xl font-bold ${submission.plagiarismScore > 30 ? 'text-destructive' : submission.plagiarismScore > 15 ? 'text-warning' : 'text-success'}`}>
                    {submission.plagiarismScore}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Similarity Score</p>
                </div>
                {submission.plagiarismScore > 15 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Matched with other submissions in this assignment
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Marks & Feedback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="marks">Marks (out of {assignment.maxMarks})</Label>
                <Input
                  id="marks"
                  type="number"
                  min="0"
                  max={assignment.maxMarks}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  className="mt-1"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSaveEvaluation}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Evaluation'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
