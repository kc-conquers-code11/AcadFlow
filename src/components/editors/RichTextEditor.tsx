import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CharacterCount } from '@tiptap/extension-character-count';
import { cn } from '@/lib/utils';

// Custom FontSize extension via TextStyle
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: Record<string, any>) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Quote, Code2, Table as TableIcon,
  Image as ImageIcon, Undo, Redo, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Palette, X, Plus, Minus, Trash2, ChevronDown, RowsIcon, ColumnsIcon, Merge, Split,
  ArrowUp, ArrowDown, Paintbrush
} from 'lucide-react';

// Custom TableCell with backgroundColor support
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
        renderHTML: (attrs: Record<string, any>) => {
          if (!attrs.backgroundColor) return {};
          return { style: `background-color: ${attrs.backgroundColor}` };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
        renderHTML: (attrs: Record<string, any>) => {
          if (!attrs.backgroundColor) return {};
          return { style: `background-color: ${attrs.backgroundColor}` };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  minHeight?: string;
}

const ToolbarBtn = ({ onClick, isActive, icon: Icon, disabled, color, title }: any) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center",
      disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-accent text-muted-foreground",
      isActive ? "bg-primary/10 text-primary shadow-sm" : ""
    )}
    style={color ? { color: color } : {}}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

// --- Color Picker Popover ---
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
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleHexSubmit = () => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(hexInput)) onSelect(hexInput);
  };

  return (
    <div ref={popoverRef} onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-[280px] transition-colors animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Color Picker</span>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"><X size={14} /></button>
      </div>
      <div className="mb-3 flex items-center gap-3">
        <input type="color" value={hexInput} onChange={(e) => { setHexInput(e.target.value); onSelect(e.target.value); }}
          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none" />
        <input type="text" value={hexInput} onChange={(e) => setHexInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()} onBlur={handleHexSubmit}
          placeholder="#000000" className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" maxLength={7} />
      </div>
      <div className="mb-3 h-2 rounded-full" style={{ background: hexInput }} />
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => { setHexInput(c); onSelect(c); }}
            className={cn("w-7 h-7 rounded-lg transition-all hover:scale-110 hover:shadow-md border", hexInput === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background border-primary' : 'border-border/50')}
            style={{ backgroundColor: c }} title={c} />
        ))}
      </div>
    </div>
  );
}

// --- Table Controls Dropdown ---
const CELL_BG_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e0e7ff', '#f1f5f9', '#fee2e2', '#d1fae5'];
const BORDER_COLORS = ['#000000', '#6b7280', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];

