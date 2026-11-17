// layouts/WorkspaceShell.jsx
//
// Eén layout voor de hele workspace: chat staat centraal, beheer zit eronder.
// Vervangt WorkspaceLayout, ChatRoute, ChatPage, MobileSheet en MobileBottomBar.
//
//  ┌ sidebar ─────────────┐┌ main ───────────────────────┐
//  │ [logo] Workspace  ⇅  ││                             │
//  │ [+ Nieuw gesprek] [«]││   <Outlet />                │
//  │ ⌕ Zoeken      Ctrl K ││   (chat, docs, mensen, …)   │
//  │ VANDAAG              ││                             │
//  │  gesprek …           ││                             │
//  │ ▾ Beheer             ││                             │
//  │  Overzicht / Docs …  ││                             │
//  │ (●) Karim  ⋯         ││                             │
//  └──────────────────────┘└─────────────────────────────┘

import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { ChatProvider, useChat } from '../context/ChatContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useModal, { ModalProvider } from '../modals/ModalContext.jsx';
import ConfirmModal from '../modals/ConfirmModal.jsx';
import ProfileDialog from '../components/ProfileDialog.jsx';
import CommandPalette, { PageIcon } from '../components/workspace/CommandPalette.jsx';
import { BASE_URL } from '../lib/api.js';
import { ROLE_LABELS } from '../lib/permissions.js';
import { getErrorMessage } from '../lib/utils.js';
import { groupChats } from '../lib/chatGroups.js';
import '../styles/workspaceShell.css';

const STORAGE_COLLAPSED = 'raggy.sidebar.collapsed';
const STORAGE_BEHEER    = 'raggy.sidebar.beheerOpen';

export default function WorkspaceShell() {
  const { slug } = useParams();
  return (
    <ModalProvider>
      <ChatProvider slug={slug}>
        <Shell />
      </ChatProvider>
    </ModalProvider>
  );
}

