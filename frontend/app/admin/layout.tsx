'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Palette, FileText,
  BarChart3, Settings, ChevronDown, LogOut, Menu, X, Store,
  Bell, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { removeToken } from '@/lib/auth';

type NavItem = { href: string; label: string; icon: any };
type NavGroup = { id: string; label: string; icon: any; items: { href: string; label: string }[] };
type NavEntry = NavItem | NavGroup;

const navEntries: NavEntry[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'catalogue', label: 'Catalogue', icon: Package,
    items: [
      { href: '/admin/produits', label: 'Produits' },
      { href: '/admin/categories', label: 'Catégories' },
      { href: '/admin/attributs', label: 'Tailles & couleurs' },
    ],
  },
  {
    id: 'ventes', label: 'Ventes', icon: ShoppingCart,
    items: [
      { href: '/admin/commandes', label: 'Commandes' },
      { href: '/admin/paiements', label: 'Paiements' },
    ],
  },
  {
    id: 'clients', label: 'Clients', icon: Users,
    items: [
      { href: '/admin/messages', label: 'Messages' },
      { href: '/admin/avis', label: 'Avis' },
    ],
  },
  {
    id: 'apparence', label: 'Apparence', icon: Palette,
    items: [
      { href: '/admin/hero', label: 'Bannière hero' },
      { href: '/admin/contact', label: 'Contact' },
      { href: '/admin/a-propos', label: 'À propos' },
    ],
  },
  {
    id: 'legal', label: 'Pages légales', icon: FileText,
    items: [{ href: '/admin/cgv', label: 'CGV' }],
  },
  { href: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/admin/settings', label: 'Réglages', icon: Settings },
];

const isGroup = (e: NavEntry): e is NavGroup => 'items' in e;
const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');

