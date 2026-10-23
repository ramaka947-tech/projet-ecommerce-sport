'use client';
import { useEffect, useState } from 'react';
import { Search, Send, Loader2, MoreVertical, Trash2, CheckCircle2, User } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getAdminMessages, markMessageAsRead, deleteMessage, replyMessage } from '@/lib/api';

// On regroupe les échanges d'un même client
function buildThread(msg: any) {
  const thread = [
    { id: `${msg.id}-first`, author: 'CUSTOMER', content: msg.content, createdAt: msg.createdAt },
  ];
  if (msg.reply) {
    thread.push({ id: `${msg.id}-legacy`, author: 'ADMIN', content: msg.reply, createdAt: msg.createdAt });
  }
  return thread.concat(msg.entries ?? []);
}

// Génère les initiales pour l'avatar
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

  const load = async (keepSelection = true) => {
    setLoading(true);
    try {
      const data = await getAdminMessages();
      setMessages(data);
      // Sélectionne le premier message par défaut si rien n'est sélectionné
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
    if (!msg.isRead) {
      await markMessageAsRead(msg.id);
      load(); // rafraichit pour enlever le badge non-lu
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;
    await deleteMessage(id);
    if (selectedId === id) setSelectedId(null);
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
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        
        {/* En-tête de la page */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Messages de contact</h1>
          <p className="text-sm text-ink/60 mt-1">Répondez aux messages de vos clients rapidement.</p>
        </div>

        {/* Conteneur principal : 2 colonnes */}
        <div className="flex-1 bg-white border border-line rounded-2xl shadow-sm flex overflow-hidden">
          
          {/* --- COLONNE GAUCHE : LISTE DES CONVERSATIONS --- */}
          <div className="w-80 border-r border-line flex flex-col bg-white shrink-0">
            
            <div className="p-4 border-b border-line space-y-3">
              <h2 className="font-bold text-lg text-ink">Conversations</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-canvas/50 border border-line rounded-lg text-sm focus:outline-none focus:border-action"
                />
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'all' ? 'bg-action text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}>Tous ({messages.length})</button>
                <button onClick={() => setFilter('unread')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'unread' ? 'bg-action text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}>Non lus ({messages.filter(m => !m.isRead).length})</button>
                <button onClick={() => setFilter('read')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'read' ? 'bg-action text-white' : 'bg-canvas text-ink/60 hover:text-ink'}`}>Lus ({messages.filter(m => m.isRead).length})</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && messages.length === 0 ? (
                <div className="p-8 flex justify-center text-ink/40"><Loader2 className="animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink/40">Aucune conversation.</div>
              ) : (
                filtered.map(m => {
                  const isSelected = selectedId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className={`flex items-start gap-3 p-4 border-b border-line cursor-pointer transition-colors ${isSelected ? 'bg-action-soft/30 border-l-4 border-l-action' : 'hover:bg-canvas border-l-4 border-l-transparent'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white ${m.isRead ? 'bg-ink/40' : 'bg-action'}`}>
                        {getInitials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="font-bold text-ink truncate">{m.name}</p>
                          <span className="text-[10px] text-ink/40 whitespace-nowrap ml-2">
                            {new Date(m.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-xs text-ink/50 truncate mb-1">{m.email}</p>
                        <p className={`text-xs truncate ${m.isRead ? 'text-ink/40' : 'text-ink/80 font-medium'}`}>{m.content}</p>
                      </div>
                      {!m.isRead && (
                        <div className="w-5 h-5 rounded-full bg-action text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                          1
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --- COLONNE DROITE : FIL DE DISCUSSION --- */}
          <div className="flex-1 flex flex-col bg-canvas/30">
            {!selectedMsg ? (
              <div className="flex-1 flex flex-col items-center justify-center text-ink/40">
                <User size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Sélectionnez une conversation</p>
                <p className="text-sm">pour voir les messages et répondre.</p>
              </div>
            ) : (
              <>
                {/* En-tête du chat */}
                <div className="h-20 bg-white border-b border-line px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-action text-white flex items-center justify-center font-bold">
                      {getInitials(selectedMsg.name)}
                    </div>
                    <div>
                      <h2 className="font-bold text-ink text-lg">{selectedMsg.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-ink/50">
                        <span>{selectedMsg.email}</span>
                        <span className="bg-action/10 text-action px-2 py-0.5 rounded text-[10px] font-bold">Client</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ink/60">
                    <span className="font-medium">Sujet : {selectedMsg.subject || 'Général'}</span>
                    <span>Reçu le {new Date(selectedMsg.createdAt).toLocaleDateString('fr-FR')}</span>
                    <button onClick={(e) => handleDelete(selectedMsg.id, e)} className="p-2 text-action hover:bg-action-soft rounded-lg transition" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {thread.map((item) => {
                    const isAdmin = item.author === 'ADMIN';
                    return (
                      <div key={item.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-1 ${isAdmin ? 'bg-ink' : 'bg-action'}`}>
                          {isAdmin ? 'A' : getInitials(selectedMsg.name)}
                        </div>
                        <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-semibold text-ink">{isAdmin ? 'Admin' : selectedMsg.name}</span>
                            <span className="text-[10px] text-ink/40">{new Date(item.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap ${isAdmin ? 'bg-ink text-white rounded-tr-sm' : 'bg-white text-ink border border-line rounded-tl-sm shadow-sm'}`}>
                            {item.content}
                          </div>
                          {isAdmin && (
                            <span className="text-[10px] text-ink/40 mt-1 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Lu
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Zone de saisie */}
                <div className="p-4 bg-white border-t border-line shrink-0">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Écrivez votre réponse..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') handleReply(); }}
                      className="flex-1 border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-action bg-canvas/30"
                    />
                    <button
                      onClick={handleReply}
                      disabled={sending || !replyText.trim()}
                      className="bg-action text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-action-dark transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Envoyer
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