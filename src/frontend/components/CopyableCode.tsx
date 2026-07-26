import { useState } from 'react';

export function CopyableCode({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${location.origin}/?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <span className="copyable-code" onClick={handleClick} title="Click to copy">
      {label && <>{label}: </>}{code}
      {copied && <span className="copyable-copied">Copied!</span>}
    </span>
  );
}
