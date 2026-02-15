import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface WebTerminalProps {
    assignmentId: string;
    onExecute?: (command: string) => Promise<string>;
}

export interface WebTerminalRef {
    run: (command: string, type?: 'stdout' | 'stderr' | 'system' | 'info') => void;
    clear: () => void;
}

const WebTerminal = forwardRef<WebTerminalRef, WebTerminalProps>(({ onExecute }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const commandBuffer = useRef('');

    useImperativeHandle(ref, () => ({
        run: (output: string, type: 'stdout' | 'stderr' | 'system' | 'info' = 'stdout') => {
            if (xtermRef.current) {
                let formattedOutput = output;

                // Colorize based on type
                if (type === 'stderr') {
                    formattedOutput = `\x1b[31m${output}\x1b[0m`; // Red
                } else if (type === 'system') {
                    formattedOutput = `\x1b[1;34m${output}\x1b[0m`; // Bold Blue
                } else if (type === 'info') {
                    formattedOutput = `\x1b[36m${output}\x1b[0m`; // Cyan
                }

                // Fix Line Endings for Xterm (Critical for formatting)
                // If the string is pure JSON or code, we don't want to break it, 
                // but for display we need \r\n
                formattedOutput = formattedOutput.replace(/\n/g, '\r\n');

                xtermRef.current.writeln(formattedOutput);

                // Scroll to bottom
                xtermRef.current.scrollToBottom();
            }
        },
        clear: () => {
            xtermRef.current?.clear();
        }
    }));

    useEffect(() => {
        if (!terminalRef.current) return;

        // 1. Initialize Terminal
        const term = new Terminal({
            cursorBlink: true,
            convertEol: true, // Auto convert \n to \r\n
            theme: {
                background: '#09090b', // Matches zinc-950
                foreground: '#a1a1aa', // Matches zinc-400
                cursor: '#ffffff',
                selectionBackground: 'rgba(255, 255, 255, 0.3)'
            },
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontSize: 12,
            lineHeight: 1.4,
            scrollback: 1000,

        });

        // 2. Initialize Fit Addon
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // 3. Initial Fit (With slight delay to ensure DOM is painted)
        setTimeout(() => {
            try { fitAddon.fit(); } catch (e) { console.log('Fit error:', e); }
        }, 50);

        // 4. Initial Prompt
        term.writeln('\x1b[1;34mWelcome to AcadFlow Secure Runtime v2.4\x1b[0m');
        term.write('\x1b[1;32mstudent@lab\x1b[0m:\x1b[1;34m~\x1b[0m$ ');

        // 5. ROBUST RESIZE OBSERVER (Fixes "Vertical Text" issue)
        const resizeObserver = new ResizeObserver(() => {
            // Request animation frame prevents "ResizeObserver loop limit exceeded"
            requestAnimationFrame(() => {
                if (fitAddonRef.current && terminalRef.current) {
                    try {
                        fitAddonRef.current.fit();
                    } catch (e) {
                        // Suppress resize errors during rapid dragging
                    }
                }
            });
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        // 6. Shell Logic
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

        return () => {
            resizeObserver.disconnect();
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
            if (command.startsWith('echo ')) {
                term.writeln(command.substring(5));
            } else if (command === 'help') {
                term.writeln('Available commands: echo, clear, help');
            } else {
                term.writeln(`\x1b[31mbash: ${command}: command not found\x1b[0m`);
            }
        }
    };

    // Ensure container takes full size so xterm fills it
    return (
        <div
            className="h-full w-full overflow-hidden bg-zinc-950 pl-2 pb-1"
            ref={terminalRef}
        />
    );
});

WebTerminal.displayName = 'WebTerminal';
export default WebTerminal;