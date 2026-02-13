import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';

// --- CONFIG ---
// Use the standard OpenAI-compatible endpoint provided by Groq
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
        <div className="flex flex-col h-full bg-[#0c0c0e] border-l border-slate-800">
            {/* Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#18181b] shrink-0">
                <div className="flex items-center gap-2">
                    <Bot size={16} className="text-purple-400" />
                    <span className="text-xs font-bold text-slate-300">AI Tutor</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${mode === 'FULL_ASSISTANCE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{mode === 'FULL_ASSISTANCE' ? 'Active' : 'Limited'}</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <div className={`rounded-lg p-3 text-xs leading-relaxed max-w-[85%] border shadow-sm ${
                            m.role === 'user' 
                                ? 'bg-blue-600/10 text-blue-100 border-blue-600/20' 
                                : 'bg-[#1e1e20] text-slate-300 border-slate-800'
                        }`}>
                            {/* Simple rendering for paragraphs */}
                            {m.content.split('\n').map((line, i) => (
                                <p key={i} className={`min-h-[0.5rem] ${line.trim() === '' ? 'h-2' : ''}`}>{line}</p>
                            ))}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                            <Loader2 size={12} className="animate-spin" />
                        </div>
                        <div className="bg-[#1e1e20] text-slate-500 border border-slate-800 rounded-lg p-3 text-xs">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 flex gap-2 bg-[#0c0c0e] shrink-0">
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Ask about your code..." 
                    disabled={loading}
                    className="flex-1 bg-[#1e1e20] border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 disabled:opacity-50"
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim()} 
                    className="p-2 bg-purple-600 rounded-md text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-900/20"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
            </form>
        </div>
    );
}