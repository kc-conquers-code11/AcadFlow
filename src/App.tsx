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
import { ForgotPassword, ResetPassword } from "./pages/index";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* --- PROTECTED ROUTES --- */}
            <Route element={<ProtectedRoute />}>
              
              {/* A. FULLSCREEN ROUTES (No Sidebar/Header) */}
              <Route path="/practical/:practicalId" element={<EditorPage />} />
              <Route path="/editor/:practicalId" element={<EditorPage />} />
              <Route path="/evaluate/:submissionId" element={<EvaluatePage />} />

              {/* B. MAIN LAYOUT ROUTES (With Sidebar & Navbar) */}
              <Route element={<MainLayout />}>
                
                {/* 1. Global Shared */}
                {/* Dashboard logic handle karega ki kise kahan bhejna hai */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* 2. Admin Exclusive Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                {/* 3. Academic Shared (Student + Teacher + HOD + Admin) */}
                <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'hod', 'admin']} />}>
                  <Route path="/batches" element={<Batches />} />
                  <Route path="/batches/:batchId" element={<BatchDashboard />} />
                  <Route path="/assignments" element={<Assignments />} />
                </Route>

                {/* 4. Student Only */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route path="/subjects" element={<Subjects />} />
                  <Route path="/subjects/:subjectId" element={<SubjectDetail />} />
                </Route>

                {/* 5. Teacher & Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['teacher', 'hod', 'admin']} />}>
                  <Route path="/submissions" element={<Submissions />} />
                  <Route path="/submissions/:assignmentId" element={<SubmissionList />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

              </Route>
            </Route>

            {/* --- FALLBACKS --- */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;