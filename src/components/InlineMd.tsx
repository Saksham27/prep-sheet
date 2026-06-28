import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

interface Props {
  children: string;
  className?: string;
}

/**
 * Renders a markdown fragment. Inline code stays inline (styled via .md css);
 * fenced blocks render through the syntax-highlighted CodeBlock with a copy button.
 */
export default function InlineMd({ children, className }: Props) {
  return (
    <div className={`md text-sm text-text/90 ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className: cn, children: c, ...rest }: any) {
            const match = /language-(\w+)/.exec(cn ?? '');
            const text = String(c).replace(/\n$/, '');
            if (inline || !text.includes('\n')) {
              return (
                <code className={cn} {...rest}>
                  {c}
                </code>
              );
            }
            return <CodeBlock code={text} lang={match?.[1] ?? 'text'} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
