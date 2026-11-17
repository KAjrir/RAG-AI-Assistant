// components/workspace/CommandPalette.jsx
// Ctrl/⌘ + K: zoek gesprekken, ga naar een pagina, of stel direct een vraag.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useChat } from '../../context/ChatContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { sortChatsByRecent } from '../../lib/chatGroups.js';

const MAX_CHATS = 6;

export default function CommandPalette({ slug, pages, onClose }) {
  const navigate        = useNavigate();
  const { chats }       = useChat();
  const { workspace }   = useWorkspace();
  const [query, setQuery]     = useState('');
  const [active, setActive]   = useState(0);
  const listRef               = useRef(null);

  const q = query.trim();
  const ql = q.toLowerCase();

  // Platte lijst met items; secties zijn alleen voor de weergave
  const sections = useMemo(() => {
    const result = [];

    if (q) {
      result.push({
        title: 'Vraag stellen',
        items: [{
          id: 'ask',
          kind: 'ask',
          label: q,
          hint: `Vraag aan ${workspace?.name ?? 'workspace'}`,
          run: () => navigate(`/w/${slug}`, { state: { draft: q, send: true } }),
        }],
      });
    }

    const matchingChats = sortChatsByRecent(chats)
      .filter(c => !ql || (c.title || '').toLowerCase().includes(ql))
      .slice(0, MAX_CHATS)
      .map(c => ({
        id: `chat-${c.id}`,
        kind: 'chat',
        label: c.title || 'Geen titel',
        run: () => navigate(`/w/${slug}/chat/${c.id}`),
      }));

    if (matchingChats.length) {
      result.push({ title: q ? 'Gesprekken' : 'Recente gesprekken', items: matchingChats });
    }

    const matchingPages = [
      { id: 'new', kind: 'page', icon: 'plus', label: 'Nieuw gesprek', to: `/w/${slug}` },
      ...pages.map(p => ({ id: `page-${p.to}`, kind: 'page', icon: p.icon, label: p.label, to: p.to })),
    ]
      .filter(p => !ql || p.label.toLowerCase().includes(ql))
      .map(p => ({ ...p, run: () => navigate(p.to) }));

    if (matchingPages.length) {
      result.push({ title: 'Ga naar', items: matchingPages });
    }

    return result;
  }, [q, ql, chats, pages, slug, workspace?.name]);

  const flat = sections.flatMap(s => s.items);

  useEffect(() => { setActive(0); }, [q]);

  // Actief item in beeld houden
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function run(item) {
    if (!item) return;
    onClose();
    item.run();
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      run(flat[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }

  let index = -1;

  return (
    <>
      <div className="cp-backdrop" onMouseDown={onClose} />
      <div className="cp" role="dialog" aria-modal="true" aria-label="Zoeken en vragen">
        <div className="cp-input-row">
          <SearchIcon />
          <input
            className="cp-input"
            placeholder={`Zoek of vraag iets aan ${workspace?.name ?? 'je workspace'}…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="cp-list"
            aria-activedescendant={flat[active] ? `cp-item-${active}` : undefined}
          />
          <kbd className="cp-kbd">Esc</kbd>
        </div>

        <div className="cp-list" id="cp-list" role="listbox" ref={listRef}>
          {sections.length === 0 && (
            <p className="cp-empty">Niets gevonden.</p>
          )}
          {sections.map(section => (
            <div key={section.title} className="cp-section">
              <p className="cp-section-title">{section.title}</p>
              {section.items.map(item => {
                index += 1;
                const i = index;
                return (
                  <button
                    key={item.id}
                    id={`cp-item-${i}`}
                    data-index={i}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    className={`cp-item ${i === active ? 'cp-item--active' : ''} ${item.kind === 'ask' ? 'cp-item--ask' : ''}`}
                    onMouseMove={() => i !== active && setActive(i)}
                    onClick={() => run(item)}
                  >
                    <span className="cp-item-icon">
                      {item.kind === 'ask'  && <SparkIcon />}
                      {item.kind === 'chat' && <ChatIcon />}
                      {item.kind === 'page' && <PageIcon name={item.icon} />}
                    </span>
                    <span className="cp-item-label">{item.label}</span>
                    {item.hint && <span className="cp-item-hint">{item.hint}</span>}
                    {i === active && <span className="cp-item-enter">↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="cp-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigeren</span>
          <span><kbd>↵</kbd> openen</span>
        </div>
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="10.8" y1="10.8" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5l1.3 3.6 3.7 1.4-3.7 1.4L7 11.5 5.7 7.9 2 6.5l3.7-1.4L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5h10v7H8.5L6 11.5V9.5H2V2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

export function PageIcon({ name }) {
  switch (name) {
    case 'plus':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      );
    case 'overview':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <rect x="1.5" y="1.5" width="5" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="8.5" y="1.5" width="5" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1.5" y="8.5" width="5" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="8.5" y="8.5" width="5" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      );
    case 'docs':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <path d="M3 1.5h6l3 3V13.5H3V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M9 1.5V4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <line x1="5" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="5" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
      );
    case 'connections':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <circle cx="3.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="11.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="11.5" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
          <line x1="5.4" y1="6.7" x2="9.6" y2="4.3" stroke="currentColor" strokeWidth="1.1"/>
          <line x1="5.4" y1="8.3" x2="9.6" y2="10.7" stroke="currentColor" strokeWidth="1.1"/>
        </svg>
      );
    case 'people':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="11.5" cy="5" r="1.6" stroke="currentColor" strokeWidth="1.1"/>
          <path d="M13.8 12.5c0-1.6-1-2.7-2.2-3.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
      );
    case 'settings':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.1 3.1l1 1M10.9 10.9l1 1M3.1 11.9l1-1M10.9 4.1l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
}