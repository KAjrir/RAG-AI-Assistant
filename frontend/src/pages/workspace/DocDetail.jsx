import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../lib/api';
import '../../new-styles/docDetail.css';

export default function DocDetail() {
  const { slug, docId }   = useParams();
  const navigate          = useNavigate();
  const [doc, setDoc]     = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/workspaces/${slug}/docs/${docId}`),
      api.get(`/workspaces/${slug}/docs/${docId}/chunks`),
    ])
      .then(([docRes, chunksRes]) => {
        setDoc(docRes.data);
        setChunks(chunksRes.data);
      })
      .finally(() => setLoading(false));
  }, [slug, docId]);

  async function handleReindex() {
    setReindexing(true);
    try {
      await api.post(`/workspaces/${slug}/docs/${docId}/reindex`);
      setDoc(prev => ({ ...prev, status: 'processing' }));
      pollStatus();
    } catch {
      setReindexing(false);
    }
  }

  function pollStatus() {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/workspaces/${slug}/docs/${docId}/status`);
        if (res.data.status === 'indexed') {
          clearInterval(interval);
          setDoc(prev => ({ ...prev, status: 'indexed' }));
          setReindexing(false);
        }
        if (res.data.status === 'error') {
          clearInterval(interval);
          setDoc(prev => ({ ...prev, status: 'error' }));
          setReindexing(false);
        }
      } catch {
        clearInterval(interval);
        setReindexing(false);
      }
    }, 3000);
  }

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    setDeleting(true);
    try {
      await api.delete(`/workspaces/${slug}/docs/${docId}`);
      navigate(`/w/${slug}/docs`);
    } catch {
      setDeleting(false);
    }
  }

  if (loading) return <p className="dd-loading">Laden…</p>;
  if (!doc)    return <p className="dd-loading">Document niet gevonden.</p>;

  return (
    <div className="dd-root">
      {/* Header */}
      <header className="dd-header">
        <button className="dd-back" onClick={() => navigate(`/w/${slug}/docs`)}>
          <BackIcon /> Terug naar documenten
        </button>
        <div className="dd-header-main">
          <div className="dd-header-left">
            <div className={`dd-doc-icon dd-doc-icon--${doc.status}`}>
              <DocIcon />
            </div>
            <div>
              <h1 className="dd-title">{doc.name}</h1>
              <div className="dd-meta-row">
                <span className="dd-meta">{doc.size}</span>
                <span className="dd-meta-sep">·</span>
                <span className="dd-meta">{doc.uploadedAt}</span>
                <span className="dd-meta-sep">·</span>
                <span className={`dd-pill dd-pill--${doc.status}`}>
                  {statusLabel(doc.status)}
                </span>
              </div>
            </div>
          </div>
          <div className="dd-header-actions">
            {(doc.status === 'error' || doc.status === 'indexed') && (
              <button
                className="dd-btn-secondary"
                onClick={handleReindex}
                disabled={reindexing}
              >
                <ReindexIcon />
                {reindexing ? 'Bezig…' : 'Opnieuw indexeren'}
              </button>
            )}
            <button
              className="dd-btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              <TrashIcon />
              {deleting ? 'Verwijderen…' : 'Verwijderen'}
            </button>
          </div>
        </div>
      </header>

      {/* Statistieken */}
      <div className="dd-stats">
        <div className="dd-stat">
          <span className="dd-stat-num">{doc.chunkCount ?? chunks.length}</span>
          <span className="dd-stat-label">Chunks</span>
        </div>
        <div className="dd-stat">
          <span className="dd-stat-num">{doc.tokenCount ?? '—'}</span>
          <span className="dd-stat-label">Tokens</span>
        </div>
        <div className="dd-stat">
          <span className="dd-stat-num">{doc.pageCount ?? '—'}</span>
          <span className="dd-stat-label">Pagina's</span>
        </div>
      </div>

      {/* Chunks */}
      {chunks.length > 0 && (
        <section className="dd-chunks-section">
          <p className="dd-section-label">Chunks ({chunks.length})</p>
          <ul className="dd-chunk-list">
            {chunks.map((chunk, i) => (
              <li key={chunk.id} className="dd-chunk">
                <span className="dd-chunk-num">#{i + 1}</span>
                <p className="dd-chunk-text">{chunk.content}</p>
                <span className="dd-chunk-tokens">{chunk.tokens} tokens</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Verwerking bezig */}
      {doc.status === 'processing' && (
        <div className="dd-processing">
          <SpinnerIcon />
          <p>Document wordt verwerkt en geïndexeerd…</p>
        </div>
      )}
    </div>
  );
}

function statusLabel(status) {
  const labels = { indexed: 'Geïndexeerd', processing: 'Verwerking', error: 'Fout' };
  return labels[status] ?? status;
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 1.5h7l3.5 3.5V14.5H3V1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M10 1.5V5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}

function ReindexIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M2 10.5V7h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="dd-spinner">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"
        strokeDasharray="30 15" strokeLinecap="round"/>
    </svg>
  );
}