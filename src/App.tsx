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
            
            {/* Protected routes with layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout><Dashboard /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/subjects" element={
              <ProtectedRoute>
                <MainLayout><Subjects /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/subjects/:subjectId" element={
              <ProtectedRoute>
                <MainLayout><SubjectDetail /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/assignments" element={
              <ProtectedRoute>
                <MainLayout><Assignments /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/editor/:assignmentId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout><EditorPage /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/submissions" element={
              <ProtectedRoute allowedRoles={['teacher', 'hod']}>
                <MainLayout><Submissions /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/submissions/:assignmentId" element={
              <ProtectedRoute allowedRoles={['teacher', 'hod']}>
                <MainLayout><SubmissionList /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/evaluate/:submissionId" element={
              <ProtectedRoute allowedRoles={['teacher', 'hod']}>
                <MainLayout><EvaluatePage /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['teacher', 'hod']}>
                <MainLayout><Reports /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['hod']}>
                <MainLayout><UsersPage /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <MainLayout><Settings /></MainLayout>
              </ProtectedRoute>
            } />
            
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
