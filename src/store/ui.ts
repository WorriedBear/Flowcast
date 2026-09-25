import { create } from 'zustand';

interface UI {
  escalateRecId: string | null;
  source: { name: string; week?: number } | null;
  draftsOpen: boolean;
  navOpen: boolean;
  set: (p: Partial<Omit<UI, 'set'>>) => void;
}
export const useUI = create<UI>((set) => ({ escalateRecId: null, source: null, draftsOpen: false, navOpen: false, set: (p) => set(p) }));
