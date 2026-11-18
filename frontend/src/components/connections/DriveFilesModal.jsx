// components/connections/DriveFilesModal.jsx
// Laat de klant kiezen welke Google Drive-bestanden Raggy mag gebruiken.
import { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage, formatTimeAgo } from '../../lib/utils.js';
import { openDrivePicker } from '../../lib/googlePicker.js';
import IntegrationIcon from '../icons/IntegrationIcons.jsx';
import '../../styles/driveFiles.css';

const TYPE_LABELS = {
  'application/vnd.google-apps.folder': 'Map',
  'application/vnd.google-apps.document': 'Google Docs',
  'application/vnd.google-apps.spreadsheet': 'Google Sheets',
  'application/vnd.google-apps.presentation': 'Google Slides',
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'text/plain': 'Tekst',
  'text/csv': 'CSV',
  'text/markdown': 'Markdown',
};

export default function DriveFilesModal({ connection, onClose }) {
  const { can, getPickerConfig, fetchConnectionItems } = useWorkspace();
  const orgConnectionId = connection.organization_connection?.id;
  const toast = useToast();

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [picking, setPicking]   = useState(false);

  const canManage = can('connections', 'connect');
  const folders   = items.filter(i => i.isFolder);
  const files     = items.filter(i => !i.isFolder);

  useEffect(() => {
    let cancelled = false;
    fetchConnectionItems(orgConnectionId)
      .then(data => { if (!cancelled) setItems(data); })
      .catch(err => toast.error(getErrorMessage(err, 'Drive-bestanden ophalen is mislukt.')))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !picking) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [picking, onClose]);

  async function handlePick() {
    setPicking(true);
    try {
      const config = await getPickerConfig(orgConnectionId);
      const picked = await openDrivePicker(config);
      if (picked.length === 0) return; // geannuleerd

      // Google heeft de bestanden nu aan Raggy toegekend: lijst opnieuw ophalen
      setItems(await fetchConnectionItems(orgConnectionId));

      const n = picked.length;
      toast.success(n === 1 ? '1 bestand toegevoegd aan Raggy.' : `${n} bestanden toegevoegd aan Raggy.`);
    } catch (err) {
      toast.error(getErrorMessage(err, err?.message || 'Google Drive openen is mislukt.'));
    } finally {
      setPicking(false);
    }
  }

  return (
    <>
      <div className="co-modal-backdrop" onClick={() => !picking && onClose()} />
      <div className="co-modal gd-modal" role="dialog" aria-modal="true" aria-labelledby="gd-title">
        <div className="gd-header">
          <span className="gd-header-icon"><IntegrationIcon name={connection.key} /></span>
          <div className="gd-header-text">
            <h2 className="co-modal-title" id="gd-title">{connection.name}</h2>
            <p className="gd-header-sub">Raggy ziet alleen de bestanden die je hier kiest.</p>
          </div>
          <button className="co-modal-close" onClick={onClose} disabled={picking} aria-label="Sluiten">
            <CloseIcon />
          </button>
        </div>

        {canManage && (
          <button className="gd-pick" onClick={handlePick} disabled={picking}>
            <span className="gd-pick-icon">{picking ? <SpinnerIcon /> : <PlusIcon />}</span>
            <span className="gd-pick-text">
              <b>{picking ? 'Google Drive openen…' : 'Bestanden kiezen'}</b>
              <small>Google-bestanden, PDF, Word, Excel, PowerPoint en tekst</small>
            </span>
          </button>
        )}

        <div className="gd-list-wrap">
          {loading ? (
            <div className="gd-skeletons">
              <span className="gd-skeleton" /><span className="gd-skeleton" /><span className="gd-skeleton" />
            </div>
          ) : items.length === 0 ? (
            <div className="gd-empty">
              <span className="gd-empty-icon"><FolderIcon /></span>
              <p className="gd-empty-title">Nog niets gekozen</p>
              <p className="gd-empty-sub">
                {canManage
                  ? 'Kies de bestanden waar Raggy vragen over mag beantwoorden. Open een map in Google Drive om alles in één keer te selecteren.'
                  : 'Een beheerder kan hier bestanden uit Google Drive toevoegen.'}
              </p>
            </div>
          ) : (
            <>
              {folders.length > 0 && (
                <Section title="Mappen" count={folders.length}>
                  {folders.map(item => <ItemRow key={item.id} item={item} />)}
                </Section>
              )}
              {files.length > 0 && (
                <Section title="Bestanden" count={files.length}>
                  {files.map(item => <ItemRow key={item.id} item={item} />)}
                </Section>
              )}
            </>
          )}
        </div>

        <p className="gd-footnote">
          <ShieldIcon />
          Raggy leest alleen mee. Een bestand weghalen kan nog niet; verbreek de koppeling om alle toegang in te trekken.
        </p>
      </div>
    </>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="gd-section">
      <p className="gd-section-title">{title} <span>{count}</span></p>
      <ul className="gd-list">{children}</ul>
    </section>
  );
}

function ItemRow({ item }) {
  const type = TYPE_LABELS[item.mimeType] ?? 'Bestand';

  return (
    <li className="gd-item">
      <span className="gd-item-icon">
        {item.iconUrl ? <img src={item.iconUrl} alt="" /> : item.isFolder ? <FolderIcon /> : <FileIcon />}
      </span>
      <span className="gd-item-text">
        <span className="gd-item-name">{item.name}</span>
        <span className="gd-item-meta">
          {type}
          {item.modifiedTime && <> · gewijzigd {formatTimeAgo(item.modifiedTime)}</>}
        </span>
      </span>
      {item.url && (
        <a className="gd-item-btn" href={item.url} target="_blank" rel="noreferrer" title="Openen in Google Drive" aria-label="Openen in Google Drive">
          <ExternalIcon />
        </a>
      )}
    </li>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M8 2h4v4M12 2L6.5 7.5M10.5 8.5V11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinning">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 14" strokeLinecap="round"/>
    </svg>
  );
}