'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Card } from './engine';
import { makeSampleCard } from './engine';

interface CardsStore {
  cards: Card[];
  curCardId: string | null;
  addCard: (card: Card) => void;
  addSample: () => void;
  removeCard: (id: string) => void;
  setCur: (id: string) => void;
  checkin: (id: string, ts?: number) => void;
  undoCheckin: (id: string) => void;
  importCards: (cards: Card[]) => number;
}

export const useCards = create<CardsStore>()(
  persist(
    (set, get) => ({
      cards: [],
      curCardId: null,
      addCard: (card) => {
        set((s) => ({ cards: [card, ...s.cards], curCardId: card.id }));
      },
      addSample: () => {
        const s = get();
        if (s.cards.length === 0) {
          const sample = makeSampleCard();
          set({ cards: [sample], curCardId: sample.id });
        }
      },
      removeCard: (id) => {
        set((s) => {
          const cards = s.cards.filter((c) => c.id !== id);
          const curCardId = s.curCardId === id ? (cards[0]?.id ?? null) : s.curCardId;
          return { cards, curCardId };
        });
      },
      setCur: (id) => set({ curCardId: id }),
      checkin: (id, ts = Date.now()) => {
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, checkins: [...c.checkins, ts] } : c)),
        }));
      },
      undoCheckin: (id) => {
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === id && c.checkins.length > 0 ? { ...c, checkins: c.checkins.slice(0, -1) } : c
          ),
        }));
      },
      importCards: (cards) => {
        const s = get();
        const existing = new Set(s.cards.map((c) => c.id));
        const fresh = cards.filter((c) => c && c.id && c.name && !existing.has(c.id));
        if (fresh.length) set({ cards: [...s.cards, ...fresh] });
        return fresh.length;
      },
    }),
    {
      name: 'worthit.cards.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/* ══════════ 主题 store ══════════ */
export type Theme = 'dive' | 'forge';

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dive',
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      name: 'worthit.theme.v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
