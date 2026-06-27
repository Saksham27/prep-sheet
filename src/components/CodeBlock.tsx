import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('json', json);

interface Props {
  code: string;
  lang?: string;
  label?: string;
}

const LANG_MAP: Record<string, string> = { csharp: 'csharp', text: 'text', json: 'json' };

export default function CodeBlock({ code, lang = 'csharp', label }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-md border border-border bg-[#161b22]">
      <div className="flex items-center justify-between border-b border-border bg-panel2 px-3 py-1.5">
        <span className="font-mono text-xs text-muted">{label ?? lang}</span>
        <button
          onClick={copy}
          className="rounded px-2 py-0.5 text-xs text-muted transition hover:bg-border hover:text-text"
        >
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={LANG_MAP[lang] ?? 'csharp'}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: 'transparent',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          padding: '0.9rem 1rem',
        }}
        codeTagProps={{ style: { fontFamily: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
