import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Button } from '../ui/button';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link as LinkIcon, LinkOff,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Undo, Redo, Type, Palette,
  Sparkles, Wand2, Copy, Check, Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';

// Toolbar button component
const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-all ${
      isActive 
        ? 'bg-purple-100 text-purple-700 shadow-sm' 
        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

// Divider component
const ToolbarDivider = () => (
  <div className="w-px h-6 bg-gray-200 mx-1" />
);

// Font sizes
const FONT_SIZES = [
  { label: 'Small', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Large', value: '1.125rem' },
  { label: 'Extra Large', value: '1.25rem' },
];

// Colors
const COLORS = [
  { label: 'Default', value: null },
  { label: 'Red', value: '#EF4444' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Green', value: '#22C55E' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Gray', value: '#6B7280' },
];

// Canned responses / templates
const CANNED_RESPONSES = [
  { 
    id: 'greeting', 
    label: '👋 Greeting', 
    text: 'Hello! Thank you for reaching out to The Doggy Company. I\'m here to help with your query.' 
  },
  { 
    id: 'order_confirm', 
    label: '📦 Order Confirmation', 
    text: 'Your order has been confirmed and is being processed. You will receive tracking information once shipped.' 
  },
  { 
    id: 'delivery_update', 
    label: '🚚 Delivery Update', 
    text: 'Your order is on its way! Expected delivery is within [X] business days. You can track your shipment using the link provided.' 
  },
  { 
    id: 'resolution', 
    label: '✅ Issue Resolved', 
    text: 'I\'m pleased to confirm that your issue has been resolved. Is there anything else I can help you with?' 
  },
  { 
    id: 'follow_up', 
    label: '🔄 Follow Up', 
    text: 'I\'m following up on our previous conversation. Have you had a chance to review the information I provided?' 
  },
  { 
    id: 'closing', 
    label: '🙏 Closing', 
    text: 'Thank you for choosing The Doggy Company! If you have any more questions, feel free to reach out. Have a pawsome day! 🐾' 
  },
  { 
    id: 'refund', 
    label: '💰 Refund Info', 
    text: 'Your refund has been initiated and will be processed within 5-7 business days. The amount will be credited to your original payment method.' 
  },
  { 
    id: 'appointment', 
    label: '📅 Appointment Confirmed', 
    text: 'Your appointment has been scheduled for [DATE] at [TIME]. Please arrive 10 minutes early with your pet\'s records.' 
  },
];

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Type your message...', 
  minHeight = '150px',
  showAI = true,
  onAIGenerate,
  aiLoading = false,
  disabled = false,
  className = ''
}) => {
  const [showCannedMenu, setShowCannedMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  // Handle link
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Insert canned response
  const insertCannedResponse = (text) => {
    editor?.chain().focus().insertContent(text).run();
    setShowCannedMenu(false);
  };

  // Copy content
  const copyContent = async () => {
    const text = editor?.getText() || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!editor) {
    return <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className={`rich-text-editor border rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-gray-50/80 sticky top-0 z-10">
        {/* Text Style Group */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Headings */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Lists */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Alignment */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Link */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Link"
            >
              <LinkOff className="w-4 h-4" />
            </ToolbarButton>
          )}
        </div>

        <ToolbarDivider />

        {/* Color Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600 flex items-center gap-1" title="Text Color">
              <Palette className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32">
            {COLORS.map((color) => (
              <DropdownMenuItem
                key={color.label}
                onClick={() => {
                  if (color.value) {
                    editor.chain().focus().setColor(color.value).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                }}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color.value || '#000' }}
                />
                {color.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Undo/Redo */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Canned Responses */}
          <DropdownMenu open={showCannedMenu} onOpenChange={setShowCannedMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Type className="w-3.5 h-3.5 mr-1" />
                Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Quick Responses</div>
              <DropdownMenuSeparator />
              {CANNED_RESPONSES.map((response) => (
                <DropdownMenuItem
                  key={response.id}
                  onClick={() => insertCannedResponse(response.text)}
                  className="flex flex-col items-start py-2"
                >
                  <span className="font-medium">{response.label}</span>
                  <span className="text-xs text-gray-500 line-clamp-1">{response.text}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Generate */}
          {showAI && onAIGenerate && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700"
              onClick={onAIGenerate}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1" />
              )}
              AI Draft
            </Button>
          )}

          {/* Copy */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={copyContent}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Bubble Menu for selected text */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-0.5 p-1 bg-gray-900 rounded-lg shadow-xl"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-gray-700' : 'hover:bg-gray-800'} text-white`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-gray-700' : 'hover:bg-gray-800'} text-white`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-gray-700' : 'hover:bg-gray-800'} text-white`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-gray-600 mx-1" />
          <button
            onClick={setLink}
            className={`p-1.5 rounded ${editor.isActive('link') ? 'bg-gray-700' : 'hover:bg-gray-800'} text-white`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none focus:outline-none"
        style={{ minHeight }}
      />

      {/* Character count */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t bg-gray-50/50 text-xs text-gray-500">
        <span>
          {editor.storage.characterCount?.characters() || editor.getText().length} characters
        </span>
        <span className="text-gray-400">
          Tip: Use Ctrl+B for bold, Ctrl+I for italic
        </span>
      </div>

      {/* Editor Styles */}
      <style>{`
        .rich-text-editor .ProseMirror {
          padding: 12px 16px;
          min-height: ${minHeight};
          outline: none;
        }
        .rich-text-editor .ProseMirror p {
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.75em 0 0.5em;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75em 0 0.5em;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.5em 0 0.25em;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror li {
          margin: 0.25em 0;
        }
        .rich-text-editor .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0.75em 0;
          color: #6b7280;
          font-style: italic;
        }
        .rich-text-editor .ProseMirror pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-family: monospace;
          font-size: 0.875rem;
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .rich-text-editor .ProseMirror code {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        .rich-text-editor .ProseMirror pre code {
          background: none;
          padding: 0;
        }
        .rich-text-editor .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
        }
        .rich-text-editor .ProseMirror.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
