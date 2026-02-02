import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Highlighter,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TEXT_COLORS = [
  { name: "기본", color: "#000000" },
  { name: "빨강", color: "#ef4444" },
  { name: "파랑", color: "#3b82f6" },
  { name: "초록", color: "#22c55e" },
  { name: "주황", color: "#f97316" },
  { name: "보라", color: "#a855f7" },
];

const HIGHLIGHT_COLORS = [
  { name: "없음", color: "transparent" },
  { name: "노랑", color: "#fef08a" },
  { name: "빨강", color: "#fecaca" },
  { name: "파랑", color: "#bfdbfe" },
  { name: "초록", color: "#bbf7d0" },
  { name: "주황", color: "#fed7aa" },
];

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[160px] px-3 py-2",
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("underline") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground mb-1">글자 색상</p>
              <div className="flex gap-1">
                {TEXT_COLORS.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.color }}
                    onClick={() => {
                      editor.chain().focus().setColor(item.color).run();
                    }}
                    title={item.name}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("highlight") && "bg-muted"
              )}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground mb-1">하이라이트</p>
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded border border-border hover:scale-110 transition-transform",
                      item.color === "transparent" && "bg-background"
                    )}
                    style={{ backgroundColor: item.color === "transparent" ? undefined : item.color }}
                    onClick={() => {
                      if (item.color === "transparent") {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().toggleHighlight({ color: item.color }).run();
                      }
                    }}
                    title={item.name}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && placeholder && (
          <p className="absolute top-2 left-3 text-muted-foreground text-sm pointer-events-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
