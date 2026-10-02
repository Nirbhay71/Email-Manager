import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Gemini answers in Markdown (**bold**, ### headings, lists, ---). Rendered
// here instead of shown raw. The output is model text built from untrusted
// email content, so it is sanitized before it touches the DOM, and links
// open in a new tab without access to this page.
marked.setOptions({ gfm: true, breaks: true });

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "del", "code", "pre", "blockquote",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "a",
  "table", "thead", "tbody", "tr", "th", "td",
];

export default function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(text, { async: false }) as string, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ["href", "title", "target", "rel"],
    }),
    [text]
  );
  return <div className={`md-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
