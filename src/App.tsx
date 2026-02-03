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
import Assignments from "./pages/Assignments";
import EditorPage from "./pages/EditorPage";
import Submissions from "./pages/Submissions";
import SubmissionList from "./pages/SubmissionList";
import EvaluatePage from "./pages/EvaluatePage";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
            
            {/* Protected Routes Structure */}
            {/* 1. Check Auth */}
            <Route element={<ProtectedRoute />}>
              
              {/* 2. Apply Layout (Persistent Sidebar) */}
              <Route element={<MainLayout />}>
                
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/subjects/:subjectId" element={<SubjectDetail />} />
                <Route path="/assignments" element={<Assignments />} />
                
                {/* Student Only */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                   <Route path="/editor/:assignmentId" element={<EditorPage />} />
                </Route>

                {/* Teachers Only */}
                <Route element={<ProtectedRoute allowedRoles={['teacher', 'hod']} />}>
                  <Route path="/submissions" element={<Submissions />} />
                  <Route path="/submissions/:assignmentId" element={<SubmissionList />} />
                  <Route path="/evaluate/:submissionId" element={<EvaluatePage />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

                {/* HOD Only */}
                <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                <Route path="/settings" element={<Settings />} />

              </Route> {/* End Layout */}
            </Route> {/* End Auth Protection */}
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;