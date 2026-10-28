'use client';
import { useEffect } from 'react';

export default function GlobalConfirm() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.confirm = (message?: string) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm';
      overlay.innerHTML = `
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmation</h3>
          <p class="text-sm text-gray-600 mb-6 whitespace-pre-wrap">${message || ''}</p>
          <div class="flex gap-3">
            <button id="cancel-confirm" class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition">Annuler</button>
            <button id="ok-confirm" class="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 transition">Confirmer</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      let result = false;
      let done = false;

      document.getElementById('ok-confirm')?.addEventListener('click', () => {
        result = true;
        done = true;
        overlay.remove();
      });
      
      document.getElementById('cancel-confirm')?.addEventListener('click', () => {
        result = false;
        done = true;
        overlay.remove();
      });

      const start = Date.now();
      while (!done && Date.now() - start < 15000) {
        // On attend le clic
      }

      return result;
    };
  }, []);

  return null;
}