function Shell() {
  const { slug }   = useParams();
  const { pathname } = useLocation();
  const navigate   = useNavigate();
  const { workspace, documents, loading, can } = useWorkspace();

  const [collapsed, setCollapsed]       = useState(() => readStorage(STORAGE_COLLAPSED, false));
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [paletteOpen, setPaletteOpen]   = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);

  const base        = `/w/${slug}`;
  const isChatRoute = pathname.replace(/\/$/, '') === base || pathname.startsWith(`${base}/chat`);

  // Beheer-pagina's (alleen wat deze rol mag zien)
  const pages = useMemo(() => [
    { to: `${base}/overzicht`,    label: 'Overzicht',    icon: 'overview' },
    { to: `${base}/docs`,         label: 'Documenten',   icon: 'docs' },
    { to: `${base}/connecties`,   label: 'Connecties',   icon: 'connections' },
    { to: `${base}/mensen`,       label: 'Mensen',       icon: 'people' },
    ...(can('workspace', 'update') || can('workspace', 'delete')
      ? [{ to: `${base}/instellingen`, label: 'Instellingen', icon: 'settings' }]
      : []),
  ], [base, can]);

  // Bij navigeren: mobiele drawer dicht
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Ctrl/⌘ + K overal in de workspace
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(open => !open);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function toggleCollapsed() {
    setCollapsed(c => {
      writeStorage(STORAGE_COLLAPSED, !c);
      return !c;
    });
  }

  if (loading && !workspace) {
    return (
      <div className="ws-loading">
        <span className="ws-spinner" />
      </div>
    );
  }

  const docsProcessing = documents.some(d => ['uploading', 'queued', 'processing'].includes(d.status));

  return (
    <div className={`ws-shell ${collapsed ? 'ws-shell--collapsed' : ''}`}>
      <div
        className={`ws-overlay ${mobileOpen ? 'ws-overlay--open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`ws-sidebar ${mobileOpen ? 'ws-sidebar--mobile-open' : ''}`} aria-label="Workspace navigatie">
        <WorkspaceSwitcher collapsed={collapsed} />

        <div className="ws-actions">
          <button
            className="ws-new-chat"
            onClick={() => navigate(base)}
            title="Nieuw gesprek"
          >
            <PageIcon name="plus" />
            <span className="ws-label">Nieuw gesprek</span>
          </button>
          <button
            className="ws-icon-btn ws-collapse-btn"
            onClick={toggleCollapsed}
            title={collapsed ? 'Zijbalk uitklappen' : 'Zijbalk inklappen'}
            aria-label={collapsed ? 'Zijbalk uitklappen' : 'Zijbalk inklappen'}
          >
            <SidebarIcon />
          </button>
          <button
            className="ws-icon-btn ws-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Menu sluiten"
          >
            <CloseIcon />
          </button>
        </div>

        <button className="ws-search" onClick={() => setPaletteOpen(true)} title="Zoeken (Ctrl K)">
          <SearchIcon />
          <span className="ws-label">Zoeken</span>
          <kbd className="ws-kbd">{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
        </button>

        <ChatList collapsed={collapsed} />

        <BeheerNav
          pages={pages}
          collapsed={collapsed}
          pathname={pathname}
          docsCount={documents.length}
          docsProcessing={docsProcessing}
        />

        <ProfileMenu collapsed={collapsed} onEditProfile={() => setProfileOpen(true)} />
      </aside>

      <div className="ws-main">
        {/* Mobiele balk voor beheer-pagina's (chat heeft z'n eigen header) */}
        {!isChatRoute && (
          <div className="ws-mobilebar">
            <button className="ws-icon-btn" onClick={() => setMobileOpen(true)} aria-label="Menu openen">
              <MenuIcon />
            </button>
            <span className="ws-mobilebar-title">{workspace?.name}</span>
            <button className="ws-icon-btn" onClick={() => navigate(base)} aria-label="Nieuw gesprek">
              <PageIcon name="plus" />
            </button>
          </div>
        )}

        {isChatRoute ? (
          <Outlet context={{ onMenuClick: () => setMobileOpen(true) }} />
        ) : (
          <div className="ws-page">
            <Outlet context={{ onMenuClick: () => setMobileOpen(true) }} />
          </div>
        )}
      </div>

      {paletteOpen && (
        <CommandPalette slug={slug} pages={pages} onClose={() => setPaletteOpen(false)} />
      )}
      {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

// ── Workspace switcher ─────────────────────

function WorkspaceSwitcher({ collapsed }) {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { workspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false), open);

  const memberships = user?.memberships ?? [];
  const planLabel   = workspace?.plan === 'pro' ? 'Pro' : 'Basis';
  const roleLabel   = ROLE_LABELS[workspace?.role] ?? workspace?.role;

  function go(path) {
    setOpen(false);
    navigate(path);
  }

  return (
    <div className="ws-switcher" ref={ref}>
      <button
        className={`ws-switcher-btn ${open ? 'ws-switcher-btn--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? workspace?.name : undefined}
      >
        <WorkspaceLogo url={workspace?.logo_resource_url} name={workspace?.name} />
        <span className="ws-switcher-text ws-label">
          <span className="ws-switcher-name">{workspace?.name}</span>
          <span className="ws-switcher-meta">{roleLabel} · {planLabel}</span>
        </span>
        <span className="ws-label ws-switcher-chevron"><UpDownIcon /></span>
      </button>

      {open && (
        <div className="ws-popover ws-switcher-menu" role="menu">
          <p className="ws-popover-label">Wisselen van workspace</p>
          {memberships.map(m => {
            const active = m.org_slug === slug;
            return (
              <button
                key={m.org_id ?? m.org_slug}
                role="menuitem"
                className={`ws-popover-item ${active ? 'ws-popover-item--active' : ''}`}
                onClick={() => (active ? setOpen(false) : go(`/w/${m.org_slug}`))}
              >
                <WorkspaceLogo url={m.logo_resource_url} name={m.org_name} size="sm" />
                <span className="ws-popover-item-text">
                  <span className="ws-popover-item-name">{m.org_name}</span>
                  <span className="ws-popover-item-sub">{ROLE_LABELS[m.role] ?? m.role}</span>
                </span>
                {active && <CheckIcon />}
              </button>
            );
          })}
          <div className="ws-popover-divider" />
          <button role="menuitem" className="ws-popover-item" onClick={() => go('/dashboard')}>
            <span className="ws-popover-item-icon"><GridIcon /></span>
            Alle workspaces
          </button>
        </div>
      )}
    </div>
  );
}

function WorkspaceLogo({ url, name, size }) {
  return (
    <span className={`ws-logo ${size === 'sm' ? 'ws-logo--sm' : ''}`}>
      {url ? <img src={`${BASE_URL}${url}`} alt="" /> : (name?.[0]?.toUpperCase() ?? '?')}
    </span>
  );
}

// ── Gesprekken ─────────────────────────────

function ChatList({ collapsed }) {
  const { slug, chatId } = useParams();
  const navigate         = useNavigate();
  const toast            = useToast();
  const { openModal }    = useModal();
  const { chats, chatsLoading, deleteChat, updateChatTitle, titleLoading } = useChat();

  const [menu, setMenu]               = useState(null); // { chatId, x, y }
  const [editingId, setEditingId]     = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const menuRef        = useRef(null);
  const savingRef      = useRef(false);
  const editingIdRef   = useRef(null);

  useClickOutside(menuRef, () => setMenu(null), !!menu);

  useEffect(() => {
    if (!menu) return;
    function onKey(e) { if (e.key === 'Escape') setMenu(null); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  const groups = useMemo(() => groupChats(chats), [chats]);

  if (collapsed) return <div className="ws-chats ws-chats--collapsed" />;

  function openMenu(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (menu?.chatId === id) { setMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ chatId: id, x: rect.right - 160, y: rect.bottom + 4 });
  }

  function startEdit(chat) {
    setMenu(null);
    if (!chat) return;
    editingIdRef.current = chat.id;
    setEditingId(chat.id);
    setEditingTitle(chat.title || '');
  }

  function cancelEdit() {
    editingIdRef.current = null;
    setEditingId(null);
    setEditingTitle('');
  }

  async function confirmEdit() {
    const chat = chats.find(c => c.id === editingId);
    // Ref-check vangt een late blur na Enter af
    if (!chat || savingRef.current || editingIdRef.current !== chat.id) return;

    const title = editingTitle.trim();
    if (!title || title === (chat.title ?? '')) { cancelEdit(); return; }

    savingRef.current = true;
    try {
      await updateChatTitle(chat.id, title);
      toast.success('Naam van het gesprek gewijzigd.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Naam wijzigen is mislukt.'));
    } finally {
      savingRef.current = false;
      cancelEdit();
    }
  }

  function askDelete(id) {
    setMenu(null);
    const title = chats.find(c => c.id === id)?.title || 'dit gesprek';

    openModal(
      <ConfirmModal
        title="Gesprek verwijderen"
        description={<>Weet je zeker dat je <strong>{title}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.</>}
        confirmLabel="Verwijderen"
        busyLabel="Verwijderen…"
        danger
        onConfirm={async () => {
          try {
            await deleteChat(id);
          } catch (err) {
            toast.error(getErrorMessage(err, 'Gesprek verwijderen is mislukt.'));
            throw err;
          }
          toast.success('Gesprek verwijderd.');
          if (chatId === id) navigate(`/w/${slug}`, { replace: true });
        }}
      />
    );
  }

  return (
    <nav className="ws-chats" aria-label="Gesprekken" onScroll={() => menu && setMenu(null)}>
      {groups.map(group => (
        <div key={group.label ?? 'all'} className="ws-chat-group">
          <p className="ws-section-label">{group.label ?? 'Gesprekken'}</p>
          {group.chats.map(chat => {
            const isActive     = chat.id === chatId;
            const showSkeleton = isActive && titleLoading && !chat.title;

            if (editingId === chat.id) {
              return (
                <div key={chat.id} className="ws-chat-edit">
                  <input
                    className="ws-chat-edit-input"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  { e.preventDefault(); confirmEdit(); }
                      if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); }
                    }}
                    onBlur={confirmEdit}
                    onFocus={e => e.target.select()}
                    maxLength={120}
                    autoFocus
                  />
                </div>
              );
            }

            return (
              <div key={chat.id} className={`ws-chat ${isActive ? 'ws-chat--active' : ''}`}>
                <NavLink to={`/w/${slug}/chat/${chat.id}`} className="ws-chat-link">
                  {showSkeleton ? (
                    <span className="ws-skeleton" />
                  ) : (
                    <span className={`ws-chat-title ${!chat.title ? 'ws-chat-title--untitled' : ''}`}>
                      {chat.title || 'Nieuw gesprek'}
                    </span>
                  )}
                </NavLink>
                <button
                  className={`ws-chat-menu-btn ${menu?.chatId === chat.id ? 'ws-chat-menu-btn--open' : ''}`}
                  onClick={e => openMenu(e, chat.id)}
                  aria-label="Gespreksopties"
                >
                  <DotsIcon />
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {!chatsLoading && chats.length === 0 && (
        <div className="ws-chats-empty">
          <p>Nog geen gesprekken.</p>
          <span>Je gesprekken verschijnen hier.</span>
        </div>
      )}

      {menu && (
        <div
          ref={menuRef}
          className="ws-popover ws-chat-menu"
          style={{ top: menu.y, left: Math.max(8, menu.x) }}
          role="menu"
        >
          <button
            role="menuitem"
            className="ws-popover-item"
            onClick={() => startEdit(chats.find(c => c.id === menu.chatId))}
          >
            <span className="ws-popover-item-icon"><EditIcon /></span>
            Naam wijzigen
          </button>
          <button
            role="menuitem"
            className="ws-popover-item ws-popover-item--danger"
            onClick={() => askDelete(menu.chatId)}
          >
            <span className="ws-popover-item-icon"><TrashIcon /></span>
            Verwijderen
          </button>
        </div>
      )}
    </nav>
  );
}

// ── Beheer ─────────────────────────────────

function BeheerNav({ pages, collapsed, pathname, docsCount, docsProcessing }) {
  const onBeheerPage = pages.some(p => pathname.startsWith(p.to));
  const [open, setOpen] = useState(() => readStorage(STORAGE_BEHEER, true));

  // Op een beheer-pagina altijd open, anders weet je niet waar je bent
  const expanded = open || onBeheerPage || collapsed;

  function toggle() {
    setOpen(o => {
      writeStorage(STORAGE_BEHEER, !o);
      return !o;
    });
  }

  return (
    <div className={`ws-beheer ${expanded ? 'ws-beheer--open' : ''}`}>
      {!collapsed && (
        <button
          className="ws-beheer-toggle"
          onClick={toggle}
          disabled={onBeheerPage}
          aria-expanded={expanded}
        >
          <span>Beheer</span>
          <ChevronIcon />
        </button>
      )}

      {expanded && (
        <nav className="ws-beheer-nav" aria-label="Beheer">
          {pages.map(page => (
            <NavLink
              key={page.to}
              to={page.to}
              className={({ isActive }) => `ws-nav-item ${isActive ? 'ws-nav-item--active' : ''}`}
              title={collapsed ? page.label : undefined}
            >
              <span className="ws-nav-icon">
                <PageIcon name={page.icon} />
                {page.icon === 'docs' && docsProcessing && <span className="ws-nav-dot" />}
              </span>
              <span className="ws-label">{page.label}</span>
              {page.icon === 'docs' && docsCount > 0 && (
                <span className="ws-nav-count ws-label">{docsCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

// ── Profiel ────────────────────────────────

function ProfileMenu({ collapsed, onEditProfile }) {
  const navigate         = useNavigate();
  const toast            = useToast();
  const { user, logout } = useAuth();
  const [open, setOpen]  = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => setOpen(false), open);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  async function handleLogout() {
    setOpen(false);
    try {
      await logout();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Uitloggen is mislukt.'));
    }
    navigate('/inloggen', { replace: true });
  }

  return (
    <div className="ws-profile" ref={ref}>
      <button
        className={`ws-profile-btn ${open ? 'ws-profile-btn--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? user?.name : undefined}
      >
        <span className="ws-avatar">
          {user?.profile_picture_resource_url
            ? <img src={`${BASE_URL}${user.profile_picture_resource_url}`} alt="" />
            : initials}
        </span>
        <span className="ws-profile-text ws-label">
          <span className="ws-profile-name">{user?.name}</span>
          <span className="ws-profile-email">{user?.email}</span>
        </span>
        <span className="ws-label ws-profile-dots"><DotsIcon horizontal /></span>
      </button>

      {open && (
        <div className="ws-popover ws-profile-menu" role="menu">
          <button role="menuitem" className="ws-popover-item" onClick={() => { setOpen(false); onEditProfile(); }}>
            <span className="ws-popover-item-icon"><UserIcon /></span>
            Profiel bewerken
          </button>
          <button role="menuitem" className="ws-popover-item" onClick={() => { setOpen(false); navigate('/dashboard'); }}>
            <span className="ws-popover-item-icon"><GridIcon /></span>
            Alle workspaces
          </button>
          <div className="ws-popover-divider" />
          <button role="menuitem" className="ws-popover-item ws-popover-item--danger" onClick={handleLogout}>
            <span className="ws-popover-item-icon"><LogoutIcon /></span>
            Uitloggen
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────

function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    function onKey(e) {
      if (e.key === 'Escape') onOutside();
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

// ── Iconen ─────────────────────────────────

function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.75" y="2.25" width="12.5" height="11.5" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function UpDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4.5 5.5L7 3l2.5 2.5M4.5 8.5L7 11l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ws-chevron">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ws-popover-check">
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="1.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1.5" y="8" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="8" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function DotsIcon({ horizontal }) {
  return horizontal ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="3" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="11" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 4h9M5 4V2.5h3V4M4.5 6v4.5M8.5 6v4.5M3 4l.7 7h5.6L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="4.8" r="2.6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.2 12.5c0-2.5 2.2-4.2 4.8-4.2s4.8 1.7 4.8 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="13" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}