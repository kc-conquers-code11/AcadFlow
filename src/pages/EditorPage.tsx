import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Save, Send, ChevronLeft, Loader2, Info,
    Terminal as TerminalIcon, ShieldAlert, Play, PlayCircle,
    Download, CopyPlus, Link as LinkIcon, BrainCircuit, RotateCcw,
    Sun, Moon, Code2, Cpu, Laptop2
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from 'next-themes';

// --- COMPONENTS ---
import { CodeEditor } from '@/components/editors/CodeEditor';
import DocumentEditor from '@/components/secure/DocumentEditor';
import AIAssistant from '@/components/secure/AIAssistant';
import SecurityEngine from '@/components/secure/SecurityEngine';
import WebTerminal, { WebTerminalRef } from '@/components/secure/WebTerminal';

// --- API CONFIG ---
const PISTON_API = "https://emkc.org/api/v2/piston/execute";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// --- LANGUAGE CONFIG ---
const LANGUAGES = [
    { id: 'python', name: 'Python 3', icon: Code2, piston: 'python', ver: '3.10.0' },
    { id: 'c', name: 'C (GCC)', icon: Code2, piston: 'c', ver: '10.2.0' },
    { id: 'cpp', name: 'C++ (G++)', icon: Code2, piston: 'c++', ver: '10.2.0' },
    { id: 'java', name: 'Java', icon: Code2, piston: 'java', ver: '15.0.2' },
    { id: 'javascript', name: 'NodeJS', icon: Code2, piston: 'javascript', ver: '18.15.0' },
    { id: 'asm', name: 'Assembly (NASM)', icon: Cpu, piston: 'nasm', ver: '2.15.05' },
    { id: 'bash', name: 'OS (Bash)', icon: Laptop2, piston: 'bash', ver: '5.1.0' },
    { id: 'sql', name: 'SQL (SQLite)', icon: Code2, piston: 'sqlite3', ver: '3.36.0' }
];

