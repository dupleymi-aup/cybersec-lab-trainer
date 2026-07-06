import { memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default memo(function CodeBlock({ code, language = 'javascript', title }: CodeBlockProps) {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-slate-700">
      {title && (
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 font-mono text-xs text-slate-400 dark:bg-slate-700">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2">{title}</span>
        </div>
      )}
      <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, fontSize: '0.85rem' }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
});
