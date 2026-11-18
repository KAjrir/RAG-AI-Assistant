// ChatPage.jsx
import { useRef, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useModal from '../modals/ModalContext.jsx';
import ConfirmModal from '../modals/ConfirmModal.jsx';
import { BASE_URL } from '../lib/api.js';
import { getErrorMessage } from '../lib/utils.js';
import '../styles/chatPage.css';

export default function ChatPage() {
  const { slug, chatId } = useParams();
  const { workspace }    = useWorkspace();
  const { user }         = useAuth();
  const navigate         = useNavigate();
  const toast            = useToast();
  const { openModal }    = useModal();
  const { chats, chatsLoading, deleteChat, updateChatTitle, titleLoading } = useChat();

  const [sidebarOpen, setSidebarOpen]      = useState(true);
  const [mobileSidebarOpen, setMobileOpen] = useState(false);
  const [chatMenu, setChatMenu]            = useState(null); // { chatId, x, y }
  const [editingChat, setEditingChat]      = useState(null);
  const [editingTitle, setEditingTitle]    = useState('');

  const [searchOpen, setSearchOpen]       = useState(false);
  const [query, setQuery]                 = useState('');

  const menuRef        = useRef(null);
  const savingTitleRef = useRef(false); // voorkomt dubbel opslaan (Enter + blur)
  const editingIdRef   = useRef(null);  // welk gesprek nu bewerkt wordt (sync, i.t.t. state)

  // Menu sluiten bij klik buiten / Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setChatMenu(null);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setChatMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  function openMenu(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (chatMenu?.chatId === id) { setChatMenu(null); return; }

    const rect        = e.currentTarget.getBoundingClientRect();
    const sidebarRect = e.currentTarget.closest('.cpl-sidebar')?.getBoundingClientRect();

    setChatMenu({
      chatId: id,
      x: (sidebarRect?.right ?? rect.right) - 45,
      y: rect.bottom,
    });
  }

  // ── Naam wijzigen ────────────────────────

  function startEdit(chat) {
    setChatMenu(null);
    if (!chat) return;
    editingIdRef.current = chat.id;
    setEditingChat(chat);
    setEditingTitle(chat.title || '');
  }

  function cancelEdit() {
    editingIdRef.current = null;
    setEditingChat(null);
    setEditingTitle('');
  }

  async function confirmEdit() {
    // Ref-check vangt een late blur na Enter/opslaan af (oude closure)
    if (!editingChat || savingTitleRef.current || editingIdRef.current !== editingChat.id) return;

    const title = editingTitle.trim();
    if (!title || title === (editingChat.title ?? '')) {
      cancelEdit();
      return;
    }

    savingTitleRef.current = true;
    try {
      await updateChatTitle(editingChat.id, title);
      toast.success('Naam van het gesprek gewijzigd.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Naam wijzigen is mislukt.'));
    } finally {
      savingTitleRef.current = false;
      cancelEdit();
    }
  }

  // ── Verwijderen ──────────────────────────

  function askDelete(id) {
    setChatMenu(null);
    const chat  = chats.find(c => c.id === id);
    const title = chat?.title || 'dit gesprek';

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
            throw err; // modal blijft open
          }
          toast.success('Gesprek verwijderd.');
          if (chatId === id) navigate(`/w/${slug}/chat`, { replace: true });
        }}
      />
    );
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  const q            = query.trim().toLowerCase();
  const visibleChats = q ? chats.filter(c => (c.title || '').toLowerCase().includes(q)) : chats;
  const groups       = groupChats(visibleChats);

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="cpl-shell">

      <div
        className={`cpl-overlay ${mobileSidebarOpen ? 'cpl-overlay--open' : ''}`}
        onClick={closeMobile}
      />

      <aside className={`cpl-sidebar ${sidebarOpen ? 'cpl-sidebar--open' : 'cpl-sidebar--closed'} ${mobileSidebarOpen ? 'cpl-sidebar--mobile-open' : ''}`}>

        <div className="cpl-header">
          {sidebarOpen && (
            <span className="cpl-logo" onClick={() => navigate('/dashboard')}>
              <img alt="Raggy" src="/images/logo.svg" />
            </span>
          )}
          <button
            className="cpl-toggle cpl-toggle--desktop"
            onClick={() => setSidebarOpen(p => !p)}
            aria-label={sidebarOpen ? 'Zijbalk inklappen' : 'Zijbalk uitklappen'}
          >
            {sidebarOpen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
          <button className="cpl-toggle cpl-toggle--mobile" onClick={closeMobile} aria-label="Sluiten">
            <CloseIcon />
          </button>
        </div>

        <div className="cpl-new-wrap">
          <button
            className={`cpl-new-btn ${sidebarOpen ? '' : 'cpl-new-btn--icon'}`}
            onClick={() => { navigate(`/w/${slug}/chat`); closeMobile(); }}
            title="Nieuw gesprek"
          >
            <PlusIcon />
            {sidebarOpen && 'Nieuw gesprek'}
          </button>
        </div>

        {sidebarOpen && (
          searchOpen ? (
            <div className="cpl-search">
              <SearchIcon />
              <input
                className="cpl-search-input"
                placeholder="Zoek in gesprekken…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { e.stopPropagation(); closeSearch(); }
                }}
                onBlur={() => { if (!query.trim()) closeSearch(); }}
                autoFocus
              />
              {query && (
                <button
                  className="cpl-search-clear"
                  onMouseDown={e => { e.preventDefault(); setQuery(''); }}
                  aria-label="Zoekopdracht wissen"
                >
                  <CloseSmallIcon />
                </button>
              )}
            </div>
          ) : (
            <button className="cpl-search-btn" onClick={() => setSearchOpen(true)}>
              <SearchIcon /> Zoeken
            </button>
          )
        )}

        <hr className="cpl-divider" />

        <nav className="cpl-chats" onScroll={() => chatMenu && setChatMenu(null)}>
          {sidebarOpen && groups.map(group => (
            <div key={group.label ?? 'all'} className="cpl-chat-group">
              {group.label && <p className="cpl-chat-group-label">{group.label}</p>}
              {group.chats.map(chat => {
            const isActive     = chat.id === chatId;
            const showSkeleton = isActive && titleLoading && !chat.title;

            return (
              <div key={chat.id} className="cpl-chat-wrap">
                {editingChat?.id === chat.id ? (
                  <div className="cpl-chat-edit">
                    <input
                      className="cpl-chat-edit-input"
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
                    <div className="cpl-chat-edit-actions">
                      <button
                        className="cpl-chat-edit-btn"
                        onMouseDown={e => { e.preventDefault(); confirmEdit(); }}
                        aria-label="Opslaan"
                      >
                        <CheckIcon />
                      </button>
                      <button
                        className="cpl-chat-edit-btn cpl-chat-edit-btn--cancel"
                        onMouseDown={e => { e.preventDefault(); cancelEdit(); }}
                        aria-label="Annuleren"
                      >
                        <CloseSmallIcon />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <NavLink
                      to={`/w/${slug}/chat/${chat.id}`}
                      className={({ isActive }) => `cpl-chat ${isActive ? 'cpl-chat--active' : ''}`}
                      onClick={closeMobile}
                    >
                      {showSkeleton ? (
                        <span className="cpl-chat-title-skeleton" />
                      ) : (
                        <span className={`cpl-chat-title ${!chat.title ? 'untitled' : ''}`}>
                          {chat.title || 'Geen titel'}
                        </span>
                      )}
                    </NavLink>
                    <button
                      className="cpl-chat-menu-btn"
                      onClick={(e) => openMenu(e, chat.id)}
                      aria-label="Gespreksopties"
                    >
                      <DotsIcon />
                    </button>
                  </>
                )}
              </div>
            );
              })}
            </div>
          ))}

          {sidebarOpen && !chatsLoading && visibleChats.length === 0 && (
            <p className="cpl-chats-empty">
              {q ? 'Geen gesprekken gevonden.' : 'Nog geen gesprekken.'}
            </p>
          )}
        </nav>

        <div
          className={`cpl-profile ${sidebarOpen ? '' : 'cpl-profile--closed'}`}
          onClick={() => navigate(`/w/${slug}`)}
        >
          <div className="cpl-avatar">
            {user?.profile_picture_resource_url ? (
              <img
                src={`${BASE_URL}${user.profile_picture_resource_url}`}
                alt="Profielfoto"
                className="cpl-avatar-img"
              />
            ) : (
              initials
            )}
          </div>
          {sidebarOpen && (
            <div className="cpl-profile-info">
              <span className="cpl-profile-name">{user?.name}</span>
              <span className="cpl-profile-org">{workspace?.name}</span>
            </div>
          )}
        </div>

      </aside>

      {chatMenu && (
        <div
          ref={menuRef}
          className="cpl-chat-menu"
          style={{ top: chatMenu.y, left: chatMenu.x }}
        >
          <button
            className="cpl-chat-menu-item"
            onClick={() => startEdit(chats.find(c => c.id === chatMenu.chatId))}
          >
            <EditIcon /> Naam wijzigen
          </button>
          <button
            className="cpl-chat-menu-item cpl-chat-menu-item--danger"
            onClick={() => askDelete(chatMenu.chatId)}
          >
            <TrashIcon /> Verwijderen
          </button>
        </div>
      )}

      <div className="cpl-content">
        <Outlet context={{ sidebarOpen, onMenuClick: () => setMobileOpen(p => !p) }} />
      </div>

    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function DotsIcon() {
  return (
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CloseSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// Groepeert op laatste activiteit: Vandaag, Gisteren, Afgelopen 7 dagen, …
// Heeft geen enkel gesprek een datum, dan één groep zonder kopje.
function groupChats(chats) {
  const dateOf = c => {
    const raw = c.updated_at ?? c.created_at;
    const d   = raw ? new Date(raw) : null;
    return d && !isNaN(d) ? d : null;
  };

  if (!chats.some(dateOf)) return chats.length ? [{ label: null, chats }] : [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;

  const buckets = [
    { label: 'Vandaag',            from: startOfToday.getTime() },
    { label: 'Gisteren',           from: startOfToday.getTime() - DAY },
    { label: 'Afgelopen 7 dagen',  from: startOfToday.getTime() - 7 * DAY },
    { label: 'Afgelopen 30 dagen', from: startOfToday.getTime() - 30 * DAY },
    { label: 'Ouder',              from: -Infinity },
  ].map(b => ({ ...b, chats: [] }));

  for (const chat of chats) {
    const t = dateOf(chat)?.getTime() ?? Date.now(); // zonder datum = net aangemaakt
    buckets.find(b => t >= b.from).chats.push(chat);
  }

  return buckets.filter(b => b.chats.length > 0);
}