import React, { useEffect, useCallback } from 'react';

export type SecurityEventType = 'FOCUS_LOST' | 'PASTE_ATTEMPT' | 'INSPECT_ATTEMPT' | 'COPY_ATTEMPT' | 'FULLSCREEN_EXIT';

interface SecurityEngineProps {
    submissionId: string;
    onViolation: (type: SecurityEventType, details: any) => void;
    isPaused?: boolean; // Controls active state (e.g. for dialogs)
}

const SecurityEngine: React.FC<SecurityEngineProps> = ({ onViolation, isPaused = false }) => {
    
    // 1. Tab Switching / Visibility
    const handleVisibilityChange = useCallback(() => {
        if (isPaused) return;

        if (document.hidden) {
            document.title = "⚠️ COME BACK!";
            onViolation('FOCUS_LOST', { timestamp: new Date().toISOString() });
        } else {
            document.title = "Assignment";
        }
    }, [onViolation, isPaused]);

    // 2. Disable Copy/Paste (External)
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (isPaused) return;

        // Block paste in strict mode
        e.preventDefault();
        onViolation('PASTE_ATTEMPT', { timestamp: new Date().toISOString() });
    }, [onViolation, isPaused]);

    // 3. Disable Context Menu
    const handleContextMenu = useCallback((e: MouseEvent) => {
        if (isPaused) return;
        e.preventDefault();
    }, [isPaused]);

    // 4. Disable Shortcuts & Inspect
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isPaused) return;

        // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u')
        ) {
            e.preventDefault();
            onViolation('INSPECT_ATTEMPT', { timestamp: new Date().toISOString() });
        }
    }, [onViolation, isPaused]);

    // 5. Fullscreen Check
    const handleFullscreenChange = useCallback(() => {
        if (isPaused) return;
        if (!document.fullscreenElement) {
            onViolation('FULLSCREEN_EXIT', { timestamp: new Date().toISOString() });
        }
    }, [onViolation, isPaused]);

    useEffect(() => {
        // Attach listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [handleVisibilityChange, handlePaste, handleContextMenu, handleKeyDown, handleFullscreenChange]);

    return null;
};

export default SecurityEngine;