function TableControlsDropdown({ editor, onClose }: { editor: any; onClose: () => void }) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItem = (label: string, onClick: () => void, icon: any, disabled = false) => {
    const Icon = icon;
    return (
      <button key={label} disabled={disabled} onMouseDown={(e) => e.preventDefault()}
        onClick={() => { onClick(); }}
        className={cn("flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left",
          disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent text-foreground"
        )}>
        <Icon size={14} className="text-muted-foreground shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  const isInTable = editor.isActive('table');

  // Helper: apply border style to table + all cells
  const applyBorderStyle = (borderValue: string) => {
    const tableEl = (editor.view.dom as HTMLElement).querySelector('table');
    if (!tableEl) return;
    tableEl.style.cssText = `border: ${borderValue} !important;`;
    tableEl.querySelectorAll('th, td').forEach((cell) => {
      (cell as HTMLElement).style.cssText += `border: ${borderValue} !important;`;
    });
    editor.commands.focus();
  };

  // Helper: apply border color
  const applyBorderColor = (color: string) => {
    const tableEl = (editor.view.dom as HTMLElement).querySelector('table');
    if (!tableEl) return;
    tableEl.style.borderColor = color;
    tableEl.querySelectorAll('th, td').forEach((cell) => {
      (cell as HTMLElement).style.borderColor = color;
    });
    editor.commands.focus();
  };

  // Helper: move table up or down
  const moveTable = (direction: 'up' | 'down') => {
    const { state, dispatch } = editor.view;
    const { $from } = state.selection;
    // Walk up from cursor to find the table node
    let tablePos = -1;
    let tableNode: any = null;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === 'table') {
        tablePos = $from.before(d);
        tableNode = $from.node(d);
        break;
      }
    }
    if (tablePos < 0 || !tableNode) return;
    const tableEnd = tablePos + tableNode.nodeSize;
    if (direction === 'up' && tablePos > 0) {
      const $tablePos = state.doc.resolve(tablePos);
      const beforeIndex = $tablePos.index($tablePos.depth) - 1;
      if (beforeIndex >= 0) {
        const siblingNode = $tablePos.node($tablePos.depth).child(beforeIndex);
        const siblingStart = tablePos - siblingNode.nodeSize;
        const tr = state.tr;
        const tableSlice = state.doc.slice(tablePos, tableEnd);
        tr.delete(tablePos, tableEnd);
        tr.insert(siblingStart, tableSlice.content);
        dispatch(tr);
      }
    } else if (direction === 'down') {
      const $tableEnd = state.doc.resolve(tableEnd);
      const parentNode = $tableEnd.node($tableEnd.depth);
      const afterIndex = $tableEnd.index($tableEnd.depth);
      if (afterIndex < parentNode.childCount) {
        const siblingNode = parentNode.child(afterIndex);
        const siblingEnd = tableEnd + siblingNode.nodeSize;
        const tr = state.tr;
        const siblingSlice = state.doc.slice(tableEnd, siblingEnd);
        tr.delete(tableEnd, siblingEnd);
        tr.insert(tablePos, siblingSlice.content);
        dispatch(tr);
      }
    }
    editor.commands.focus();
  };

  return (
    <div ref={popoverRef} onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-2 w-[240px] max-h-[70vh] overflow-y-auto transition-colors animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insert</div>
      {menuItem('Insert Table (3×3)', () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), TableIcon)}
      <div className="h-px bg-border my-1" />

      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rows</div>
      {menuItem('Add Row Before', () => editor.chain().focus().addRowBefore().run(), Plus, !isInTable)}
      {menuItem('Add Row After', () => editor.chain().focus().addRowAfter().run(), Plus, !isInTable)}
      {menuItem('Delete Row', () => editor.chain().focus().deleteRow().run(), Minus, !isInTable)}
      <div className="h-px bg-border my-1" />

      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Columns</div>
      {menuItem('Add Column Before', () => editor.chain().focus().addColumnBefore().run(), Plus, !isInTable)}
      {menuItem('Add Column After', () => editor.chain().focus().addColumnAfter().run(), Plus, !isInTable)}
      {menuItem('Delete Column', () => editor.chain().focus().deleteColumn().run(), Minus, !isInTable)}
      <div className="h-px bg-border my-1" />

      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cells</div>
      {menuItem('Merge Cells', () => editor.chain().focus().mergeCells().run(), Merge, !isInTable)}
      {menuItem('Split Cell', () => editor.chain().focus().splitCell().run(), Split, !isInTable)}
      {menuItem('Toggle Header Row', () => editor.chain().focus().toggleHeaderRow().run(), RowsIcon, !isInTable)}
      {menuItem('Toggle Header Col', () => editor.chain().focus().toggleHeaderColumn().run(), ColumnsIcon, !isInTable)}
      <div className="h-px bg-border my-1" />

      {/* Cell Background Color */}
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cell Background</div>
      <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
        {CELL_BG_COLORS.map(c => (
          <button key={c} disabled={!isInTable} onMouseDown={(e) => e.preventDefault()}
            onClick={() => { editor.chain().focus().setCellAttribute('backgroundColor', c).run(); }}
            className={cn("w-6 h-6 rounded-md border border-border transition-all",
              !isInTable ? "opacity-40 cursor-not-allowed" : "hover:scale-110 hover:shadow-md"
            )}
            style={{ backgroundColor: c }} title={`Cell BG: ${c}`} />
        ))}
        <button disabled={!isInTable} onMouseDown={(e) => e.preventDefault()}
          onClick={() => { editor.chain().focus().setCellAttribute('backgroundColor', null).run(); }}
          className={cn("px-2 h-6 rounded-md border border-border text-xs font-medium transition-colors",
            !isInTable ? "opacity-40 cursor-not-allowed" : "hover:bg-accent text-foreground"
          )}>Clear</button>
      </div>
      <div className="h-px bg-border my-1" />

      {/* Table Borders */}
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borders</div>
      <div className="flex gap-1 px-2 pb-1.5">
        {[
          { label: 'None', value: 'none' },
          { label: 'Light', value: '1px solid currentColor' },
          { label: 'Medium', value: '2px solid currentColor' },
          { label: 'Heavy', value: '3px solid currentColor' },
        ].map(({ label, value }) => (
          <button key={label} onMouseDown={(e) => e.preventDefault()} disabled={!isInTable}
            onClick={() => applyBorderStyle(value)}
            className={cn("flex-1 px-1 py-1.5 text-xs rounded-md border border-border transition-colors text-center font-medium",
              !isInTable ? "opacity-40 cursor-not-allowed" : "hover:bg-accent text-foreground"
            )}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 px-2 pb-1.5">
        {BORDER_COLORS.map(c => (
          <button key={c} disabled={!isInTable} onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyBorderColor(c)}
            className={cn("w-6 h-6 rounded-md border border-border transition-all",
              !isInTable ? "opacity-40 cursor-not-allowed" : "hover:scale-110 hover:shadow-md"
            )}
            style={{ backgroundColor: c }} title={`Border: ${c}`} />
        ))}
      </div>
      <div className="h-px bg-border my-1" />

      {/* Move & Delete */}
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</div>
      {menuItem('Move Table Up', () => moveTable('up'), ArrowUp, !isInTable)}
      {menuItem('Move Table Down', () => moveTable('down'), ArrowDown, !isInTable)}
      <div className="h-px bg-border my-1" />
      {menuItem('Delete Table', () => editor.chain().focus().deleteTable().run(), Trash2, !isInTable)}
    </div>
  );
}

