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
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(async () => {
      try {
        const { error } = await login(email, password);
        if (error) throw error;

        toast.success("Welcome back!");
        navigate('/dashboard');
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
        <div className="flex items-center gap-1">
          <img src="/images/logo.png" alt="AcadFlow" className="h-20 md:h-24 w-auto object-contain" />
          <span className="font-bold text-2xl md:text-3xl tracking-tight font-display">
            <span className="text-primary">Acad</span>
            <span className="text-foreground">Flow</span>
          </span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground items-center">
          <button
            onClick={(e) => {
              const newTheme = theme === "dark" ? "light" : "dark";

              // @ts-ignore
              if (!document.startViewTransition) {
                setTheme(newTheme);
                return;
              }

              const x = e.clientX;
              const y = e.clientY;
              const right = window.innerWidth - x;
              const bottom = window.innerHeight - y;
              const maxRadius = Math.hypot(
                Math.max(x, right),
                Math.max(y, bottom)
              );

              // @ts-ignore
              const transition = document.startViewTransition(() => {
                setTheme(newTheme);
              });

              transition.ready.then(() => {
                document.documentElement.animate(
                  {
                    clipPath: [
                      `circle(0px at ${x}px ${y}px)`,
                      `circle(${maxRadius}px at ${x}px ${y}px)`,
                    ],
                  },
                  {
                    duration: 500,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)',
                  }
                );
              });
            }}
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
                  mainClassName="text-primary overflow-hidden py-2 sm:py-4 justify-center rounded-lg inline-flex items-center leading-normal font-display"
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
                Sign in
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Computer Engineering Department
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="email">Institutional Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
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
                    onChange={(e: any) => setPassword(e.target.value)}
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



              <div className="flex items-center justify-between text-xs">
                <a href="#" className="font-semibold text-primary hover:text-primary/80">Forgot password?</a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 group/btn"
              >
                {isLoading ? "Authenticating..." : (
                  <>
                    Access Portal
                    <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>


          {/* Decorative Security Seal */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -right-2 -bottom-2 md:-right-4 md:-bottom-4 flex h-10 w-10 md:h-12 md:w-12 bg-card rounded-full shadow-lg items-center justify-center border border-border cursor-pointer transition-transform hover:scale-105 z-50">
                  <ShieldCheck className="w-5 h-5 md:w-5 md:h-5 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={5}>
                <p>Secured by Supabase</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-muted-foreground font-medium relative z-10">
        &copy; 2026 PVPP College of Engineering. All rights reserved. • Privacy Policy
      </footer>
    </div>
  );
}

