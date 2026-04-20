import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatFileSize } from "../../lib/utils"
import '../../styles/docsUpload.css';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';

const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_MB = 25;

export default function DocsUpload() {
  const { slug }                    = useParams();
  const navigate                    = useNavigate();
  const inputRef                    = useRef(null);
  const { uploadDocuments }         = useWorkspace();

  const [dragging, setDragging]     = useState(false);
  const [files, setFiles]           = useState([]);
  const [error, setError]           = useState(null);
  const [uploading, setUploading]   = useState(false);

  function validateFiles(fileList) {
    for (const file of Array.from(fileList)) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ACCEPTED_TYPES.includes(ext)) {
        return `Bestandstype niet ondersteund. Gebruik ${ACCEPTED_TYPES.join(', ')}.`;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        return `"${file.name}" is te groot. Maximaal ${MAX_MB} MB per bestand.`;
      }
    }
    return null;
  }

  function handleSelect(fileList) {
    setError(null);
    const validationError = validateFiles(fileList);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const nieuweFiles = Array.from(fileList).filter(f => !existing.has(f.name));
      return [...prev, ...nieuweFiles];
    });
  }

  function removeFile(name) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleSelect(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setError(null);

    try {
      await uploadDocuments(files);
      navigate(`/w/${slug}/docs`);
    } catch (err) {
      setError(err.response.data.error);
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
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="du-input"
          onChange={e => e.target.files.length > 0 && handleSelect(e.target.files)}
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

      {error && <p className="du-failed"><AlertIcon /> {error}</p>}

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
            {uploading ? <><SpinnerIcon /> Uploaden…</> : 'Uploaden en indexeren'}
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
function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <line x1="6.5" y1="1" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
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

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="7" y1="4.5" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="9.5" r="0.7" fill="currentColor"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="du-spinner">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round"/>
    </svg>
  );
}

