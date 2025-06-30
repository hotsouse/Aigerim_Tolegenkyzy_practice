'use client';

import { useState, useEffect } from 'react';

export default function MarkdownRenderer({ content }: { content: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="text-gray-500">Loading markdown renderer...</div>;
  }

  // Динамический импорт только на клиенте
  const ReactMarkdown = require('react-markdown').default;
  const remarkGfm = require('remark-gfm').default;

  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}