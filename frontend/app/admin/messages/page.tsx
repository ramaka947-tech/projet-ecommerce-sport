'use client';
import { useEffect, useState } from 'react';
import { Search, Send, Loader2, Trash2, CheckCircle2, User, ArrowLeft } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getAdminMessages, markMessageAsRead, deleteMessage, replyMessage } from '@/lib/api';

function buildThread(msg: any) {
  const thread = [
    { id: `${msg.id}-first`, author: 'CUSTOMER', content: msg.content, createdAt: msg.createdAt },
  ];
  if (msg.reply) {
    thread.push({ id: `${msg.id}-legacy`, author: 'ADMIN', content: msg.reply, createdAt: msg.createdAt });
  }
  return thread.concat(msg.entries ?? []);
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  // Sur mobile : afficher la liste OU le chat
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const load = async (keepSelection = true) => {
    setLoading(true);
    try {
      const data = await getAdminMessages();
      setMessages(data);
      if (!keepSelection || (!selectedId && data.length > 0)) {
        setSelectedId(data[0].id);
        if (!data[0].isRead) markMessageAsRead(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(false); }, []);

  const handleSelect = async (msg: any) => {
    setSelectedId(msg.id);
    setReplyText('');
    setMobileChatOpen(true);
    if (!msg.isRead) {
      await markMessageAsRead(msg.id);
      load();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;
    await deleteMessage(id);
    if (selectedId === id) {
      setSelectedId(null);
      setMobileChatOpen(false);
    }
    load();
  };

  const handleReply = async () => {
    if (!selectedId || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await replyMessage(selectedId, replyText.trim());
      setReplyText('');
      await load();
    } finally {
      setSending(false);
    }
  };

  const filtered = messages.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.content?.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' ? true : filter === 'unread' ? !m.isRead : m.isRead;
    return matchesSearch && matchesFilter;
  });

  const selectedMsg = messages.find(m => m.id === selectedId);
  const thread = selectedMsg ? buildThread(selectedMsg) : [];

  return (
    <AdminGuard>
      <div className="flex h-[calc(100dvh-8rem)] flex-col md:h-[calc(100vh-8rem)]">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl font-bold text-ink md:text-2xl">Messages de contact</h1>
          <p className="mt-1 text-sm text-ink/60">Répondez aux messages de vos clients rapidement.</p>
        </div>

        <div className="flex flex-1 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {/* LISTE — cachée sur mobile si chat ouvert */}
          <div className={`w-full flex-col border-r border-line bg-white md:flex md:w-80 md:shrink-0 ${mobileChatOpen ? 'hidden' : 'flex'}`}>
            <div className="space-y-3 border-b border-line p-3 md:p-4">
              <h2 className="text-base font-bold text-ink md:text-lg">Conversations</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-line bg-canvas/50 pl-9 pr-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2 md:text-sm"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                <button onClick={() => setFilter('all')} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'all' ? 'bg-action text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}>
                  Tous ({messages.length})
                </button>
                <button onClick={() => setFilter('unread')} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'unread' ? 'bg-action text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}>
                  Non lus ({messages.filter(m => !m.isRead).length})
                </button>
                <button onClick={() => setFilter('read')} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === 'read' ? 'bg-action text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}>
                  Lus ({messages.filter(m => m.isRead).length})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && messages.length === 0 ? (
                <div className="flex justify-center p-8 text-ink/40"><Loader2 className="animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink/40">Aucune conversation.</div>
              ) : (
                filtered.map(m => {
                  const isSelected = selectedId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className={`flex cursor-pointer items-start gap-3 border-b border-line p-3 transition-colors md:p-4 ${isSelected ? 'border-l-4 border-l-action bg-action-soft/30' : 'border-l-4 border-l-transparent hover:bg-canvas'}`}
                    >
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${m.isRead ? 'bg-ink/40' : 'bg-action'}`}>
                        {getInitials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-baseline justify-between">
                          <p className="truncate font-bold text-ink">{m.name}</p>
                          <span className="ml-2 whitespace-nowrap text-[10px] text-ink/40">
                            {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mb-1 truncate text-xs text-ink/50">{m.email}</p>
                        <p className={`truncate text-xs ${m.isRead ? 'text-ink/40' : 'font-medium text-ink/80'}`}>{m.content}</p>
                      </div>
                      {!m.isRead && (
                        <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-action text-[10px] font-bold text-white">1</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CHAT — caché sur mobile si non ouvert */}
          <div className={`flex-1 flex-col bg-canvas/30 md:flex ${mobileChatOpen ? 'flex' : 'hidden'}`}>
            {!selectedMsg ? (
              <div className="flex flex-1 flex-col items-center justify-center text-ink/40">
                <User size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Sélectionnez une conversation</p>
                <p className="text-sm">pour voir les messages et répondre.</p>
              </div>
            ) : (
              <>
                {/* En-tête chat */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-3 py-2 md:h-20 md:px-6 md:py-0">
                  <div className="flex min-w-0 items-center gap-2 md:gap-4">
                    <button
                      onClick={() => setMobileChatOpen(false)}
                      aria-label="Retour aux conversations"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink/60 hover:bg-canvas md:hidden"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action font-bold text-white md:size-10">
                      {getInitials(selectedMsg.name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-ink md:text-lg">{selectedMsg.name}</h2>
                      <div className="flex min-w-0 items-center gap-2 text-xs text-ink/50 md:text-sm">
                        <span className="truncate">{selectedMsg.email}</span>
                        <span className="hidden shrink-0 rounded bg-action/10 px-2 py-0.5 text-[10px] font-bold text-action sm:inline">Client</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden text-sm text-ink/60 md:flex md:items-center md:gap-4">
                      <span className="font-medium">Sujet : {selectedMsg.subject || 'Général'}</span>
                      <span>Reçu le {new Date(selectedMsg.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <button onClick={(e) => handleDelete(selectedMsg.id, e)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg text-action transition hover:bg-action-soft">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto p-3 md:space-y-6 md:p-6">
                  {thread.map((item) => {
                    const isAdmin = item.author === 'ADMIN';
                    return (
                      <div key={item.id} className={`flex gap-2 md:gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <div className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white md:size-8 ${isAdmin ? 'bg-ink' : 'bg-action'}`}>
                          {isAdmin ? 'A' : getInitials(selectedMsg.name)}
                        </div>
                        <div className={`flex max-w-[80%] flex-col md:max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className="mb-1 flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-ink">{isAdmin ? 'Admin' : selectedMsg.name}</span>
                            <span className="text-[10px] text-ink/40">{new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`whitespace-pre-wrap rounded-2xl p-3 text-sm md:p-4 ${isAdmin ? 'rounded-tr-sm bg-ink text-white' : 'rounded-tl-sm border border-line bg-white text-ink shadow-sm'}`}>
                            {item.content}
                          </div>
                          {isAdmin && (
                            <span className="mt-1 flex items-center gap-1 text-[10px] text-ink/40">
                              <CheckCircle2 size={12} /> Lu
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Saisie */}
                <div className="shrink-0 border-t border-line bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:p-4 md:pb-4">
                  <div className="flex gap-2 md:gap-3">
                    <input
                      type="text"
                      placeholder="Écrivez votre réponse..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
                      className="min-h-11 flex-1 rounded-xl border border-line bg-canvas/30 px-3 text-base focus:border-action focus:outline-none md:min-h-0 md:px-4 md:py-3 md:text-sm"
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || !replyText.trim()}
                      aria-label="Envoyer"
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action px-3 font-semibold text-sm text-white transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:px-6 md:py-3"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}