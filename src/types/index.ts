// User roles
export type UserRole = 'student' | 'teacher' | 'admin';

// User profile
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  year?: number; // Only for students
  enrollmentNumber?: string; // Only for students
  batch?: string; // Only for students
  division?: string; // Only for students
  createdAt: string;
}

// Subject
export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  year: number;
  semester: number;
  hasCodeEditor: boolean; // Whether this subject uses code editor for practicals
  teacherId: string;
  createdAt: string;
}

// Assignment types
export type AssignmentType = 'assignment' | 'practical';

// Assignment / Experiment
export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  type: AssignmentType;
  deadline: string;
  maxMarks: number;
  programmingLanguage?: string; // For practicals
  createdAt: string;
  createdBy: string;
}

// Submission status
export type SubmissionStatus = 'draft' | 'submitted' | 'evaluated';

// Student submission
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string; // Rich text or code
  status: SubmissionStatus;
  submittedAt?: string;
  lastSavedAt: string;
  plagiarismScore?: number;
  marks?: number;
  feedback?: string;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

// Plagiarism report
export interface PlagiarismReport {
  id: string;
  submissionId: string;
  similarityPercentage: number;
  matchedSubmissions: {
    submissionId: string;
    studentName: string;
    matchPercentage: number;
  }[];
  generatedAt: string;
}

// Evaluation
export interface Evaluation {
  id: string;
  submissionId: string;
  teacherId: string;
  marks: number;
  feedback: string;
  inlineComments: {
    position: number;
    text: string;
  }[];
  evaluatedAt: string;
}

// Dashboard stats
export interface DashboardStats {
  totalAssignments: number;
  pendingSubmissions: number;
  completedSubmissions: number;
  averageScore?: number;
}

// For teacher/HoD reports
export interface SubjectReport {
  subjectId: string;
  subjectName: string;
  totalStudents: number;
  submissionRate: number;
  averageScore: number;
  plagiarismCases: number;
}
