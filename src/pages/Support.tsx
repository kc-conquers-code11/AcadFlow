import { useState } from 'react';
import { Mail, LifeBuoy, Globe, MessageCircle, HelpCircle, ChevronRight, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
        <div className="max-w-5xl mx-auto p-8 space-y-12 animate-in fade-in">
            
            {/* Back Button */}
            <div className="flex justify-start">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/dashboard')}
                    className="text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Button>
            </div>

            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 mx-auto rounded-2xl flex items-center justify-center">
                    <LifeBuoy size={32} className="animate-pulse" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Support Center</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Raise a ticket or reach out to our technical and departmental experts.
                </p>
            </div>

            {/* Support Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Technical Support Card */}
                <Card className="hover:shadow-md transition-all border-border bg-card overflow-hidden">
                    <div className="h-1.5 w-full bg-blue-600" />
                    <CardContent className="p-6 space-y-4">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-600 font-bold">Technical Support</h3>
                            <p className="text-xl font-bold text-foreground italic">Krishna Choudhary</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Facing login issues, editor bugs, or server errors? Click below to send an email for technical resolution.
                        </p>
                        {/* MAILTO LINK ADDED HERE */}
                        <a 
                            href="mailto:support@acadflow.com" 
                            className="block font-mono text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg text-center border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            support@acadflow.com
                        </a>
                    </CardContent>
                </Card>

                {/* Departmental Admin Card */}
                <Card className="hover:shadow-md transition-all border-border bg-card overflow-hidden">
                    <div className="h-1.5 w-full bg-emerald-600" />
                    <CardContent className="p-6 space-y-4">
                        <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg flex items-center justify-center">
                            <Globe size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 font-bold">Departmental Admin</h3>
                            <p className="text-xl font-bold text-foreground italic">Dr. Rais Mulla</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            For curriculum queries, batch changes, or practical scheduling, contact the **VPPCOE & VA HOD**.
                        </p>
                        <Button variant="outline" className="w-full group border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                            Contact Coordinator <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card className="border-border shadow-lg bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <MessageCircle className="text-primary" /> Direct Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Your Name</Label>
                                        <Input 
                                            id="name" 
                                            placeholder="John Doe" 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            required 
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
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input 
                                        id="subject" 
                                        placeholder="Issue with Lab Submission" 
                                        value={formData.subject}
                                        onChange={e => setFormData({...formData, subject: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea 
                                        id="message" 
                                        placeholder="Describe your issue in detail..." 
                                        className="min-h-[120px]" 
                                        value={formData.message}
                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                        required 
                                    />
                                </div>
                                <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send className="mr-2 h-4 w-4" /> Send Support Ticket</>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <HelpCircle size={20} className="text-primary" /> FAQ
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                q: "Editor bug?",
                                a: "Ensure first line is `Filename.extension`."
                            },
                            {
                                q: "Modification?",
                                a: "Request Faculty for a 'Redo Request'."
                            },
                            {
                                q: "Security Check?",
                                a: "Tab switches are logged for integrity."
                            }
                        ].map((faq, i) => (
                            <details key={i} className="group border border-border rounded-lg bg-card p-3 cursor-pointer hover:bg-muted/10 transition-colors">
                                <summary className="text-sm font-semibold flex justify-between items-center list-none text-foreground">
                                    {faq.q}
                                    <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-muted-foreground" />
                                </summary>
                                <p className="mt-2 text-xs text-muted-foreground border-l-2 border-primary/20 pl-3 leading-relaxed">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <MessageCircle size={16} className="text-blue-500" /> Average response time: 2-4 business hours.
                </p>
            </div>
        </div>
    );
}