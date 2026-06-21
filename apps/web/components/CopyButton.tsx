'use client';

import { useState } from 'react';
import { useToast } from './Toast';

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast('Copied to clipboard');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Copy failed — select and copy manually');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`px-3 py-1.5 border text-[12px] transition disabled:opacity-40 ${
        copied
          ? 'border-status-approved text-status-approved'
          : 'border-line hover:border-line-strong'
      } ${className}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}
