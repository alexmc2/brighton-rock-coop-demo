'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { cn } from '@/lib/utils';

// Custom extension for font size
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace('px', ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}px` };
            },
          },
        },
      },
    ];
  },
});

interface TiptapProps {
  content?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  className?: string;
  placeholder?: string;
}

const fontSizes = [
  { label: 'Small', size: '14' },
  { label: 'Normal', size: '16' },
  { label: 'Large', size: '20' },
  { label: 'Huge', size: '24' },
];

const Tiptap = ({
  content = '',
  onChange,
  editable = true,
  className,
  placeholder = 'Start writing...',
}: TiptapProps) => {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontSize],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none text-slate-600 dark:text-slate-300',
          className
        ),
      },
    },
    immediatelyRender: false,
  });

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
      {!editor?.isEmpty && editable && (
        <div className="flex flex-wrap justify-end mt-2 gap-2">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(
              'p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded',
              { 'bg-slate-100 dark:bg-slate-800': editor?.isActive('bold') }
            )}
          >
            Bold
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={cn(
              'p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded',
              { 'bg-slate-100 dark:bg-slate-800': editor?.isActive('italic') }
            )}
          >
            Italic
          </button>
          {fontSizes.map(({ label, size }) => (
            <button
              key={size}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .setMark('textStyle', { fontSize: size })
                  .run()
              }
              className={cn(
                'p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded',
                {
                  'bg-slate-100 dark:bg-slate-800':
                    editor?.getAttributes('textStyle').fontSize === size,
                }
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tiptap;
