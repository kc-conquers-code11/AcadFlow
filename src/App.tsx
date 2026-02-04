import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import Batches from "./pages/Batches";
import BatchDashboard from "./pages/BatchDashboard";
import Assignments from "./pages/Assignments";
import EditorPage from "./pages/EditorPage";
import Submissions from "./pages/Submissions";
import SubmissionList from "./pages/SubmissionList";
import EvaluatePage from "./pages/EvaluatePage";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Auth Pages
import { ForgotPassword, ResetPassword } from "./pages/index"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/practical/:practicalId" element={<EditorPage />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>

                {/* --- 1. SHARED ROUTES (Student, Teacher, Admin) --- */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />

                {/* --- 2. ACADEMIC SHARED (Student & Teacher) --- */}
                {/* Isko alag nikala taaki permission conflict na ho */}
                <Route element={<ProtectedRoute allowedRoles={['student', 'teacher']} />}>
                  <Route path="/batches" element={<Batches />} />
                  <Route path="/batches/:batchId" element={<BatchDashboard />} /> {/* URL Fixed: uses ID now */}
                  <Route path="/assignments" element={<Assignments />} />
                </Route>

                {/* --- 3. STUDENT ONLY --- */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route path="/subjects" element={<Subjects />} />
                  <Route path="/subjects/:subjectId" element={<SubjectDetail />} />
<Route path="/editor/:practicalId" element={<EditorPage />} />                </Route>

                {/* --- 4. TEACHER ONLY --- */}
                <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
                  <Route path="/submissions" element={<Submissions />} />
                  <Route path="/submissions/:assignmentId" element={<SubmissionList />} />
                  <Route path="/evaluate/:submissionId" element={<EvaluatePage />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

                {/* --- 5. ADMIN ONLY --- */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                   <Route path="/subjects" element={<Subjects />} />
                   <Route path="/users" element={<UsersPage />} />
                </Route>

              </Route>
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;