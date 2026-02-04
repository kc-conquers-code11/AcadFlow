export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'student' | 'teacher' | 'hod';
  department: string | null;
  enrollment_number: string | null;
  year: number | null;
  avatar_url: string | null;
  division: 'A' | 'B' | null;
  batch: 'A' | 'B' | 'C' | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  year: number;
  semester: number;
  has_code_editor: boolean;
}

export interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  deadline: string;
  type: 'theory' | 'practical';
  programming_language: string | null;
  max_marks: number;
  created_by: string;
  target_division: 'A' | 'B' | null;
  target_batch: 'A' | 'B' | 'C' | null;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  status: 'draft' | 'submitted' | 'evaluated';
  submitted_at: string | null;
  last_saved_at: string;
  marks: number | null;
  feedback: string | null;
  plagiarism_score: number;
}

// --- New Types for Dynamic Batches ---

export interface Batch {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_by: string;
  created_at: string;
}

export interface BatchStudent {
  id: string;
  batch_id: string;
  student_id: string;
  joined_at: string;
}