import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- CONFIG ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AIAssistantProps {
    mode: 'FULL_ASSISTANCE' | 'LIMITED';
    codeContext: string;
    onLog?: (prompt: string, response: string) => void;
}

export default function AIAssistant({ mode, codeContext, onLog }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            content: "Hi! I'm your AI Tutor. I can help with logic, syntax errors, and debugging. I won't write the full solution for you, but I'll guide you to it!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom whenever messages change
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        if (!GROQ_API_KEY) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "⚠️ Error: Groq API Key is missing. Please check your .env file."
            }]);
            return;
        }

        const userMsgText = input.trim();
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsgText };

        // 1. Update UI immediately with user message
        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setLoading(true);

        try {
            // 2. Construct System Prompt with Context
            const systemPrompt = `
                You are a helpful, encouraging, and strict Computer Science Tutor.
                
                Current Context:
                - The student is working on a coding problem.
                - Their current code is provided below.
                
                Rules:
                1. ${mode === 'LIMITED' ? 'Provide HINTS only. Do NOT write code snippets.' : 'Explain concepts and provide short snippets if asked, but do NOT write the entire solution.'}
                2. Be concise, clear, and friendly.
                3. If the student asks about an error, analyze the "Student Code" below.
                4. Use markdown for formatting code snippets and explanations.
                
                Student Code:
                \`\`\`
                ${codeContext || "// No code written yet"}
                \`\`\`
            `;

            // 3. Prepare Message History for API (Limit context window to last 6 messages to save tokens)
            const recentMessages = messages.filter(m => m.role !== 'system').slice(-6);
            const apiMessages = [
                { role: "system", content: systemPrompt },
                ...recentMessages.map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: userMsgText }
            ];

            // 4. Call Groq API
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model: "llama-3.3-70b-versatile", // Fast & Intelligent
                    messages: apiMessages,
                    temperature: 0.7,
                    max_tokens: 500,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const aiResponseText = response.data.choices[0]?.message?.content || "I couldn't process that. Please try again.";

            // 5. Update UI with AI Response
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: aiResponseText }]);

            // Log interaction
            onLog?.(userMsgText, aiResponseText);

        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            const errorMsg = error.response?.status === 401
                ? "Invalid API Key. Please check your configuration."
                : "Sorry, I'm having trouble connecting to the server right now.";

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ ${errorMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card transition-colors">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50 shrink-0 transition-colors">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Sparkles size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-foreground">AI Tutor</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${mode === 'FULL_ASSISTANCE' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`}></div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{mode === 'FULL_ASSISTANCE' ? 'Active' : 'Limited'}</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <AnimatePresence initial={false}>
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                                }`}>
                                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] transition-colors ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-muted border border-border text-foreground rounded-bl-sm'
                                }`}>
                                {m.role === 'user' ? (
                                    <p>{m.content}</p>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:my-2 [&_code]:text-xs [&_code]:font-mono [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Loader2 size={14} className="animate-spin text-white" />
                        </div>
                        <div className="bg-muted border border-border rounded-xl rounded-bl-sm px-4 py-3 transition-colors">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card shrink-0 transition-colors">
                <div className="flex gap-2 items-center bg-muted/50 border border-border rounded-xl p-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about your code..."
                        disabled={loading}
                        className="flex-1 bg-transparent border-none px-2.5 py-1.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="p-2 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </form>
        </div>
    );
}