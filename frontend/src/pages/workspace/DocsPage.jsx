import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../../lib/api';
import { formatFileSize, formatTimeAgo, sortDocs } from '../../lib/utils.js';
import '../../new-styles/docsPage.css';

export default function DocsPage() {
  const { slug }            = useParams();
  const navigate            = useNavigate();
  const [docs, setDocs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/workspaces/${slug}/docs`)
      .then(res => {
        setDocs(res.data)
        console.log(res.data)
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleReindex(docId) {
    await api.post(`/workspaces/${slug}/docs/${docId}/reindex`);
    setDocs(prev =>
      prev.map(d => d.id === docId ? { ...d, status: 'processing' } : d)
    );
  }

  async function handleDelete(docId) {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen?')) return;
    await api.delete(`/workspaces/${slug}/docs/${docId}`);
    setDocs(prev => prev.filter(d => d.id !== docId));
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
      ) : docs.length === 0 ? (
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
          {sortDocs(docs).map(doc => (
            <li key={doc.id} className="dp-item">
              <div className={`dp-icon dp-icon--${doc.status}`}>
                <DocIcon />
              </div>
              <div className="dp-info" onClick={() => navigate(`/w/${slug}/docs/${doc.id}`)}>
                <span className="dp-name">{doc.originalname}</span>
                <span className="dp-meta">
                  {formatFileSize(doc.size)} · {doc.chunks ? `${doc.chunks} chunks` : formatTimeAgo(doc.uploaded_at)}
                </span>
              </div>
              <div className="dp-actions">
                {doc.status === 'failed' && (
                  <button
                    className="dp-action-btn"
                    title="Opnieuw indexeren"
                    onClick={() => handleReindex(doc.id)}
                  >
                    <ReindexIcon />
                  </button>
                )}
                <button
                  className="dp-action-btn dp-action-btn--danger"
                  title="Verwijderen"
                  onClick={() => handleDelete(doc.id)}
                >
                  <TrashIcon />
                </button>
              </div>
              <span className={`dp-pill dp-pill--${doc.status}`}>
                {statusLabel(doc.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusLabel(status) {
  const labels = { completed: 'Geïndexeerd', processing: 'Verwerking', failed: 'Mislukt' };
  return labels[status] ?? status;
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