import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import DOMPurify from "dompurify";
import { apiFetch } from "../../utils/api.ts";

/**
 * Renders an email the way the sender formatted it.
 *
 * The HTML comes from GET /emails/:id/content and is untrusted, so it is
 *  1. sanitized with DOMPurify (scripts, forms, embeds, event handlers removed),
 *  2. shown inside an <iframe sandbox> WITHOUT allow-scripts, with its own
 *     Content-Security-Policy — even markup the sanitizer missed cannot run code
 *     or touch the app, and the email's CSS can't leak into the page.
 * allow-same-origin is only there so the parent can measure the content height
 * (it is safe without allow-scripts). Links open in a new tab.
 *
 * Until the HTML arrives (or if there is none) the stored plain text is shown.
 */
export default function EmailBody({ emailId, fallbackText }: { emailId: string; fallbackText: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [text, setText] = useState(fallbackText);
  const [loadingHtml, setLoadingHtml] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setHtml(null);
    setText(fallbackText);
    setLoadingHtml(true);
    apiFetch(`/emails/${emailId}/content`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const json: { html: string | null; text: string } = await res.json();
        if (json.text) setText(json.text);
        if (json.html) setHtml(json.html);
      })
      .catch(() => { /* keep the plain-text fallback */ })
      .finally(() => { if (!controller.signal.aborted) setLoadingHtml(false); });
    return () => controller.abort();
  }, [emailId, fallbackText]);

  if (html) return <SandboxedHtml html={html} />;

  return (
    <div>
      {loadingHtml && <p className="text-[11px] text-[#9ca3af] mb-[8px] animate-pulse">Loading formatted version…</p>}
      <p className="text-[13px] text-[#374151] whitespace-pre-wrap leading-[20px] break-words">{linkify(cleanPlainText(text))}</p>
    </div>
  );
}

const FRAME_HEAD = `
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline' https:; font-src https: data:; media-src https: data:">
<meta name="referrer" content="no-referrer">
<base target="_blank">
<style>
  html, body { margin: 0; }
  body { padding: 4px 2px; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; font-size: 14px; line-height: 1.5; color: #374151; overflow-wrap: anywhere; }
  img { max-width: 100% !important; height: auto !important; }
  table { max-width: 100% !important; }
  a { color: #2563eb; }
</style>`;

function buildSrcDoc(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    FORBID_TAGS: ["script", "iframe", "frame", "object", "embed", "form", "input", "button", "textarea", "select", "base", "meta", "link"],
    FORBID_ATTR: ["srcdoc", "formaction"],
  });
  return /<head[^>]*>/i.test(clean)
    ? clean.replace(/<head[^>]*>/i, (m) => m + FRAME_HEAD)
    : `<!doctype html><html><head>${FRAME_HEAD}</head><body>${clean}</body></html>`;
}

function SandboxedHtml({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);
  const srcDoc = useMemo(() => buildSrcDoc(html), [html]);

  // Grow the frame to its content so the modal scrolls as one page.
  const measure = () => {
    const doc = ref.current?.contentDocument;
    if (doc?.documentElement) setHeight(Math.max(120, doc.documentElement.scrollHeight + 8));
  };

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const onLoad = () => {
      measure();
      const body = frame.contentDocument?.body;
      if (body && "ResizeObserver" in window) {
        observer = new ResizeObserver(measure);
        observer.observe(body);
      }
    };
    frame.addEventListener("load", onLoad);
    return () => { frame.removeEventListener("load", onLoad); observer?.disconnect(); };
  }, []);

  return (
    <iframe
      ref={ref}
      title="Email content"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      style={{ height }}
      className="w-full border-0 block"
    />
  );
}

/** Drop leading lines of raw CSS some senders put in their plain-text part. */
function cleanPlainText(text: string): string {
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && /^\s*(@media|@font-face|@import|[.#a-z][\w.#\s,:>-]*\{)[^]*[{};]\s*$/i.test(lines[i])) i++;
  return lines.slice(i).join("\n").trim();
}

function linkify(text: string): ReactNode[] {
  return text.split(/(https?:\/\/[^\s<>()"']+)/g).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline break-all">{part}</a>
      : part
  );
}
