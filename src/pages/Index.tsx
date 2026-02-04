import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// If you haven't set up the AuthContext yet, you can comment this out or use a mock
// import { useAuth } from '@/contexts/AuthContext'; 
import { Button } from '../components/ui/button'; // Assuming shadcn button exists
import { GraduationCap, ArrowRight, Lock, User, Loader2, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Visual Components ---

const PastelBlob = ({ className }: { className: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 2, ease: "easeOut" }}
    className={cn("absolute rounded-full blur-[100px] opacity-60 mix-blend-multiply filter", className)}
  />
);

const SoftInput = ({ icon: Icon, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 border",
      isFocused
        ? "bg-white border-indigo-200 shadow-lg shadow-indigo-100/50 ring-4 ring-indigo-50/50"
        : "bg-gray-50/80 border-transparent hover:bg-white hover:border-gray-200"
    )}>
      <Icon size={18} className={cn("transition-colors", isFocused ? "text-indigo-600" : "text-gray-400")} />
      <input
        {...props}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 font-medium text-sm"
      />
    </div>
  );
};

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const { login } = useAuth(); // Uncomment when Context is ready
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call for the "Feel"
    setTimeout(async () => {
      try {
        // await login(email, password);
        console.log("Logged in:", email);
        navigate('/dashboard'); // Change this to your actual dashboard route
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleDemoLogin = (role: string) => {
    setEmail(`${role.toLowerCase()}@college.edu`);
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC] relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* 1. Softer, Moving Background Blobs (No Glare) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <PastelBlob className="w-[500px] h-[500px] bg-blue-100/80 -top-20 -left-20 animate-pulse" />
        <PastelBlob className="w-[400px] h-[400px] bg-purple-100/80 bottom-0 right-0 animate-pulse delay-1000" />
        <PastelBlob className="w-[300px] h-[300px] bg-indigo-50/80 top-[40%] left-[40%] animate-pulse delay-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] px-6"
      >

        {/* 2. The Card: Frosted Glass */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">

          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200"
            >
              <GraduationCap className="text-white" size={26} />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              Academic Workflow Portal <br /> Computer Engineering Dept.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <SoftInput
                icon={User}
                type="email"
                placeholder="Institutional Email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
              />
              <SoftInput
                icon={Lock}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold shadow-lg shadow-gray-200 hover:shadow-xl hover:shadow-gray-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-white/80" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Footer Demo Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles size={12} className="text-indigo-400" />
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Quick Demo Access</p>
              <Sparkles size={12} className="text-indigo-400" />
            </div>

            <div className="flex gap-2 justify-center">
              {['Student', 'Teacher', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleDemoLogin(role)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright to ground the design */}
        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          © 2024 Computer Engineering Dept. • Secure Access
        </p>

      </motion.div>
    </div>
  );
};

export default Index;