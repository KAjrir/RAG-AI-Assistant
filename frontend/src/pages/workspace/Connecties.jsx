import { useState } from 'react';
import { useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import IntegrationIcon from '../../components/icons/IntegrationIcons.jsx';
import '../../styles/connecties.css';

export default function Connecties() {
  const { slug }                              = useParams();
  const {
    connections, loading, isAdmin,
    connectConnection,
    disableConnection,
    deleteConnection,
    updateConnectionConfig,
  }                                           = useWorkspace();

  // Connect modal (eerste keer verbinden)
  const [connectModal, setConnectModal]       = useState(null);
  const [connectValues, setConnectValues]     = useState({});
  const [connecting, setConnecting]           = useState(null);
  const [connectError, setConnectError]       = useState(null);

  // Settings modal (api_key - wijzig + verwijder)
  const [settingsModal, setSettingsModal]     = useState(null);
  const [configValues, setConfigValues]       = useState({});
  const [savingConfig, setSavingConfig]       = useState(false);
  const [configError, setConfigError]         = useState(null);

  // Confirm verwijder modal
  const [confirmDelete, setConfirmDelete]     = useState(null); // { orgConnectionId }

  // ── Connect ────────────────────────────────

  async function handleConnect(connection) {
    if (connection.auth_type === 'oauth') {
      connectConnection(connection.id);
      return;
    }

    if (connection.auth_type === 'public') {
      setConnecting(connection.id);
      try {
        await connectConnection(connection.id);
      } finally {
        setConnecting(null);
      }
      return;
    }

    // api_key → modal
    setConnectValues({});
    setConnectError(null);
    setConnectModal(connection);
  }

  async function handleSaveConnect(e) {
    e.preventDefault();
    setConnecting(connectModal.id);
    setConnectError(null);
    try {
      await connectConnection(connectModal.id, connectValues);
      setConnectModal(null);
    } catch (err) {
      setConnectError(err.response?.data?.error ?? 'Er ging iets mis.');
    } finally {
      setConnecting(null);
    }
  }

  // ── Settings ───────────────────────────────

  function handleOpenSettings(connection) {
    setConfigValues({});
    setConfigError(null);
    setSettingsModal(connection);
  }

  async function handleSaveConfig(e) {
    e.preventDefault();
    setSavingConfig(true);
    setConfigError(null);
    try {
      await updateConnectionConfig(settingsModal.organization_connection.id, configValues);
      setSettingsModal(null);
    } catch (err) {
      setConfigError(err.response?.data?.error ?? 'Er ging iets mis.');
    } finally {
      setSavingConfig(false);
    }
  }

  // ── Verwijderen ────────────────────────────

  function handleAskDelete(orgConnectionId) {
    setConfirmDelete({ orgConnectionId });
  }

  async function handleConfirmDelete() {
    await deleteConnection(confirmDelete.orgConnectionId);
    setConfirmDelete(null);
    setSettingsModal(null);
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
          {connections.map(connection => {
            const orgConn     = connection.organization_connection;
            const isConnected = !!orgConn;
            const isEnabled   = orgConn?.enabled ?? false;
            const comingSoon  = connection.status === 'coming_soon' && !isConnected;

            // Members zien alleen verbonden connecties
            if (!isAdmin && !isConnected) return null;

            return (
              <li key={connection.id} className={`co-item${comingSoon ? ' co-item--coming-soon' : ''}`}>
                <div className="co-item-icon">
                  <IntegrationIcon name={connection.key} />
                </div>

                <div className="co-item-info">
                  <div className="co-item-name-row">
                    <span className="co-item-name">{connection.name}</span>
                    {comingSoon && <span className="co-badge-soon">Binnenkort</span>}
                    {isConnected && !isEnabled && <span className="co-badge-disabled">Uitgeschakeld</span>}
                  </div>
                  <span className="co-item-desc">
                    {isConnected ? 'Verbonden' : connection.description}
                  </span>
                </div>

                {/* Alleen admins/owners zien knoppen */}
                {isAdmin && (
                  <>
                    {isConnected ? (
                      <div className="co-item-actions">
                        <span className={`co-pill ${isEnabled ? 'co-pill--active' : 'co-pill--disabled'}`}>
                          {isEnabled ? 'Actief' : 'Uit'}
                        </span>

                        {isEnabled ? (
                          <button
                            className="co-btn-toggle"
                            onClick={() => disableConnection(orgConn.id)}
                            title="Uitschakelen"
                          >
                            <PauseIcon />
                          </button>
                        ) : (
                          <button
                            className="co-btn-toggle"
                            onClick={() => connectConnection(connection.id)}
                            title="Inschakelen"
                          >
                            <PlayIcon />
                          </button>
                        )}

                        {connection.auth_type === 'api_key' ? (
                          <button
                            className="co-btn-toggle"
                            onClick={() => handleOpenSettings(connection)}
                            title="Instellingen"
                          >
                            <SettingsIcon />
                          </button>
                        ) : (
                          <button
                            className="co-btn-secondary"
                            onClick={() => handleAskDelete(orgConn.id)}
                          >
                            Verwijderen
                          </button>
                        )}
                      </div>
                    ) : comingSoon ? (
                      <button className="co-btn-soon" disabled>Binnenkort</button>
                    ) : (
                      <button
                        className="co-btn-primary"
                        disabled={connecting === connection.id}
                        onClick={() => handleConnect(connection)}
                      >
                        {connecting === connection.id ? 'Verbinden…' : 'Verbinden'}
                      </button>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Connect modal */}
      {connectModal && (
        <>
          <div className="co-modal-backdrop" onClick={() => setConnectModal(null)} />
          <div className="co-modal">
            <div className="co-modal-header">
              <h2 className="co-modal-title">{connectModal.name} verbinden</h2>
              <button className="co-modal-close" onClick={() => setConnectModal(null)}>
                <CloseIcon />
              </button>
            </div>
            <p className="co-modal-desc">{connectModal.description}</p>
            <form className="co-modal-form" onSubmit={handleSaveConnect}>
              {connectModal.auth_config?.fields?.map(field => (
                <div key={field.key} className="co-modal-field">
                  <label className="co-modal-label">{field.label}</label>
                  <input
                    className="co-modal-input"
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder ?? ''}
                    value={connectValues[field.key] ?? ''}
                    onChange={e => setConnectValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    required
                  />
                  {field.hint && <p className="co-modal-hint">{field.hint}</p>}
                </div>
              ))}
              {connectError && <p className="co-modal-error">{connectError}</p>}
              <div className="co-modal-footer">
                <button type="button" className="co-btn-secondary" onClick={() => setConnectModal(null)}>
                  Annuleren
                </button>
                <button type="submit" className="co-btn-primary" disabled={connecting === connectModal.id}>
                  {connecting === connectModal.id ? 'Verbinden…' : 'Verbinden'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Settings modal */}
      {settingsModal && (
        <>
          <div className="co-modal-backdrop" onClick={() => setSettingsModal(null)} />
          <div className="co-modal">
            <div className="co-modal-header">
              <h2 className="co-modal-title">{settingsModal.name}</h2>
              <button className="co-modal-close" onClick={() => setSettingsModal(null)}>
                <CloseIcon />
              </button>
            </div>
            <form className="co-modal-form" onSubmit={handleSaveConfig}>
              <p className="co-modal-section-title">Configuratie wijzigen</p>
              {settingsModal.auth_config?.fields?.map(field => (
                <div key={field.key} className="co-modal-field">
                  <label className="co-modal-label">{field.label}</label>
                  <input
                    className="co-modal-input"
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder ?? ''}
                    value={configValues[field.key] ?? ''}
                    onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                  {field.hint && <p className="co-modal-hint">{field.hint}</p>}
                </div>
              ))}
              {configError && <p className="co-modal-error">{configError}</p>}
              <div className="co-modal-footer">
                <button
                  type="button"
                  className="co-btn-danger"
                  onClick={() => handleAskDelete(settingsModal.organization_connection.id)}
                >
                  Verwijderen
                </button>
                <button type="submit" className="co-btn-primary" disabled={savingConfig}>
                  {savingConfig ? 'Opslaan…' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Confirm verwijder modal */}
      {confirmDelete && (
        <>
          <div className="co-modal-backdrop" onClick={() => setConfirmDelete(null)} />
          <div className="co-modal co-modal--sm">
            <div className="co-modal-header">
              <h2 className="co-modal-title">Verbinding verwijderen</h2>
              <button className="co-modal-close" onClick={() => setConfirmDelete(null)}>
                <CloseIcon />
              </button>
            </div>
            <p className="co-modal-desc">
              Weet je zeker dat je deze verbinding wilt verwijderen? Documenten die via deze connectie zijn geïmporteerd blijven bewaard.
            </p>
            <div className="co-modal-footer">
              <button
                type="button"
                className="co-btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="co-btn-danger-solid"
                onClick={handleConfirmDelete}
              >
                Verwijderen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="2" y="2" width="3" height="8" rx="1" fill="currentColor"/>
      <rect x="7" y="2" width="3" height="8" rx="1" fill="currentColor"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 2l7 4-7 4V2z" fill="currentColor"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.4 2.4l1.06 1.06M8.54 8.54l1.06 1.06M9.6 2.4L8.54 3.46M3.46 8.54L2.4 9.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}