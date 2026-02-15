import { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { 
  Copy, 
  Check, 
  Lock, 
  FileCode, 
  Terminal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CodeEditorProps {
  content: string;
  onChange?: (content: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  filename?: string;
  theme?: string; // Added Theme Prop
}

const languageConfig: Record<string, { label: string; monaco: string; color: string }> = {
  c: { label: 'C (GCC)', monaco: 'c', color: 'text-blue-600' },
  cpp: { label: 'C++', monaco: 'cpp', color: 'text-blue-600' },
  java: { label: 'Java', monaco: 'java', color: 'text-red-600' },
  python: { label: 'Python', monaco: 'python', color: 'text-yellow-600' },
  javascript: { label: 'JavaScript', monaco: 'javascript', color: 'text-yellow-500' },
  typescript: { label: 'TypeScript', monaco: 'typescript', color: 'text-blue-500' },
  sql: { label: 'SQL', monaco: 'sql', color: 'text-indigo-600' },
  html: { label: 'HTML', monaco: 'html', color: 'text-orange-600' },
  css: { label: 'CSS', monaco: 'css', color: 'text-blue-400' },
  json: { label: 'JSON', monaco: 'json', color: 'text-slate-600' },
  asm: { label: 'ASM (8086)', monaco: 'ini', color: 'text-red-500' },
  bash: { label: 'Terminal/OS', monaco: 'shell', color: 'text-gray-600' },
};

export function CodeEditor({ 
  content, 
  onChange, 
  language = 'python',
  readOnly = false,
  filename,
  theme = 'light' // Default to light
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Resolve language details
  const config = languageConfig[language.toLowerCase()] || { 
    label: language.toUpperCase(), 
    monaco: language, 
    color: 'text-slate-600' 
  };

  // Handle Theme Switching Dynamically
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'acadflow-dark' : 'acadflow-light');
    }
  }, [theme]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Light Theme
    monaco.editor.defineTheme('acadflow-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorLineNumber.foreground': '#94a3b8',
        'editor.selectionBackground': '#e0e7ff',
      }
    });

    // Define Dark Theme
    monaco.editor.defineTheme('acadflow-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#09090b', // zinc-950 matches your app dark mode
        'editor.lineHighlightBackground': '#27272a',
        'editorLineNumber.foreground': '#71717a',
        'editor.selectionBackground': '#3f3f46',
      }
    });

    monaco.editor.setTheme(theme === 'dark' ? 'acadflow-dark' : 'acadflow-light');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-xl overflow-hidden h-full transition-colors duration-300",
      theme === 'dark' ? "border-zinc-800 bg-zinc-950" : "border-slate-300 bg-white shadow-sm"
    )}>
      
      {/* 1. Toolbar / Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b backdrop-blur-sm transition-colors duration-300",
        theme === 'dark' ? "border-zinc-800 bg-zinc-900/50" : "border-slate-200 bg-slate-50/50"
      )}>
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className={cn(
            "flex items-center gap-2 px-2 py-1 rounded border shadow-sm transition-colors",
            theme === 'dark' ? "bg-zinc-900 border-zinc-700" : "bg-white border-slate-200"
          )}>
            <FileCode size={14} className={config.color} />
            <span className={cn("text-xs font-mono font-medium", theme === 'dark' ? "text-zinc-300" : "text-slate-700")}>
              {filename || `main.${config.monaco === 'python' ? 'py' : config.monaco}`}
            </span>
          </div>

          {/* Read Only Badge */}
          {readOnly && (
            <Badge variant="secondary" className="h-6 gap-1 font-normal opacity-80">
              <Lock size={10} /> Read-Only
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
           {/* Language Indicator */}
          <div className={cn("hidden sm:flex items-center gap-1.5 text-xs font-medium mr-2", theme === 'dark' ? "text-zinc-400" : "text-slate-400")}>
            <Terminal size={12} />
            {config.label}
          </div>

          {/* Copy Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 opacity-70 hover:opacity-100"
            onClick={copyToClipboard}
            title="Copy code"
          >
            <Copy size={14} />
          </Button>
        </div>
      </div>

      {/* 2. The Editor Canvas */}
      <div className="relative flex-1 min-h-0">
        <Editor
          height="100%"
          language={config.monaco}
          value={content}
          onChange={(value) => !readOnly && onChange?.(value || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            renderLineHighlight: 'line',
            tabSize: 2,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
          }}
          className={cn(readOnly && "opacity-90")}
        />
      </div>

      {/* 3. Footer Status */}
      {!readOnly && (
        <div className={cn(
          "border-t px-4 py-1 flex justify-end transition-colors duration-300",
          theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-100"
        )}>
          <span className={cn("text-[10px] font-mono", theme === 'dark' ? "text-zinc-500" : "text-slate-300")}>
            {content.split('\n').length} lines • UTF-8
          </span>
        </div>
      )}
    </div>
  );
}