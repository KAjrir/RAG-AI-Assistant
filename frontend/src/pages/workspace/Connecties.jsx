import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '../../lib/api';
import '../../styles/connecties.css';
import IntegrationIcon from '../../components/icons/IntegrationIcons.jsx';

const AVAILABLE_INTEGRATIONS = [
  { key: 'ons_welzijn', name: 'ONS Welzijn',  description: 'Zoek cliëntdata op, stel vragen en krijg direct inzicht.',                    comingSoon: true },
  { key: 'sdb_groep',   name: 'SDB Groep',    description: 'Doorzoek alle handleidingen en krijg meteen het juiste antwoord.',             comingSoon: true },
  { key: 'afas',        name: 'AFAS Pocket',  description: 'Vraag, zoek en haal data op vanuit je AFAS omgeving.',                         comingSoon: true },
  { key: 'topdesk',     name: 'TOPdesk',      description: 'Zoek meldingen op, check de status en krijg direct overzicht.',                comingSoon: true },
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
            const comingSoon = integration.comingSoon && !connection;

            return (
              <li key={integration.key} className={`co-item${comingSoon ? ' co-item--coming-soon' : ''}`}>
                <div className="co-item-icon">
                  <IntegrationIcon name={integration.key} />
                </div>
                <div className="co-item-info">
                  <div className="co-item-name-row">
                    <span className="co-item-name">{integration.name}</span>
                    {comingSoon && (
                      <span className="co-badge-soon">Binnenkort</span>
                    )}
                  </div>
                  <span className="co-item-desc">
                    {connection
                      ? `Verbonden · ${connection.syncedCount ?? 0} bestanden gesynchroniseerd`
                      : integration.description}
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
                ) : comingSoon ? (
                  <button className="co-btn-soon" disabled>
                    Binnenkort
                  </button>
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