// --- Font Size Selector ---
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

function FontSizeDropdown({ editor, onClose }: { editor: any; onClose: () => void }) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={popoverRef} onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-2 w-[140px] transition-colors animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font Size</div>
      {FONT_SIZES.map(size => (
        <button key={size} onMouseDown={(e) => e.preventDefault()}
          onClick={() => { editor.chain().focus().setFontSize(size).run(); onClose(); }}
          className={cn("flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-lg transition-colors",
            editor.getAttributes('textStyle').fontSize === size
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent text-foreground"
          )}>
          <span style={{ fontSize: size }}>{parseInt(size)}</span>
          <span className="text-xs text-muted-foreground">{size}</span>
        </button>
      ))}
      <div className="h-px bg-border my-1" />
      <button onMouseDown={(e) => e.preventDefault()}
        onClick={() => { editor.chain().focus().unsetFontSize().run(); onClose(); }}
        className="flex items-center w-full px-3 py-1.5 text-sm rounded-lg hover:bg-accent text-muted-foreground transition-colors">
        Reset Default
      </button>
    </div>
  );
}


export function RichTextEditor({ content, onChange, editable = true, minHeight = "400px" }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: { keepMarks: true, HTMLAttributes: { class: 'list-disc pl-6 space-y-1' } },
      orderedList: { keepMarks: true, HTMLAttributes: { class: 'list-decimal pl-6 space-y-1' } },
      listItem: { HTMLAttributes: { class: 'pl-1' } },
    }),
    Underline,
    TextStyle,
    Color,
    FontSize,
    Image,
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-500 hover:underline cursor-pointer' } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    CustomTableHeader,
    CustomTableCell,
    CharacterCount,
  ], []);

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'focus:outline-none px-5 py-4 h-full text-foreground text-base leading-relaxed',
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
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleColorSelect = useCallback((color: string) => {
    setCurrentTextColor(color);
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  return (
    <div className={cn(
      "flex flex-col h-full border rounded-xl overflow-hidden shadow-sm transition-all",
      editable ? "bg-card border-border shadow-md" : "bg-muted/30 border-border"
    )}>

      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-muted/50 backdrop-blur-sm sticky top-0 z-10 transition-colors shrink-0">

          {/* History */}
          <div className="flex items-center gap-0.5 mr-1">
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} title="Undo" />
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} title="Redo" />
          </div>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Formatting */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} title="Underline" />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code2} title="Code" />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-border mx-1" />

          {/* Color Picker */}
          <div className="relative">
            <ToolbarBtn onClick={() => { setShowColorPicker(!showColorPicker); setShowTableMenu(false); setShowFontSize(false); }} isActive={showColorPicker} icon={Palette} color={currentTextColor} title="Text Color" />
            {showColorPicker && <ColorPickerPopover onSelect={handleColorSelect} onClose={() => setShowColorPicker(false)} currentColor={currentTextColor} />}
          </div>

          {/* Font Size */}
          <div className="relative">
            <button type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowFontSize(!showFontSize); setShowColorPicker(false); setShowTableMenu(false); }}
              className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                showFontSize ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground")}>
              <span>Size</span><ChevronDown size={12} />
            </button>
            {showFontSize && <FontSizeDropdown editor={editor} onClose={() => setShowFontSize(false)} />}
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-border mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-border mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-border mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Blockquote" />
          </div>
          <div className="w-px h-5 bg-slate-300 dark:bg-border mx-1" />

          {/* Table & Inserts */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={addLink} isActive={editor.isActive('link')} icon={LinkIcon} title="Insert Link" />
            <ToolbarBtn onClick={addImage} icon={ImageIcon} title="Insert Image" />
            <div className="relative">
              <button type="button" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setShowTableMenu(!showTableMenu); setShowColorPicker(false); setShowFontSize(false); }}
                className={cn("flex items-center gap-0.5 p-1.5 rounded-md transition-all",
                  showTableMenu || editor.isActive('table') ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-accent text-muted-foreground")}>
                <TableIcon size={16} strokeWidth={2.5} />
                <ChevronDown size={10} />
              </button>
              {showTableMenu && <TableControlsDropdown editor={editor} onClose={() => setShowTableMenu(false)} />}
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className={cn("flex-1 overflow-y-auto", !editable && "opacity-90")}>
        <EditorContent editor={editor} className="h-full [&_.tiptap]:h-full [&_.tiptap]:outline-none" />
      </div>

      {/* Footer */}
      {editable && (
        <div className="bg-muted/50 border-t border-border px-4 py-1.5 flex justify-between items-center transition-colors shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rich Text Active</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{editor.storage.characterCount?.words?.() || 0} words</span>
        </div>
      )}
    </div>
  );
}