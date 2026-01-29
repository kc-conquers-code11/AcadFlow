import { Subject, Assignment, Submission, User } from '@/types';

// Mock subjects
export const mockSubjects: Subject[] = [
  {
    id: 'subj-1',
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    department: 'Computer Engineering',
    year: 3,
    semester: 5,
    hasCodeEditor: true,
    teacherId: 'teacher-1',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'subj-2',
    name: 'Database Management Systems',
    code: 'CS302',
    department: 'Computer Engineering',
    year: 3,
    semester: 5,
    hasCodeEditor: true,
    teacherId: 'teacher-1',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'subj-3',
    name: 'Computer Networks',
    code: 'CS303',
    department: 'Computer Engineering',
    year: 3,
    semester: 5,
    hasCodeEditor: false,
    teacherId: 'teacher-2',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'subj-4',
    name: 'Operating Systems',
    code: 'CS304',
    department: 'Computer Engineering',
    year: 3,
    semester: 5,
    hasCodeEditor: true,
    teacherId: 'teacher-1',
    createdAt: '2024-01-15T00:00:00Z',
  },
];

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    subjectId: 'subj-1',
    title: 'Binary Search Tree Implementation',
    description: 'Implement a BST with insert, delete, and search operations. Include traversal methods.',
    type: 'practical',
    deadline: '2024-02-15T23:59:00Z',
    maxMarks: 25,
    programmingLanguage: 'cpp',
    createdAt: '2024-01-20T00:00:00Z',
    createdBy: 'teacher-1',
  },
  {
    id: 'assign-2',
    subjectId: 'subj-1',
    title: 'Analysis of Sorting Algorithms',
    description: 'Write a detailed analysis comparing the time and space complexity of various sorting algorithms.',
    type: 'assignment',
    deadline: '2024-02-20T23:59:00Z',
    maxMarks: 20,
    createdAt: '2024-01-22T00:00:00Z',
    createdBy: 'teacher-1',
  },
  {
    id: 'assign-3',
    subjectId: 'subj-2',
    title: 'SQL Query Optimization',
    description: 'Write SQL queries for the given scenarios and explain optimization techniques used.',
    type: 'practical',
    deadline: '2024-02-18T23:59:00Z',
    maxMarks: 30,
    programmingLanguage: 'sql',
    createdAt: '2024-01-21T00:00:00Z',
    createdBy: 'teacher-1',
  },
  {
    id: 'assign-4',
    subjectId: 'subj-2',
    title: 'ER Diagram Design',
    description: 'Design an ER diagram for a hospital management system. Include all entities and relationships.',
    type: 'assignment',
    deadline: '2024-02-25T23:59:00Z',
    maxMarks: 20,
    createdAt: '2024-01-23T00:00:00Z',
    createdBy: 'teacher-1',
  },
  {
    id: 'assign-5',
    subjectId: 'subj-3',
    title: 'OSI Model Explanation',
    description: 'Provide a detailed explanation of each layer in the OSI model with real-world examples.',
    type: 'assignment',
    deadline: '2024-02-22T23:59:00Z',
    maxMarks: 15,
    createdAt: '2024-01-24T00:00:00Z',
    createdBy: 'teacher-2',
  },
  {
    id: 'assign-6',
    subjectId: 'subj-4',
    title: 'Process Scheduling Simulation',
    description: 'Implement FCFS, SJF, and Round Robin scheduling algorithms.',
    type: 'practical',
    deadline: '2024-02-28T23:59:00Z',
    maxMarks: 30,
    programmingLanguage: 'c',
    createdAt: '2024-01-25T00:00:00Z',
    createdBy: 'teacher-1',
  },
];

// Mock submissions
export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    assignmentId: 'assign-1',
    studentId: 'student-1',
    content: '// BST Implementation\n#include <iostream>\nusing namespace std;\n\nstruct Node {\n    int data;\n    Node* left;\n    Node* right;\n};\n\n// Insert function\nNode* insert(Node* root, int value) {\n    if (root == nullptr) {\n        Node* newNode = new Node();\n        newNode->data = value;\n        newNode->left = newNode->right = nullptr;\n        return newNode;\n    }\n    if (value < root->data) {\n        root->left = insert(root->left, value);\n    } else {\n        root->right = insert(root->right, value);\n    }\n    return root;\n}',
    status: 'submitted',
    submittedAt: '2024-02-10T14:30:00Z',
    lastSavedAt: '2024-02-10T14:30:00Z',
    plagiarismScore: 12,
  },
  {
    id: 'sub-2',
    assignmentId: 'assign-2',
    studentId: 'student-1',
    content: '<h1>Analysis of Sorting Algorithms</h1><p>In this analysis, we compare various sorting algorithms...</p>',
    status: 'evaluated',
    submittedAt: '2024-02-18T10:00:00Z',
    lastSavedAt: '2024-02-18T10:00:00Z',
    marks: 18,
    feedback: 'Excellent analysis. Good use of examples.',
    evaluatedAt: '2024-02-19T15:00:00Z',
    evaluatedBy: 'teacher-1',
  },
  {
    id: 'sub-3',
    assignmentId: 'assign-3',
    studentId: 'student-1',
    content: '-- SQL Query Optimization\nSELECT * FROM employees WHERE department_id = 5;',
    status: 'draft',
    lastSavedAt: '2024-02-12T09:00:00Z',
  },
];

// Mock students for teacher view
export const mockStudents: User[] = [
  {
    id: 'student-1',
    email: 'john.smith@college.edu',
    name: 'John Smith',
    role: 'student',
    department: 'Computer Engineering',
    year: 3,
    enrollmentNumber: 'CE2022001',
    createdAt: '2023-08-01T00:00:00Z',
  },
  {
    id: 'student-2',
    email: 'emily.johnson@college.edu',
    name: 'Emily Johnson',
    role: 'student',
    department: 'Computer Engineering',
    year: 3,
    enrollmentNumber: 'CE2022002',
    createdAt: '2023-08-01T00:00:00Z',
  },
  {
    id: 'student-3',
    email: 'michael.brown@college.edu',
    name: 'Michael Brown',
    role: 'student',
    department: 'Computer Engineering',
    year: 3,
    enrollmentNumber: 'CE2022003',
    createdAt: '2023-08-01T00:00:00Z',
  },
  {
    id: 'student-4',
    email: 'sarah.wilson@college.edu',
    name: 'Sarah Wilson',
    role: 'student',
    department: 'Computer Engineering',
    year: 3,
    enrollmentNumber: 'CE2022004',
    createdAt: '2023-08-01T00:00:00Z',
  },
];

// Helper functions
export function getSubjectById(id: string): Subject | undefined {
  return mockSubjects.find(s => s.id === id);
}

export function getAssignmentById(id: string): Assignment | undefined {
  return mockAssignments.find(a => a.id === id);
}

export function getAssignmentsBySubject(subjectId: string): Assignment[] {
  return mockAssignments.filter(a => a.subjectId === subjectId);
}

export function getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string): Submission | undefined {
  return mockSubmissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
}

export function getSubmissionsByAssignment(assignmentId: string): Submission[] {
  return mockSubmissions.filter(s => s.assignmentId === assignmentId);
}
