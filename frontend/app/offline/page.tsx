export const metadata = { title: 'Hors ligne' };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-bold text-ink">Vous êtes hors ligne</h1>
      <p className="mt-2 text-sm text-ink/70">
        Vérifiez votre connexion internet, puis réessayez.
      </p>
      <a
        href="/"
        className="mt-5 inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-action px-5 text-sm font-semibold text-white active:bg-action-dark sm:w-auto"
      >
        Réessayer
      </a>
    </div>
  );
}