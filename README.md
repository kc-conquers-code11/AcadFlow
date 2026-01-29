# AcadFlow  
### Unified Paperless Academic Assignment & Practical Management Platform

AcadFlow is a **department-level academic workflow system** designed to eliminate paper-based assignments and practical records by providing a **secure, centralized, and structured digital platform** for students, faculty, and administrators.

The platform focuses on **academic seriousness, usability, and long-term record integrity**, avoiding flashy UI trends and unnecessary AI abstractions.

---

## 🎯 Vision

To create a **paperless, low-friction, and audit-ready academic ecosystem** that:
- Reduces student stress caused by handwriting and rewriting
- Minimizes faculty workload in evaluation and record keeping
- Eliminates paper wastage
- Prevents plagiarism through smart similarity detection
- Maintains permanent, structured academic records

---

## 🧩 Core Features (Plan on Paper )

### 👨‍🎓 Student Module
- Secure login and role-based access
- Subject-wise dashboard
- View assignments and experiment titles
- In-browser **rich document editor** (Docs-like)
- In-browser **code editor** for selected subjects
- Autosave and controlled submission
- View plagiarism percentage (own submission)
- Access marks and feedback after evaluation
- More features as per requirements

---

### 👨‍🏫 Teacher Module
- Subject-wise submission dashboard
- Open and evaluate student work inside the editor
- Inline comments for documents and code
- View plagiarism reports:
  - Similarity percentage
  - Matched submissions
- Marks entry and feedback storage
- Submission and evaluation statistics

---

### 🧑‍💼 HoD / Admin Module
- Read-only access to all subjects and submissions
- Department-wide reports:
  - Submission completion
  - Plagiarism trends
  - Evaluation status
- User, subject, and semester management
- Centralized academic oversight

---

## ✍️ Editors

### Rich Text Editor (Assignments)
- Headings, lists, tables
- Images and code blocks
- Clean academic formatting
- Autosave support

**Implementation:** Will progress as the project levels up

---

### Code Editor (Practicals)
- Syntax highlighting
- Language selection per subject
- Line numbers and readable formatting

**Implementation:** Monaco Editor (VS Code engine)

---

## 🧠 Plagiarism Detection (Phase-1)

### Text Assignments
- Token-based similarity comparison
- Subject and assignment-level scope

### Code Practicals
- Whitespace and comment normalization
- Structural similarity detection
- Experiment-level comparison

Plagiarism checks are executed using **Supabase Edge Functions**, with results stored for faculty review.

---

## 🏗 Tech Stack

### Frontend
- React (Vite / Next.js)
- TypeScript
- Minimal SaaS UI (academic-first design)

### Backend
- Supabase
  - Authentication
  - PostgreSQL database
  - Row Level Security (RLS)
  - Edge Functions
  - Storage (exports, attachments)

---

## 🗄 Database Overview

Key entities:
- Users & profiles (roles: student, teacher, HoD)
- Subjects and semesters
- Assignments and practical experiments
- Submissions
- Plagiarism reports
- Evaluations and feedback

All access is governed using **Row Level Security**:
- Students → own submissions only
- Teachers → assigned subjects
- HoD → full department visibility

---

## 🔐 Security & Compliance
- Role-based access control
- Secure authentication
- Audit-friendly data structure
- Permanent academic record preservation
- No third-party data sharing

---

## 🧭 UI / UX Principles
- Minimal, flat, SaaS-style interface
- Academic and institutional tone
- High readability and clarity
- Desktop-first (lab and office usage)
- No glassmorphism, AI visuals, or gimmicks

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-org/acadflow.git
cd acadflow
