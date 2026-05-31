import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { formatTimeAgo } from '../../lib/utils.js';
import '../../styles/overzicht.css';
import StatusPill from '../../components/StatusPill.jsx';

export default function Overzicht() {
  const { slug }                    = useParams();
  const { documents, stats, can }   = useWorkspace();
  const navigate                    = useNavigate();

  const recentDocs = documents.slice(0, 5);

  return (
    <div className="ov-root">
      <header className="ov-header">
        <div>
          <h1 className="ov-title">Overzicht</h1>
          <p className="ov-slug">w/{slug}</p>
        </div>
        {can('documents', 'create') && (
          <button className="ov-btn-primary" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
            <PlusIcon /> Document toevoegen
          </button>
        )}
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
        {recentDocs.length === 0 ? (
          <div className="ov-empty">
            <div className="ov-empty-icon"><DocIcon /></div>
            <p className="ov-empty-title">Nog geen documenten</p>
            {can('documents', 'create') && (
              <p className="ov-empty-sub">
                <button className="ov-empty-link" onClick={() => navigate(`/w/${slug}/docs/upload`)}>
                  Upload je eerste document
                </button>{' '}
                om te beginnen.
              </p>
            )}
          </div>
        ) : (
          <ul className="ov-doc-list">
            {recentDocs.map(doc => (
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
                  <StatusPill status={doc.status} />
                </button>
              </li>
            ))}
            {documents.length > 5 && (
              <li>
                <button
                  className="ov-doc-more"
                  onClick={() => navigate(`/w/${slug}/docs`)}
                >
                  Alle {documents.length} documenten bekijken →
                </button>
              </li>
            )}
          </ul>
        )}
      </section>
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