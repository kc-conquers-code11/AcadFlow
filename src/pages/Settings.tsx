import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Bell,
  Shield,
  Mail,
  Building,
  Save,
  Lock,
  GraduationCap,
  Layers,
  LayoutGrid,
  Hash,
  Smartphone,
  LogOut,
  Loader2,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Settings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          // Add other editable fields here if any
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
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-in fade-in space-y-8">

      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="grid gap-8">

        {/* 2. Identity Card */}
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} />
              <AvatarFallback className="text-3xl font-bold">
                {profile.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-muted-foreground font-medium">{profile.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
                <Badge variant="outline">
                  {profile.department || 'Computer Engineering'}
                </Badge>
              </div>
            </div>

            <Button variant="outline" onClick={() => logout()} className="hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* 3. Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Personal Profile</CardTitle>
            </div>
            <CardDescription>Update your personal details and academic info.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={profile.email} disabled className="pl-9 bg-muted/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={profile.department || 'Computer Engineering'} disabled className="pl-9 bg-muted/50" />
                </div>
              </div>

              {profile.role === 'student' && (
                <>
                  <div className="space-y-2">
                    <Label>Enrollment ID</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={profile.enrollment_number} disabled className="pl-9 bg-muted/50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={`Year ${profile.year || '-'}`} disabled className="pl-9 bg-muted/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Division</Label>
                      <div className="relative">
                        <LayoutGrid className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={profile.division} disabled className="pl-9 bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch</Label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={`Batch ${profile.batch}`} disabled className="pl-9 bg-muted/50" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4. Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you want to be alerted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { title: "Email Alerts", desc: "Receive emails about new assignments and grades.", icon: Mail },
              { title: "Deadline Reminders", desc: "Get notified 24h before submission due date.", icon: Clock },
              { title: "Push Notifications", desc: "Receive alerts on your mobile device.", icon: Smartphone }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 5. Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage your password and authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-lg">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button variant="outline">
              Update Password
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}