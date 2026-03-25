import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../../lib/api';
import '../../new-styles/connecties.css';

const AVAILABLE_INTEGRATIONS = [
  { key: 'google_drive',  name: 'Google Drive',  description: 'Synchroniseer mappen vanuit Google Drive.' },
  { key: 'sharepoint',    name: 'SharePoint',     description: 'Koppel je SharePoint bibliotheek.' },
  { key: 'notion',        name: 'Notion',         description: 'Importeer pagina\'s vanuit Notion.' },
  { key: 'confluence',    name: 'Confluence',     description: 'Verbind je Confluence workspace.' },
];

export default function Connecties() {
  const { slug }                          = useParams();
  const [connections, setConnections]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [connecting, setConnecting]       = useState(null);

  useEffect(() => {
    api.get(`/workspaces/${slug}/connections`)
      .then(res => setConnections(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleConnect(integrationKey) {
    setConnecting(integrationKey);
    try {
      // OAuth flow: backend geeft een redirect URL terug
      const res = await api.get(`/workspaces/${slug}/connections/${integrationKey}/oauth`);
      window.location.href = res.data.url;
    } catch {
      setConnecting(null);
    }
  }

  async function handleDisconnect(connectionId) {
    if (!confirm('Verbinding verwijderen? Documenten die via deze connectie zijn geïmporteerd blijven bewaard.')) return;
    await api.delete(`/workspaces/${slug}/connections/${connectionId}`);
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }

  function isConnected(key) {
    return connections.find(c => c.provider === key);
  }

  return (
    <div className="co-root">
      <header className="co-header">
        <div>
          <h1 className="co-title">Connecties</h1>
          <p className="co-slug">w/{slug} · /connecties</p>
        </div>
      </header>

      {loading ? (
        <p className="co-loading">Laden…</p>
      ) : (
        <ul className="co-list">
          {AVAILABLE_INTEGRATIONS.map(integration => {
            const connection = isConnected(integration.key);
            return (
              <li key={integration.key} className="co-item">
                <div className="co-item-icon">
                  <IntegrationIcon name={integration.key} />
                </div>
                <div className="co-item-info">
                  <span className="co-item-name">{integration.name}</span>
                  <span className="co-item-desc">
                    {connection ? `Verbonden · ${connection.syncedCount ?? 0} bestanden gesynchroniseerd` : integration.description}
                  </span>
                </div>
                {connection ? (
                  <div className="co-item-actions">
                    <span className="co-pill co-pill--active">Actief</span>
                    <button
                      className="co-btn-secondary"
                      onClick={() => handleDisconnect(connection.id)}
                    >
                      Verwijderen
                    </button>
                  </div>
                ) : (
                  <button
                    className="co-btn-primary"
                    disabled={connecting === integration.key}
                    onClick={() => handleConnect(integration.key)}
                  >
                    {connecting === integration.key ? 'Verbinden…' : 'Verbinden'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function IntegrationIcon({ name }) {
  const icons = {
    google_drive: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14l3-5.5L9 14H2z" fill="currentColor" opacity=".5"/>
        <path d="M9 14l3-5.5h4L13 14H9z" fill="currentColor" opacity=".7"/>
        <path d="M6.5 3.5L2 11l3 .5L9.5 5 6.5 3.5z" fill="currentColor"/>
        <path d="M9.5 5l3.5 6H16L12.5 3.5 9.5 5z" fill="currentColor" opacity=".8"/>
      </svg>
    ),
    sharepoint: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/>
        <text x="5" y="13" fontSize="9" fill="currentColor" fontWeight="600">SP</text>
      </svg>
    ),
    notion: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    confluence: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 13.5C5 11 7 9 9 9s4 2 6-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M3 8.5C5 6 7 4 9 4s4 2 6-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  };
  return icons[name] ?? null;
}