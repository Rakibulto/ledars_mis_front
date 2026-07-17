'use client';

import React from 'react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { useEditor, EditorContent } from '@tiptap/react';

import { Box, Tooltip, Divider, IconButton } from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ── Toolbar button ───────────────────────────────────────────────────

function ToolbarBtn({ title, icon, onClick, isActive = false }) {
  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1,
          color: isActive ? 'primary.main' : 'text.secondary',
          bgcolor: isActive ? 'primary.lighter' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Iconify icon={icon} width={16} />
      </IconButton>
    </Tooltip>
  );
}

// ── TiptapEditor ─────────────────────────────────────────────────────

export default function TiptapEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  editable = true,
  minHeight = 120,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: value || '',
    editable,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      if (onChange) onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        style: `min-height: ${minHeight}px; padding: 12px; outline: none; line-height: 1.6;`,
      },
    },
  });

  // Sync external value changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: 'primary.main',
          boxShadow: '0 0 0 2px rgba(99,102,241,0.12)',
        },
      }}
    >
      {/* Toolbar */}
      {editable && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            px: 1,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.neutral',
            flexWrap: 'wrap',
          }}
        >
          <ToolbarBtn
            title="Bold"
            icon="solar:text-bold-bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          />
          <ToolbarBtn
            title="Italic"
            icon="solar:text-italic-bold"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
          <ToolbarBtn
            title="Bullet List"
            icon="solar:list-cross-bold"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          />
          <ToolbarBtn
            title="Ordered List"
            icon="solar:list-numbers-bold"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
          <ToolbarBtn
            title="Add Link"
            icon="solar:link-bold"
            onClick={addLink}
            isActive={editor.isActive('link')}
          />
        </Box>
      )}

      {/* Editor Body */}
      <EditorContent editor={editor} style={{ minHeight }} />
    </Box>
  );
}
