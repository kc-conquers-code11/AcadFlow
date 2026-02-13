import { useState } from 'react';
import { 
  Mail, 
  LifeBuoy, 
  Globe, 
  MessageCircle, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft, 
  Send, 
  Loader2, 
  Ticket,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Reusing the grid pattern for consistency
const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.4]" />
);

export default function Support() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('support_tickets')
                .insert([formData]);

            if (error) throw error;

            toast.success("Ticket raised! Our team will contact you soon.");
            setFormData({ name: '', email: '', subject: '', message: '' }); 
        } catch (error: any) {
            toast.error("Failed to send message: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
            <GridPattern />

            {/* Top Navigation */}
            <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/dashboard')}
                        className="text-muted-foreground hover:text-foreground group"
                    >
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Dashboard
                    </Button>
                    <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground">
                        <LifeBuoy size={14} /> Help Center
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto w-full p-8 md:p-12 space-y-12">
                
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="px-3 py-1 border-blue-500/20 text-blue-600 bg-blue-50 dark:bg-blue-900/20 mb-2">
                        24/7 Support
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        How can we help you?
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Resolve technical issues, inquire about academic schedules, or raise a support ticket directly to the administration.
                    </p>
                </div>

                {/* Direct Contact Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Tech Support */}
                    <Card className="hover:shadow-lg transition-all border-border bg-card/50 backdrop-blur-sm group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all" />
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <Mail size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg">Technical Support</h3>
                                <p className="text-sm text-muted-foreground">
                                    Login issues, bugs, or platform errors? Reach out to our dev team.
                                </p>
                                <a 
                                    href="mailto:team.acadflow@gmail.com" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline mt-2"
                                >
                                    team.acadflow@gmail.com <ChevronRight size={14} />
                                </a>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Admin */}
                    <Card className="hover:shadow-lg transition-all border-border bg-card/50 backdrop-blur-sm group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-1.5 transition-all" />
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <Globe size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg">Academic Admin</h3>
                                <p className="text-sm text-muted-foreground">
                                    Queries regarding batches, practicals, or enrollment status.
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">Dr. Rais Mulla</span>
                                    <span className="text-xs text-muted-foreground">HOD, Computer Dept.</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Ticket Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-border shadow-md bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Ticket className="text-primary" /> Raise a Ticket
                                </CardTitle>
                                <CardDescription>
                                    Fill out the form below for detailed assistance. We usually respond within 4 hours.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleFormSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input 
                                                id="name" 
                                                placeholder="John Doe" 
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                required 
                                                className="bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input 
                                                id="email" 
                                                type="email" 
                                                placeholder="john@example.com" 
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                required 
                                                className="bg-background/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input 
                                            id="subject" 
                                            placeholder="e.g. Issue with Lab Submission" 
                                            value={formData.subject}
                                            onChange={e => setFormData({...formData, subject: e.target.value})}
                                            required 
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Description</Label>
                                        <Textarea 
                                            id="message" 
                                            placeholder="Please describe your issue in detail..." 
                                            className="min-h-[150px] bg-background/50 resize-none" 
                                            value={formData.message}
                                            onChange={e => setFormData({...formData, message: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <Button type="submit" className="w-full sm:w-auto min-w-[150px]" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                        ) : (
                                            <><Send className="mr-2 h-4 w-4" /> Submit Ticket</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* FAQ Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <HelpCircle size={20} className="text-primary" /> Common Questions
                            </h2>
                            <div className="space-y-3">
                                {[
                                    {
                                        q: "Editor not loading?",
                                        a: "Ensure your filename ends with the correct extension (e.g., .c, .py)."
                                    },
                                    {
                                        q: "Submission mistake?",
                                        a: "Contact your faculty for a 'Redo Request' before the deadline."
                                    },
                                    {
                                        q: "Security warning?",
                                        a: "We log tab switches. Avoid switching tabs during active tests."
                                    }
                                ].map((faq, i) => (
                                    <div key={i} className="space-y-1">
                                        <h4 className="text-sm font-semibold text-foreground flex items-start gap-2">
                                            <ChevronRight size={14} className="mt-1 text-muted-foreground shrink-0" />
                                            {faq.q}
                                        </h4>
                                        <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                                    <Clock size={16} /> Business Hours
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Monday - Friday: 9:00 AM - 5:00 PM<br/>
                                    Average response time: <span className="font-semibold text-foreground">2-4 hours</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}