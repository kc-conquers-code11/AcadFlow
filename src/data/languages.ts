import {
    FileCode,
    Code2,
    Terminal,
    Database,
    Cpu
} from 'lucide-react';

export const LANGUAGES = [
    { id: 'python', name: 'Python', piston: 'python', ver: '3.10.0', icon: FileCode },
    { id: 'javascript', name: 'JavaScript', piston: 'javascript', ver: '18.15.0', icon: FileCode },
    { id: 'cpp', name: 'C++', piston: 'cpp', ver: '10.2.0', icon: Code2 },
    { id: 'java', name: 'Java', piston: 'java', ver: '15.0.2', icon: Code2 },
    { id: 'c', name: 'C', piston: 'c', ver: '10.2.0', icon: Code2 },
    { id: 'asm', name: 'Assembly', piston: 'nasm', ver: '2.15.05', icon: Cpu },
    { id: 'bash', name: 'Bash', piston: 'bash', ver: '5.2.0', icon: Terminal },
    { id: 'sql', name: 'SQL', piston: 'sqlite3', ver: '3.36.0', icon: Database },
];
