import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Sparkles, BrainCircuit, CopyPlus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button'; 
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- CONFIG ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// LOAD MULTIPLE KEYS FROM ENV
const API_KEYS = [
    import.meta.env.VITE_GROQ_API_KEY_1,
    import.meta.env.VITE_GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3
].filter(Boolean); // Removes undefined keys

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    isTyping?: boolean;
}

interface AIAssistantProps {
    mode: 'FULL_ASSISTANCE' | 'LIMITED';
    codeContext: string;
    subject?: string;
    taskTitle?: string;
    onAppendToReport?: (content: string, section: string) => void;
    onLog?: (prompt: string, response: string) => void;
}

const TypewriterMessage = ({ content, onComplete }: { content: string, onComplete: () => void }) => {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setDisplayedText((prev) => prev + content.charAt(indexRef.current));
            indexRef.current++;
            if (indexRef.current >= content.length) { clearInterval(interval); onComplete(); }
        }, 8);
        return () => clearInterval(interval);
    }, [content, onComplete]);
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>;
};

export default function AIAssistant({ mode, codeContext, subject = "Computer Science", taskTitle = "Coding Task", onAppendToReport, onLog }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([{ id: 'init', role: 'assistant', content: `Hi! I'm your ${subject} Tutor. Ask me anything about ${taskTitle}.`, isTyping: false }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

    // --- KEY ROTATION LOGIC ---
    const fetchWithRetry = async (payload: any, attempt = 0): Promise<any> => {
        if (API_KEYS.length === 0) throw new Error("No API Keys configured");
        
        // Pick key based on attempt count (Round Robin)
        const currentKey = API_KEYS[attempt % API_KEYS.length];

        try {
            // Using axios.create to ensure clean headers (Fixes 401 Issue)
            const aiClient = axios.create();
            return await aiClient.post(GROQ_API_URL, payload, { 
                headers: { 
                    "Authorization": `Bearer ${currentKey}`, 
                    "Content-Type": "application/json" 
                } 
            });
        } catch (error: any) {
            // Retry if Rate Limited (429) or Unauthorized (401) AND we have more keys to try
            if ((error.response?.status === 429 || error.response?.status === 401) && attempt < API_KEYS.length - 1) {
                console.warn(`Key ${attempt + 1} failed. Switching to next key...`);
                return fetchWithRetry(payload, attempt + 1);
            }
            throw error;
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const userMsgText = input.trim();
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsgText };
        setMessages(prev => [...prev, newUserMsg]); setInput(''); setLoading(true);

        try {
            const systemPrompt = `You are a strict Computer Science Professor. Subject: ${subject}. Task: ${taskTitle}. Mode: ${mode}. Code Context: \n${codeContext}`;
            const recentMessages = messages.filter(m => m.role !== 'system').slice(-6);
            
            const response = await fetchWithRetry({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, ...recentMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMsgText }],
                temperature: 0.7, max_tokens: 600,
            });

            const aiResponseText = response.data.choices[0]?.message?.content || "Processing error.";
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiResponseText, isTyping: true }]);
            onLog?.(userMsgText, aiResponseText);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ Error connecting to AI. Please try again later.`, isTyping: false }]);
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col h-full bg-card transition-colors">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm"><Sparkles size={14} className="text-white" /></div>
                    <span className="text-sm font-bold text-foreground">AI Tutor</span>
                </div>
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${mode === 'FULL_ASSISTANCE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div><span className="text-[10px] uppercase font-bold">{mode === 'FULL_ASSISTANCE' ? 'Pro' : 'Limited'}</span></div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <AnimatePresence initial={false}>
                    {messages.map((m) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'}`}>{m.role === 'user' ? <User size={14} /> : <Bot size={14} />}</div>
                            <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] relative group ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted border border-border text-foreground rounded-bl-sm'}`}>
                                {m.role === 'user' ? <p>{m.content}</p> : (
                                    <>
                                        <div className="prose prose-sm dark:prose-invert max-w-none [&_code]:text-xs">
                                            {m.isTyping ? <TypewriterMessage content={m.content} onComplete={() => setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, isTyping: false } : msg))} /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>}
                                        </div>
                                        {!m.isTyping && onAppendToReport && (
                                            <div className="mt-2 pt-2 border-t border-border/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase tracking-wide gap-1"><CopyPlus size={10} /> Add to Report <ChevronDown size={10} /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {['theory', 'algorithm', 'output', 'conclusion'].map(sec => (
                                                            <DropdownMenuItem key={sec} onClick={() => onAppendToReport(m.content, sec)} className="capitalize text-xs cursor-pointer">To {sec}</DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {loading && <div className="flex gap-3"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0"><BrainCircuit size={14} className="text-white animate-pulse" /></div><div className="bg-muted border border-border rounded-xl rounded-bl-sm px-4 py-3"><span className="text-xs font-medium text-muted-foreground">Thinking...</span></div></div>}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card shrink-0 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask doubt..." disabled={loading} className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <button type="submit" disabled={loading || !input.trim()} className="p-2 bg-primary rounded-lg text-primary-foreground disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
            </form>
        </div>
    );
}