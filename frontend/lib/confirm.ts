export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm';

    const box = document.createElement('div');
    box.className = 'w-full max-w-md rounded-2xl bg-white p-6 shadow-xl';

    const title = document.createElement('h3');
    title.className = 'mb-2 text-lg font-bold text-gray-900';
    title.textContent = 'Confirmation';

    const text = document.createElement('p');
    text.className = 'mb-6 whitespace-pre-wrap text-sm text-gray-600';
    text.textContent = message;

    const row = document.createElement('div');
    row.className = 'flex gap-3';

    const close = (value: boolean) => {
      overlay.remove();
      resolve(value);
    };

    const cancel = document.createElement('button');
    cancel.textContent = 'Annuler';
    cancel.className =
      'flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50';
    cancel.onclick = () => close(false);

    const ok = document.createElement('button');
    ok.textContent = 'Confirmer';
    ok.className =
      'flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700';
    ok.onclick = () => close(true);

    row.append(cancel, ok);
    box.append(title, text, row);
    overlay.append(box);
    document.body.appendChild(overlay);
  });
}