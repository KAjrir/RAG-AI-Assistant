import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { formatFileSize, formatTimeAgo } from '../../lib/utils.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import '../../styles/docsPage.css';
import { api } from '../../lib/api.js';

export default function DocsPage() {
  const { slug }                              = useParams();
  const navigate                              = useNavigate();
  const { documents, loading, refreshDocuments, reindexDocument, deleteDocument } = useWorkspace();

  // Refresh zodra de pagina mount — haalt verse data op
  // polling in context neemt het daarna over bij processing docs
  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleReindex(docId) {
    await reindexDocument(docId) 
  }

  async function handleDelete(docId) {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen?')) return;
    await deleteDocument(docId);
  }

  return (
    <div className="dp-root">
      <header className="dp-header">
        <div>
          <h1 className="dp-title">Documenten</h1>
          <p className="dp-slug">w/{slug} · /docs</p>
        </div>
        <button className="dp-btn-primary" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
          <PlusIcon /> Uploaden
        </button>
      </header>

      {loading ? (
        <p className="dp-loading">Laden…</p>
      ) : documents.length === 0 ? (
        <div className="dp-empty">
          <div className="dp-empty-icon"><DocIcon /></div>
          <p className="dp-empty-title">Nog geen documenten</p>
          <p className="dp-empty-sub">Upload je eerste document om te beginnen.</p>
          <button className="dp-btn-primary" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
            <PlusIcon /> Document uploaden
          </button>
        </div>
      ) : (
        <ul className="dp-list">
          {documents.map(doc => (
            <li key={doc.id} className="dp-item"  onClick={() => navigate(`/w/${slug}/docs/${doc.id}`)}>
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
                {doc.status === 'failed' && (
                  <button
                    className="dp-action-btn"
                    title="Opnieuw indexeren"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReindex(doc.id)
                    }}
                  >
                    <ReindexIcon />
                  </button>
                )}
                <button
                  className="dp-action-btn dp-action-btn--danger"
                  title="Verwijderen"
                  onClick={(e) => {
                    e.stopPropagation()
                      handleDelete(doc.id)
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
              <StatusPill status={doc.status}/>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const config = {
    uploading: {
      color: 'blue',
      title: 'Uploaden',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 9V3M6 3L3 6M6 3l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    queued: {
      color: 'yellow',
      title: 'Wachtrij',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    },
    processing: {
      color: 'amber',
      title: 'Verwerking',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="dp-spin">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="16 8" strokeLinecap="round"/>
      </svg>
    },
    completed: {
      color: 'green',
      title: 'Geïndexeerd',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    },
    failed: {
      color: 'red',
      title: 'Mislukt',
      icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    },
  }

  const { icon, title, color } = config[status] ?? { icon: '?', title: status, color: 'gray' }

  return (
    <span className={`dp-pill dp-pill--${color}`} title={title}>
      {icon}
    </span>
  )
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