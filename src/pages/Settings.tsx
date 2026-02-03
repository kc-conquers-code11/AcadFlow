import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Reusable Section Component for consistency
const SettingsSection = ({ icon: Icon, title, description, children }: any) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <div className="p-6 space-y-6">
      {children}
    </div>
  </div>
);

// Reusable Input Group
const InputGroup = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon size={12} />} {label}
    </label>
    <Input 
      className="bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
      {...props} 
    />
  </div>
);

export default function Settings() {
  const { user } = useAuth();

  if (!user) return null;

  const handleSave = () => {
    // Simulate API call
    toast.success("Settings updated successfully");
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      
      {/* 1. Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="grid gap-8">

        {/* 2. Identity Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <Avatar className="h-24 w-24 ring-4 ring-slate-50">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
            <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-500">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500 font-medium">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 capitalize">
                {user.role}
              </Badge>
              <Badge variant="outline" className="text-slate-500 border-slate-200">
                {user.department || 'Computer Engineering'}
              </Badge>
            </div>
          </div>

          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

        {/* 3. Personal Information */}
        <SettingsSection 
          icon={User} 
          title="Personal Profile" 
          description="Update your personal details and academic info."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Full Name" icon={User} defaultValue={user.name} />
            <InputGroup label="Email Address" icon={Mail} defaultValue={user.email} disabled className="bg-slate-50 text-slate-500" />
            <InputGroup label="Department" icon={Building} defaultValue={user.department} disabled className="bg-slate-50 text-slate-500" />
            
            {user.role === 'student' && (
              <>
                <InputGroup label="Enrollment ID" icon={Hash} defaultValue={user.enrollmentNumber} disabled className="bg-slate-50 text-slate-500" />
                <InputGroup label="Academic Year" icon={GraduationCap} defaultValue={`Year ${user.year}`} disabled className="bg-slate-50 text-slate-500" />
              </>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </div>
        </SettingsSection>

        {/* 4. Notifications */}
        <SettingsSection 
          icon={Bell} 
          title="Notifications" 
          description="Configure how you want to be alerted."
        >
          <div className="space-y-5">
            {[
              { title: "Email Alerts", desc: "Receive emails about new assignments and grades.", icon: Mail },
              { title: "Deadline Reminders", desc: "Get notified 24h before submission due date.", icon: ClockIcon },
              { title: "Push Notifications", desc: "Receive alerts on your mobile device.", icon: Smartphone }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-slate-400">
                     <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* 5. Security */}
        <SettingsSection 
          icon={Shield} 
          title="Security" 
          description="Manage your password and authentication."
        >
          <div className="space-y-6 max-w-lg">
             <InputGroup label="Current Password" icon={Lock} type="password" />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <InputGroup label="New Password" type="password" />
               <InputGroup label="Confirm Password" type="password" />
             </div>

             <Button variant="outline" className="border-slate-200 text-slate-600 w-full md:w-auto">
               Update Password
             </Button>
          </div>
        </SettingsSection>

      </div>
    </div>
  );
}

// Helper icon
const ClockIcon = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);