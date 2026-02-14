import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/editors/RichTextEditor';

interface Section {
    id: string;
    label: string;
    required: boolean;
}

interface DocumentEditorProps {
    onChange?: (sectionId: string, content: string) => void;
    readOnly?: boolean;
    initialValues?: Record<string, string>;
    activeSection?: string; // New prop to control tab externally
    onSectionChange?: (id: string) => void;
}

const DEFAULT_SECTIONS: Section[] = [
    { id: 'theory', label: 'Theory & Concept', required: true },
    { id: 'algorithm', label: 'Algorithm / Logic', required: true },
    { id: 'output', label: 'Output & Results', required: true }, //  NEW SECTION
    { id: 'conclusion', label: 'Conclusion', required: true },
];

export default function DocumentEditor({
    onChange,
    readOnly = false,
    initialValues = {},
    activeSection: externalActiveSection,
    onSectionChange
}: DocumentEditorProps) {
    const [internalActiveSection, setInternalActiveSection] = useState(DEFAULT_SECTIONS[0].id);
    const [contents, setContents] = useState<Record<string, string>>(initialValues);

    const activeSection = externalActiveSection || internalActiveSection;

    useEffect(() => {
        if (initialValues) setContents(prev => ({ ...prev, ...initialValues }));
    }, [initialValues]);

    const handleChange = (val: string) => {
        const newContents = { ...contents, [activeSection]: val };
        setContents(newContents);
        onChange?.(activeSection, val);
    };

    const handleTabClick = (id: string) => {
        setInternalActiveSection(id);
        onSectionChange?.(id);
    };

    const currentContent = contents[activeSection] || '';

    return (
        <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border bg-card transition-colors">
            {/* Tabs */}
            <div className="flex overflow-x-auto bg-muted/50 border-b border-border transition-colors">
                {DEFAULT_SECTIONS.map(section => (
                    <button
                        key={section.id}
                        onClick={() => handleTabClick(section.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === section.id
                                ? 'border-primary text-primary bg-background'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {section.label} {section.required && '*'}
                    </button>
                ))}
            </div>

            {/* Rich Editor Area */}
            <div className="flex-1 overflow-hidden">
                <RichTextEditor
                    key={activeSection} // Force re-render on tab change to update content
                    content={currentContent}
                    onChange={handleChange}
                    editable={!readOnly}
                    minHeight="100%"
                />
            </div>
        </div>
    );
}