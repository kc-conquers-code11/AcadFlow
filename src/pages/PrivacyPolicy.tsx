import { Shield, Lock, Eye, FileText, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-6 border-b pb-6">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <Shield size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm italic">Last updated: February 14, 2026</p>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText size={20} className="text-primary" /> 1. Introduction
          </h2>
          <p>
            Welcome to <strong>AcadFlow</strong>. We are committed to protecting the personal data of our students and faculty members. 
            This Privacy Policy outlines how we collect, handle, and secure your information within our academic ecosystem.
          </p>
        </section>

        <section className="bg-muted/30 p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Eye size={20} className="text-primary" /> 2. Data Collection & Usage
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-2">
              <span className="font-bold text-primary">●</span>
              <span><strong>Profile Information:</strong> We store your Name, Institutional Email, Enrollment Number, Division, and Batch details to provide personalized dashboard access.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">●</span>
              <span><strong>Academic Submissions:</strong> Code snippets, lab reports, Viva scores, and evaluation grades are stored for academic record-keeping and faculty review.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">●</span>
              <span><span><strong>Security Logs:</strong> To ensure academic integrity, we monitor tab-switching activity and clipboard usage during active assessments.</span></span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Lock size={20} className="text-primary" /> 3. Data Security & Storage
          </h2>
          <p>
            Your data is stored on encrypted servers managed by <strong>Supabase</strong>. 
            Access is strictly restricted to authorized institutional faculty and department heads (HODs) for grading and audit purposes.
          </p>
        </section>

        <section className="bg-primary/5 p-6 rounded-xl border border-primary/10">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2 text-primary">
            <Mail size={20} /> 4. Contact & Compliance
          </h2>
          <p className="text-sm">
            If you have questions regarding your data privacy or wish to request data correction, please contact our administrative team at:
          </p>
          <p className="font-mono font-bold mt-2 text-primary underline">privacy@acadflow.com</p>
        </section>
      </div>
    </div>
  );
}