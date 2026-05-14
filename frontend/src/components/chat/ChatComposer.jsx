import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import '../../styles/chatComposer.css';

const MODELS = [
  { key: 'gpt-4o-mini', label: 'GPT-5' },
  { key: 'gpt-4o',      label: 'Sonnet 4.6' },
  // Toekomst:
  // { key: 'grok-2',   label: 'Grok 2' },
];

export default function ChatComposer({ draft, setDraft, handleSubmit }) {
  const { slug }                              = useParams();
  const { connections }                       = useWorkspace();
  const navigate                              = useNavigate();
  const fileInputRef                          = useRef(null);

  // Plus menu
  const [plusOpen, setPlusOpen]               = useState(false);
  const [connSubmenuOpen, setConnSubmenuOpen] = useState(false);
  const plusRef                               = useRef(null);

  // Model dropdown
  const [modelOpen, setModelOpen]             = useState(false);
  const [selectedModel, setSelectedModel]     = useState(MODELS[0]);
  const modelRef                              = useRef(null);

  // Files
  const [files, setFiles]                     = useState([]);

  // Actieve connectors (frontend state)
  const availableConns = connections.filter(c => c.organization_connection?.enabled);
  const [activeConns, setActiveConns]         = useState(
    () => availableConns.map(c => c.id)
  );

  function toggleConn(id) {
    setActiveConns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // Sluit menus bij klik buiten
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+V paste detecteren (screenshots/images)
  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        addFiles(pastedFiles);
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  function addFiles(newFiles) {
    setFiles(prev => [
      ...prev,
      ...newFiles.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name || `screenshot-${Date.now()}.png`,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      }))
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
    e.target.value = '';  // Reset zodat je hetzelfde bestand opnieuw kan toevoegen
    setPlusOpen(false);
  }

  function onSubmit() {
    if (!draft.trim() && files.length === 0) return;

    // Bouw FormData op
    const payload = {
      message: draft,
      model: selectedModel.key,
      connections: activeConns,
      files: files.map(f => f.file)
    }
    
    const formData = new FormData();
    formData.append('message', draft);
    formData.append('model', selectedModel.key);
    formData.append('connections', JSON.stringify(activeConns));
    files.forEach(f => formData.append('files', f.file, f.name));
    console.log(payload)
    console.log(formData)

    handleSubmit(payload, formData);

    // Reset files na submit
    files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setDraft("");
  }

  return (
    <div className="composer">
      <div className="composer-inner">

        {/* File previews */}
        {files.length > 0 && (
          <div className="composer-files">
            {files.map(f => (
              <div key={f.id} className="composer-file">
                {f.preview ? (
                  <img src={f.preview} className="composer-file-preview" alt={f.name} />
                ) : (
                  <div className="composer-file-icon"><AttachIcon /></div>
                )}
                <span className="composer-file-name">{f.name}</span>
                <button className="composer-file-remove" onClick={() => removeFile(f.id)}>
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          className="composer-input"
          placeholder="Typ een bericht…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.docx"
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
                className="composer-plus"
                onClick={() => { setPlusOpen(p => !p); setConnSubmenuOpen(false); }}
              >
                <PlusIcon />
              </button>

              {plusOpen && (
                <div className="composer-menu">

                  {/* Bestand toevoegen */}
                  <button
                    className="composer-menu-item"
                    onClick={() => { fileInputRef.current?.click(); }}
                  >
                    <AttachIcon />
                    Bestand toevoegen
                  </button>

                  <div className="composer-menu-divider" />

                  {/* Connecties trigger */}
                  <button
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
                    const isOn = activeConns.includes(conn.id);
                    return (
                      <button
                        key={conn.id}
                        className="composer-submenu-item"
                        onClick={() => toggleConn(conn.id)}
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
                    className="composer-submenu-item composer-submenu-item--manage"
                    onClick={() => { setPlusOpen(false); setConnSubmenuOpen(false); navigate(`/w/${slug}/connecties`); }}
                  >
                    <ManageIcon />
                    Connecties beheren
                  </button>
                </div>
              )}
            </div>

            {/* Active connector pills */}
            {availableConns
              .filter(c => activeConns.includes(c.id))
              .map(conn => (
                <button
                  key={conn.id}
                  className="composer-pill"
                  onClick={() => toggleConn(conn.id)}
                  title={`${conn.name} uitschakelen`}
                >
                  {conn.name}
                </button>
              ))}
          </div>

          {/* Rechts: model + send */}
          <div className="composer-toolbar-right">
            <div className="composer-model-wrap" ref={modelRef}>
              <button
                className="composer-model"
                onClick={() => setModelOpen(p => !p)}
              >
                {selectedModel.label}
                <ChevronDownIcon />
              </button>

              {modelOpen && (
                <div className="composer-menu composer-menu--right">
                  {MODELS.map(m => (
                    <button
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
              className="composer-send"
              onClick={onSubmit}
              disabled={!draft.trim() && files.length === 0}
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
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 3A1.5 1.5 0 0 1 14 4.5V6h.5A3.5 3.5 0 0 1 18 9.5v6a1.5 1.5 0 0 1-1.5 1.5h-13a1.5 1.5 0 0 1-1.492-1.347L2 15.5v-6A3.5 3.5 0 0 1 5.5 6H6V4.5A1.5 1.5 0 0 1 7.5 3zM3 15.5l.01.1a.5.5 0 0 0 .49.4h13a.5.5 0 0 0 .5-.5V12h-4v.5a.5.5 0 0 1-1 0V12H8v.5a.5.5 0 0 1-1 0V12H3zM5.5 7A2.5 2.5 0 0 0 3 9.5V11h4v-.5a.5.5 0 0 1 1 0v.5h4v-.5a.5.5 0 0 1 1 0v.5h4V9.5A2.5 2.5 0 0 0 14.5 7zm2-3a.5.5 0 0 0-.5.5V6h6V4.5a.5.5 0 0 0-.5-.5z"/></svg>
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