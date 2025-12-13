import React from "react";
import ReactMarkdown from "react-markdown";

export default function MarkdownText({ text = "", className = "" }) {
  if (!text || typeof text !== "string") return null;
  return (
    <ReactMarkdown
      className={`prose prose-slate max-w-none prose-headings:mt-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-code:px-1 prose-code:py-0.5 prose-code:bg-slate-100 prose-code:text-slate-800 ${className}`}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {children}
          </a>
        ),
        code: ({ inline, className, children, ...props }) =>
          !inline ? (
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto text-sm my-3">
              <code className={className} {...props}>{children}</code>
            </pre>
          ) : (
            <code className="bg-slate-100 text-slate-800 rounded px-1 py-0.5">{children}</code>
          ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}