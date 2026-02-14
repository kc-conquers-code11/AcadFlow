import { useState } from 'react';
import {
    Mail,
    LifeBuoy,
    Globe,
    HelpCircle,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
    Send,
    Loader2,
    Ticket,
    Clock,
    MessageSquare,
    Zap,
    BookOpen,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Support() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
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

    const faqs = [
        {
            q: "Editor not loading?",
            a: "Ensure your filename ends with the correct extension (e.g., .c, .py). Try clearing your browser cache and using Google Chrome for best compatibility."
        },
        {
            q: "Submission mistake?",
            a: "Contact your faculty for a 'Redo Request' before the deadline. Once granted, you'll be able to resubmit your work."
        },
        {
            q: "Security warning?",
            a: "We log tab switches during active tests to maintain academic integrity. Avoid switching tabs or opening new windows during assessments."
        },
        {
            q: "Forgot my password?",
            a: "Use the 'Forgot credentials?' link on the login page to reset your password via your institutional email."
        },
        {
            q: "Grades not showing?",
            a: "Grades appear after faculty evaluation. If your submission is marked 'Submitted' but hasn't been graded yet, please wait or contact your instructor."
        }
    ];

    const channels = [
        {
            icon: Mail,
            title: "Technical Support",
            desc: "Login issues, bugs, or platform errors",
            contact: "team.acadflow@gmail.com",
            href: "mailto:team.acadflow@gmail.com",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            response: "< 4 hours"
        },
        {
            icon: Globe,
            title: "Academic Admin",
            desc: "Batches, practicals, or enrollment queries",
            contact: "Dr. Rais Mulla · HOD",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            response: "1-2 days"
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col animate-in fade-in">

            {/* Top Navigation */}
            <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
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

            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-10">

                {/* Hero */}
                <header className="text-center space-y-4 pb-2">
                    <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5">
                        24/7 Support
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                        How can we help you?
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Resolve technical issues, inquire about academic schedules, or raise a support ticket directly to the administration.
                    </p>
                </header>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: Zap, label: "Avg Response", value: "2-4 hrs", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                        { icon: Shield, label: "Uptime", value: "99.9%", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                        { icon: MessageSquare, label: "Satisfaction", value: "98%", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
                    ].map((stat, i) => (
                        <Card key={i} className="border-border bg-card">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
                                    <stat.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Contact Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {channels.map((ch, i) => (
                        <Card key={i} className="border-border bg-card hover:shadow-md transition-all group">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", ch.bg, ch.color)}>
                                    <ch.icon size={22} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-foreground">{ch.title}</h3>
                                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                                            <Clock size={10} className="mr-1" /> {ch.response}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{ch.desc}</p>
                                    {ch.href ? (
                                        <a href={ch.href} target="_blank" rel="noopener noreferrer"
                                            className={cn("inline-flex items-center gap-1 text-sm font-medium mt-1 hover:underline", ch.color)}>
                                            {ch.contact} <ChevronRight size={14} />
                                        </a>
                                    ) : (
                                        <p className="text-sm font-medium text-foreground mt-1">{ch.contact}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* Ticket Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-border bg-card">
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Ticket className="text-primary" size={20} />
                                        <h2 className="text-xl font-bold text-foreground">Raise a Ticket</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Fill out the form below for detailed assistance. We usually respond within 4 hours.
                                    </p>
                                </div>
                                <form onSubmit={handleFormSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="bg-background border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="bg-background border-border"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="e.g. Issue with Lab Submission"
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Description</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Please describe your issue in detail..."
                                            className="min-h-[150px] bg-background border-border resize-none"
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
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
                    <div className="space-y-4">
                        <Card className="border-border bg-card">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen size={18} className="text-primary" />
                                    <h2 className="text-lg font-bold text-foreground">Common Questions</h2>
                                </div>
                                <div className="space-y-1">
                                    {faqs.map((faq, i) => (
                                        <div key={i} className="border-b border-border last:border-0">
                                            <button
                                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                                className="w-full flex items-center justify-between py-3 text-left hover:text-primary transition-colors"
                                            >
                                                <span className="text-sm font-semibold text-foreground pr-2">{faq.q}</span>
                                                <ChevronDown size={14} className={cn(
                                                    "text-muted-foreground transition-transform shrink-0",
                                                    openFaq === i && "rotate-180"
                                                )} />
                                            </button>
                                            {openFaq === i && (
                                                <p className="text-xs text-muted-foreground pb-3 leading-relaxed animate-in fade-in slide-in-from-top-1">
                                                    {faq.a}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                                    <Clock size={16} /> Business Hours
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Monday – Friday: 9:00 AM – 5:00 PM<br />
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