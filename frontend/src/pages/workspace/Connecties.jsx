import { useState } from 'react';
import { useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../lib/utils.js';
import IntegrationIcon from '../../components/icons/IntegrationIcons.jsx';
import '../../styles/connecties.css';

export default function Connecties() {
  const { slug } = useParams();
  const toast    = useToast();
  const {
    connections, loading, can,
    connectConnection,
    disableConnection,
    deleteConnection,
    updateConnectionConfig,
  } = useWorkspace();

  const [connectModal, setConnectModal]   = useState(null);
  const [connectValues, setConnectValues] = useState({});
  const [connecting, setConnecting]       = useState(null);

  const [settingsModal, setSettingsModal] = useState(null);
  const [configValues, setConfigValues]   = useState({});
  const [savingConfig, setSavingConfig]   = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null); // { orgConnectionId, name }
  const [deleting, setDeleting]           = useState(false);
  const [toggling, setToggling]           = useState(null);

  // ── Verbinden ────────────────────────────

  async function handleConnect(connection) {
    if (connection.auth_type === 'oauth') {
      // Redirect naar de provider, geen toast nodig
      connectConnection(connection.id);
      return;
    }

    if (connection.auth_type === 'public') {
      setConnecting(connection.id);
      try {
        await connectConnection(connection.id);
        toast.success(`${connection.name} is verbonden.`);
      } catch (err) {
        toast.error(getErrorMessage(err, `${connection.name} verbinden is mislukt.`));
      } finally {
        setConnecting(null);
      }
      return;
    }

    setConnectValues({});
    setConnectModal(connection);
  }

  async function handleSaveConnect(e) {
    e.preventDefault();
    setConnecting(connectModal.id);
    try {
      await connectConnection(connectModal.id, connectValues);
      toast.success(`${connectModal.name} is verbonden.`);
      setConnectModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err, `${connectModal.name} verbinden is mislukt.`));
    } finally {
      setConnecting(null);
    }
  }

  // ── Aan/uit ──────────────────────────────

  async function handleToggle(connection) {
    const orgConn   = connection.organization_connection;
    const isEnabled = orgConn?.enabled ?? false;

    setToggling(connection.id);
    try {
      if (isEnabled) {
        await disableConnection(orgConn.id);
        toast.success(`${connection.name} is uitgeschakeld.`);
      } else {
        await connectConnection(connection.id);
        toast.success(`${connection.name} is ingeschakeld.`);
      }
    } catch (err) {
      toast.error(getErrorMessage(
        err,
        isEnabled ? 'Uitschakelen is mislukt.' : 'Inschakelen is mislukt.'
      ));
    } finally {
      setToggling(null);
    }
  }

  // ── Instellingen ─────────────────────────

  function handleOpenSettings(connection) {
    setConfigValues({});
    setSettingsModal(connection);
  }

  async function handleSaveConfig(e) {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updateConnectionConfig(settingsModal.organization_connection.id, configValues);
      toast.success('Configuratie opgeslagen.');
      setSettingsModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Configuratie opslaan is mislukt.'));
    } finally {
      setSavingConfig(false);
    }
  }

  // ── Verwijderen ──────────────────────────

  function handleAskDelete(connection) {
    setConfirmDelete({
      orgConnectionId: connection.organization_connection.id,
      name: connection.name,
    });
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteConnection(confirmDelete.orgConnectionId);
      toast.success(`Verbinding met ${confirmDelete.name} is verwijderd.`);
      setConfirmDelete(null);
      setSettingsModal(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Verbinding verwijderen is mislukt.'));
    } finally {
      setDeleting(false);
    }
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
                            onClick={() => handleAskDelete(connection)}
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
          <div className="co-modal-backdrop" onClick={() => !connecting && setConnectModal(null)} />
          <div className="co-modal" role="dialog" aria-modal="true" aria-labelledby="co-connect-title">
            <div className="co-modal-header">
              <h2 className="co-modal-title" id="co-connect-title">{connectModal.name} verbinden</h2>
              <button className="co-modal-close" onClick={() => setConnectModal(null)} disabled={!!connecting}>
                <CloseIcon />
              </button>
            </div>
            <p className="co-modal-desc">{connectModal.description}</p>
            <form className="co-modal-form" onSubmit={handleSaveConnect}>
              {connectModal.auth_config?.fields?.map(field => (
                <div key={field.key} className="co-modal-field">
                  <label className="co-modal-label" htmlFor={`co-connect-${field.key}`}>{field.label}</label>
                  <input
                    id={`co-connect-${field.key}`}
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
              <div className="co-modal-footer">
                <button
                  type="button"
                  className="co-btn-secondary"
                  onClick={() => setConnectModal(null)}
                  disabled={connecting === connectModal.id}
                >
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
          <div className="co-modal-backdrop" onClick={() => !savingConfig && setSettingsModal(null)} />
          <div className="co-modal" role="dialog" aria-modal="true" aria-labelledby="co-settings-title">
            <div className="co-modal-header">
              <h2 className="co-modal-title" id="co-settings-title">{settingsModal.name}</h2>
              <button className="co-modal-close" onClick={() => setSettingsModal(null)} disabled={savingConfig}>
                <CloseIcon />
              </button>
            </div>
            <form className="co-modal-form" onSubmit={handleSaveConfig}>
              <p className="co-modal-section-title">Configuratie wijzigen</p>
              {settingsModal.auth_config?.fields?.map(field => (
                <div key={field.key} className="co-modal-field">
                  <label className="co-modal-label" htmlFor={`co-config-${field.key}`}>{field.label}</label>
                  <input
                    id={`co-config-${field.key}`}
                    className="co-modal-input"
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder ?? ''}
                    value={configValues[field.key] ?? ''}
                    onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                  {field.hint && <p className="co-modal-hint">{field.hint}</p>}
                </div>
              ))}
              <div className="co-modal-footer">
                <button
                  type="button"
                  className="co-btn-danger"
                  onClick={() => handleAskDelete(settingsModal)}
                  disabled={savingConfig}
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
          <div className="co-modal-backdrop" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="co-modal co-modal--sm" role="dialog" aria-modal="true" aria-labelledby="co-delete-title">
            <div className="co-modal-header">
              <h2 className="co-modal-title" id="co-delete-title">Verbinding verwijderen</h2>
              <button className="co-modal-close" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                <CloseIcon />
              </button>
            </div>
            <p className="co-modal-desc">
              Weet je zeker dat je de verbinding met <strong>{confirmDelete.name}</strong> wilt verwijderen? Documenten die via deze connectie zijn geïmporteerd blijven bewaard.
            </p>
            <div className="co-modal-footer">
              <button
                type="button"
                className="co-btn-secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="co-btn-danger-solid"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Verwijderen…' : 'Verwijderen'}
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