import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import RotatingText from '@/components/ui/rotating-text';
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Microscope,
  User,
  Mail,
  Lock,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Visual Components ---

const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]" />
);

const FloatingBadge = ({ icon: Icon, label, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 bg-card/80 bg-background backdrop-blur-sm border border-border/50 rounded-full shadow-sm text-xs font-medium text-muted-foreground"
  >
    <Icon size={14} className="text-primary" />
    {label}
  </motion.div>
);

const CleanInput = ({ label, ...props }: any) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="group relative">
      <label className={cn(
        "absolute left-3 transition-all duration-200 pointer-events-none text-muted-foreground bg-background px-1 z-10",
        focused || props.value ? "-top-2.5 text-xs text-primary font-semibold" : "top-3 text-sm"
      )}>
        {label}
      </label>
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={(e) => setFocused(e.target.value !== '')}
        className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/10 transition-all shadow-sm group-hover:border-accent placeholder:text-transparent"
      />
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLogin, setIsLogin] = useState(true);

  // New States for Division & Batch
  const [division, setDivision] = useState<'A' | 'B'>('A');
  const [batch, setBatch] = useState<'A' | 'B' | 'C'>('A');

  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(async () => {
      try {
        if (isLogin) {
          await login(email, password);
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
        toast.error(error.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col relative overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
      <GridPattern />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--primary) 100%)`,
          backgroundSize: "100% 100%",
          opacity: 1
        }}
      />

      {/* Navigation / Header */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="AcadFlow" className="h-20 md:h-24 w-auto object-contain" />
          <span className="font-bold text-2xl md:text-3xl tracking-tight font-serif">
            <span className="text-primary">Acad</span>
            <span className="text-foreground">Flow</span>
          </span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground items-center">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <span className="cursor-pointer hover:text-foreground transition-colors">Documentation</span>
          <span className="cursor-pointer hover:text-foreground transition-colors">Support</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto w-full px-6 gap-12 lg:gap-24 relative z-10">

        {/* Left: The "Pitch" */}
        <div className="flex-1 space-y-8 text-center md:text-left pt-10 md:pt-0">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl z-20 font-bold tracking-tight text-foreground leading-[1.1] font-serif"
            >
              Academic rigour <br />
              <span className="text-primary italic flex items-center sm:ml-10 lg:ml-0 gap-2">
                meets
                <RotatingText
                  texts={['modern', 'simple', 'powerful']}
                  mainClassName="text-primary overflow-hidden py-2 sm:py-4 justify-center rounded-lg inline-flex items-center leading-normal"
                  staggerFrom="first"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-2 px-3 sm:pb-4 pt-1 sm:pt-2"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={3000}
                />
                flow.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed font-sans"
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

        {/* Right: The "Ceramic" Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full max-w-[420px] relative group"
        >
          {/* Subtle Shadow Layer */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-border/50 to-transparent rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />

          <div className="relative bg-card rounded-xl shadow-xl shadow-shadow/5 p-8 border border-border">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-card-foreground">
                {isLogin ? "Sign in" : "Create Account"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isLogin ? "Computer Engineering Department" : "Join the academic portal"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name Field (Only for Signup) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CleanInput
                      label="Full Name"
                      type="text"
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Role Toggle + Div/Batch (Only for Signup) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden space-y-4"
                  >
                    {/* Role Selection */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Select Role</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={cn(
                            "py-2 text-sm font-medium rounded-lg border transition-all",
                            role === 'student'
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('teacher')}
                          className={cn(
                            "py-2 text-sm font-medium rounded-lg border transition-all",
                            role === 'teacher'
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          Teacher
                        </button>
                      </div>
                    </div>

                    {/* Student Specific: Div & Batch */}
                    {role === 'student' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        {/* Division */}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Division</p>
                          <div className="flex gap-2">
                            {['A', 'B'].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDivision(d as any)}
                                className={cn(
                                  "flex-1 py-2 text-sm font-bold rounded-lg border transition-all",
                                  division === d
                                    ? "bg-secondary/20 border-secondary/40 text-secondary-foreground"
                                    : "bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Batch */}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Lab Batch</p>
                          <div className="flex gap-2">
                            {['A', 'B', 'C'].map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setBatch(b as any)}
                                className={cn(
                                  "flex-1 py-2 text-sm font-bold rounded-lg border transition-all",
                                  batch === b
                                    ? "bg-secondary/20 border-secondary/40 text-secondary-foreground"
                                    : "bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isLogin && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <input type="checkbox" className="rounded border-input text-primary focus:ring-ring" />
                    Remember device
                  </label>
                  <a href="#" className="font-semibold text-primary hover:text-primary/80">Forgot credentials?</a>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 group/btn"
              >
                {isLoading ? "Authenticating..." : (
                  <>
                    {isLogin ? "Access Portal" : "Create Account"}
                    <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "First time here? " : "Already registered? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {isLogin ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          {/* Decorative Security Seal */}
          <div className="absolute -right-4 -bottom-4 hidden md:flex h-12 w-12 bg-card rounded-full shadow-lg items-center justify-center border border-border" title="Secured by Supabase">
            <ShieldCheck size={20} className="text-primary" />
          </div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-muted-foreground font-medium relative z-10">
        &copy; 2026 PVPP College of Engineering. All rights reserved. • Privacy Policy
      </footer>
    </div>
  );
}