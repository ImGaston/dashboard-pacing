"use client";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your lesson content in Markdown...\n\n### Heading\nParagraph text...\n\n> Blockquote renders as a Key Takeaway box",
}: MarkdownEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[400px] resize-y bg-bone-light rounded-[12px] border border-bone-dark p-4 font-mono text-sm text-tobacco leading-relaxed placeholder:text-moss/50 focus:outline-none focus:ring-2 focus:ring-cedar/20 focus:border-cedar transition-colors"
      spellCheck={false}
    />
  );
}
