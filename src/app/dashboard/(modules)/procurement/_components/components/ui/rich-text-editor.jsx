'use client';

import { useRef, useEffect } from 'react';
import { Bold, List, Italic, Underline, ListOrdered } from 'lucide-react';

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Enter text...',
  minHeight = '150px',
  className = '',
}) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  // Sync external value into the editor (only when it differs to avoid cursor jump)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    isInternalChange.current = true;
    onChange?.(editorRef.current?.innerHTML ?? '');
  };

  const execCmd = (command, value = null) => {
    editorRef.current?.focus();
    // eslint-disable-next-line no-restricted-globals
    document.execCommand(command, false, value);
  };

  const toolbarBtns = [
    { label: 'Bold', icon: Bold, cmd: 'bold' },
    { label: 'Italic', icon: Italic, cmd: 'italic' },
    { label: 'Underline', icon: Underline, cmd: 'underline' },
    { label: 'Unordered List', icon: List, cmd: 'insertUnorderedList' },
    { label: 'Ordered List', icon: ListOrdered, cmd: 'insertOrderedList' },
  ];

  return (
    <div
      className={`w-full rounded-lg border border-input bg-input-background overflow-hidden focus-within:ring-2 focus-within:ring-ring ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-input bg-secondary/40 px-2 py-1">
        {toolbarBtns.map(({ label, icon: Icon, cmd }) => (
          <button
            key={cmd}
            type="button"
            title={label}
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd(cmd);
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={[
          'w-full px-3 py-2 text-sm text-foreground outline-none',
          'prose prose-sm max-w-none',
          '[&:empty]:before:content-[attr(data-placeholder)]',
          '[&:empty]:before:text-muted-foreground',
          '[&:empty]:before:pointer-events-none',
        ].join(' ')}
      />
    </div>
  );
}
