'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getCustomerToken } from '@/lib/customer-auth';
import { getMyMessages, addMyMessageEntry } from '@/lib/api';
import BackButton from '@/components/back-button';

type Entry = { id: string; author: 'CUSTOMER' | 'ADMIN'; content: string; createdAt: string };

type Message = {
  id: string;
  subject?: string | null;
  content: string;
  reply?: string | null;
  createdAt: string;
  entries?: Entry[];
};

// Construit le fil : message initial, ancienne réponse (si elle existe), puis les entrées
function buildThread(msg: Message): Entry[] {
  const thread: Entry[] = [
    { id: `${msg.id}-first`, author: 'CUSTOMER', content: msg.content, createdAt: msg.createdAt },
  ];
  if (msg.reply) {
    thread.push({
      id: `${msg.id}-legacy-reply`,
      author: 'ADMIN',
      content: msg.reply,
      createdAt: msg.createdAt,
    });
  }
  return thread.concat(msg.entries ?? []);
}

function MessageCard({ msg, onUpdated }: { msg: Message; onUpdated: (m: Message) => void }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const thread = buildThread(msg);
  const answered = thread[thread.length - 1].author === 'ADMIN';

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const updated = await addMyMessageEntry(msg.id, text);
      onUpdated(updated);
      setDraft('');
    } catch (err) {
      console.error(err);
      setSendError("Votre message n'a pas pu être envoyé. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <p className="break-words font-bold text-ink">
            Sujet : {msg.subject || 'Demande générale'}
          </p>
          <p className="text-xs text-ink/70 md:text-ink/50">
            Envoyé le {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
            answered ? 'bg-success-soft text-success' : 'bg-canvas text-ink/70 md:text-ink/60'
          }`}
        >
          {answered ? 'Répondu' : 'En attente'}
        </span>
      </div>

      <div className="space-y-4">
        {thread.map((item, i) => {
          const isAdmin = item.author === 'ADMIN';
          return (
            <div key={item.id}>
              <p
                className={`mb-1 text-xs font-bold uppercase ${
                  isAdmin ? 'text-action' : 'text-ink/70 md:text-ink/40'
                }`}
              >
                {isAdmin ? 'Réponse de AD Sport Solutions :' : i === 0 ? 'Votre message :' : 'Votre réponse :'}
              </p>
              <p
                className={`whitespace-pre-line break-words rounded-lg p-3 text-sm text-ink/80 ${
                  isAdmin ? 'border border-action/20 bg-action/5' : 'bg-canvas'
                }`}
              >
                {item.content}
              </p>
              {i > 0 && (
                <p className="mt-1 text-xs text-ink/70 md:text-[11px] md:text-ink/40">
                  {new Date(item.createdAt).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <label htmlFor={`reply-${msg.id}`} className="sr-only">
          Votre réponse
        </label>
        {/* 16 px sur mobile : sinon l'iPhone zoome au moment de taper */}
        <textarea
          id={`reply-${msg.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Écrire une réponse..."
          className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink placeholder:text-gray-500 focus:border-action focus:outline-none md:text-sm md:placeholder:text-ink/40"
        />
        {sendError && (
          <p role="alert" className="mt-1 break-words text-xs text-red-600">
            {sendError}
          </p>
        )}
        <div className="mt-2 flex md:justify-end">
          <button
            type="button"
            onClick={send}
            disabled={sending || !draft.trim()}
            className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition active:bg-action-dark disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0 md:w-auto md:hover:bg-action-dark"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={16} aria-hidden="true" />
            )}
            {sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyMessagesPage() {
  const { isLoggedIn } = useCustomerAuth();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Le stockage local peut lever une exception (mode privé iOS) : on protège.
  useEffect(() => {
    try {
      setHasToken(!!getCustomerToken());
    } catch {
      setHasToken(false);
    }
  }, []);

  const loadMessages = () => {
    setLoading(true);
    setError(null);
    getMyMessages()
      .then((m: Message[]) => {
        if (mounted.current) setMessages(m);
      })
      .catch((err: any) => {
        console.error(err);
        if (mounted.current) {
          setError(
            'Impossible de charger vos messages. Vérifiez votre connexion ou réessayez dans un instant.'
          );
        }
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const replaceMessage = (updated: Message) =>
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

  // On attend de savoir si un jeton existe avant de conclure « pas connecté »
  if (hasToken === null || (hasToken && !isLoggedIn) || loading) {
    return (
      <div role="status" className="flex items-center gap-2 p-6 text-ink/70 md:p-8 md:text-ink/60">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Chargement...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
        <BackButton fallback="/mon-compte" className="mb-4 md:mb-6" />
        <div className="rounded-2xl border border-line bg-white p-8 text-center md:p-12">
          <p className="text-ink/70 md:text-ink/60">
            Connectez-vous pour retrouver vos échanges avec AD Sport Solutions.
          </p>
          <Link
            href="/compte/connexion"
            className="mt-4 flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-action px-5 text-sm font-semibold text-white transition active:bg-action-dark md:inline-block md:min-h-0 md:w-auto md:py-2.5 md:hover:bg-action-dark"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
      <BackButton fallback="/mon-compte" className="mb-4 md:mb-6" />

      <div className="mb-6 flex items-center gap-3 md:mb-8">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action/10 text-action">
          <MessageSquare size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink text-balance sm:text-2xl">
            Mon espace messages
          </h1>
          <p className="text-sm text-ink/70 md:text-ink/60">
            Retrouvez ici vos échanges avec AD Sport Solutions.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <span className="break-words">{error}</span>
          <button
            type="button"
            onClick={loadMessages}
            className="inline-flex min-h-11 shrink-0 touch-manipulation items-center font-semibold underline md:min-h-0 md:hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {!error && messages.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center md:p-12">
          <p className="text-ink/70 md:text-ink/60">
            Vous n&apos;avez envoyé aucun message pour le moment.
          </p>
          <Link
            href="/contact"
            className="mt-4 flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-action px-5 text-sm font-semibold text-white transition active:bg-action-dark md:inline-block md:min-h-0 md:w-auto md:py-2.5 md:hover:bg-action-dark"
          >
            Contacter le service client
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageCard key={msg.id} msg={msg} onUpdated={replaceMessage} />
          ))}
        </div>
      )}
    </div>
  );
}