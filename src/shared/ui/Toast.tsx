import { create } from 'zustand';
import { cn } from '@/shared/lib/cn';

export type ToastTone = 'default' | 'squad' | 'banked' | 'danger';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  items: ToastItem[];
  toast: (input: { message: string; tone?: ToastTone }) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  toast: ({ message, tone = 'default' }) => {
    const id = crypto.randomUUID();
    set((s) => ({ items: [...s.items, { id, message, tone }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Call from anywhere, incl. outside React. */
export const toast = (input: { message: string; tone?: ToastTone }) =>
  useToastStore.getState().toast(input);

const toneClass: Record<ToastTone, string> = {
  default: 'border-[var(--color-line)] bg-[var(--color-raised)] text-[var(--color-ink)]',
  squad: 'border-[var(--color-squad)] bg-[var(--color-squad)]/10 text-[var(--color-ink)]',
  banked: 'border-[var(--color-banked)] bg-[var(--color-banked)]/10 text-[var(--color-ink)]',
  danger: 'border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-ink)]',
};

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto w-full max-w-sm rounded-[10px] border px-4 py-3 text-start text-sm shadow-lg',
            toneClass[t.tone],
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