function getPageInfo(pathname: string): { title: string; parent?: string } {
  for (const entry of navEntries) {
    if (isGroup(entry)) {
      const item = entry.items.find((i) => matches(pathname, i.href));
      if (item) return { title: item.label, parent: entry.label };
    } else if (matches(pathname, entry.href)) {
      return { title: entry.label };
    }
  }
  return { title: 'Administration' };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const entry of navEntries) {
      if (isGroup(entry) && entry.items.some((i) => matches(pathname, i.href))) {
        next[entry.id] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
    setMobileOpen(false);
    setMenuOpen(false);
    setHoveredGroup(null);
  }, [pathname]);

  // Nettoyage du timeout
  useEffect(() => {
    return () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (pathname === '/admin/login') return <>{children}</>;

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleLogout = () => { removeToken(); router.push('/admin/login'); };
  const { title, parent } = getPageInfo(pathname);

  const onMouseEnterGroup = (id: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredGroup(id);
  };

  const onMouseLeaveGroup = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredGroup(null);
    }, 200);
  };

  // --- Fonction pour générer la sidebar (pour gérer desktop et mobile) ---
  const renderSidebar = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className={`flex h-16 shrink-0 items-center border-b border-white/10 ${isCollapsed ? 'justify-center' : 'px-5'}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="SportPro" className={`${isCollapsed ? 'h-8' : 'h-10'} w-auto`} />
          {!isCollapsed && (
            <span className="text-xl font-black tracking-tight">
              Sport<span className="text-action">Pro</span>
            </span>
          )}
        </Link>
      </div>

      {/* 1. Désactiver l'overflow quand réduit */}
      <nav className={`flex-1 py-4 space-y-1 px-2 ${
        isCollapsed 
          ? 'overflow-visible' 
          : 'overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent'
      }`}>
        {navEntries.map((entry) => {
          if (isGroup(entry)) {
            const Icon = entry.icon;
            const isOpen = !!openGroups[entry.id];
            const hasActive = entry.items.some((i) => matches(pathname, i.href));
            const isHovered = hoveredGroup === entry.id;

            return (
              <div 
                key={entry.id} 
                className="relative"
                onMouseEnter={() => isCollapsed && onMouseEnterGroup(entry.id)}
                onMouseLeave={() => isCollapsed && onMouseLeaveGroup()}
              >
                <button
                  onClick={() => !isCollapsed && toggleGroup(entry.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${hasActive ? 'text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''} ${isHovered ? 'bg-white/10' : ''}`}
                >
                  <Icon size={20} className={hasActive ? 'text-action' : ''} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{entry.label}</span>
                      <ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* SOUS-MENU NORMAL (Sidebar ouverte) */}
                {!isCollapsed && isOpen && (
                  <div className="ml-9 mt-1 space-y-1 border-l-2 border-white/10 pl-3">
                    {entry.items.map((item) => {
                      const active = matches(pathname, item.href);
                      return (
                        <Link key={item.href} href={item.href} className={`block rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-action text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* 2. SOUS-MENU VOLANT avec pont transparent (pl-2) */}
                {isCollapsed && isHovered && (
                  <div
                    className="absolute left-full top-0 z-50 pl-2"
                    onMouseEnter={() => onMouseEnterGroup(entry.id)}
                    onMouseLeave={() => onMouseLeaveGroup()}
                  >
                    <div className="w-48 rounded-xl bg-white p-2 shadow-xl">
                      <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
                        {entry.label}
                      </p>
                      {entry.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block rounded-lg px-3 py-2 text-sm transition ${
                            matches(pathname, item.href)
                              ? 'bg-action/10 font-semibold text-action'
                              : 'text-ink/80 hover:bg-canvas'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const Icon = entry.icon;
          const active = matches(pathname, entry.href);

          return (
            <div key={entry.href} className="relative group">
              <Link
                href={entry.href}
                className={`flex items-center w-full rounded-lg transition ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} ${active ? 'bg-action text-white font-bold' : 'text-white/80 font-bold hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={20} />
                {!isCollapsed && <span className="text-sm">{entry.label}</span>}
              </Link>
              
              {/* 3. TOOLTIP avec pont transparent (pl-2) */}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full top-1/2 z-50 -translate-y-1/2 pl-2 opacity-0 invisible transition-all group-hover:visible group-hover:opacity-100">
                  <div className="w-max rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-xl">
                    {entry.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 md:block ${collapsed ? 'w-20' : 'w-64'}`}>
        {renderSidebar(collapsed)}
      </aside>

      {/* Sidebar Mobile - Utilise renderSidebar(false) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-ink shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-4 top-4 text-white/50 hover:text-white z-50">
              <X size={20} />
            </button>
            {renderSidebar(false)}
          </aside>
        </div>
      )}

      <div className={`transition-all duration-300 ${collapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-line bg-white px-4 md:px-6 shadow-sm">
          <button
            onClick={() => { setCollapsed(!collapsed); setHoveredGroup(null); }}
            className="hidden md:flex items-center justify-center p-2 text-ink/60 hover:text-ink hover:bg-canvas rounded-lg transition"
            title={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
          </button>

          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink/70 hover:bg-canvas md:hidden">
            <Menu size={24} />
          </button>

          <div className="min-w-0 flex-1">
            {parent && <p className="truncate text-xs font-medium text-ink/50">{parent}</p>}
            <h2 className="truncate text-xl font-bold leading-tight text-ink">{title}</h2>
          </div>

          <Link href="/" target="_blank" className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-action hover:text-action lg:inline-flex">
            <Store size={16} /> Voir la boutique
          </Link>

          <button className="relative rounded-lg p-2 text-ink/60 transition hover:bg-canvas hover:text-ink">
            <Bell size={20} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-action"></span>
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-canvas">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">A</span>
              <span className="hidden text-sm font-semibold text-ink md:block">Admin</span>
              <ChevronDown size={16} className={`hidden text-ink/40 transition-transform md:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-lg">
                <Link href="/admin/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-canvas hover:text-ink">
                  <Settings size={16} /> Réglages
                </Link>
                <div className="my-1 border-t border-line" />
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-action hover:bg-action/5">
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}