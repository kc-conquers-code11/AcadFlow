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
  Lock,
  Check,
  Menu,
  X
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// --- Visual Components ---

const GridPattern = () => (
  <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]" />
);

const FloatingBadge = ({ icon: Icon, label, delay }: { icon: any, label: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full shadow-sm text-xs font-medium text-muted-foreground whitespace-nowrap"
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

// --- MOCK CLOUDFLARE WIDGET ---
const CloudflareWidget = ({ onVerify, isHuman }: { onVerify: (val: boolean) => void, isHuman: boolean }) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>(isHuman ? 'success' : 'idle');

  const handleClick = () => {
    if (status !== 'idle') return;
    setStatus('verifying');

    // Simulate network delay
    setTimeout(() => {
      setStatus('success');
      onVerify(true);
    }, 1200);
  };

  return (
    <div className="w-full h-[65px] bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#d6d6d6] dark:border-[#333] rounded-[4px] flex items-center justify-between px-3 mt-4 mb-2 select-none shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <div
          onClick={handleClick}
          className={cn(
            "w-[28px] h-[28px] bg-white dark:bg-[#222] border border-[#c1c1c1] dark:border-[#444] rounded-[2px] cursor-pointer flex items-center justify-center transition-all",
            status === 'idle' && "hover:border-[#a0a0a0]",
            status === 'success' && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
          )}
        >
          {status === 'verifying' && <Loader2 className="animate-spin text-foreground" size={18} />}
          {status === 'success' && <Check className="text-emerald-500" size={20} strokeWidth={4} />}
        </div>
        <span className="text-[14px] font-medium text-[#404040] dark:text-[#e0e0e0]">
          {status === 'success' ? 'Success!' : 'Verify you are human'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-0.5 pt-1">
        <CloudflareLogo className="h-6 w-6 text-[#404040] dark:text-[#808080]" />
        <div className="text-[9px] text-[#555] dark:text-[#666] leading-none text-center font-medium">
          <span className="block mb-0.5">Privacy - Terms</span>
        </div>
      </div>
    </div>
  );
};

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
  const [isHuman, setIsHuman] = useState(false);

  // Hooks
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // --- Handlers ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // MANDATORY CLOUDFLARE CHECK
    if (!isHuman) {
      toast.error("Verification Required", {
        description: "Please complete the human verification before proceeding.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await login(email, password);
        if (error) throw error;
        toast.success("Welcome back!");

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col relative overflow-x-hidden font-sans selection:bg-primary/20 selection:text-primary">
      <GridPattern />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--primary) 100%)`,
          backgroundSize: "100% 100%",
          opacity: 0.8
        }}
      />

      {/* Navigation / Header */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-2xl tracking-tight font-display">
            <span className="text-primary">Acad</span>
            <span className="text-foreground">Flow</span>
          </span>
        </div>

        {/* Desktop Navigation */}
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
              if ((document as any).startViewTransition) {
                (document as any).startViewTransition(() => {
                  toggleTheme();
                });
              } else {
                toggleTheme();
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

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left font-display text-xl font-bold flex items-center gap-2">
                  <div className="h-7 w-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                    <GraduationCap size={16} strokeWidth={2.5} />
                  </div>
                  AcadFlow
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6 mt-8">
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border">
                  <span className="text-sm font-medium">Appearance</span>
                  <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2 h-8">
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </Button>
                </div>

                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base font-normal h-12"
                    onClick={() => navigate('/privacy')}
                  >
                    <BookOpen size={18} className="mr-3 text-muted-foreground" />
                    Documentation
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base font-normal h-12"
                    onClick={() => navigate('/support')}
                  >
                    <ShieldCheck size={18} className="mr-3 text-muted-foreground" />
                    Support
                  </Button>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 text-xs text-muted-foreground">
                v2.4.0 (Stable)
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main Content - Flex changes for better responsiveness */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto w-full px-6 py-12 gap-10 lg:gap-20 relative z-10">

        {/* Left: The "Pitch" */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl z-20 font-bold tracking-tight text-foreground leading-[1.1] font-serif"
            >
              Academic rigour <br />
              <span className="text-primary italic flex items-center justify-center lg:justify-start gap-2 flex-wrap">
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
              className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans"
            >
              The centralized platform for assignments, practicals, and record keeping.
              Designed for focus, built for integrity.
            </motion.p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
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
          className="w-full max-w-[400px] relative group shrink-0"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-b from-border/50 to-transparent rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />

          <div className="relative bg-card rounded-xl shadow-xl p-6 md:p-8 border border-border">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-card-foreground">
                {isLogin ? "Sign in" : "Create Account"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isLogin ? "Computer Engineering Department" : "Join the academic portal"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode='wait'>
                {!isLogin && (
                  <motion.div
                    key="signup-fields"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mb-4">
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

              {/* SECURITY WIDGET INTEGRATION */}
              <CloudflareWidget onVerify={setIsHuman} isHuman={isHuman} />

              <Button
                type="submit"
                disabled={isLoading || !isHuman}
                className={cn(
                  "w-full h-11 transition-all font-medium rounded-lg flex items-center justify-center gap-2 group/btn shadow-lg shadow-primary/20",
                  !isHuman ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <>{isLogin ? "Access Portal" : "Create Account"} <ArrowRight size={16} className={cn("transition-transform", isHuman && "group-hover/btn:translate-x-0.5")} /></>
                )}
              </Button>
            </form>

            {/* <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "First time here? " : "Already registered? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setIsHuman(false); // Reset captcha on switch
                  }}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {isLogin ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div> */}
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
                  <div className="flex items-center gap-3 bg-black/90 dark:bg-black/80 backdrop-blur-md border border-white/10 pl-2 pr-4 py-2 rounded-full shadow-2xl hover:shadow-primary/20 transition-all hover:scale-105 hover:border-primary/30">
                    <div className="relative h-8 w-8 bg-[#F38020] rounded-full flex items-center justify-center shrink-0">
                      <CloudflareLogo className="h-5 w-5 text-white" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Secured by</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white tracking-tight">Cloudflare</span>
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
      <footer className="w-full p-6 text-center text-xs text-muted-foreground font-medium relative z-10 shrink-0">
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