'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Boxes, Package, FolderTree, Ruler,
  ShoppingCart, ClipboardList, Wallet,
  Users, MessagesSquare, Star,
  LayoutTemplate, Images, Phone, Info,
  Scale, ScrollText,
  BarChart3, Settings, UserCircle,
  ChevronDown, ChevronRight, LogOut, Menu, X, Store, Bell,
  PanelLeftClose, PanelLeftOpen, User,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';

type NavItem = { href: string; label: string; icon: any };
type NavGroup = { id: string; label: string; icon: any; items: { href: string; label: string; icon?: any }[] };
type NavEntry = NavItem | NavGroup;

const navEntries: NavEntry[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'catalogue', label: 'Catalogue', icon: Boxes,
    items: [
      { href: '/admin/produits', label: 'Produits', icon: Package },
      { href: '/admin/categories', label: 'Catégories', icon: FolderTree },
      { href: '/admin/attributs', label: 'Tailles & couleurs', icon: Ruler },
    ],
  },
  {
    id: 'ventes', label: 'Ventes', icon: ShoppingCart,
    items: [
      { href: '/admin/commandes', label: 'Commandes', icon: ClipboardList },
      { href: '/admin/paiements', label: 'Paiements', icon: Wallet },
    ],
  },
  {
    id: 'clients', label: 'Clients', icon: Users,
    items: [
      { href: '/admin/messages', label: 'Messages', icon: MessagesSquare },
      { href: '/admin/avis', label: 'Avis', icon: Star },
    ],
  },
  {
    id: 'apparence', label: 'Apparence', icon: LayoutTemplate,
    items: [
      { href: '/admin/hero', label: 'Bannière hero', icon: Images },
      { href: '/admin/contact', label: 'Contact', icon: Phone },
      { href: '/admin/a-propos', label: 'À propos', icon: Info },
    ],
  },
  {
    id: 'legal', label: 'Pages légales', icon: Scale,
    items: [{ href: '/admin/cgv', label: 'CGV', icon: ScrollText }],
  },
  { href: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/admin/configuration', label: 'Configuration', icon: Settings },
  { href: '/admin/settings', label: 'Profil', icon: UserCircle },
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
  const [adminName, setAdminName] = useState<string>('Admin');

  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem('admin_name');
      if (savedName && savedName !== 'Admin') {
        setAdminName(savedName);
      } else {
        // Fallback : si c'est "Admin" ou vide, on essaie d'utiliser l'email
        const email = localStorage.getItem('admin_email');
        if (email) {
          setAdminName(email.split('@')[0]); // ex: "rama" depuis "rama@mail.com"
        }
      }
    } catch {
      /* stockage indisponible : on garde "Admin" */
    }
  }, []);

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

  useEffect(() => {
    return () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Échap ferme le menu latéral mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (pathname === '/admin/login') return <>{children}</>;

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleLogout = () => {
    removeToken();
    try {
      localStorage.removeItem('admin_name');
      localStorage.removeItem('admin_email');
    } catch {
      /* ignore */
    }
    router.replace('/admin/login'); // replace : le bouton "précédent" ne ramène pas dans l'admin
  };
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

  const renderSidebar = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className={`flex h-16 shrink-0 items-center border-b border-white/10 ${isCollapsed ? 'justify-center' : 'px-5'}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="AD Sport Solutions"
            className={`${isCollapsed ? 'size-9' : 'size-10'} shrink-0 rounded-full object-cover`}
          />
          {!isCollapsed && (
            <span className="flex flex-col text-base font-black leading-none tracking-tight">
              <span>AD Sport</span>
              <span className="mt-0.5 text-action">Solutions</span>
            </span>
          )}
        </Link>
      </div>

      <nav className={`min-h-0 flex-1 py-4 space-y-1 px-2 ${isCollapsed
        ? 'overflow-visible'
        : 'overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent'
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
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition md:min-h-0 ${hasActive ? 'text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center' : ''} ${isHovered ? 'bg-white/10' : ''}`}
                >
                  <Icon size={20} className={hasActive ? 'text-action' : ''} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{entry.label}</span>
                      <ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {!isCollapsed && isOpen && (
                  <div className="ml-9 mt-1 space-y-1 border-l-2 border-white/10 pl-3">
                    {entry.items.map((item) => {
                      const active = matches(pathname, item.href);
                      const ItemIcon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition md:min-h-0 ${active ? 'bg-action text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                          {ItemIcon && <ItemIcon size={16} className="shrink-0" />}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {isCollapsed && isHovered && (
                  <div
                    className="absolute left-full top-0 z-50 pl-2"
                    onMouseEnter={() => onMouseEnterGroup(entry.id)}
                    onMouseLeave={() => onMouseLeaveGroup()}
                  >
                    <div className="w-52 rounded-xl bg-white p-2 shadow-xl">
                      <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink/50">
                        {entry.label}
                      </p>
                      {entry.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${matches(pathname, item.href)
                              ? 'bg-action/10 font-semibold text-action'
                              : 'text-ink/80 hover:bg-canvas'
                              }`}
                          >
                            {ItemIcon && <ItemIcon size={16} className="shrink-0" />}
                            {item.label}
                          </Link>
                        );
                      })}
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
                className={`flex min-h-11 w-full items-center rounded-lg transition md:min-h-0 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} ${active ? 'bg-action text-white font-bold' : 'text-white/80 font-bold hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={20} />
                {!isCollapsed && <span className="text-sm">{entry.label}</span>}
              </Link>

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
    <div className="min-h-dvh bg-canvas">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 md:block ${collapsed ? 'w-20' : 'w-64'}`}>
        {renderSidebar(collapsed)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-60 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-ink pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-2 top-[calc(0.625rem+env(safe-area-inset-top))] z-10 flex size-11 items-center justify-center rounded-lg text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
            {renderSidebar(false)}
          </aside>
        </div>
      )}

      <div className={`min-w-0 transition-all duration-300 ${collapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-[calc(4rem+env(safe-area-inset-top))] items-center gap-2 border-b border-line bg-white px-3 pt-[env(safe-area-inset-top)] shadow-sm sm:gap-4 md:h-16 md:px-6 md:pt-0">
          <button
            onClick={() => { setCollapsed(!collapsed); setHoveredGroup(null); }}
            className="hidden md:flex items-center justify-center p-2 text-ink/60 hover:text-ink hover:bg-canvas rounded-lg transition"
            title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          >
            {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink/70 hover:bg-canvas md:hidden"
          >
            <Menu size={24} />
          </button>

          <nav aria-label="Fil d'Ariane" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            <Link href="/admin/dashboard" className="hidden shrink-0 text-ink/50 transition hover:text-ink sm:inline">
              Administration
            </Link>
            {parent && (
              <>
                <ChevronRight size={14} className="hidden shrink-0 text-ink/30 sm:block" />
                <span className="hidden truncate text-ink/50 sm:inline">{parent}</span>
              </>
            )}
            <ChevronRight size={14} className="hidden shrink-0 text-ink/30 sm:block" />
            <span className="truncate text-base font-semibold text-ink md:text-sm">{title}</span>
          </nav>

          <Link href="/" target="_blank" className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-action hover:text-action lg:inline-flex">
            <Store size={16} /> Voir la boutique
          </Link>

          <button
            aria-label="Notifications"
            className="relative flex size-11 shrink-0 items-center justify-center rounded-lg text-ink/60 transition hover:bg-canvas hover:text-ink md:size-auto md:p-2"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-action md:top-2 md:right-2"></span>
          </button>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu du compte"
              className="flex min-h-11 items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-canvas md:min-h-0"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white uppercase">
                {(() => {
                  const name = (adminName || 'Admin').trim();
                  const parts = name.split(/\s+/).filter(Boolean);
                  if (parts.length === 1) {
                    return parts[0].substring(0, 2).toUpperCase();
                  }
                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                })()}
              </span>
              <span className="hidden text-sm font-semibold text-ink md:block">{adminName}</span>
              <ChevronDown size={16} className={`hidden text-ink/40 transition-transform md:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-line bg-white p-1.5 shadow-lg">
                <p className="truncate px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink/40 md:hidden">
                  {adminName}
                </p>
                <Link href="/admin/settings" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-canvas hover:text-ink md:min-h-0">
                  <User size={16} /> Profil
                </Link>
                <Link href="/" target="_blank" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-canvas hover:text-ink lg:hidden">
                  <Store size={16} /> Voir la boutique
                </Link>
                <div className="my-1 border-t border-line" />
                <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-action hover:bg-action/5 md:min-h-0">
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="min-w-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}