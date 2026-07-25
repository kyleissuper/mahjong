import { useState, useEffect, useRef } from 'react';

export function SearchableCombo({ value, options, placeholder, onChange, extraOptions }: {
  value: string | null;
  options: string[];
  placeholder?: string;
  onChange: (value: string | null) => void;
  extraOptions?: { label: string; value: string | null; onSelect: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? options.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(v: string | null) {
    onChange(v);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { setOpen(true); return; }
    const total = filtered.length + (extraOptions?.length ?? 0);
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, total - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight < filtered.length) select(filtered[highlight]);
      else {
        const extra = extraOptions?.[highlight - filtered.length];
        if (extra) { extra.onSelect(); setOpen(false); }
      }
    }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => { setHighlight(0); }, [query]);

  return (
    <div className="combo" ref={ref}>
      <input className="combo-input" ref={inputRef}
        placeholder={value || placeholder || 'Search...'}
        value={open ? query : (value || '')}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown} />
      {value && !open && (
        <button className="combo-clear" onClick={() => { onChange(null); inputRef.current?.focus(); }}
          aria-label="Clear">×</button>
      )}
      {open && (
        <div className="combo-dropdown">
          {filtered.map((p, i) => (
            <div key={p} className={`combo-option ${i === highlight ? 'combo-option-active' : ''}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={e => { e.preventDefault(); select(p); }}>
              {p}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="combo-empty">No matches</div>
          )}
          {extraOptions?.map((opt, i) => (
            <div key={opt.label}
              className={`combo-option ${opt.label.startsWith('+') ? 'combo-add' : ''} ${filtered.length + i === highlight ? 'combo-option-active' : ''}`}
              onMouseEnter={() => setHighlight(filtered.length + i)}
              onMouseDown={e => { e.preventDefault(); opt.onSelect(); setOpen(false); }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
