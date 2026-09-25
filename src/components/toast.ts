import { create } from 'zustand';

export interface Toast { id: number; kind: 'success' | 'info' | 'error'; text: string; undo?: () => void; ms: number }
interface T { toasts: Toast[]; push: (t: Omit<Toast, 'id' | 'ms'> & { ms?: number }) => void; dismiss: (id: number) => void }
let n = 0;
export const useToasts = create<T>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++n;
    const ms = t.ms ?? (t.undo ? 5000 : 4000);
    set({ toasts: [...get().toasts, { ...t, id, ms }].slice(-4) });
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));
export const toast = (text: string, kind: Toast['kind'] = 'success', undo?: () => void) => useToasts.getState().push({ text, kind, undo });
