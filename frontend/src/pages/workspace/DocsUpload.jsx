import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatFileSize, getErrorMessage } from '../../lib/utils.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import '../../styles/docsUpload.css';

const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_MB         = 25;

export default function DocsUpload() {
  const { slug }            = useParams();
  const navigate            = useNavigate();
  const toast               = useToast();
  const inputRef            = useRef(null);
  const { uploadDocuments } = useWorkspace();

  const [dragging, setDragging]   = useState(false);
  const [files, setFiles]         = useState([]);
  const [uploading, setUploading] = useState(false);

  // Geeft de reden terug waarom een bestand niet mag, of null als het goed is
  function getRejectReason(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) return 'type';
    if (file.size > MAX_MB * 1024 * 1024) return 'size';
    return null;
  }

  function handleSelect(fileList) {
    const incoming = Array.from(fileList);
    const valid    = [];
    const wrongType = [];
    const tooBig    = [];

    for (const file of incoming) {
      const reason = getRejectReason(file);
      if (reason === 'type') wrongType.push(file.name);
      else if (reason === 'size') tooBig.push(file.name);
      else valid.push(file);
    }

    // Geldige bestanden toevoegen, ook als er ongeldige tussen zaten
    if (valid.length) {
      setFiles(prev => {
        const existing = new Set(prev.map(f => f.name));
        return [...prev, ...valid.filter(f => !existing.has(f.name))];
      });
    }

    if (wrongType.length) {
      toast.error(
        `${listNames(wrongType)} ${wrongType.length > 1 ? 'worden' : 'wordt'} niet ondersteund. Gebruik ${ACCEPTED_TYPES.join(', ')}.`
      );
    }
    if (tooBig.length) {
      toast.error(
        `${listNames(tooBig)} ${tooBig.length > 1 ? 'zijn' : 'is'} te groot. Maximaal ${MAX_MB} MB per bestand.`
      );
    }
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    if (e.dataTransfer.files.length > 0) handleSelect(e.dataTransfer.files);
  }

  function handleInputChange(e) {
    if (e.target.files.length > 0) handleSelect(e.target.files);
    e.target.value = ''; // zodat hetzelfde bestand opnieuw gekozen kan worden
  }

  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);

    try {
      const result     = await uploadDocuments(files);
      const uploaded   = result.docs?.length ?? 0;
      const duplicates = result.duplicateDocs ?? [];

      if (uploaded > 0) {
        toast.success(
          uploaded === 1
            ? '1 document geüpload, indexeren is gestart.'
            : `${uploaded} documenten geüpload, indexeren is gestart.`
        );
      }

      // Duplicaten worden op de documentenpagina in de banner getoond
      navigate(`/w/${slug}/docs`, { state: { duplicates } });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Uploaden is mislukt.'));
      setUploading(false);
    }
  }

  return (
    <div className="du-root">
      <header className="du-header">
        <Link to={`/w/${slug}/docs`} className="du-back">
          <BackIcon /> Terug naar documenten
        </Link>
        <h1 className="du-title">Documenten uploaden</h1>
        <p className="du-sub">
          Ondersteunde formaten: PDF, DOCX, TXT · Maximaal {MAX_MB} MB per bestand
        </p>
      </header>

      <div
        className={`du-dropzone ${dragging ? 'du-dropzone--dragging' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="du-input"
          onChange={handleInputChange}
        />
        <div className="du-dropzone-empty">
          <div className="du-dropzone-icon"><UploadIcon /></div>
          <p className="du-dropzone-label">
            Sleep bestanden hierheen of <span>klik om te kiezen</span>
          </p>
          <p className="du-dropzone-hint">
            PDF, DOCX of TXT · max {MAX_MB} MB · meerdere bestanden tegelijk
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="du-file-list">
          {files.map(file => (
            <li key={file.name} className="du-file-item">
              <div className="du-file-icon"><DocIcon /></div>
              <div className="du-file-info">
                <span className="du-file-name">{file.name}</span>
                <span className="du-file-size">{formatFileSize(file.size)}</span>
              </div>
              {!uploading && (
                <button
                  className="du-file-remove"
                  onClick={() => removeFile(file.name)}
                  title="Verwijderen"
                >
                  <CloseIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="du-footer">
        {files.length > 0 && (
          <button
            className="du-btn-primary"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading
              ? <><SpinnerIcon /> Uploaden…</>
              : `Uploaden en indexeren${files.length > 1 ? ` (${files.length})` : ''}`}
          </button>
        )}
        <button
          className="du-btn-secondary"
          onClick={() => navigate(`/w/${slug}/docs`)}
          disabled={uploading}
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

// "a.exe", "a.exe en b.zip", "a.exe, b.zip en 3 andere"
function listNames(names) {
  const quoted = names.map(n => `"${n}"`);
  if (quoted.length === 1) return quoted[0];
  if (quoted.length === 2) return `${quoted[0]} en ${quoted[1]}`;
  if (quoted.length === 3) return `${quoted[0]}, ${quoted[1]} en ${quoted[2]}`;
  return `${quoted[0]}, ${quoted[1]} en ${quoted.length - 2} andere`;
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3.5 1.5h7L14 6v10.5H3.5V1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M10.5 1.5V6H14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="du-spinner">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round"/>
    </svg>
  );
}