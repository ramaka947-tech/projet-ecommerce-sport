'use client';
import { useEffect, useState } from 'react';
import { Trash2, CheckCircle, Send, Loader2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getAdminMessages, markMessageAsRead, deleteMessage, replyMessage } from '@/lib/api';

type Entry = { id: string; author: 'CUSTOMER' | 'ADMIN'; content: string; createdAt: string };

// Fil complet : message initial, ancienne réponse (si elle existe), puis les échanges
function buildThread(msg: any): Entry[] {
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

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMessages();
      setMessages(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les messages. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRead = async (id: string) => {
    try {
      await markMessageAsRead(id);
      load();
    } catch (err) {
      console.error(err);
      setError("L'action a échoué. Réessayez.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await deleteMessage(id);
      load();
    } catch (err) {
      console.error(err);
      setError('La suppression a échoué. Réessayez.');
    }
  };

  const handleReply = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim() || sending[id]) return;

    setSending((prev) => ({ ...prev, [id]: true }));
    try {
      await replyMessage(id, text.trim());
      setReplyText((prev) => ({ ...prev, [id]: '' }));
      await load();
    } catch (err) {
      console.error(err);
      setError("La réponse n'a pas pu être envoyée. Réessayez.");
    } finally {
      setSending((prev) => ({ ...prev, [id]: false }));
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages de contact</h1>
        <p className="text-sm text-ink/60 mt-1">
          {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'Tous les messages sont lus'}
        </p>
      </div>

      {error && (
        <div className="max-w-4xl bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="shrink-0 font-semibold underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-ink/60">
          <Loader2 size={18} className="animate-spin" /> Chargement...
        </div>
      ) : messages.length === 0 ? (
        !error && (
          <div className="bg-white rounded-2xl border border-line p-12 text-center">
            <p className="text-ink/60">Aucun message pour le moment.</p>
          </div>
        )
      ) : (
        <div className="space-y-4 max-w-4xl">
          {messages.map((msg) => {
            const thread = buildThread(msg);
            return (
              <div
                key={msg.id}
                className={`bg-white rounded-2xl border p-5 transition-colors ${
                  msg.isRead ? 'border-line' : 'border-action/40 bg-action/5'
                }`}
              >
                {/* En-tête du message */}
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-ink">{msg.name}</span>
                      <span className="text-sm text-ink/50">&lt;{msg.email}&gt;</span>
                      {!msg.isRead && (
                        <span className="text-xs bg-action text-white px-2 py-0.5 rounded-full font-semibold">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/50">
                      {new Date(msg.createdAt).toLocaleString('fr-FR')} · Sujet :{' '}
                      <strong>{msg.subject || 'Aucun'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!msg.isRead && (
                      <button
                        onClick={() => handleRead(msg.id)}
                        title="Marquer comme lu"
                        className="p-2 text-ink/60 hover:text-success transition"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(msg.id)}
                      title="Supprimer"
                      className="p-2 text-ink/40 hover:text-alert transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Fil de discussion */}
                <div className="space-y-3 mb-4">
                  {thread.map((item, i) => {
                    const isAdmin = item.author === 'ADMIN';
                    return (
                      <div key={item.id}>
                        {isAdmin ? (
                          <div className="bg-success-soft border border-success/20 p-4 rounded-lg">
                            <p className="text-xs font-bold text-success mb-1 uppercase tracking-wide">
                              Votre réponse :
                            </p>
                            <p className="text-sm text-ink/80 whitespace-pre-wrap">{item.content}</p>
                          </div>
                        ) : (
                          <div>
                            {i > 0 && (
                              <p className="text-xs font-bold text-ink/40 mb-1 uppercase tracking-wide">
                                Réponse du client :
                              </p>
                            )}
                            <p
                              className={`text-sm text-ink/80 whitespace-pre-wrap ${
                                i > 0 ? 'bg-canvas p-3 rounded-lg' : ''
                              }`}
                            >
                              {item.content}
                            </p>
                          </div>
                        )}
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

                {/* Zone de réponse : toujours visible pour pouvoir continuer la discussion */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      thread.length > 1
                        ? 'Continuer la discussion...'
                        : 'Écrivez votre réponse ici...'
                    }
                    value={replyText[msg.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleReply(msg.id);
                    }}
                    className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-action"
                  />
                  <button
                    onClick={() => handleReply(msg.id)}
                    disabled={sending[msg.id] || !replyText[msg.id]?.trim()}
                    className="flex items-center gap-2 bg-action text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-action-dark transition disabled:opacity-50"
                  >
                    {sending[msg.id] ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Répondre
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminGuard>
  );
}