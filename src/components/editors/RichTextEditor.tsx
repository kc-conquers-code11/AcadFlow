import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CharacterCount } from '@tiptap/extension-character-count';
import { cn } from '@/lib/utils';
import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Quote, Code2, Table as TableIcon,
  Image as ImageIcon, Undo, Redo, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Palette, X
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  minHeight?: string;
}

const ToolbarBtn = ({ onClick, isActive, icon: Icon, disabled, color }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center",
      disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-muted text-muted-foreground",
      isActive ? "bg-primary/10 text-primary shadow-sm" : ""
    )}
    style={color ? { color: color } : {}}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

// --- Professional Color Picker Popover ---
const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#FFFFFF',
  '#FF0000', '#FF4D00', '#FF9900', '#FFCC00', '#FFFF00', '#99FF00', '#33FF00', '#00FF66',
  '#00FFFF', '#0099FF', '#0033FF', '#3300FF', '#6600FF', '#9900FF', '#FF00FF', '#FF0066',
  '#CC0000', '#CC3D00', '#CC7A00', '#CCA300', '#CCCC00', '#7ACC00', '#29CC00', '#00CC52',
  '#00CCCC', '#007ACC', '#0029CC', '#2900CC', '#5200CC', '#7A00CC', '#CC00CC', '#CC0052',
];

function ColorPickerPopover({ onSelect, onClose, currentColor }: { onSelect: (color: string) => void; onClose: () => void; currentColor: string }) {
  const [hexInput, setHexInput] = useState(currentColor || '#000000');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleHexSubmit = () => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(hexInput)) {
      onSelect(hexInput);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-[280px] transition-colors animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Color Picker</span>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Native Color Input (full spectrum picker) */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              onSelect(e.target.value);
            }}
            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
          />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
            onBlur={handleHexSubmit}
            placeholder="#000000"
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            maxLength={7}
          />
        </div>
      </div>

      {/* Preview Strip */}
      <div className="mb-3 h-2 rounded-full" style={{ background: hexInput }} />

      {/* Preset Grid */}
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              setHexInput(color);
              onSelect(color);
            }}
            className={cn(
              "w-7 h-7 rounded-lg transition-all hover:scale-110 hover:shadow-md border",
              hexInput === color ? 'ring-2 ring-primary ring-offset-1 ring-offset-background border-primary' : 'border-border/50'
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}


export function RichTextEditor({ content, onChange, editable = true, minHeight = "400px" }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');

  // Minimize extensions to prevent "Duplicate extension" warnings during re-renders
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: true },
      orderedList: { keepMarks: true },
    }),
    Underline,
    TextStyle,
    Color,
    Image,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-blue-500 hover:underline cursor-pointer' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse table-auto w-full' } }),
    TableRow,
    TableHeader,
    TableCell.configure({ HTMLAttributes: { class: 'border border-border p-2' } }),
    CharacterCount,
  ], []); // Empty dependency array means these extensions are defined once

  const editor = useEditor({
    extensions, // Use the memoized extensions
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate dark:prose-invert prose-sm max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:leading-relaxed',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg not-italic',
          'prose-code:bg-muted prose-code:text-red-500 dark:prose-code:text-red-400 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
          'prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-2 prose-td:p-2'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleColorSelect = (color: string) => {
    setCurrentTextColor(color);
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-xl overflow-hidden shadow-sm transition-all",
      editable
        ? "bg-card border-border shadow-md shadow-muted/50"
        : "bg-muted/30 border-border"
    )}>

      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-muted/50 backdrop-blur-sm sticky top-0 z-10 transition-colors">

          {/* History */}
          <div className="flex items-center gap-0.5 mr-2">
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} />
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} />
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Formatting */}
          <div className="flex items-center gap-0.5 relative">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code2} />
            <ToolbarBtn onClick={() => setShowColorPicker(!showColorPicker)} isActive={showColorPicker} icon={Palette} color={currentTextColor} />
            {showColorPicker && (
              <ColorPickerPopover
                onSelect={handleColorSelect}
                onClose={() => setShowColorPicker(false)}
                currentColor={currentTextColor}
              />
            )}
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} />
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} />
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} />
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Inserts */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={addLink} isActive={editor.isActive('link')} icon={LinkIcon} />
            <ToolbarBtn onClick={addTable} icon={TableIcon} />
            <ToolbarBtn onClick={addImage} icon={ImageIcon} />
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className={cn("flex-1 overflow-y-auto", !editable && "opacity-90")}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer Status */}
      {editable && (
        <div className="bg-muted/50 border-t border-border px-4 py-1.5 flex justify-between items-center transition-colors">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rich Text Active</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {editor.storage.characterCount?.words?.() || 0} words
          </span>
        </div>
      )}
    </div>
  );
}