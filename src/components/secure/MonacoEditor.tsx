import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface MonacoEditorProps {
    initialValue?: string;
    language?: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    height?: string;
    theme?: 'vs-dark' | 'light';
}

export default function MonacoEditor({
    initialValue = '',
    language = 'javascript',
    onChange,
    readOnly = false,
    height = '100%',
    theme = 'vs-dark'
}: MonacoEditorProps) {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    return (
        <Editor
            height={height}
            language={language}
            value={initialValue}
            theme={theme}
            onChange={(value) => onChange?.(value || '')}
            onMount={handleEditorDidMount}
            options={{
                readOnly,
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                tabSize: 2,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                roundedSelection: false,
                cursorStyle: 'line',
            }}
        />
    );
}