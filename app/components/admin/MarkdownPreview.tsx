"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  /* Headings */
  h1: ({ children }) => (
    <h1 className="text-2xl font-serif text-onyx mt-10 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-serif text-onyx mt-8 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-serif text-onyx mt-8">{children}</h3>
  ),

  /* Body */
  p: ({ children }) => (
    <p className="text-tobacco text-sm leading-relaxed mb-4">{children}</p>
  ),

  /* Lists */
  ul: ({ children }) => (
    <ul className="list-disc pl-6 space-y-1 text-sm text-tobacco mb-4">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 space-y-1 text-sm text-tobacco mb-4">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  /* Blockquote → Key Takeaway box */
  blockquote: ({ children }) => (
    <div className="bg-moss/10 border-l-4 border-moss p-4 rounded-r-lg my-6">
      <p className="text-[9px] font-bold text-walnut uppercase tracking-[2px] mb-1">
        Key Takeaway
      </p>
      <div className="text-tobacco text-sm leading-relaxed [&>p]:mb-0">
        {children}
      </div>
    </div>
  ),

  /* Inline styles */
  strong: ({ children }) => (
    <strong className="font-semibold text-onyx">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,

  /* Code */
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-bone-muted p-4 rounded-lg font-mono text-xs overflow-x-auto my-4">
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono text-xs bg-bone-muted px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-4">{children}</pre>,

  /* Links */
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cedar underline underline-offset-2 hover:text-cedar/80 transition-colors"
    >
      {children}
    </a>
  ),

  /* Horizontal rule */
  hr: () => <hr className="border-bone-dark my-8" />,

  /* Table */
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 font-semibold text-onyx border-b border-bone-dark">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-tobacco border-b border-bone">
      {children}
    </td>
  ),
};

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <p className="text-moss text-sm italic">No content yet.</p>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
