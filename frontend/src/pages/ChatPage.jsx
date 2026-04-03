// ChatPage.jsx
import { useRef, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import '../styles/chatPage.css';

export default function ChatPage() {
  const { slug, chatId }                    = useParams();
  const { workspace }                       = useWorkspace();
  const { user }                            = useAuth();
  const navigate                            = useNavigate();
  const { chats, deleteChat, updateChatTitle, titleLoading } = useChat();


  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [mobileSidebarOpen, setMobileOpen]  = useState(false);
  const [chatMenu, setChatMenu]             = useState(null);
  const [editingChat, setEditingChat]       = useState(null);
  const [editingTitle, setEditingTitle]     = useState('');

  const menuRef                             = useRef(null);
  const editInputRef                        = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setChatMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openMenu(e, id) {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Pak de sidebar breedte als startpunt
    const sidebar = document.querySelector('.cpl-sidebar');
    const sidebarRect = sidebar.getBoundingClientRect();
    
    setChatMenu({ 
      chatId: id, 
      x: sidebarRect.right - 45,
      y: rect.bottom
    });
  }

  function startEdit(chat) {
    setChatMenu(null);
    setEditingChat(chat);
    setEditingTitle(chat.title || '');
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  async function confirmEdit() {

    if (!editingTitle.trim() || editingTitle === editingChat?.title) {
      cancelEdit();
      return;
    }
    await updateChatTitle(editingChat?.id, editingTitle.trim());
    setEditingChat(null);
  }

  function cancelEdit() {
    setEditingChat(null);
    setEditingTitle('');
  }

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
              VLNK<span>.</span>
            </span>
          )}
          <button className="cpl-toggle cpl-toggle--desktop" onClick={() => setSidebarOpen(p => !p)}>
            {sidebarOpen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
          <button className="cpl-toggle cpl-toggle--mobile" onClick={closeMobile}>
            <CloseIcon />
          </button>
        </div>

        <div className="cpl-new-wrap">
          <button
            className={`cpl-new-btn ${sidebarOpen ? '' : 'cpl-new-btn--icon'}`}
            onClick={() => { navigate(`/w/${slug}/chat`); closeMobile(); }}
          >
            <PlusIcon />
            {sidebarOpen && 'Nieuw gesprek'}
          </button>
        </div>

        {sidebarOpen && (
          <button className="cpl-search-btn">
            <SearchIcon /> Zoeken
          </button>
        )}

        <hr className="cpl-divider" />

        <nav className="cpl-chats">
          {sidebarOpen && chats.map(chat => {
            const isActive = chat.id === chatId;
            const showSkeleton = isActive && titleLoading;

            return (
              <div key={chat.id} className="cpl-chat-wrap">
                {editingChat?.id === chat.id ? (
                  <div className="cpl-chat-edit">
                    <input
                      ref={editInputRef}
                      className="cpl-chat-edit-input"
                      value={editingTitle}
                      onChange={e => {
                        setEditingTitle(e.target.value)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  confirmEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={confirmEdit}
                    />
                    <div className="cpl-chat-edit-actions">
                      <button
                        className="cpl-chat-edit-btn"
                        onMouseDown={e => { e.preventDefault(); confirmEdit(); }}
                      >
                        <CheckIcon />
                      </button>
                      <button
                        className="cpl-chat-edit-btn cpl-chat-edit-btn--cancel"
                        onMouseDown={e => { e.preventDefault(); cancelEdit(); }}
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
                    >
                      <DotsIcon />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </nav>

        <div
          className={`cpl-profile ${sidebarOpen ? '' : 'cpl-profile--closed'}`}
          onClick={() => navigate(`/w/${slug}`)}
        >
          <div className="cpl-avatar">{initials}</div>
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
            onClick={() => {
              const chat = chats.find(c => c.id === chatMenu.chatId);
              startEdit(chat);
            }}
          >
            <EditIcon /> Naam wijzigen
          </button>
          <button
            className="cpl-chat-menu-item cpl-chat-menu-item--danger"
            onClick={async () => {
              setChatMenu(null);
              await deleteChat(chatMenu.chatId);
              if (chatId === chatMenu.chatId) navigate(`/w/${slug}/chat`);
            }}
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