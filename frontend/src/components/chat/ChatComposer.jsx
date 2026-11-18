import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import '../../styles/chatComposer.css';

// key = wat de backend krijgt, label = wat de gebruiker ziet
const MODELS = [
	{ key: 'gpt-4o',      label: 'GPT-4o' },
	{ key: 'gpt-4o-mini', label: 'GPT-4o mini' },
	{ key: 'gpt-6-luna', label: 'GPT-6' },
  // Toekomst:
  // { key: 'grok-2',   label: 'Grok 2' },
];

const ACCEPTED_EXT = ['.pdf', '.txt', '.docx'];
const MAX_FILE_MB  = 25;
const MAX_FILES    = 10;

export default function ChatComposer({
  draft, setDraft, handleSubmit,
  busy = false,
  submitSignal = 0,   // verhoog om de huidige draft te versturen (bijv. vanuit Ctrl+K)
  focusKey,           // wijzigt → tekstvak krijgt focus (alleen met muis/trackpad)
}) {
  const { slug }        = useParams();
  const { connections, workspace } = useWorkspace();
  const navigate        = useNavigate();
  const toast           = useToast();
  const fileInputRef    = useRef(null);
  const textareaRef     = useRef(null);

  // Plus menu
  const [plusOpen, setPlusOpen]               = useState(false);
  const [connSubmenuOpen, setConnSubmenuOpen] = useState(false);
  const plusRef                               = useRef(null);

  // Model dropdown
  const [modelOpen, setModelOpen]         = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const modelRef                          = useRef(null);

  // Bestanden
  const [files, setFiles] = useState([]);
  const filesRef          = useRef(files);
  filesRef.current        = files;

  // Connecties: standaard alles aan wat in de workspace actief is.
  // We onthouden welke de gebruiker UIT heeft gezet, zodat connecties
  // die later binnenkomen (na laden) gewoon aan staan.
  const [disabledConns, setDisabledConns] = useState([]);
  const availableConns = connections.filter(c => c.organization_connection?.enabled);
  const activeConnIds  = availableConns
    .filter(c => !disabledConns.includes(c.id))
    .map(c => c.id);

  function toggleConn(id) {
    setDisabledConns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function closeMenus() {
    setPlusOpen(false);
    setConnSubmenuOpen(false);
    setModelOpen(false);
  }

  // Klik buiten of Escape sluit de menu's
  useEffect(() => {
    function handleClickOutside(e) {
      if (plusRef.current && !plusRef.current.contains(e.target)) {
        setPlusOpen(false);
        setConnSubmenuOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target)) {
        setModelOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') closeMenus();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Previews opruimen als de composer verdwijnt
  useEffect(() => {
    return () => {
      filesRef.current.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    };
  }, []);

  // ── Bestanden ────────────────────────────

  function isAccepted(file) {
    if (file.type.startsWith('image/')) return true;
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    return ACCEPTED_EXT.includes(ext);
  }

  function addFiles(incoming) {
    const wrongType = [];
    const tooBig    = [];
    const valid     = [];

    for (const f of incoming) {
      if (!isAccepted(f)) wrongType.push(f.name || 'bestand');
      else if (f.size > MAX_FILE_MB * 1024 * 1024) tooBig.push(f.name || 'bestand');
      else valid.push(f);
    }

    if (wrongType.length) {
      toast.error(`${wrongType.join(', ')} ${wrongType.length > 1 ? 'worden' : 'wordt'} niet ondersteund. Gebruik een afbeelding, PDF, DOCX of TXT.`);
    }
    if (tooBig.length) {
      toast.error(`${tooBig.join(', ')} ${tooBig.length > 1 ? 'zijn' : 'is'} te groot. Maximaal ${MAX_FILE_MB} MB per bestand.`);
    }
    if (!valid.length) return;

    const room = MAX_FILES - filesRef.current.length;
    if (room <= 0) {
      toast.error(`Je kunt maximaal ${MAX_FILES} bestanden tegelijk meesturen.`);
      return;
    }
    if (valid.length > room) {
      toast.error(`Je kunt maximaal ${MAX_FILES} bestanden tegelijk meesturen. ${valid.length - room} ${valid.length - room > 1 ? 'zijn' : 'is'} niet toegevoegd.`);
    }

    setFiles(prev => [
      ...prev,
      ...valid.slice(0, room).map(f => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name || `screenshot-${Date.now()}.png`,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      })),
    ]);
  }

  function removeFile(id) {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  }

  function handleFileInput(e) {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) addFiles(selected);
    e.target.value = ''; // zodat hetzelfde bestand opnieuw gekozen kan worden
    setPlusOpen(false);
  }

  // Alleen plakken in het tekstvak, niet overal op de pagina
  function handlePaste(e) {
    const pasted = Array.from(e.clipboardData?.files ?? []);
    if (!pasted.length) return;
    // Alleen default blokkeren als er geen tekst mee komt
    if (!e.clipboardData.getData('text')) e.preventDefault();
    addFiles(pasted);
  }

  // Focus op het tekstvak bij openen van een (nieuw) gesprek.
  // Niet op touch-apparaten: daar zou het toetsenbord ongevraagd openklappen.
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) {
      textareaRef.current?.focus();
    }
  }, [focusKey]);

  // ── Versturen ────────────────────────────

  const canSend = !busy && (draft.trim().length > 0 || files.length > 0);

  function onSubmit() {
    if (!canSend) return;

    const message = draft.trim();
    const payload = {
      message,
      model: selectedModel.key,
      connections: activeConnIds,
      files: files.map(f => f.file),
    };

    const formData = new FormData();
    formData.append('message', message);
    formData.append('model', selectedModel.key);
    formData.append('connections', JSON.stringify(activeConnIds));
    files.forEach(f => formData.append('files', f.file, f.name));

    handleSubmit(payload, formData);

    files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setDraft('');
  }

  // Extern verzoek om te versturen
  const lastSignalRef = useRef(submitSignal);
  useEffect(() => {
    if (submitSignal === lastSignalRef.current) return;
    lastSignalRef.current = submitSignal;
    onSubmit();
  }, [submitSignal]);

  return (
    <div className="composer">
      <div className="composer-inner">

        {/* Bestand previews */}
        {files.length > 0 && (
          <div className="composer-files">
            {files.map(f => (
              <div key={f.id} className="composer-file" title={f.name}>
                {f.preview ? (
                  <img src={f.preview} className="composer-file-preview" alt={f.name} />
                ) : (
                  <div className="composer-file-icon"><AttachIcon /></div>
                )}
                <span className="composer-file-name">{f.name}</span>
                <button
                  type="button"
                  className="composer-file-remove"
                  onClick={() => removeFile(f.id)}
                  aria-label={`${f.name} verwijderen`}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tekstvak */}
        <textarea
          ref={textareaRef}
          className="composer-input"
          placeholder={workspace?.name ? `Vraag iets aan ${workspace.name}…` : 'Stel een vraag…'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={e => {
            // isComposing: niet versturen tijdens IME-invoer
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          aria-label="Bericht"
        />

        {/* Verborgen bestandskiezer */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={['image/*', ...ACCEPTED_EXT].join(',')}
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />

        {/* Toolbar */}
        <div className="composer-toolbar">

          {/* Links */}
          <div className="composer-toolbar-left">

            {/* Plus knop + menu */}
            <div className="composer-plus-wrap" ref={plusRef}>
              <button
                type="button"
                className="composer-plus"
                onClick={() => { setPlusOpen(p => !p); setConnSubmenuOpen(false); }}
                aria-label="Toevoegen"
                aria-expanded={plusOpen}
              >
                <PlusIcon />
              </button>

              {plusOpen && (
                <div className="composer-menu">
                  <button
                    type="button"
                    className="composer-menu-item"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <AttachIcon />
                    Bestand toevoegen
                  </button>

                  <div className="composer-menu-divider" />

                  <button
                    type="button"
                    className={`composer-menu-item composer-menu-item--arrow ${connSubmenuOpen ? 'composer-menu-item--active' : ''}`}
                    onClick={() => setConnSubmenuOpen(p => !p)}
                  >
                    <ConnectorIcon />
                    Connecties
                    <ChevronRightIcon />
                  </button>
                </div>
              )}

              {/* Connecties submenu */}
              {plusOpen && connSubmenuOpen && (
                <div className="composer-submenu">
                  {availableConns.length === 0 && (
                    <p className="composer-submenu-empty">Geen connecties beschikbaar</p>
                  )}

                  {availableConns.map(conn => {
                    const isOn = activeConnIds.includes(conn.id);
                    return (
                      <button
                        type="button"
                        key={conn.id}
                        className="composer-submenu-item"
                        onClick={() => toggleConn(conn.id)}
                        role="switch"
                        aria-checked={isOn}
                      >
                        <span className="composer-submenu-name">{conn.name}</span>
                        <span className={`composer-toggle ${isOn ? 'composer-toggle--on' : ''}`}>
                          <span className="composer-toggle-knob" />
                        </span>
                      </button>
                    );
                  })}

                  <div className="composer-menu-divider" />

                  <button
                    type="button"
                    className="composer-submenu-item composer-submenu-item--manage"
                    onClick={() => { closeMenus(); navigate(`/w/${slug}/connecties`); }}
                  >
                    <ManageIcon />
                    Connecties beheren
                  </button>
                </div>
              )}
            </div>

            {/* Actieve connectie pills */}
            {availableConns
              .filter(c => activeConnIds.includes(c.id))
              .map(conn => (
                <button
                  type="button"
                  key={conn.id}
                  className="composer-pill"
                  onClick={() => toggleConn(conn.id)}
                  title={`${conn.name} uitschakelen`}
                >
                  {conn.name}
                </button>
              ))}
          </div>

          {/* Rechts: model + versturen */}
          <div className="composer-toolbar-right">
            <div className="composer-model-wrap" ref={modelRef}>
              <button
                type="button"
                className="composer-model"
                onClick={() => setModelOpen(p => !p)}
                aria-expanded={modelOpen}
              >
                {selectedModel.label}
                <ChevronDownIcon />
              </button>

              {modelOpen && (
                <div className="composer-menu composer-menu--right">
                  {MODELS.map(m => (
                    <button
                      type="button"
                      key={m.key}
                      className={`composer-menu-item ${m.key === selectedModel.key ? 'composer-menu-item--selected' : ''}`}
                      onClick={() => { setSelectedModel(m); setModelOpen(false); }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="composer-send"
              onClick={onSubmit}
              disabled={!canSend}
              aria-label="Versturen"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M11.5 6.5L6.5 11.5C5.1 12.9 2.9 12.9 1.5 11.5C0.1 10.1 0.1 7.9 1.5 6.5L6 2C7 1 8.5 1 9.5 2C10.5 3 10.5 4.5 9.5 5.5L5 10C4.4 10.6 3.6 10.6 3 10C2.4 9.4 2.4 8.6 3 8L7.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function ConnectorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function ManageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 6.25293V7.00031H4.25C3.00736 7.00031 2 8.00766 2 9.2503V17.7471C2 18.9897 3.00736 19.9971 4.25 19.9971H19.75C20.9926 19.9971 22 18.9897 22 17.7471V9.25031C22 8.00766 20.9926 7.00031 19.75 7.00031H17V6.25293C17 5.01029 15.9926 4.00293 14.75 4.00293H9.25C8.00736 4.00293 7 5.01029 7 6.25293ZM9.25 5.50293H14.75C15.1642 5.50293 15.5 5.83872 15.5 6.25293V7.00031H8.5V6.25293C8.5 5.83872 8.83579 5.50293 9.25 5.50293ZM7 8.50293H8.5V8.50031H15.5V8.50293H17V8.50031H19.75C20.1642 8.50031 20.5 8.83609 20.5 9.25031V11.5003H17.5V10.7503C17.5 10.3361 17.1642 10.0003 16.75 10.0003C16.3358 10.0003 16 10.3361 16 10.7503V11.5003H8V10.7503C8 10.3361 7.66421 10.0003 7.25 10.0003C6.83579 10.0003 6.5 10.3361 6.5 10.7503V11.5003H3.5V9.2503C3.5 8.83609 3.83579 8.50031 4.25 8.50031H7V8.50293ZM16 13.0003V14.2503C16 14.6645 16.3358 15.0003 16.75 15.0003C17.1642 15.0003 17.5 14.6645 17.5 14.2503V13.0003H20.5V17.7471C20.5 18.1613 20.1642 18.4971 19.75 18.4971H4.25C3.83579 18.4971 3.5 18.1613 3.5 17.7471V13.0003H6.5V14.2503C6.5 14.6645 6.83579 15.0003 7.25 15.0003C7.66421 15.0003 8 14.6645 8 14.2503V13.0003H16Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto' }}>
      <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 7-7 7 7"/>
      <path d="M12 19V5"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}