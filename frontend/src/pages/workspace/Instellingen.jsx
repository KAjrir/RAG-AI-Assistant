import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../lib/api';
import '../../new-styles/instellingen.css';


export default function Instellingen() {
  const { slug } = useParams();
  const { workspace, isOwner, updateWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [name, setName]       = useState(workspace?.name ?? '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // Niet-owners krijgen een melding en zien de pagina niet
  if (!isOwner) {
    return (
      <div className="is-no-access">
        <p className="is-no-access-title">Geen toegang</p>
        <p className="is-no-access-sub">Alleen eigenaren kunnen de instellingen beheren.</p>
      </div>
    );
  }

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim() || name === workspace?.name) return;
    setSaving(true);
    try {
      await updateWorkspace({ name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkspace() {
    const confirmed = prompt(
      `Typ de naam van de workspace (${workspace?.name}) om te bevestigen:`
    );
    if (confirmed !== workspace?.name) return;
    await api.delete(`/workspaces/${slug}`);
    navigate('/dashboard');
  }

  return (
    <div className="is-root">
      <header className="is-header">
        <h1 className="is-title">Instellingen</h1>
        <p className="is-slug">w/{slug} · /instellingen</p>
      </header>

      {/* Algemeen */}
      <section className="is-section">
        <h2 className="is-section-title">Algemeen</h2>
        <form className="is-form" onSubmit={handleSaveName}>
          <label className="is-label" htmlFor="ws-name">Naam workspace</label>
          <div className="is-input-row">
            <input
              id="ws-name"
              className="is-input"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button type="submit" className="is-btn-primary" disabled={saving || name === workspace?.name}>
              {saved ? 'Opgeslagen' : saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </section>

      {/* Abonnement */}
      <section className="is-section">
        <h2 className="is-section-title">Abonnement en facturering</h2>
        <div className="is-card-row">
          <div className="is-info-card" onClick={() => navigate(`/w/${slug}/instellingen/abonnement`)}>
            <div className="is-info-card-label">Huidig plan</div>
            <div className="is-info-card-value">{workspace?.plan ?? 'Starter'}</div>
            <ChevronIcon />
          </div>
          <div className="is-info-card" onClick={() => navigate(`/w/${slug}/instellingen/facturering`)}>
            <div className="is-info-card-label">Volgende afschrijving</div>
            <div className="is-info-card-value">{workspace?.nextBillingDate ?? '—'}</div>
            <ChevronIcon />
          </div>
          <div className="is-info-card" onClick={() => navigate(`/w/${slug}/instellingen/referrals`)}>
            <div className="is-info-card-label">Referrals</div>
            <div className="is-info-card-value">{workspace?.referralCount ?? 0} actief</div>
            <ChevronIcon />
          </div>
        </div>
      </section>

      {/* Gevarenzone */}
      <section className="is-section is-section--danger">
        <h2 className="is-section-title is-section-title--danger">Gevarenzone</h2>
        <div className="is-danger-card">
          <div>
            <p className="is-danger-label">Workspace verwijderen</p>
            <p className="is-danger-sub">
              Alle documenten, gesprekken en leden worden permanent verwijderd.
              Dit kan niet ongedaan worden gemaakt.
            </p>
          </div>
          <button className="is-btn-danger" onClick={handleDeleteWorkspace}>
            Workspace verwijderen
          </button>
        </div>
      </section>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}