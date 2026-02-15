import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  User,
  Bell,
  Shield,
  Mail,
  Building,
  Save,
  Lock,
  GraduationCap,
  Hash,
  Smartphone,
  LogOut,
  Loader2,
  Layers,
  LayoutGrid,
  Clock,
  KeyRound,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Reusable Section Component
const SettingsSection = ({ icon: Icon, title, description, children }: any) => (
  <Card className="border-border bg-card overflow-hidden">
    <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <CardContent className="p-6 space-y-6">
      {children}
    </CardContent>
  </Card>
);

// Reusable Input Group
const InputGroup = ({ label, icon: Icon, disabled, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon size={12} />} {label}
    </label>
    <Input
      type={type}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        "bg-background border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all h-10",
        disabled && "bg-muted text-muted-foreground cursor-not-allowed"
      )}
    />
  </div>
);

export default function Settings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Fetch Profile Data
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) setProfile(data);
        if (error) console.error("Error fetching profile:", error);
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  // Handle Input Change
  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  // Save Changes to Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background animate-in fade-in">
      <div className="max-w-4xl mx-auto p-8 space-y-8">

        {/* Page Header */}
        <header className="border-b border-border pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile, preferences, and security.</p>
        </header>

        {/* Identity Card */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-20 w-20 ring-4 ring-border">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profile.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                  {profile.role}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground border-border">
                  {profile.department || 'Computer Engineering'}
                </Badge>
              </div>
            </div>

            <Button variant="outline" onClick={() => logout()} className="border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <SettingsSection
          icon={User}
          title="Personal Profile"
          description="Update your personal details and academic info."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup
              label="Full Name"
              icon={User}
              value={profile.name}
              onChange={(e: any) => handleChange('name', e.target.value)}
            />
            <InputGroup
              label="Email Address"
              icon={Mail}
              value={profile.email}
              disabled
            />
            <InputGroup
              label="Department"
              icon={Building}
              value={profile.department || 'Computer Engineering'}
              disabled
            />

            {profile.role === 'student' && (
              <>
                <InputGroup
                  label="Enrollment ID"
                  icon={Hash}
                  value={profile.enrollment_number}
                  disabled
                />
                <InputGroup
                  label="Academic Year"
                  icon={GraduationCap}
                  value={`Year ${profile.year || '-'}`}
                  disabled
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup
                    label="Division"
                    icon={LayoutGrid}
                    value={profile.division}
                    disabled
                  />
                  <InputGroup
                    label="Batch"
                    icon={Layers}
                    value={`Batch ${profile.batch}`}
                    disabled
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Configure how you want to be alerted."
        >
          <div className="space-y-1">
            {[
              { title: "Email Alerts", desc: "Receive emails about new assignments and grades.", icon: Mail },
              { title: "Deadline Reminders", desc: "Get notified 24h before submission due date.", icon: Clock },
              { title: "Push Notifications", desc: "Receive alerts on your mobile device.", icon: Smartphone }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex gap-3 items-center">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Manage your password and authentication."
        >
          <div className="space-y-6 max-w-lg">
            <InputGroup label="Current Password" icon={Lock} type="password" placeholder="••••••••" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="New Password" icon={KeyRound} type="password" placeholder="••••••••" />
              <InputGroup label="Confirm Password" icon={KeyRound} type="password" placeholder="••••••••" />
            </div>

            <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
              <Lock className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </div>
        </SettingsSection>

      </div>
    </div>
  );
}