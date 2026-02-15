import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Mail, 
  ArrowLeft, 
  Server, 
  UserCheck, 
  Fingerprint, 
  Building,
  Code2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Reuse the visual pattern from Login for consistency
const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.4]" />
);

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <GridPattern />

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground group"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
          <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground">
            <Shield size={14} /> AcadFlow Legal
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5 mb-4">
            Official Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are committed to transparency. This document outlines how AcadFlow collects, protects, and utilizes academic data.
          </p>
          <p className="text-xs font-mono text-muted-foreground pt-2">
            Last Updated: February 14, 2026
          </p>
        </div>

        <Separator className="my-8" />

        <div className="space-y-12">
          
          {/* Section 1: Intro */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                <FileText size={20} /> 
              </div>
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Welcome to <strong>AcadFlow</strong>. As an academic management platform utilized by the Computer Engineering Department, we adhere to strict institutional data protection standards. This policy applies to all students, faculty, and administrators accessing the portal.
            </p>
          </section>

          {/* Section 2: Data Collection */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                <Eye size={20} /> 
              </div>
              2. Data Collection & Usage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card/50 hover:bg-card transition-colors">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <UserCheck size={18} className="text-primary" /> Profile Data
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We store your Full Name, Institutional Email, Enrollment Number, Division, and Batch to maintain accurate academic records.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 hover:bg-card transition-colors">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Server size={18} className="text-primary" /> Academic Records
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code submissions, lab reports, viva voice marks, and assignment grades are stored securely for grading and auditing.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover:bg-card transition-colors">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Fingerprint size={18} className="text-primary" /> Integrity Logs
                  </div>
                  <p className="text-sm text-muted-foreground">
                    During active assessments, we monitor tab-switching frequency and clipboard actions to ensure academic integrity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 hover:bg-card transition-colors">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Building size={18} className="text-primary" /> Institutional Use
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Data is used strictly for academic purposes by PVPPCOE faculty. We do not sell or share data with third parties.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 3: Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                <Lock size={20} /> 
              </div>
              3. Security Infrastructure
            </h2>
            <div className="bg-muted/30 border border-border rounded-xl p-6">
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored on encrypted database servers compliant with industry standards. 
                Network traffic is protected by <strong>Cloudflare</strong>, providing DDoS protection and SSL encryption (TLS 1.3). 
                Access to the database is restricted to authorized administrative personnel via Role-Based Access Control (RBAC).
              </p>
            </div>
          </section>

          {/* Section 4: Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                <Mail size={20} /> 
              </div>
              4. Contact Support
            </h2>
            <p className="text-muted-foreground">
              For any concerns regarding data privacy, corrections to your profile, or to report a vulnerability, please contact the administration directly.
            </p>
            <div className="mt-4">
              <a 
                href="mailto:vu1f2425053@pvppcoe.ac.in"
                target="_blank"
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail size={16} /> Contact Privacy Team
              </a>
            </div>
          </section>

          <Separator className="my-8" />
{/* Section 5: Developer Credits */}
          <section className="space-y-6 pb-20">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                <Code2 size={20} /> 
              </div>
              5. Engineering Team
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              AcadFlow has been designed and engineered with a focus on academic integrity and modern user experience by:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dev 1 */}
              <a 
                href="https://www.linkedin.com/in/kc-thedev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <div className="h-full p-6 bg-gradient-to-br from-card to-muted border border-border rounded-xl transition-all group-hover:border-primary/50 group-hover:shadow-md relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Developer</p>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      Krishna Choudhary
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">Backend & Security</p>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Fingerprint size={100} />
                  </div>
                </div>
              </a>

              {/* Dev 2 - Replace details here */}
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <div className="h-full p-6 bg-gradient-to-br from-card to-muted border border-border rounded-xl transition-all group-hover:border-primary/50 group-hover:shadow-md relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1"> Developer</p>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      Aayush Shinde
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">UI/UX</p>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Fingerprint size={100} />
                  </div>
                </div>
              </a>
            </div>

            <div className="p-4 bg-muted/30 border border-dashed border-border rounded-lg text-center">
              <p className="text-xs text-muted-foreground italic">"Engineering tools that empower education."</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}