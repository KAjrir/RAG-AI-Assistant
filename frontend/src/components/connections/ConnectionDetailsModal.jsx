// components/connections/ConnectionDetailsModal.jsx
// Detailpagina van een connectie (in een modal): wat het is, wat Raggy ermee kan
// per tool, hoe het koppelen werkt, en de acties.
import { useEffect, useRef, useState } from 'react';
import IntegrationIcon from '../icons/IntegrationIcons.jsx';
import '../../styles/connectionDetails.css';

const AUTH_INFO = {
  oauth:   'Je logt in bij de dienst zelf en geeft Raggy daar toestemming. Raggy ziet je wachtwoord nooit, en je kunt de toegang altijd weer intrekken door de verbinding te verwijderen.',
  api_key: 'Je koppelt met een API-sleutel van de dienst. De sleutel wordt alleen op de server gebruikt en nooit aan andere gebruikers getoond.',
  public:  'Dit is een openbare bron. Je hoeft niet in te loggen of een sleutel in te vullen.',
};

// Korte uitleg voor de klant: eigen summary, anders de eerste alinea van de description
function toolSummary(tool) {
  if (tool.summary) return tool.summary;
  return tool.description?.split(/\n\s*\n/)[0]?.trim() ?? '';
}

export default function ConnectionDetailsModal({
  connection,
  canConnect,
  canToggle,
  canDelete,
  connecting,
  toggling,
  hasFilePicker,
  onConnect,
  onToggle,
  onOpenFiles,
  onDelete,
  onClose,
}) {
  const orgConn     = connection.organization_connection;
  const isConnected = !!orgConn;
  const isEnabled   = orgConn?.enabled ?? false;
  const comingSoon  = connection.status === 'coming_soon' && !isConnected;
  const tools       = connection.tools ?? [];

  const [selectedKey, setSelectedKey] = useState(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const menuRef = useRef(null);

  const selectedTool = tools.find(t => t.key === selectedKey) ?? null;
  const hasMenu      = isConnected && (canToggle || canDelete);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (menuOpen) setMenuOpen(false);
      else onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, onClose]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <>
      <div className="co-modal-backdrop" onClick={onClose} />
      <div className="co-modal cd-modal" role="dialog" aria-modal="true" aria-labelledby="cd-title">
        <button className="co-modal-close cd-close" onClick={onClose} aria-label="Sluiten">
          <CloseIcon />
        </button>

        <div className="cd-scroll">
          {/* ── Hero ─────────────────────────── */}
          <div className="cd-hero">
            <span className="cd-hero-icon"><IntegrationIcon name={connection.key} /></span>

            <div className="cd-hero-text">
              <div className="cd-title-row">
                <h2 className="cd-title" id="cd-title">{connection.name}</h2>
                <StatusBadge comingSoon={comingSoon} isConnected={isConnected} isEnabled={isEnabled} />
              </div>
              {connection.description && <p className="cd-tagline">{connection.description}</p>}
            </div>

            <div className="cd-hero-actions">
              {comingSoon ? (
                <button type="button" className="cd-btn cd-btn--soon" disabled>Binnenkort</button>
              ) : !isConnected ? (
                canConnect && (
                  <button type="button" className="cd-btn cd-btn--primary" onClick={onConnect} disabled={connecting}>
                    {connecting ? 'Verbinden…' : 'Verbinden'}
                  </button>
                )
              ) : (
                <div className="cd-split" ref={menuRef}>
                  {hasFilePicker ? (
                    <button type="button" className="cd-btn cd-btn--primary cd-split-main" onClick={onOpenFiles}>
                      <FolderIcon /> Bestanden kiezen
                    </button>
                  ) : (
                    <span className="cd-btn cd-btn--connected cd-split-main">
                      <CheckIcon /> Verbonden
                    </span>
                  )}

                  {hasMenu && (
                    <>
                      <button
                        type="button"
                        className={`cd-btn cd-split-toggle ${hasFilePicker ? 'cd-btn--primary' : 'cd-btn--connected'}`}
                        onClick={() => setMenuOpen(o => !o)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="Meer acties"
                      >
                        <ChevronIcon />
                      </button>

                      {menuOpen && (
                        <div className="cd-menu" role="menu">
                          {canToggle && (
                            <button
                              type="button"
                              role="menuitem"
                              className="cd-menu-item"
                              disabled={toggling}
                              onClick={() => { setMenuOpen(false); onToggle(); }}
                            >
                              <PowerIcon /> {isEnabled ? 'Uitschakelen' : 'Inschakelen'}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              role="menuitem"
                              className="cd-menu-item cd-menu-item--danger"
                              onClick={() => { setMenuOpen(false); onDelete(); }}
                            >
                              <TrashIcon /> Verbinding verwijderen
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="cd-body">
            {/* ── Over ───────────────────────── */}
            {connection.about && <p className="cd-about">{connection.about}</p>}

            {/* ── Tools ──────────────────────── */}
            <section className="cd-section">
              <div className="cd-section-head">
                <h3 className="cd-section-title">Tools</h3>
                {tools.length > 0 && <span className="cd-count">{tools.length}</span>}
              </div>

              {tools.length === 0 ? (
                <p className="cd-empty">Voor deze connectie zijn nog geen tools beschikbaar.</p>
              ) : (
                <>
                  <div className="cd-chips" role="list">
                    {tools.map(tool => (
                      <button
                        key={tool.key}
                        type="button"
                        role="listitem"
                        className={`cd-chip${selectedKey === tool.key ? ' cd-chip--active' : ''}`}
                        onClick={() => setSelectedKey(k => (k === tool.key ? null : tool.key))}
                        aria-pressed={selectedKey === tool.key}
                      >
                        <ToolIcon toolKey={tool.key} />
                        {tool.key}
                      </button>
                    ))}
                  </div>

                  {selectedTool ? (
                    <div className="cd-tool-detail" key={selectedTool.key}>
                      <span className="cd-tool-icon"><ToolIcon toolKey={selectedTool.key} /></span>
                      <div className="cd-tool-text">
                        <p className="cd-tool-name">{selectedTool.name}</p>
                        <code className="cd-tool-key">{selectedTool.key}</code>
                        {toolSummary(selectedTool) && (
                          <p className="cd-tool-summary">{toolSummary(selectedTool)}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="cd-hint">Klik op een tool om te zien wat Raggy ermee doet.</p>
                  )}

                  <p className="cd-note">
                    <SparkIcon />
                    Je hoeft zelf niets aan te roepen: stel je vraag in de chat en Raggy kiest de juiste tool.
                  </p>
                </>
              )}
            </section>

            {/* ── Koppelen ───────────────────── */}
            {AUTH_INFO[connection.auth_type] && (
              <section className="cd-section">
                <div className="cd-section-head">
                  <h3 className="cd-section-title">Koppelen en privacy</h3>
                </div>
                <div className="cd-auth">
                  <ShieldIcon />
                  <span>{AUTH_INFO[connection.auth_type]}</span>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ comingSoon, isConnected, isEnabled }) {
  if (comingSoon) return <span className="co-badge co-badge--soon">Binnenkort</span>;
  if (!isConnected) return null;
  return (
    <span className={`co-badge ${isEnabled ? 'co-badge--active' : 'co-badge--disabled'}`}>
      <span className="co-badge-dot" />
      {isEnabled ? 'Actief' : 'Uitgeschakeld'}
    </span>
  );
}

// Icoon op basis van het begin van de tool-key: list_, search_, read_
function ToolIcon({ toolKey }) {
  if (toolKey.startsWith('list_')) return <ListIcon />;
  if (toolKey.startsWith('search_')) return <SearchIcon />;
  if (toolKey.startsWith('read_')) return <FileIcon />;
  return <SparkIcon />;
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z"/>
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 3v8M7.5 6.2a7 7 0 1 0 9 0"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M11.5 3.5l-.7 7.7a1 1 0 0 1-1 .8H4.2a1 1 0 0 1-1-.8L2.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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