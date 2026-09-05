import { type ReactNode, useEffect } from 'react';

export interface PlayerSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Dark bottom sheet scoped to the player — the app's themed `Sheet` would
 *  clash with the pitch-black player when the app is in light mode. */
export function PlayerSheet({ open, onClose, title, children }: PlayerSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button aria-label={title} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full rounded-t-2xl border border-white/10 bg-[#141414] p-6 pb-8 text-white">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/25" />
        <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
