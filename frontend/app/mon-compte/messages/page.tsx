'use client';
import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getMyMessages, addMyMessageEntry } from '@/lib/api';
import { MessageSquare, Loader2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Entry = { id: string; author: 'CUSTOMER' | 'ADMIN'; content: string; createdAt: string };

type Message = {
  id: string;
  subject?: string | null;
  content: string;
  reply?: string | null;
  createdAt: string;
  entries?: Entry[];
};

function BackLink() {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/mon-compte');
    }
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  );
}

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
    <div className="bg-white border border-line rounded-2xl p-6">
      <div className="flex justify-between items-start mb-3 border-b border-line pb-3">
        <div>
          <p className="font-bold text-ink">Sujet : {msg.subject || 'Demande générale'}</p>
          <p className="text-xs text-ink/50">
            Envoyé le {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold ${
            answered ? 'bg-success-soft text-success' : 'bg-canvas text-ink/60'
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
                className={`text-xs font-bold uppercase mb-1 ${
                  isAdmin ? 'text-action' : 'text-ink/40'
                }`}
              >
                {isAdmin ? 'Réponse de SportPro :' : i === 0 ? 'Votre message :' : 'Votre réponse :'}
              </p>
              <p
                className={`text-sm text-ink/80 p-3 rounded-lg whitespace-pre-line ${
                  isAdmin ? 'bg-action/5 border border-action/20' : 'bg-canvas'
                }`}
              >
                {item.content}
              </p>
              {i > 0 && (
                <p className="text-[11px] text-ink/40 mt-1">
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

      <div className="mt-5 pt-4 border-t border-line">
        <label htmlFor={`reply-${msg.id}`} className="sr-only">
          Votre réponse
        </label>
        <textarea
          id={`reply-${msg.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Écrire une réponse..."
          className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/40 focus:border-action focus:outline-none"
        />
        {sendError && <p className="text-xs text-red-600 mt-1">{sendError}</p>}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={send}
            disabled={sending || !draft.trim()}
            className="inline-flex items-center gap-2 bg-action text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-action-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyMessagesPage() {
  const { isLoggedIn } = useCustomerAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = () => {
    setLoading(true);
    setError(null);
    getMyMessages()
      .then(setMessages)
      .catch((err) => {
        console.error(err);
        setError(
          'Impossible de charger vos messages. Vérifiez votre connexion ou réessayez dans un instant.'
        );
      })
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-ink/60">
        <Loader2 size={18} className="animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">
      <BackLink />

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-action/10 text-action flex items-center justify-center">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Mon espace messages</h1>
          <p className="text-sm text-ink/60">Retrouvez ici vos échanges avec SportPro.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadMessages}
            className="shrink-0 font-semibold underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {!error && messages.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-12 text-center">
          <p className="text-ink/60">Vous n'avez envoyé aucun message pour le moment.</p>
          <Link
            href="/contact"
            className="inline-block mt-4 bg-action text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-action-dark transition"
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