import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Microscope, 
  User, 
  Mail, 
  Lock, 
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Visual Components ---

const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
);

const FloatingBadge = ({ icon: Icon, label, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm text-xs font-medium text-slate-600"
  >
    <Icon size={14} className="text-blue-600" />
    {label}
  </motion.div>
);

const CleanInput = ({ label, ...props }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="group relative">
      <label className={cn(
        "absolute left-3 transition-all duration-200 pointer-events-none text-slate-500 bg-white px-1 z-10",
        focused || props.value ? "-top-2.5 text-xs text-blue-600 font-semibold" : "top-3 text-sm"
      )}>
        {label}
      </label>
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={(e) => setFocused(e.target.value !== '')}
        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm group-hover:border-slate-300 placeholder:text-transparent"
      />
    </div>
  );
};

export default function Login() {
  // Logic State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  
  // New States for Division & Batch
  const [division, setDivision] = useState<'A' | 'B'>('A');
  const [batch, setBatch] = useState<'A' | 'B' | 'C'>('A');

  const [isLoading, setIsLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Real Login
        const { error } = await login(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
        navigate('/dashboard');
      } else {
        // Real Signup
        if (!name.trim()) throw new Error("Name is required");
        
        // Pass div/batch only if student
        const divToSend = role === 'student' ? division : undefined;
        const batchToSend = role === 'student' ? batch : undefined;

        const { error } = await signup(email, password, name, role, divToSend, batchToSend);
        if (error) throw error;
        toast.success("Account created! Welcome to AcadFlow.");
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      <GridPattern />
      
      {/* Abstract Gradient Orbs */}

      {/* Abstract Gradient Orbs for subtle color - purely atmospheric */}
      <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-100/50 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/50 rounded-full blur-[100px]" />

      {/* Navigation / Header */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <GraduationCap size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">AcadFlow</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <span className="cursor-pointer hover:text-slate-900 transition-colors">Documentation</span>
          <span className="cursor-pointer hover:text-slate-900 transition-colors">Support</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto w-full px-6 gap-12 lg:gap-24">
        
        {/* Left: The "Pitch" */}

        {/* Left: The "Pitch" - Clean and Editorial */}
        <div className="flex-1 space-y-8 text-center md:text-left pt-10 md:pt-0">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
            >
              Academic rigour <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                meets modern flow.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
              The centralized platform for assignments, practicals, and record keeping.
              Designed for focus, built for integrity.
            </motion.p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <FloatingBadge icon={ShieldCheck} label="Audit Ready" delay={0.3} />
            <FloatingBadge icon={Microscope} label="Lab Integrated" delay={0.4} />
            <FloatingBadge icon={BookOpen} label="Paperless" delay={0.5} />
          </div>
        </div>

        {/* Right: The "Ceramic" Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full max-w-[420px] relative group"
        >
          {/* Subtle Shadow Layer */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-slate-200 to-slate-100 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500" />

          <div className="relative bg-white rounded-xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {isLogin ? "Sign in" : "Create Account"}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {isLogin ? "Computer Engineering Department" : "Join the academic portal"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <CleanInput
                  label="Institutional Email"
                  type="email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                />
                <CleanInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember device
                </label>
                <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">Forgot Password?</a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-slate-900/20 flex items-center justify-center gap-2 group/btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? "Access Portal" : "Create Account"} 
                    <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-center text-slate-400 font-medium uppercase tracking-wider mb-3">Quick Access (Demo)</p>
              <div className="grid grid-cols-3 gap-2">
                {['Student', 'Teacher', 'Admin'].map((role) => (
                  <button
                    key={role}
                    className="px-2 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Security Seal */}
          <div className="absolute -right-4 -bottom-4 hidden md:flex h-12 w-12 bg-white rounded-full shadow-lg items-center justify-center border border-slate-100" title="Secured by Supabase">
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-slate-400 font-medium">
        &copy; 2026 PVPP College of Engineering. All rights reserved. • Privacy Policy
      </footer>
    </div>
  );
}