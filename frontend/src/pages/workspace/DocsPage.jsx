import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { formatFileSize, formatTimeAgo } from '../../lib/utils.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import '../../styles/docsPage.css';
import StatusPill from '../../components/StatusPill.jsx';

export default function DocsPage() {
  const { slug }                                    = useParams();
  const navigate                                    = useNavigate();
  const location                                    = useLocation();
  const { documents, loading, can, refreshDocuments, reindexDocument, deleteDocument } = useWorkspace();

  const [duplicates, setDuplicates]               = useState(location?.state?.duplicates ?? []);
  const [highlightedDoc, setHighlightedDoc]       = useState(null);
  const [confirmDelete, setConfirmDelete]         = useState(null); // { id, name }
  const docRefs                                   = useRef({});

  useEffect(() => {
    refreshDocuments();
  }, []);

  function scrollToDoc(docName) {
    const doc = documents.find(d => d.originalname === docName);
    if (!doc) return;
    const el = docRefs.current[doc.id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedDoc(doc.id);
    setTimeout(() => setHighlightedDoc(null), 1200);
  }

  async function handleReindex(docId) {
    await reindexDocument(docId);
  }

  function handleDelete(doc) {
    setConfirmDelete({ id: doc.id, name: doc.originalname });
  }

  async function handleConfirmDelete() {
    await deleteDocument(confirmDelete.id);
    setConfirmDelete(null);
  }

  return (
    <div className="dp-root">
      <header className="dp-header">
        <div>
          <h1 className="dp-title">Documenten</h1>
          <p className="dp-slug">w/{slug} · /docs</p>
        </div>
        {can('documents', 'create') && (
          <button className="dp-btn-primary" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
            <PlusIcon /> Uploaden
          </button>
        )}
      </header>

      {duplicates.length > 0 && (
        <div className="dp-duplicates">
          <div className="dp-duplicates-header">
            <div className="dp-duplicates-title">
              <AlertIcon />
              <span>
                {duplicates.length} bestand{duplicates.length > 1 ? 'en werden' : ' werd'} overgeslagen — al aanwezig in je workspace
              </span>
            </div>
            <button
              className="dp-duplicates-close"
              onClick={() => setDuplicates([])}
              title="Sluiten"
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="dp-duplicates-list">
            {duplicates.map((doc, i) => (
              <li key={i}>
                <div
                  className="dp-duplicates-item"
                  onClick={() => scrollToDoc(doc.originalname)}
                >
                  <DocIcon />
                  <div className="dp-duplicates-item-info">
                    <span className="dp-duplicates-item-name">{doc.duplicateFileName}</span>
                    <span className="dp-duplicates-item-existing">
                      al aanwezig als <strong>{doc.originalname}</strong>
                    </span>
                  </div>
                  <ChevronIcon />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="dp-loading">Laden…</p>
      ) : documents.length === 0 ? (
        <div className="dp-empty">
          <div className="dp-empty-icon"><DocIcon /></div>
          <p className="dp-empty-title">Nog geen documenten</p>
          <p className="dp-empty-sub">Upload je eerste document om te beginnen.</p>
          {can('documents', 'create') && (
            <button className="dp-btn-primary" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
              <PlusIcon /> Document uploaden
            </button>
          )}
        </div>
      ) : (
        <ul className="dp-list">
          {documents.map(doc => (
            <li
              key={doc.id}
              ref={el => docRefs.current[doc.id] = el}
              className={`dp-item ${highlightedDoc === doc.id ? 'dp-item--highlight' : ''}`}
              onClick={() => navigate(`/w/${slug}/docs/${doc.id}`)}
            >
              <div className={`dp-icon dp-icon--${doc.status}`}>
                <DocIcon />
              </div>
              <div className="dp-info">
                <span className="dp-name">{doc.originalname}</span>
                <span className="dp-meta">
                  {formatFileSize(doc.size)} · {doc.chunks
                    ? `${doc.chunks} chunks`
                    : formatTimeAgo(doc.uploaded_at)
                  }
                </span>
              </div>
              <div className="dp-actions">
                {doc.status === 'failed' && can('documents', 'create') && (
                  <button
                    className="dp-action-btn"
                    title="Opnieuw indexeren"
                    onClick={(e) => { e.stopPropagation(); handleReindex(doc.id); }}
                  >
                    <ReindexIcon />
                  </button>
                )}
                {can('documents', 'delete') && (
                  <button
                    className="dp-action-btn dp-action-btn--danger"
                    title="Verwijderen"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              <StatusPill status={doc.status} />
            </li>
          ))}
        </ul>
      )}

      {/* Verwijder modal */}
      {confirmDelete && (
        <>
          <div className="dp-modal-backdrop" onClick={() => setConfirmDelete(null)} />
          <div className="dp-modal">
            <div className="dp-modal-icon">
              <TrashIcon />
            </div>
            <div className="dp-modal-body">
              <h2 className="dp-modal-title">Document verwijderen</h2>
              <p className="dp-modal-desc">
                Weet je zeker dat je <strong>{confirmDelete.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <div className="dp-modal-footer">
              <button className="dp-btn-secondary" onClick={() => setConfirmDelete(null)}>
                Annuleren
              </button>
              <button className="dp-btn-danger" onClick={handleConfirmDelete}>
                Verwijderen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 1h6L11 3.5V13H2.5V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8.5 1v2.5H11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
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
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="7" y1="6" x2="7" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="7" cy="10.5" r="0.7" fill="currentColor"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}