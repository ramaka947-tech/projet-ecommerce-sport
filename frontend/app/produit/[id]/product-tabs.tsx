'use client';

import { useState, type ReactNode } from 'react';

type Tab = { id: string; label: string; content: ReactNode };

export default function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  if (tabs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
      <div
        role="tablist"
        className="flex gap-5 px-4 sm:gap-6 sm:px-6 lg:px-8 border-b border-line overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`relative min-h-12 touch-manipulation py-3.5 text-sm whitespace-nowrap transition-colors md:min-h-0 md:py-4 ${
                isActive
                  ? 'font-bold text-ink'
                  : 'text-ink/70 active:text-ink md:text-ink/50 md:hover:text-ink'
              }`}
            >
              {t.label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-action rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          className="p-4 sm:p-6 lg:p-8"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}