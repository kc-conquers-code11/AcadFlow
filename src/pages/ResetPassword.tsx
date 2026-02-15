import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  KeyRound, 
  ArrowLeft, 
  Loader2, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { toast } from 'sonner';

const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.2]" />
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false); // Check if user came from reset link
  const [showPassword, setShowPassword] = useState(false);

  // Check if the URL has an access token (Supabase recovery link)
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }
  }, []);

  // --- Case 1: Send Reset Link ---
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast.success("Reset link sent to your email.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Case 2: Update Password (Recovery) ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <GridPattern />
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] space-y-6 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isRecoveryMode ? "Set New Password" : "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRecoveryMode 
              ? "Ensure your new password is strong and unique." 
              : "We'll send a recovery link to your institutional email."}
          </p>
        </div>

        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl">
          {!isEmailSent ? (
            <form onSubmit={isRecoveryMode ? handleUpdatePassword : handleRequestReset} className="space-y-4">
              
              {isRecoveryMode ? (
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Institutional Email</Label>
                  <div className="relative">
                    <Input 
                      id="email"
                      type="email"
                      placeholder="name@pvppcoe.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}

              <Button disabled={isLoading} className="w-full h-11 font-semibold group">
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : isRecoveryMode ? (
                  "Update Password"
                ) : (
                  "Send Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Check your inbox</h3>
                <p className="text-sm text-muted-foreground">
                  A password reset link has been sent to <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setIsEmailSent(false)}>
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} />
              Back to Sign in
            </Button>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
          <CheckCircle2 size={12} />
          End-to-End Encrypted Recovery
        </div>
      </motion.div>
    </div>
  );
}