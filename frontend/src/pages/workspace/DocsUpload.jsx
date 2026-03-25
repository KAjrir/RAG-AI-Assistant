import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../lib/api';
import '../../new-styles/docsUpload.css';

const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_MB = 25;

export default function DocsUpload() {
  const { slug }          = useParams();
  const navigate          = useNavigate();
  const inputRef          = useRef(null);

  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [error, setError]         = useState(null);
  const [status, setStatus]       = useState('idle'); // idle | uploading | processing | done | error

  function validateFile(f) {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `Bestandstype niet ondersteund. Gebruik ${ACCEPTED_TYPES.join(', ')}.`;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `Bestand is te groot. Maximaal ${MAX_MB} MB toegestaan.`;
    }
    return null;
  }

  function handleSelect(f) {
    setError(null);
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleSelect(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/workspaces/${slug}/docs`,
        { method: 'POST', credentials: 'include', body: formData }
      );

      if (!res.ok) throw new Error(`Upload mislukt (${res.status})`);

      const { id } = await res.json();
      setStatus('processing');
      pollStatus(id);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function pollStatus(docId) {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/workspaces/${slug}/docs/${docId}/status`);
        if (res.data.status === 'indexed') {
          clearInterval(interval);
          setStatus('done');
          setTimeout(() => navigate(`/w/${slug}/docs/${docId}`), 1200);
        }
        if (res.data.status === 'error') {
          clearInterval(interval);
          setError('Verwerking mislukt. Probeer het opnieuw.');
          setStatus('error');
        }
      } catch {
        clearInterval(interval);
        setStatus('error');
      }
    }, 3000);
  }

  return (
    <div className="du-root">
      <header className="du-header">
        <button className="du-back" onClick={() => navigate(`/w/${slug}/docs`)}>
          <BackIcon /> Terug naar documenten
        </button>
        <h1 className="du-title">Document uploaden</h1>
        <p className="du-sub">
          Ondersteunde formaten: PDF, DOCX, TXT · Maximaal {MAX_MB} MB
        </p>
      </header>

      {status === 'idle' || status === 'error' ? (
        <>
          <div
            className={`du-dropzone ${dragging ? 'du-dropzone--dragging' : ''} ${file ? 'du-dropzone--has-file' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="du-input"
              onChange={e => e.target.files[0] && handleSelect(e.target.files[0])}
            />
            {file ? (
              <div className="du-file-preview">
                <div className="du-file-icon"><DocIcon /></div>
                <div className="du-file-info">
                  <span className="du-file-name">{file.name}</span>
                  <span className="du-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button
                  className="du-file-remove"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="du-dropzone-empty">
                <div className="du-dropzone-icon"><UploadIcon /></div>
                <p className="du-dropzone-label">
                  Sleep een bestand hierheen of <span>klik om te kiezen</span>
                </p>
                <p className="du-dropzone-hint">PDF, DOCX of TXT · max {MAX_MB} MB</p>
              </div>
            )}
          </div>

          {error && <p className="du-error"><AlertIcon /> {error}</p>}

          <div className="du-footer">
            <button
              className="du-btn-primary"
              disabled={!file}
              onClick={handleUpload}
            >
              Uploaden en indexeren
            </button>
            <button className="du-btn-secondary" onClick={() => navigate(`/w/${slug}/docs`)}>
              Annuleren
            </button>
          </div>
        </>
      ) : (
        <div className="du-progress">
          <div className={`du-progress-icon du-progress-icon--${status}`}>
            {status === 'done' ? <CheckIcon /> : <SpinnerIcon />}
          </div>
          <p className="du-progress-title">
            {status === 'uploading'   && 'Bestand uploaden…'}
            {status === 'processing'  && 'Document verwerken en indexeren…'}
            {status === 'done'        && 'Klaar! Document is geïndexeerd.'}
          </p>
          <p className="du-progress-sub">
            {status === 'uploading'   && 'Even geduld…'}
            {status === 'processing'  && 'Dit kan een paar seconden duren.'}
            {status === 'done'        && 'Je wordt doorgestuurd…'}
          </p>
        </div>
      )}
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