import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface WebTerminalProps {
    assignmentId: string;
    onExecute?: (command: string) => Promise<string>;
}

export interface WebTerminalRef {
    run: (command: string) => void;
}

const WebTerminal = forwardRef<WebTerminalRef, WebTerminalProps>(({ onExecute }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const commandBuffer = useRef('');

    useImperativeHandle(ref, () => ({
        run: (command: string) => {
             if (xtermRef.current) {
                 xtermRef.current.writeln(`\r\n$ ${command}`);
                 handleCommand(command, xtermRef.current);
             }
        }
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: '#000000', foreground: '#a9b7c6' },
            fontFamily: "'Fira Code', monospace",
            fontSize: 12,
            rows: 8,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        try { fitAddon.fit(); } catch(e) { /* ignore fit error on init */ }

        term.write('\x1b[1;34mstudent@acadflow\x1b[0m:\x1b[1;32m~/lab\x1b[0m$ ');

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
                term.write('\x1b[1;34mstudent@acadflow\x1b[0m:\x1b[1;32m~/lab\x1b[0m$ ');
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
             term.write(`Command executed: ${command}\r\n`);
        }
    };

    return <div className="h-full w-full bg-black p-1" ref={terminalRef} />;
});

WebTerminal.displayName = 'WebTerminal';
export default WebTerminal;