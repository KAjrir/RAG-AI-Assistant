import { useState } from 'react';
import { useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import IntegrationIcon from '../../components/icons/IntegrationIcons.jsx';
import '../../styles/connecties.css';

export default function Connecties() {
  const { slug }                              = useParams();
  const {
    connections, loading, can,
    connectConnection,
    disableConnection,
    deleteConnection,
    updateConnectionConfig,
  }                                           = useWorkspace();

  const [connectModal, setConnectModal]       = useState(null);
  const [connectValues, setConnectValues]     = useState({});
  const [connecting, setConnecting]           = useState(null);
  const [connectError, setConnectError]       = useState(null);

  const [settingsModal, setSettingsModal]     = useState(null);
  const [configValues, setConfigValues]       = useState({});
  const [savingConfig, setSavingConfig]       = useState(false);
  const [configError, setConfigError]         = useState(null);

  const [confirmDelete, setConfirmDelete]     = useState(null);
  const [toggling, setToggling]               = useState(null);

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

  async function handleToggle(connection) {
    const orgConn   = connection.organization_connection;
    const isEnabled = orgConn?.enabled ?? false;
    setToggling(connection.id);
    try {
      if (isEnabled) {
        await disableConnection(orgConn.id);
      } else {
        await connectConnection(connection.id);
      }
    } finally {
      setToggling(null);
    }
  }

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

            // Editors/viewers zien alleen verbonden connecties
            if (!can('connections', 'connect') && !isConnected) return null;

            return (
              <li key={connection.id} className={`co-item${comingSoon ? ' co-item--coming-soon' : ''}`}>
                <div className="co-item-icon">
                  <IntegrationIcon name={connection.key} />
                </div>

                <div className="co-item-info">
                  <div className="co-item-name-row">
                    <span className="co-item-name">{connection.name}</span>
                    {comingSoon && <span className="co-badge co-badge--soon">Binnenkort</span>}
                    {isConnected && (
                      <span className={`co-badge ${isEnabled ? 'co-badge--active' : 'co-badge--disabled'}`}>
                        <span className="co-badge-dot" />
                        {isEnabled ? 'Actief' : 'Uitgeschakeld'}
                      </span>
                    )}
                  </div>
                  <span className="co-item-desc">{connection.description}</span>
                </div>

                <div className="co-item-actions">
                  {isConnected ? (
                    <>
                      {can('connections', 'toggle') && (
                        <label className="co-toggle" title={isEnabled ? 'Uitschakelen' : 'Inschakelen'}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            disabled={toggling === connection.id}
                            onChange={() => handleToggle(connection)}
                          />
                          <span className="co-toggle-track">
                            <span className="co-toggle-thumb" />
                          </span>
                        </label>
                      )}

                      {can('connections', 'delete') && (
                        connection.auth_type === 'api_key' ? (
                          <button
                            className="co-btn-icon"
                            onClick={() => handleOpenSettings(connection)}
                            title="Instellingen"
                          >
                            <SettingsIcon />
                          </button>
                        ) : (
                          <button
                            className="co-btn-icon co-btn-icon--danger"
                            onClick={() => handleAskDelete(orgConn.id)}
                            title="Verwijderen"
                          >
                            <TrashIcon />
                          </button>
                        )
                      )}
                    </>
                  ) : comingSoon ? (
                    <button className="co-btn-soon" disabled>Binnenkort</button>
                  ) : (
                    can('connections', 'connect') && (
                      <button
                        className="co-btn-primary"
                        disabled={connecting === connection.id}
                        onClick={() => handleConnect(connection)}
                      >
                        {connecting === connection.id ? 'Verbinden…' : 'Verbinden'}
                      </button>
                    )
                  )}
                </div>
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
              <button type="button" className="co-btn-secondary" onClick={() => setConfirmDelete(null)}>
                Annuleren
              </button>
              <button type="button" className="co-btn-danger-solid" onClick={handleConfirmDelete}>
                Verwijderen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="1.75" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 1.5v1.75M7 10.75V12.5M1.5 7h1.75M10.75 7H12.5M3.1 3.1l1.24 1.24M9.66 9.66l1.24 1.24M10.9 3.1L9.66 4.34M4.34 9.66L3.1 10.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}