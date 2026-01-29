import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

const languageMap: Record<string, string> = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  sql: 'sql',
  html: 'html',
  css: 'css',
};

export function CodeEditor({ 
  content, 
  onChange, 
  language = 'cpp',
  readOnly = false,
  height = '500px'
}: CodeEditorProps) {
  const monacoLanguage = languageMap[language] || 'plaintext';

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Language: <span className="font-medium text-foreground uppercase">{language}</span>
        </span>
        {readOnly && (
          <span className="text-xs text-muted-foreground">Read only</span>
        )}
      </div>
      <Editor
        height={height}
        language={monacoLanguage}
        value={content}
        onChange={(value) => onChange(value || '')}
        theme="vs-light"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          folding: true,
          renderLineHighlight: 'line',
          tabSize: 2,
        }}
      />
    </div>
  );
}
