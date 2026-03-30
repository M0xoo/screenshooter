import { useEffect, useId, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";

type Props = {
  label: string;
  color: string;
  onChange: (hex: string) => void;
};

export function CompactColor({ label, color, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-medium tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="relative flex items-center gap-2" ref={wrapRef}>
        <button
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((o) => !o)}
          className="size-9 shrink-0 rounded-lg border border-zinc-200 bg-white shadow-sm ring-zinc-300 transition hover:ring-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          style={{ backgroundColor: color }}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 font-mono text-xs text-zinc-800 shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        {open ? (
          <div
            role="dialog"
            aria-labelledby={btnId}
            className="absolute left-0 top-[calc(100%+6px)] z-50 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
          >
            <HexColorPicker
              color={color}
              onChange={onChange}
              className="composer-color-picker"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
