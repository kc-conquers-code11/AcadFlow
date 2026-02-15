import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface WebTerminalProps {
    assignmentId: string;
    onExecute?: (command: string) => Promise<string>;
}

export interface WebTerminalRef {
    // Updated signature to support log types
    run: (command: string, type?: 'stdout' | 'stderr' | 'system') => void;
    clear: () => void;
}

const WebTerminal = forwardRef<WebTerminalRef, WebTerminalProps>(({ onExecute }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const commandBuffer = useRef('');

    useImperativeHandle(ref, () => ({
        run: (output: string, type: 'stdout' | 'stderr' | 'system' = 'stdout') => {
             if (xtermRef.current) {
                 // Handle ANSI Colors for Realistic Output
                 let formattedOutput = output;
                 
                 if (type === 'stderr') {
                     // Red color for errors
                     formattedOutput = `\x1b[31m${output}\x1b[0m`;
                 } else if (type === 'system') {
                     // Bold Blue for system messages
                     formattedOutput = `\x1b[1;34m${output}\x1b[0m`;
                 }

                 // Ensure newlines are handled correctly for xterm
                 const lines = formattedOutput.split('\n');
                 lines.forEach(line => xtermRef.current?.writeln(line));
             }
        },
        clear: () => {
            xtermRef.current?.clear();
        }
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: '#000000', foreground: '#a9b7c6', cursor: '#ffffff' },
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontSize: 13,
            lineHeight: 1.4,
            rows: 10,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        try { fitAddon.fit(); } catch(e) { /* ignore fit error on init */ }

        // Initial Prompt
        term.writeln('\x1b[1;34mWelcome to AcadFlow Secure Terminal v2.0\x1b[0m');
        term.write('\x1b[1;32mstudent@lab\x1b[0m:\x1b[1;34m~\x1b[0m$ ');

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Simple Shell Logic
        term.onData(async (data) => {
            const code = data.charCodeAt(0);
            if (code === 13) { // Enter
                const command = commandBuffer.current.trim();
                term.write('\r\n');
                if (command) await handleCommand(command, term);
                commandBuffer.current = '';
                term.write('\x1b[1;32mstudent@lab\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
            } else if (code === 127) { // Backspace
                if (commandBuffer.current.length > 0) {
                    commandBuffer.current = commandBuffer.current.slice(0, -1);
                    term.write('\b \b');
                }
            } else {
                commandBuffer.current += data;
                term.write(data);
            }
        });

        const handleResize = () => fitAddonRef.current?.fit();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    const handleCommand = async (command: string, term: Terminal) => {
        if (command === 'clear') {
            term.clear();
            return;
        }
        if (onExecute) {
             term.write('\x1b[33mProcessing...\x1b[0m\r\n');
             const output = await onExecute(command);
             term.write(output.replace(/\n/g, '\r\n') + '\r\n');
        } else {
             // Mock echo for basic interaction
             if(command.startsWith('echo ')) {
                 term.writeln(command.substring(5));
             } else {
                 term.writeln(`\x1b[31mbash: ${command}: command not found\x1b[0m`);
             }
        }
    };

    return <div className="h-full w-full bg-black p-2" ref={terminalRef} />;
});

WebTerminal.displayName = 'WebTerminal';
export default WebTerminal;