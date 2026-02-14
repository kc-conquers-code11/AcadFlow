import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RotatingText from '@/components/ui/rotating-text';
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Microscope,
  Loader2,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Visual Components ---

const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]" />
);

const FloatingBadge = ({ icon: Icon, label, delay }: { icon: any, label: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full shadow-sm text-xs font-medium text-muted-foreground"
  >
    <Icon size={14} className="text-primary" />
    {label}
  </motion.div>
);

// High-Fidelity Cloudflare Logo
const CloudflareLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.32 8.87c.13-.77.2-1.56.2-2.37 0-4.14-3.36-7.5-7.5-7.5-3.3 0-6.11 2.14-7.14 5.1C2.12 4.9 0 7.17 0 10c0 3.03 2.47 5.5 5.5 5.5h13.5c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.68-4.96z" />
  </svg>
);

export default function Login() {
  const PROFILE = "https://www.linkedin.com/in/kc-thedev";

  // --- State Management ---
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [division, setDivision] = useState<'A' | 'B'>('A');
  const [batch, setBatch] = useState<'A' | 'B' | 'C'>('A');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // --- Handlers ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await login(email, password);
        if (error) throw error;
        toast.success("Welcome back!");

        // CHECK IF USER IS ADMIN AND REDIRECT
        if (data.user?.user_metadata?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }

      } else {
        if (!name.trim()) throw new Error("Name is required");
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
    <div className="min-h-screen text-foreground flex flex-col relative overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
      <GridPattern />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--primary) 100%)`,
          backgroundSize: "100% 100%",
          opacity: 0.8
        }}
      />

      {/* Navigation / Header */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-2xl tracking-tight font-display">
            <span className="text-primary">Acad</span>
            <span className="text-foreground">Flow</span>
          </span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground items-center">
          <button
            onClick={(e) => {
              const btn = e.currentTarget;
              const rect = btn.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              const maxRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
              );
              document.documentElement.style.setProperty('--theme-x', `${x}px`);
              document.documentElement.style.setProperty('--theme-y', `${y}px`);
              document.documentElement.style.setProperty('--theme-r', `${maxRadius}px`);
              if (document.startViewTransition) {
                document.startViewTransition(() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                });
              } else {
                setTheme(theme === "dark" ? "light" : "dark");
              }
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <span
            className="cursor-pointer hover:text-foreground transition-colors"
            onClick={() => navigate('/privacy')}
          >
            Documentation
          </span>
          <span
            className="cursor-pointer hover:text-foreground transition-colors"
            onClick={() => navigate('/support')}
          >
            Support
          </span>
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
              <span className="text-primary italic flex items-center justify-center md:justify-start gap-2 flex-wrap">
                meets
                <RotatingText
                  texts={['modern', 'simple', 'powerful']}
                  mainClassName="text-primary overflow-hidden py-0 sm:py-2 justify-center rounded-lg inline-flex items-center leading-normal font-display"
                  staggerFrom="first"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-2 px-2 sm:pb-4 pt-1 sm:pt-2"
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

        {/* Right: Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full max-w-[420px] relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-b from-border/50 to-transparent rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />

          <div className="relative bg-card rounded-xl shadow-xl p-8 border border-border">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-card-foreground">
                {isLogin ? "Sign in" : "Create Account"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isLogin ? "Computer Engineering Department" : "Join the academic portal"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Institutional Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="username@pvppcoe.ac.in"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Select Role</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['student', 'teacher'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={cn(
                            "py-2 text-sm font-medium rounded-lg border transition-all capitalize",
                            role === r ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {role === 'student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Division</p>
                        <div className="flex gap-2">
                          {(['A', 'B'] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDivision(d)}
                              className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg border transition-all",
                                division === d ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Batch</p>
                        <div className="flex gap-2">
                          {(['A', 'B', 'C'] as const).map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBatch(b)}
                              className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg border transition-all",
                                batch === b ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input type="checkbox" className="rounded border-border text-primary" />
                    Remember device
                  </label>
                  <a href="#" className="font-semibold text-primary hover:text-primary/80">Forgot credentials?</a>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <>{isLogin ? "Access Portal" : "Create Account"} <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" /></>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
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

          {/* THE "BHARI" SECURITY BADGE */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -right-2 -bottom-4 md:-right-6 md:-bottom-6 cursor-pointer z-50 group"
                >
                  {/* Glassmorphism Capsule */}
                  <div className="flex items-center gap-3 bg-black/90 dark:bg-black/80 backdrop-blur-md border border-white/10 pl-2 pr-4 py-2 rounded-full shadow-2xl hover:shadow-primary/20 transition-all hover:scale-105 hover:border-primary/30">

                    {/* Glowing Logo Container */}
                    <div className="relative h-8 w-8 bg-[#F38020] rounded-full flex items-center justify-center shrink-0">
                      <CloudflareLogo className="h-5 w-5 text-white" />
                      {/* Scan Line Animation */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent rounded-full opacity-0 group-hover:animate-pulse" />
                    </div>

                    {/* Text Details */}
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Secured by</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white tracking-tight">Cloudflare</span>
                        {/* Blinking Live Indicator */}
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TooltipTrigger>

              <TooltipContent side="left" sideOffset={10} className="bg-zinc-900 border-zinc-800 text-white p-3 rounded-lg shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-md">
                    <Lock size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">256-bit SSL Encrypted</p>
                    <p className="text-[10px] text-zinc-400">DDoS Protection Active</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-muted-foreground font-medium relative z-10">
        &copy; 2026 PVPP College of Engineering. All rights reserved - Powered by{' '}
        <span
          className="text-primary cursor-pointer hover:underline underline-offset-2 transition-all font-bold"
          onClick={() => window.open(PROFILE, '_blank')}
        >
          EDUSync
        </span>
      </footer>
    </div>
  );
}