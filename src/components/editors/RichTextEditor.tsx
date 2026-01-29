import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code2,
  Table as TableIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Type,
  AlignLeft
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  minHeight?: string;
}

// Toolbar Button Component for consistent styling
const ToolbarBtn = ({ onClick, isActive, icon: Icon, disabled }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "p-1.5 rounded-md transition-all duration-200",
      disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 text-slate-600",
      isActive ? "bg-blue-100 text-blue-700 shadow-sm" : ""
    )}
  >
    <Icon size={16} strokeWidth={2.5} />
  </button>
);

export function RichTextEditor({ content, onChange, editable = true, minHeight = "300px" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate prose-sm max-w-none focus:outline-none min-h-[150px]',
          'prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:leading-relaxed',
          'prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg not-italic',
          'prose-code:bg-slate-100 prose-code:text-red-500 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none'
        ),
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={cn(
      "flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm transition-all",
      editable ? "border-slate-300 shadow-md shadow-slate-200/50" : "border-slate-200 bg-slate-50/30"
    )}>
      
      {/* 1. Toolbar (Only visible when editable) */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
          
          {/* History Group */}
          <div className="flex items-center gap-0.5 mr-2">
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} />
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} />
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Text Style Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code2} />
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Headings Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} />
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Lists & Structure Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} />
          </div>

          <div className="w-px h-5 bg-slate-300 mx-1" />

          {/* Insert Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={addTable} icon={TableIcon} />
            <ToolbarBtn onClick={addImage} icon={ImageIcon} />
          </div>
        </div>
      )}

      {/* 2. Editor Content Area */}
      <div className={cn("p-6", !editable && "opacity-90")}>
        <EditorContent editor={editor} style={{ minHeight }} />
      </div>

      {/* 3. Footer Status Bar */}
      {editable && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Markdown Supported</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {editor.storage.characterCount?.words?.() || 0} words
          </span>
        </div>
      )}
    </div>
  );
}