export default function EditorPage() {
    const { practicalId } = useParams<{ practicalId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    // --- UI STATES ---
    const [loading, setLoading] = useState(true);
    const [isExamStarted, setIsExamStarted] = useState(false);
    const [activeTab, setActiveTab] = useState('code');
    const [violationCount, setViolationCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [activeDocSection, setActiveDocSection] = useState('theory');

    // Dialog States
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [vivaDialogOpen, setVivaDialogOpen] = useState(false);

    // Security & Violation States
    const [violationLogs, setViolationLogs] = useState<any[]>([]);

    // Viva States
    const [vivaLoading, setVivaLoading] = useState(false);
    const [vivaQuestions, setVivaQuestions] = useState<any[]>([]);
    const [vivaAnswers, setVivaAnswers] = useState<Record<number, string>>({});
    const [vivaCleared, setVivaCleared] = useState(false);
    const [vivaScore, setVivaScore] = useState(0);

    // --- DATA STATES ---
    const [task, setTask] = useState<any>(null);
    const [isPractical, setIsPractical] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [selectedLang, setSelectedLang] = useState('python');

    // --- CONTENT STATES ---
    const [codeContent, setCodeContent] = useState('');
    const [docSections, setDocSections] = useState<Record<string, string>>({});
    const [aiScore, setAiScore] = useState<number | null>(null);
    const [executionOutput, setExecutionOutput] = useState('');
    const [outputLink, setOutputLink] = useState('');
    const [imageLink, setImageLink] = useState('');

    const [submission, setSubmission] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const terminalRef = useRef<WebTerminalRef>(null);

    // 1. Fetch Data
    useEffect(() => {
        if (!practicalId || !user) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                let foundTask = null;
                let isPrac = false;

                const { data: prac } = await supabase.from('batch_practicals').select('*').eq('id', practicalId).maybeSingle();
                if (prac) {
                    foundTask = prac;
                    isPrac = true;
                    setSubjectName(prac.subject_code || 'Practical Lab');
                } else {
                    const { data: assign } = await supabase.from('assignments').select('*').eq('id', practicalId).maybeSingle();
                    if (assign) {
                        foundTask = assign;
                        isPrac = false;
                        if (assign.subject_id) {
                            const { data: sub } = await supabase.from('subjects').select('name, code').eq('id', assign.subject_id).single();
                            if (sub) setSubjectName(`${sub.name} (${sub.code})`);
                        }
                    }
                }

                if (!foundTask) throw new Error("Task not found.");
                setTask(foundTask);
                setIsPractical(isPrac);

                // Auto-detect Language from Title
                const title = foundTask.title.toLowerCase();
                if (title.includes('cpp') || title.includes('c++')) setSelectedLang('cpp');
                else if (title.includes('java')) setSelectedLang('java');
                else if (title.includes('javascript') || title.includes('node')) setSelectedLang('javascript');
                else if (title.includes('mpmc') || title.includes('asm') || title.includes('microprocessor')) setSelectedLang('asm');
                else if (title.includes('os') || title.includes('linux') || title.includes('bash')) setSelectedLang('bash');
                else if (title.includes('sql')) setSelectedLang('sql');
                else if (title.includes('c programming')) setSelectedLang('c');
                else setSelectedLang('python');

                // Fetch Submission
                let query = supabase.from('submissions').select(`*, grader:grader_id(name)`).eq('student_id', user.id);
                if (isPrac) query = query.eq('practical_id', practicalId);
                else query = query.eq('assignment_id', practicalId);

                const { data: sub } = await query.maybeSingle();

                if (sub) {
                    setSubmission(sub);
                    setLastSaved(sub.last_saved_at ? new Date(sub.last_saved_at) : null);
                    setAiScore(sub.ai_score);
                    setOutputLink(sub.output_link || '');
                    setImageLink(sub.image_link || '');

                    if (sub.violation_logs && Array.isArray(sub.violation_logs)) {
                        setViolationLogs(sub.violation_logs);
                        setViolationCount(sub.violation_logs.length);
                    }

                    if (sub.viva_cleared) {
                        setVivaCleared(true);
                        setVivaScore(sub.viva_score || 0);
                    }

                    if (sub.content) {
                        let parsed: any = sub.content;
                        if (typeof sub.content === 'string') {
                            try { parsed = JSON.parse(sub.content); } catch { /* ignore */ }
                        }
                        setCodeContent(parsed.code || '');
                        setExecutionOutput(parsed.output || '');
                        if (parsed.language) setSelectedLang(parsed.language);

                        if (parsed.text) {
                            try {
                                const sections = JSON.parse(parsed.text);
                                setDocSections(typeof sections === 'object' ? sections : { theory: parsed.text });
                            } catch {
                                setDocSections({ theory: parsed.text });
                            }
                        }
                    }
                }
            } catch (err: any) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [practicalId, user]);

    // --- API: GENERATE VIVA ---
    const generateVivaQuestions = async () => {
        setVivaLoading(true);
        setVivaDialogOpen(true);

        const context = `
        Code Snippet: ${codeContent.substring(0, 1500)}
        Theory Concept: ${JSON.stringify(docSections).substring(0, 1000)}
      `;

        try {
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are an external examiner. Generate 3 multiple-choice questions (MCQs) based strictly on the provided code logic and theory to test if the student truly understands what they wrote. Return JSON format: { 'questions': [{ 'id': 1, 'text': 'Question?', 'options': ['A', 'B', 'C', 'D'], 'correctAnswer': 'The Correct Option Text' }] }." },
                        { role: "user", content: context }
                    ],
                    response_format: { type: "json_object" }
                },
                { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } }
            );

            const result = JSON.parse(response.data.choices[0].message.content);
            if (result.questions && Array.isArray(result.questions)) {
                setVivaQuestions(result.questions.slice(0, 3));
            } else {
                throw new Error("Invalid question format");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate Viva. Please try again.");
            setVivaDialogOpen(false);
        } finally {
            setVivaLoading(false);
        }
    };

    const handleVivaSubmit = async () => {
        let correctCount = 0;
        vivaQuestions.forEach(q => {
            if (vivaAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        const passed = correctCount >= 2;

        if (passed) {
            setVivaCleared(true);
            setVivaScore(correctCount);
            toast.success("Viva Cleared! Submitting...");
            setVivaDialogOpen(false);
            await upsertSubmission('submitted', undefined, undefined, true, correctCount);
        } else {
            toast.error(`Viva Failed (${correctCount}/3). You must understand your code to submit. Try again.`);
            setVivaAnswers({});
        }
    };

    // --- EXECUTION LOGIC ---
    const runCodeOnPiston = async (langId: string, code: string) => {
        const config = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
        try {
            const response = await axios.post(PISTON_API, {
                language: config.piston,
                version: config.ver,
                files: [{ content: code }]
            });
            return response.data.run;
        } catch (error: any) {
            return { stderr: "Compiler Connection Error: " + error.message, stdout: "" };
        }
    };

    const gradeWithGroq = async (code: string, output: string, taskTitle: string, taskDesc: string) => {
        if (!GROQ_API_KEY) return 0;
        const prompt = `Act as a strict Computer Science Professor. Task: ${taskTitle}. Desc: ${taskDesc}. Code: ${code}. Output: ${output}. Analyze logic & correctness. Return ONLY valid JSON: { "score": number (0-100) }`;
        try {
            const response = await axios.post(GROQ_API_URL, {
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });
            const result = JSON.parse(response.data.choices[0].message.content);
            return result.score || 0;
        } catch { return 0; }
    };

    const handleRunCode = async () => {
        if (!codeContent.trim()) { toast.error("Write code first!"); return; }
        setIsRunning(true);
        
        terminalRef.current?.clear();
        terminalRef.current?.run(`[System] Compiling ${selectedLang.toUpperCase()} source code...`, 'system');

        const result = await runCodeOnPiston(selectedLang, codeContent);
        let output = result.stdout;
        let error = result.stderr;

        // --- REALISTIC TASM SIMULATION ---
        if (selectedLang === 'asm') {
            if (error) {
                terminalRef.current?.run(`\nTASM Assembler Version 4.1`, 'system');
                terminalRef.current?.run(error, 'stderr');
            } else {
                terminalRef.current?.run(`\nTASM Assembler Version 4.1  Copyright (c) 1988, 1996 Borland International`, 'system');
                terminalRef.current?.run(`\nAssembling file:   source.asm\nError messages:    None\nWarning messages:  None\nPasses:            1\nRemaining memory:  412k`, 'stdout');
                terminalRef.current?.run(`\n[System] Executing .EXE file...`, 'system');
                terminalRef.current?.run(output || "Program executed successfully.", 'stdout');
            }
        } 
        else {
            if (error) terminalRef.current?.run(error, 'stderr');
            if (output) terminalRef.current?.run(output, 'stdout');
            if (!error && !output) terminalRef.current?.run("Program executed with no output.", 'system');
        }

        const finalOutput = (output || "") + "\n" + (error || "");
        setExecutionOutput(finalOutput);

        terminalRef.current?.run("\n[System] AI Grading in progress...", 'system');
        
        gradeWithGroq(codeContent, finalOutput, task.title, task.description).then(score => {
            setAiScore(score);
            terminalRef.current?.run(`[System] Grading Complete. AI Estimate: ${score}/100`, 'system');
        });

        setIsRunning(false);
        await upsertSubmission('draft', undefined, finalOutput);
    };

    const handleCopyToReport = () => {
        if (!executionOutput) {
            toast.error("No output to copy! Run code first.");
            return;
        }
        const outputHtml = `<pre style="background:#f4f4f5; padding:10px; border-radius:5px;"><code>${executionOutput}</code></pre>`;
        const currentOutputSection = docSections['output'] || '';
        setDocSections(prev => ({
            ...prev,
            output: (currentOutputSection ? currentOutputSection + '<br/>' : '') + `<p><strong>Execution Result:</strong></p>` + outputHtml
        }));
        setActiveTab('report');
        setActiveDocSection('output');
        toast.success("Output appended to Report!");
    };

    // --- SAVE & SUBMIT ---
    const upsertSubmission = async (status: 'draft' | 'submitted', overrideAiScore?: number, overrideOutput?: string, isVivaCleared?: boolean, vivaScoreVal?: number) => {
        if (!user || !task) return;
        setIsSaving(true);
        try {
            const textPayload = JSON.stringify(docSections);
            const contentPayload = {
                code: codeContent,
                language: selectedLang,
                text: textPayload,
                output: overrideOutput !== undefined ? overrideOutput : executionOutput
            };

            const payload: any = {
                student_id: user.id,
                content: contentPayload,
                status: status,
                last_saved_at: new Date().toISOString(),
                ai_score: overrideAiScore !== undefined ? overrideAiScore : aiScore,
                output_link: outputLink,
                image_link: imageLink,
                viva_cleared: isVivaCleared !== undefined ? isVivaCleared : vivaCleared,
                viva_score: vivaScoreVal !== undefined ? vivaScoreVal : vivaScore,
                violation_logs: violationLogs
            };

            if (status === 'submitted') payload.submitted_at = new Date().toISOString();
            if (isPractical) payload.practical_id = task.id; else payload.assignment_id = task.id;

            const { data, error } = await supabase
                .from('submissions')
                .upsert(payload, { onConflict: isPractical ? 'student_id,practical_id' : 'student_id,assignment_id' })
                .select().single();

            if (error) throw error;
            setSubmission(data);
            setLastSaved(new Date(data.last_saved_at));

            if (status === 'submitted') {
                toast.success("Submitted Successfully!");
                navigate(-1);
            } else {
                toast.success("Progress Saved");
            }
        } catch (err: any) {
            toast.error("Action failed: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => upsertSubmission('draft');

    const handleSubmitClick = () => {
        if (!vivaCleared) {
            if (!codeContent || Object.keys(docSections).length === 0) {
                toast.error("Please complete code and report before submitting.");
                return;
            }
            generateVivaQuestions();
        } else {
            if (confirm("Submit final version? You cannot edit after this.")) {
                upsertSubmission('submitted');
            }
        }
    };

    const handleStartExam = () => {
        document.documentElement.requestFullscreen().catch(console.error);
        setIsExamStarted(true);
        toast.success("Secure Environment Activated");
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=800');
        const printContent = document.getElementById('printable-area');
        if (printWindow && printContent) {
            printWindow.document.write(`<html><head><title>Report</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-4">${printContent.innerHTML}</body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // --- Theme Toggle Handler ---
    const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        document.documentElement.style.setProperty('--theme-x', `${x}px`);
        document.documentElement.style.setProperty('--theme-y', `${y}px`);
        document.documentElement.style.setProperty('--theme-r', `${maxRadius}px`);
        if ((document as any).startViewTransition) {
            (document as any).startViewTransition(() => setTheme(theme === 'dark' ? 'light' : 'dark'));
        } else {
            setTheme(theme === 'dark' ? 'light' : 'dark');
        }
    };

    // --- RENDER ---
    if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
    if (!task) return <div className="p-10 text-center bg-background text-foreground text-lg">Task not found.</div>;

    const isEvaluated = submission?.status === 'evaluated';
    const isSubmitted = submission?.status === 'submitted';
    const isRedoRequested = submission?.status === 'redo_requested'; 
    const isReadOnly = (isEvaluated || isSubmitted) && !isRedoRequested;

    if (isReadOnly) {
        return (
            <div className="flex flex-col h-screen bg-background overflow-hidden transition-colors">
                <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
                    <Button variant="ghost" onClick={() => navigate(-1)}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <h1 className="font-bold text-foreground text-lg flex items-center gap-2">
                        {task.title}
                        {isEvaluated ? <Badge className="bg-green-600 text-white">Graded: {submission.marks}</Badge> : <Badge variant="outline" className="text-primary border-primary bg-primary/10">Submitted</Badge>}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button onClick={handleThemeToggle} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Toggle Theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
                        <Button onClick={handlePrint} variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Download Report</Button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-muted/30">
                    <div id="printable-area" className="w-[210mm] min-h-[297mm] bg-card text-foreground shadow-xl rounded-xl p-[15mm] flex flex-col border border-border">
                        <div className="mb-6 border-b-2 border-foreground/20 pb-2"><img src="/images/letterhead.jpg" alt="Letterhead" className="w-full max-h-32 object-contain mx-auto" onError={(e) => { e.currentTarget.style.display = 'none' }} /></div>
                        {vivaCleared && <div className="absolute top-[15mm] right-[15mm] border-2 border-green-600 text-green-700 dark:text-green-400 font-bold px-3 py-1 text-xs uppercase rounded rotate-12 opacity-80 flex items-center gap-1"><BrainCircuit size={14} /> Viva Cleared ({vivaScore}/3)</div>}
                        {(outputLink || imageLink) && (
                            <div className="flex gap-4 mb-4">
                                {outputLink && <div className="flex-1 bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm"><span className="font-bold text-primary block mb-1">External Link:</span><a href={outputLink} target="_blank" rel="noreferrer" className="text-primary underline break-all">{outputLink}</a></div>}
                                {imageLink && <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 p-3 rounded-lg text-sm"><span className="font-bold text-purple-700 dark:text-purple-400 block mb-1">Attached Image:</span><a href={imageLink} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 underline break-all block mb-2">{imageLink}</a><img src={imageLink} alt="Screenshot" className="max-h-24 rounded border border-purple-200 dark:border-purple-800 object-cover" onError={(e) => e.currentTarget.style.display = 'none'} /></div>}
                            </div>
                        )}
                        <div className="flex-1 space-y-6">
                            {Object.entries(docSections).map(([key, val]) => (<div key={key}><h4 className="text-sm font-bold text-muted-foreground uppercase mb-1">{key}</h4><div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: val }} /></div>))}
                            {codeContent && (<div><h4 className="text-sm font-bold text-muted-foreground uppercase mb-1">Source Code</h4><div className="bg-muted p-4 rounded-lg border border-border font-mono text-xs whitespace-pre-wrap">{codeContent}</div></div>)}
                            {executionOutput && (<div><h4 className="text-sm font-bold text-muted-foreground uppercase mb-1">Execution Output</h4><div className="bg-zinc-900 text-green-400 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap">{executionOutput}</div></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isExamStarted) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background p-4 transition-colors">
                <div className="max-w-lg w-full bg-card rounded-2xl shadow-xl border border-border p-10 text-center space-y-8">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center"><ShieldAlert className="w-8 h-8 text-primary" /></div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">{task.title}</h1>
                        <p className="text-muted-foreground text-base">{subjectName}</p>
                        <p className="text-muted-foreground text-sm">Secure AI-Powered Assessment Environment</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2 border border-border">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Info size={16} className="text-primary" /> Before you begin:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                            <li>Your screen will enter fullscreen mode</li>
                            <li>Tab switching will be monitored</li>
                            <li>AI will grade your code upon execution</li>
                            <li>A Viva quiz is required before final submission</li>
                        </ul>
                    </div>
                    <Button onClick={handleStartExam} size="lg" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"><Play size={20} /> Start Solving</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden transition-colors">
            <SecurityEngine
                submissionId={practicalId || ''}
                isPaused={linkDialogOpen || vivaDialogOpen}
                onViolation={(type, details) => {
                    setViolationCount(prev => prev + 1);
                    setViolationLogs(prev => [...prev, { type, ...details }]);
                    if (type === 'FOCUS_LOST') toast.warning("⚠️ Tab switching detected!");
                }}
            />

            {/* HEADER */}
            <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></Button>
                    <div>
                        <h1 className="font-bold text-base text-foreground flex items-center gap-2">
                            {task.title}
                            {violationCount > 0 && <Badge variant="destructive" className="h-5 text-xs animate-pulse">{violationCount} Violations</Badge>}
                        </h1>
                        <p className="text-xs text-muted-foreground">{subjectName} • Secure Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* LANGUAGE SELECTOR */}
                    <Select value={selectedLang} onValueChange={setSelectedLang}>
                        <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map(l => (
                                <SelectItem key={l.id} value={l.id} className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <l.icon size={12} /> {l.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <button onClick={handleThemeToggle} className="p-2 rounded-lg border border-border bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" aria-label="Toggle Theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
                    
                    <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline" size="sm" className={`h-8 border-border bg-secondary text-foreground ${(outputLink || imageLink) ? 'border-green-500 text-green-600 dark:text-green-400' : ''}`}><LinkIcon className="h-3.5 w-3.5 mr-2" /> {(outputLink || imageLink) ? 'Attached' : 'Add Links'}</Button></DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground"><DialogHeader><DialogTitle>Attach Assets</DialogTitle></DialogHeader><div className="space-y-4 pt-2"><div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">⚠️ Security Note: Tab switching is allowed ONLY while this popup is open.</div><div className="space-y-2"><Label className="text-xs uppercase text-muted-foreground font-bold">Output Link</Label><Input placeholder="https://..." value={outputLink} onChange={(e) => setOutputLink(e.target.value)} className="bg-background border-border" /></div><div className="space-y-2"><Label className="text-xs uppercase text-muted-foreground font-bold">Screenshot Link</Label><Input placeholder="https://imgur.com/..." value={imageLink} onChange={(e) => setImageLink(e.target.value)} className="bg-background border-border" /></div></div><DialogFooter><Button onClick={() => setLinkDialogOpen(false)}>Done</Button></DialogFooter></DialogContent>
                    </Dialog>
                    {aiScore !== null && <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10 text-sm">AI Score: {aiScore}/100</Badge>}
                    <Button variant="outline" size="sm" onClick={() => upsertSubmission('draft')} disabled={isSaving} className="h-8 border-border bg-secondary text-foreground">{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />} Save</Button>
                    <Button size="sm" onClick={handleSubmitClick} className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">Submit <Send className="h-3.5 w-3.5 ml-2" /></Button>
                </div>
            </header>

            {isRedoRequested && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 p-2 px-4 flex items-center justify-between text-orange-600 dark:text-orange-400 text-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2"><RotateCcw size={14} className="animate-pulse" /><span className="font-bold">REDO REQUESTED:</span><span className="italic">"{submission.feedback || 'Please review and resubmit.'}"</span></div>
                    <Button variant="ghost" size="sm" className="h-5 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-500" onClick={() => toast.info("Make changes and click Submit to resolve.")}>How to fix?</Button>
                </div>
            )}

            <Dialog open={vivaDialogOpen} onOpenChange={(open) => { if (!open && !vivaCleared) return; setVivaDialogOpen(open); }}>
                <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[85vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                    <DialogHeader className="shrink-0"><DialogTitle className="flex items-center gap-2 text-xl"><BrainCircuit className="text-purple-500" /> AI Viva Assessment</DialogTitle><DialogDescription className="text-muted-foreground text-sm">To ensure you understand the code you wrote, answer these 3 questions generated from your submission. You must score at least <strong>2/3</strong> to submit.</DialogDescription></DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                        {vivaLoading ? <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-4"><Loader2 className="h-10 w-10 animate-spin text-purple-500" /><p className="text-base">Analyzing your code & generating questions...</p></div> : <div className="space-y-6 py-4">{vivaQuestions.map((q, idx) => (<div key={q.id} className="space-y-3 border-b border-border pb-4 last:border-0"><p className="font-medium text-foreground text-base"><span className="text-purple-500 dark:text-purple-400 font-bold mr-2">Q{idx + 1}.</span> {q.text}</p><div className="space-y-2">{q.options.map((opt: string, i: number) => (<label key={i} className="flex items-center space-x-3 cursor-pointer p-2.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all"><input type="radio" name={`q${q.id}`} value={opt} onChange={() => setVivaAnswers(prev => ({ ...prev, [q.id]: opt }))} className="w-4 h-4 text-purple-600 bg-background border-border focus:ring-purple-500 focus:ring-2" /><span className="text-foreground text-sm">{opt}</span></label>))}</div></div>))}</div>}
                    </div>
                    <DialogFooter className="shrink-0 mt-4"><Button variant="ghost" onClick={() => setVivaDialogOpen(false)} disabled={vivaLoading}>Cancel (Edit Code)</Button><Button onClick={handleVivaSubmit} disabled={vivaLoading || Object.keys(vivaAnswers).length < vivaQuestions.length} className="bg-purple-600 hover:bg-purple-700 text-white">Submit Answers</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MAIN BODY - Flex Layout Fixed for 100% Scale */}
            <div className="flex-1 flex flex-row overflow-hidden">
                <aside className="w-80 border-r border-border bg-muted/40 dark:bg-card hidden lg:block overflow-y-auto p-5 transition-colors shrink-0">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Info size={16} /> Instructions</h3>
                    <div className="prose prose-sm dark:prose-invert text-foreground text-base leading-relaxed">{task.description}</div>
                </aside>

                <main className="flex-1 flex flex-col bg-background border-r border-border transition-colors min-w-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-4 border-b border-border bg-card transition-colors shrink-0">
                            <TabsList className="bg-transparent h-10 p-0 gap-4">
                                <TabsTrigger value="code" className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-medium">Code Solution</TabsTrigger>
                                <TabsTrigger value="report" className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-medium">Lab Report</TabsTrigger>
                            </TabsList>
                            {activeTab === 'code' && <Button size="sm" onClick={handleRunCode} disabled={isRunning} className="h-8 bg-green-600 hover:bg-green-700 text-white text-sm gap-2 rounded-lg font-medium">{isRunning ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <PlayCircle size={16} />} Run & Check</Button>}
                        </div>
                        <TabsContent value="code" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
                            <div className="flex-1 min-h-0 relative">
                                <CodeEditor 
                                    content={codeContent} 
                                    language={selectedLang} 
                                    theme={theme}
                                    filename={`main.${selectedLang === 'python' ? 'py' : selectedLang === 'asm' ? 'asm' : selectedLang === 'c' ? 'c' : selectedLang === 'cpp' ? 'cpp' : 'txt'}`} 
                                    onChange={setCodeContent} 
                                />
                            </div>
                            <div className="h-48 border-t border-border bg-zinc-950 flex flex-col shrink-0">
                                <div className="px-4 py-1.5 bg-muted text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-2"><TerminalIcon size={14} /> Console Output</div>
                                    <button onClick={handleCopyToReport} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-muted-foreground hover:bg-secondary px-2 py-0.5 rounded-md"><CopyPlus size={12} /> <span className="text-xs">Append to Report</span></button>
                                </div>
                                <div className="flex-1 overflow-hidden relative p-1"><WebTerminal ref={terminalRef} assignmentId={practicalId || ''} /></div>
                            </div>
                        </TabsContent>
                        <TabsContent value="report" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden bg-muted/30 dark:bg-background p-6 overflow-y-auto transition-colors">
                            <div className="max-w-4xl mx-auto w-full h-full"><DocumentEditor initialValues={docSections} onChange={(id, val) => setDocSections(prev => ({ ...prev, [id]: val }))} activeSection={activeDocSection} onSectionChange={setActiveDocSection} /></div>
                        </TabsContent>
                    </Tabs>
                </main>
                
                <aside className="w-80 bg-card flex flex-col h-full overflow-hidden border-l border-border transition-colors shrink-0 hidden xl:flex">
                    <AIAssistant mode="FULL_ASSISTANCE" codeContext={codeContent}
                    subject={subjectName || "Computer Science"}  // <--- Pass Subject
                    taskTitle={task?.title || "Coding Task"}    
                    onLog={(p, r) => console.log(p)} />
                </aside>
            </div>
        </div>
    );
}