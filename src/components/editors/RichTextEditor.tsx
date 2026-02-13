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
import { useMemo } from 'react'; // Import useMemo
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Quote, Code2, Table as TableIcon,
  Image as ImageIcon, Undo, Redo, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Palette
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
      disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300",
      isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm" : ""
    )}
    style={color ? { color: color } : {}}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

export function RichTextEditor({ content, onChange, editable = true, minHeight = "400px" }: RichTextEditorProps) {
  
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
    TableCell.configure({ HTMLAttributes: { class: 'border border-slate-300 dark:border-slate-600 p-2' } }),
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
          'prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg not-italic',
          'prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:text-red-500 dark:prose-code:text-red-400 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
          'prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-700 prose-th:bg-slate-50 dark:prose-th:bg-slate-800 prose-th:p-2 prose-td:p-2'
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

  const setColor = () => {
    const color = window.prompt('Enter color (hex or name):', '#000000');
    if (color) editor.chain().focus().setColor(color).run();
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-xl overflow-hidden shadow-sm transition-all",
      editable 
        ? "bg-white dark:bg-[#0c0c0e] border-slate-300 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none" 
        : "bg-slate-50/30 dark:bg-transparent border-slate-200 dark:border-slate-800"
    )}>
      
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#18181b] backdrop-blur-sm sticky top-0 z-10">
          
          {/* History */}
          <div className="flex items-center gap-0.5 mr-2">
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} />
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} />
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Formatting */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code2} />
            <ToolbarBtn onClick={setColor} isActive={editor.isActive('textStyle')} icon={Palette} />
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} />
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} />
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} />
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

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
        <div className="bg-slate-50 dark:bg-[#18181b] border-t border-slate-100 dark:border-slate-800 px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rich Text Active</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {editor.storage.characterCount?.words?.() || 0} words
          </span>
        </div>
      )}
    </div>
  );
}