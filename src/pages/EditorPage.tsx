import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { 
  getAssignmentById, 
  getSubjectById, 
  getSubmissionByAssignmentAndStudent 
} from '@/data/mockData';
import { ArrowLeft, Save, Send, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditorPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const assignment = assignmentId ? getAssignmentById(assignmentId) : undefined;
  const subject = assignment ? getSubjectById(assignment.subjectId) : undefined;
  const existingSubmission = assignment && user 
    ? getSubmissionByAssignmentAndStudent(assignment.id, user.id)
    : undefined;

  useEffect(() => {
    if (existingSubmission) {
      setContent(existingSubmission.content);
      setLastSaved(new Date(existingSubmission.lastSavedAt));
    }
  }, [existingSubmission]);

  // Autosave every 30 seconds
  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    
    setIsSaving(true);
    // Simulate save to localStorage
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const existingIndex = submissions.findIndex(
      (s: any) => s.assignmentId === assignmentId && s.studentId === user?.id
    );
    
    const submissionData = {
      id: existingSubmission?.id || `sub-${Date.now()}`,
      assignmentId,
      studentId: user?.id,
      content,
      status: 'draft',
      lastSavedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      submissions[existingIndex] = { ...submissions[existingIndex], ...submissionData };
    } else {
      submissions.push(submissionData);
    }
    
    localStorage.setItem('submissions', JSON.stringify(submissions));
    setLastSaved(new Date());
    setIsDirty(false);
    setIsSaving(false);
    toast.success('Draft saved');
  }, [content, assignmentId, user?.id, existingSubmission?.id, isDirty]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        handleSave();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [handleSave, isDirty]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await handleSave();
    
    // Update status to submitted
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const existingIndex = submissions.findIndex(
      (s: any) => s.assignmentId === assignmentId && s.studentId === user?.id
    );
    
    if (existingIndex >= 0) {
      submissions[existingIndex].status = 'submitted';
      submissions[existingIndex].submittedAt = new Date().toISOString();
      localStorage.setItem('submissions', JSON.stringify(submissions));
    }
    
    setIsSubmitting(false);
    toast.success('Assignment submitted successfully!');
    navigate('/assignments');
  };

  if (!assignment || !subject || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assignment not found</p>
        <Button variant="link" asChild>
          <Link to="/assignments">Back to Assignments</Link>
        </Button>
      </div>
    );
  }

  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date();
  const isSubmitted = existingSubmission?.status === 'submitted';
  const isEvaluated = existingSubmission?.status === 'evaluated';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/assignments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{assignment.title}</h1>
            <p className="text-muted-foreground">{subject.name} • {subject.code}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isSubmitted && (
              <Badge className="bg-primary/10 text-primary">Submitted</Badge>
            )}
            {isEvaluated && (
              <Badge className="bg-success/10 text-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {existingSubmission.marks}/{assignment.maxMarks}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Instructions</CardTitle>
          <CardDescription>
            Deadline: {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString()}
            {isOverdue && <span className="text-destructive ml-2">• Overdue</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{assignment.description}</p>
          <p className="text-sm text-muted-foreground mt-2">Maximum marks: {assignment.maxMarks}</p>
        </CardContent>
      </Card>

      {/* Feedback (if evaluated) */}
      {isEvaluated && existingSubmission.feedback && (
        <Card className="mb-6 border-success/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-success">Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{existingSubmission.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <div className="mb-6">
        {assignment.type === 'practical' ? (
          <CodeEditor
            content={content}
            onChange={handleContentChange}
            language={assignment.programmingLanguage}
            readOnly={isSubmitted || isEvaluated}
          />
        ) : (
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            editable={!isSubmitted && !isEvaluated}
          />
        )}
      </div>

      {/* Actions */}
      {!isSubmitted && !isEvaluated && (
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleSave} 
            disabled={isSaving || !isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          
          <Button onClick={handleSubmit} disabled={isSubmitting || isOverdue}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      )}
    </div>
  );
}
