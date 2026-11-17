import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { formatTimeAgo } from '../../lib/utils.js';
import { chatDate, sortChatsByRecent } from '../../lib/chatGroups.js';
import { BASE_URL } from '../../lib/api.js';
import StatusPill from '../../components/StatusPill.jsx';
import '../../styles/overzicht.css';

export default function Overzicht() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const { workspace, documents, members, connections, loading, can } = useWorkspace();
  const { chats, chatsLoading } = useChat();
  const [question, setQuestion] = useState('');

  const base            = `/w/${slug}`;
  const connectionCount = connections.filter(c => c.organization_connection).length;
  const recentDocs      = [...documents]
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, 5);
  const recentChats     = sortChatsByRecent(chats).slice(0, 5);
  const show            = n => (loading ? '—' : n);
  const logoUrl         = workspace?.logo_resource_url ? `${BASE_URL}${workspace.logo_resource_url}` : null;

  function ask(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    navigate(base, { state: { draft: q, send: true } });
  }

  return (
    <div className="ov-root">
      {/* ── Hero met vraagbalk ── */}
      <section className="ov-hero">
        <div className="ov-hero-top">
          <span className="ov-hero-logo">
            {logoUrl ? <img src={logoUrl} alt="" /> : (workspace?.name?.[0]?.toUpperCase() ?? '?')}
          </span>
          <div>
            <p className="ov-eyebrow">Overzicht</p>
            <h1 className="ov-title">{workspace?.name}</h1>
          </div>
        </div>

        <form className="ov-ask" onSubmit={ask}>
          <SparkIcon />
          <input
            className="ov-ask-input"
            placeholder={`Vraag iets aan ${workspace?.name ?? 'je workspace'}…`}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            aria-label="Stel een vraag"
          />
          <button className="ov-ask-btn" type="submit" disabled={!question.trim()} aria-label="Vraag stellen">
            <ArrowIcon />
          </button>
        </form>
      </section>

      {/* ── Cijfers ── */}
      <section className="ov-stats">
        <button className="ov-stat" onClick={() => navigate(`${base}/docs`)}>
          <span className="ov-stat-icon ov-stat-icon--docs"><DocIcon /></span>
          <span className="ov-stat-num">{show(documents.length)}</span>
          <span className="ov-stat-label">Documenten</span>
        </button>
        <button className="ov-stat" onClick={() => navigate(`${base}/connecties`)}>
          <span className="ov-stat-icon ov-stat-icon--conn"><LinkIcon /></span>
          <span className="ov-stat-num">{show(connectionCount)}</span>
          <span className="ov-stat-label">Connecties</span>
        </button>
        <button className="ov-stat" onClick={() => navigate(`${base}/mensen`)}>
          <span className="ov-stat-icon ov-stat-icon--people"><PeopleIcon /></span>
          <span className="ov-stat-num">{show(members.length)}</span>
          <span className="ov-stat-label">Teamleden</span>
        </button>
      </section>

      {/* ── Recent ── */}
      <div className="ov-columns">
        <section className="ov-card">
          <header className="ov-card-header">
            <h2 className="ov-card-title">Recente gesprekken</h2>
            <button className="ov-card-link" onClick={() => navigate(base)}>Nieuw gesprek</button>
          </header>

          {chatsLoading ? (
            <p className="ov-muted">Laden…</p>
          ) : recentChats.length === 0 ? (
            <div className="ov-empty">
              <p className="ov-empty-title">Nog geen gesprekken</p>
              <p className="ov-empty-sub">Stel hierboven je eerste vraag.</p>
            </div>
          ) : (
            <ul className="ov-list">
              {recentChats.map(chat => {
                const date = chatDate(chat) ? (chat.updated_at ?? chat.created_at) : null;
                return (
                  <li key={chat.id}>
                    <button className="ov-row" onClick={() => navigate(`${base}/chat/${chat.id}`)}>
                      <span className="ov-row-icon"><ChatIcon /></span>
                      <span className="ov-row-text">
                        <span className="ov-row-name">{chat.title || 'Nieuw gesprek'}</span>
                        {date && <span className="ov-row-meta">{formatTimeAgo(date)}</span>}
                      </span>
                      <ChevronIcon />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ov-card">
          <header className="ov-card-header">
            <h2 className="ov-card-title">Recente documenten</h2>
            {can('documents', 'create') ? (
              <button className="ov-card-link" onClick={() => navigate(`${base}/docs/upload`)}>Uploaden</button>
            ) : (
              <button className="ov-card-link" onClick={() => navigate(`${base}/docs`)}>Alles bekijken</button>
            )}
          </header>

          {loading ? (
            <p className="ov-muted">Laden…</p>
          ) : recentDocs.length === 0 ? (
            <div className="ov-empty">
              <p className="ov-empty-title">Nog geen documenten</p>
              <p className="ov-empty-sub">
                {can('documents', 'create')
                  ? 'Upload documenten zodat Raggy er vragen over kan beantwoorden.'
                  : 'Er zijn nog geen documenten toegevoegd.'}
              </p>
            </div>
          ) : (
            <ul className="ov-list">
              {recentDocs.map(doc => (
                <li key={doc.id}>
                  <button className="ov-row" onClick={() => navigate(`${base}/docs/${doc.id}`)}>
                    <span className={`ov-row-icon ov-row-icon--${doc.status}`}><DocIcon /></span>
                    <span className="ov-row-text">
                      <span className="ov-row-name">{doc.originalname}</span>
                      <span className="ov-row-meta">{formatTimeAgo(doc.uploaded_at)}</span>
                    </span>
                    <StatusPill status={doc.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {documents.length > 5 && (
            <button className="ov-more" onClick={() => navigate(`${base}/docs`)}>
              Alle {documents.length} documenten bekijken
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="ov-ask-icon">
      <path d="M7 1.5l1.3 3.6 3.7 1.4-3.7 1.4L7 11.5 5.7 7.9 2 6.5l3.7-1.4L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 7-7 7 7"/>
      <path d="M12 19V5"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 1h6L11 3.5V13H2.5V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8.5 1v2.5H11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
      <circle cx="3.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11.5" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="5.4" y1="6.7" x2="9.6" y2="4.3" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="5.4" y1="8.3" x2="9.6" y2="10.7" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="11.5" cy="5" r="1.6" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M13.8 12.5c0-1.6-1-2.7-2.2-3.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
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

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ov-row-chevron">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}