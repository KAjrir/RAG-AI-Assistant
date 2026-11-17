import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BASE_URL } from '../../lib/api';
import { formatFileSize, formatTimeAgo, getErrorMessage } from '../../lib/utils.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import '../../styles/docDetail.css';

export default function DocDetail() {
  const { slug, docId } = useParams();
  const navigate        = useNavigate();
  const toast           = useToast();
  const { documents, loading, can, deleteDocument, reindexDocument, fetchChunks } = useWorkspace();

  const [chunks, setChunks]               = useState([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [reindexing, setReindexing]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const doc = documents.find(d => d.id === docId);

  // Chunks ophalen zodra het document geïndexeerd is (ook na opnieuw indexeren)
  useEffect(() => {
    if (doc?.status !== 'completed') return;

    let cancelled = false;
    setChunksLoading(true);

    fetchChunks(docId)
      .then(data => { if (!cancelled) setChunks(data); })
      .catch(err => {
        if (!cancelled) toast.error(getErrorMessage(err, 'Chunks ophalen is mislukt.'));
      })
      .finally(() => { if (!cancelled) setChunksLoading(false); });

    return () => { cancelled = true; };
  }, [doc?.status, docId]);

  // Escape sluit de verwijder-modal
  useEffect(() => {
    if (!confirmDelete) return;
    function onKey(e) {
      if (e.key === 'Escape' && !deleting) setConfirmDelete(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete, deleting]);

  async function handleReindex() {
    setReindexing(true);
    try {
      await reindexDocument(docId);
      setChunks([]);
      toast.success(`${doc.originalname} wordt opnieuw geïndexeerd.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Opnieuw indexeren is mislukt.'));
    } finally {
      setReindexing(false);
    }
  }

  async function handleConfirmDelete() {
    const name = doc.originalname;
    setDeleting(true);
    try {
      await deleteDocument(docId);
      toast.success(`${name} is verwijderd.`);
      navigate(`/w/${slug}/docs`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Document verwijderen is mislukt.'));
      setDeleting(false);
    }
  }

  // ── Workspace nog aan het laden ──────────
  if (loading) {
    return (
      <div className="section-loading">
        <div className="spinner" />
      </div>
    );
  }

  // ── Niet gevonden ────────────────────────
  // (na verwijderen niet tonen: dan zijn we al aan het navigeren)
  if (!doc) {
    if (deleting) return null;
    return (
      <div className="dd-root">
        <button className="dd-back" onClick={() => navigate(`/w/${slug}/docs`)}>
          <BackIcon /> Terug naar documenten
        </button>
        <div className="dd-not-found">
          <div className="dd-not-found-icon"><DocIcon /></div>
          <p className="dd-not-found-title">Document niet gevonden</p>
          <p className="dd-not-found-sub">Dit document bestaat niet of is verwijderd.</p>
        </div>
      </div>
    );
  }

  const isProcessing = ['uploading', 'queued', 'processing'].includes(doc.status);
  const chunkCount   = chunks.length || doc.chunks || null;

  return (
    <div className="dd-root">
      <button className="dd-back" onClick={() => navigate(`/w/${slug}/docs`)}>
        <BackIcon /> Terug naar documenten
      </button>

      <div className="dd-header-main">
        <div className="dd-header-left">
          <div className={`dd-doc-icon dd-doc-icon--${doc.status}`}>
            <DocIcon />
          </div>
          <div>
            <a
              href={`${BASE_URL}${doc.resource_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="dd-title-link"
            >
              <h1 className="dd-title">{doc.originalname}</h1>
            </a>
            <div className="dd-meta-row">
              <span className="dd-meta">{formatFileSize(doc.size)}</span>
              <span className="dd-meta-sep">·</span>
              <span className="dd-meta">{formatTimeAgo(doc.uploaded_at)}</span>
              <span className="dd-meta-sep">·</span>
              <span className={`dd-pill dd-pill--${doc.status}`}>
                {statusLabel(doc.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="dd-header-actions">
          {doc.status === 'completed' && (
            <button
              className="dd-btn-primary"
              onClick={() => navigate(`/w/${slug}`, {
                state: { draft: `Vat "${doc.originalname}" samen.` },
              })}
            >
              <SparkIcon />
              Vraag over dit document
            </button>
          )}
          {(doc.status === 'failed' || doc.status === 'completed') && can('documents', 'create') && (
            <button
              className="dd-btn-secondary"
              onClick={handleReindex}
              disabled={reindexing || deleting}
            >
              <ReindexIcon />
              {reindexing ? 'Bezig…' : 'Opnieuw indexeren'}
            </button>
          )}
          {can('documents', 'delete') && (
            <button
              className="dd-btn-danger"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
            >
              <TrashIcon />
              {deleting ? 'Verwijderen…' : 'Verwijderen'}
            </button>
          )}
        </div>
      </div>

      <div className="dd-stats">
        <div className="dd-stat">
          <span className="dd-stat-num">{chunkCount ?? '—'}</span>
          <span className="dd-stat-label">Chunks</span>
        </div>
        <div className="dd-stat">
          <span className="dd-stat-num">{doc.page_count ?? '—'}</span>
          <span className="dd-stat-label">Pagina's</span>
        </div>
      </div>

      {isProcessing && (
        <div className="dd-processing">
          <SpinnerIcon />
          <p>Document wordt verwerkt en geïndexeerd…</p>
        </div>
      )}

      {doc.status === 'completed' && (
        chunksLoading ? (
          <p className="dd-loading">Chunks laden…</p>
        ) : chunks.length > 0 && (
          <section className="dd-chunks-section">
            <p className="dd-section-label">Chunks ({chunks.length})</p>
            <ul className="dd-chunk-list">
              {chunks.map(chunk => (
                <li key={chunk.id ?? chunk.chunk_index} className="dd-chunk">
                  <span className="dd-chunk-num">#{chunk.chunk_index + 1}</span>
                  <p className="dd-chunk-text">{chunk.content}</p>
                </li>
              ))}
            </ul>
          </section>
        )
      )}

      {/* Verwijder modal */}
      {confirmDelete && (
        <>
          <div className="dd-modal-backdrop" onClick={() => !deleting && setConfirmDelete(false)} />
          <div className="dd-modal" role="dialog" aria-modal="true" aria-labelledby="dd-delete-title">
            <div className="dd-modal-icon">
              <TrashIcon />
            </div>
            <div className="dd-modal-body">
              <h2 className="dd-modal-title" id="dd-delete-title">Document verwijderen</h2>
              <p className="dd-modal-desc">
                Weet je zeker dat je <strong>{doc.originalname}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <div className="dd-modal-footer">
              <button
                className="dd-btn-secondary"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Annuleren
              </button>
              <button className="dd-btn-danger-solid" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Verwijderen…' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    uploading:  'Uploaden',
    queued:     'Wachtrij',
    processing: 'Verwerking',
    completed:  'Geïndexeerd',
    failed:     'Mislukt',
  };
  return labels[status] ?? status;
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5l1.3 3.6 3.7 1.4-3.7 1.4L7 11.5 5.7 7.9 2 6.5l3.7-1.4L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
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