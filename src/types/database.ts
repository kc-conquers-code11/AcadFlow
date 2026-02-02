export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'student' | 'teacher' | 'hod';
  department: string | null;
  enrollment_number: string | null;
  year: number | null;
  avatar_url: string | null;
  // New Fields for Student Identification
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
  // New Fields for Targeting
  target_division: 'A' | 'B' | null; // If null, applies to all divisions
  target_batch: 'A' | 'B' | 'C' | null; // If null, applies to whole class
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