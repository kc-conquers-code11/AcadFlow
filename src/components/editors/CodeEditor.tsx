import { useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { 
  Code2, 
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
  filename?: string; // Optional: to show "main.cpp" etc.
}

const languageConfig: Record<string, { label: string; monaco: string; color: string }> = {
  c: { label: 'C', monaco: 'c', color: 'text-blue-600' },
  cpp: { label: 'C++', monaco: 'cpp', color: 'text-blue-600' },
  java: { label: 'Java', monaco: 'java', color: 'text-red-600' },
  python: { label: 'Python', monaco: 'python', color: 'text-yellow-600' },
  javascript: { label: 'JavaScript', monaco: 'javascript', color: 'text-yellow-500' },
  typescript: { label: 'TypeScript', monaco: 'typescript', color: 'text-blue-500' },
  sql: { label: 'SQL', monaco: 'sql', color: 'text-indigo-600' },
  html: { label: 'HTML', monaco: 'html', color: 'text-orange-600' },
  css: { label: 'CSS', monaco: 'css', color: 'text-blue-400' },
  json: { label: 'JSON', monaco: 'json', color: 'text-slate-600' },
};

export function CodeEditor({ 
  content, 
  onChange, 
  language = 'cpp',
  readOnly = false,
  height = '500px',
  filename
}: CodeEditorProps) {
  const [isCopied, setIsCopied] = useState(false);
  
  // Resolve language details
  const config = languageConfig[language.toLowerCase()] || { 
    label: language.toUpperCase(), 
    monaco: language, 
    color: 'text-slate-600' 
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Adjust Monaco Theme colors to match our "Slate" aesthetic
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('acadflow-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f1f5f9', // slate-100
        'editorLineNumber.foreground': '#94a3b8',   // slate-400
        'editor.selectionBackground': '#e0e7ff',    // indigo-100
      }
    });
    monaco.editor.setTheme('acadflow-light');
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm transition-all",
      readOnly ? "border-slate-200 bg-slate-50/50" : "border-slate-300 shadow-md shadow-slate-200/50"
    )}>
      
      {/* 1. Toolbar / Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-white border border-slate-200 shadow-sm">
            <FileCode size={14} className={config.color} />
            <span className="text-xs font-mono font-medium text-slate-700">
              {filename || `main.${config.monaco === 'python' ? 'py' : config.monaco === 'javascript' ? 'js' : config.monaco}`}
            </span>
          </div>

          {/* Read Only Badge */}
          {readOnly && (
            <Badge variant="secondary" className="h-6 gap-1 bg-slate-100 text-slate-500 font-normal border-slate-200">
              <Lock size={10} /> Read-Only
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
           {/* Language Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-2">
            <Terminal size={12} />
            {config.label}
          </div>

          {/* Action Buttons */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            onClick={handleCopy}
            title="Copy code"
          >
            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </Button>
        </div>
      </div>

      {/* 2. The Editor Canvas */}
      <div className="relative group">
        <Editor
          height={height}
          language={config.monaco}
          value={content}
          onChange={(value) => !readOnly && onChange?.(value || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: false }, // Cleaner look for students
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", // Better coding fonts
            fontLigatures: true,
            renderLineHighlight: 'line',
            tabSize: 2,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            overviewRulerBorder: false, // Cleaner UI
            hideCursorInOverviewRuler: true,
          }}
          className={cn(readOnly && "opacity-90")}
        />
        
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
      </div>

      {/* 3. Footer Status (Optional, for line count etc) */}
      {!readOnly && (
        <div className="bg-white border-t border-slate-100 px-4 py-1 flex justify-end">
          <span className="text-[10px] text-slate-300 font-mono">
            {content.split('\n').length} lines • UTF-8
          </span>
        </div>
      )}
    </div>
  );
}