import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api } from '../../lib/api.js';
import { formatTimeAgo, sortDocs } from '../../lib/utils.js';
import '../../new-styles/overzicht.css';


export default function Overzicht() {
  const { slug }          = useParams();
  const { workspace }     = useWorkspace();
  const navigate          = useNavigate();

  const [docs, setDocs]   = useState([]);
  const [stats, setStats] = useState({ docs: 0, connections: 0, members: 0 });

  useEffect(() => {
    Promise.all([
      api.get(`/workspaces/${slug}/docs?limit=5`),
      api.get(`/workspaces/${slug}/stats`),
    ]).then(([docsRes, statsRes]) => {
      setDocs(docsRes.data);
      setStats(statsRes.data);
    });
  }, [slug]);

  return (
    <div className="ov-root">
      <header className="ov-header">
        <div>
          <h1 className="ov-title">Overzicht</h1>
          <p className="ov-slug">w/{slug}</p>
        </div>
        <button className="ov-btn-primary" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
          <PlusIcon /> Document toevoegen
        </button>
      </header>

      <section className="ov-stats">
        <button className="ov-stat" onClick={() => navigate(`/w/${slug}/docs`)}>
          <span className="ov-stat-num">{stats.docs}</span>
          <span className="ov-stat-label">Documenten</span>
        </button>
        <button className="ov-stat" onClick={() => navigate(`/w/${slug}/connecties`)}>
          <span className="ov-stat-num">{stats.connections}</span>
          <span className="ov-stat-label">Connecties</span>
        </button>
        <button className="ov-stat" onClick={() => navigate(`/w/${slug}/mensen`)}>
          <span className="ov-stat-num">{stats.members}</span>
          <span className="ov-stat-label">Teamleden</span>
        </button>
      </section>

      <section>
        <p className="ov-section-label">Recente documenten</p>
        <ul className="ov-doc-list">
          {sortDocs(docs).map(doc => (
            <li key={doc.id}>
              <button
                className="ov-doc-item"
                onClick={() => navigate(`/w/${slug}/docs/${doc.id}`)}
              >
                <div className={`ov-doc-icon ov-doc-icon--${doc.status}`}>
                  <DocIcon />
                </div>
                <div className="ov-doc-info">
                  <span className="ov-doc-name">{doc.originalname}</span>
                  <span className="ov-doc-meta">{formatTimeAgo(doc.uploaded_at)}</span>
                </div>
                <span className={`ov-pill ov-pill--${doc.status}`}>
                  {statusLabel(doc.status)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    completed:    'Geïndexeerd',
    processing: 'Verwerking',
    failed:      'Mislukt',
  };
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