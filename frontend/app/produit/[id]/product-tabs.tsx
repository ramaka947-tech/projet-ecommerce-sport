'use client';

import { useState, type ReactNode } from 'react';

type Tab = { id: string; label: string; content: ReactNode };

export default function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  if (tabs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
      <div role="tablist" className="flex gap-6 px-6 lg:px-8 border-b border-line overflow-x-auto">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              className={`relative py-4 text-sm whitespace-nowrap transition-colors ${
                isActive ? 'font-bold text-ink' : 'text-ink/50 hover:text-ink'
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
        <div key={t.id} role="tabpanel" hidden={t.id !== active} className="p-6 lg:p-8">
          {t.content}
        </div>
      ))}
    </div>
  );
}