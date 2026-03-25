import { useState } from 'react';
import { useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import '../../new-styles/mensen.css';

export default function Mensen() {
  const { slug }                                         = useParams();
  const { members, isOwner, inviteMember, removeMember } = useWorkspace();

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail]           = useState('');
  const [busy, setBusy]             = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [copied, setCopied]         = useState(false);

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await inviteMember(email);
      setInviteCode(res.code);
      setEmail('');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(memberId) {
    if (!confirm('Weet je zeker dat je dit lid wilt verwijderen?')) return;
    await removeMember(memberId);
  }

  function copyCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Afleiden van het domein voor de domain-join banner
  const ownerEmail  = members.find(m => m.role === 'owner')?.email ?? '';
  const domain      = ownerEmail.split('@')[1] ?? null;

  return (
    <div className="mn-root">
      <header className="mn-header">
        <div>
          <h1 className="mn-title">Mensen</h1>
          <p className="mn-slug">w/{slug} · /mensen</p>
        </div>
        {isOwner && (
          <button className="mn-btn-primary" onClick={() => setShowInvite(v => !v)}>
            <PlusIcon /> Uitnodigen
          </button>
        )}
      </header>

      {/* Uitnodigingsformulier */}
      {showInvite && (
        <div className="mn-invite-box">
          <p className="mn-invite-title">Teamlid uitnodigen</p>
          <p className="mn-invite-sub">
            Verstuur een uitnodiging via e-mail. Iedereen met een
            <strong> @{domain}</strong> adres sluit automatisch aan.
          </p>
          <form className="mn-invite-form" onSubmit={handleInvite}>
            <input
              className="mn-input"
              type="email"
              placeholder="naam@bedrijf.nl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
            <button type="submit" className="mn-btn-primary" disabled={busy}>
              {busy ? 'Versturen…' : 'Versturen'}
            </button>
            <button
              type="button"
              className="mn-btn-secondary"
              onClick={() => { setShowInvite(false); setInviteCode(null); }}
            >
              Sluiten
            </button>
          </form>

          {inviteCode && (
            <div className="mn-code-row">
              <code className="mn-code">{inviteCode}</code>
              <button className="mn-copy-btn" onClick={copyCode}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Gekopieerd' : 'Kopiëren'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Teamleden */}
      <p className="mn-section-label">Teamleden</p>
      <ul className="mn-list">
        {members.map(member => {
          const initials = member.name
            ?.split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase() ?? '?';

          return (
            <li key={member.id} className="mn-item">
              <div className="mn-avatar">{initials}</div>
              <div className="mn-info">
                <span className="mn-name">{member.name}</span>
                <span className="mn-email">
                  {member.email}
                  {member.role === 'owner' ? ' · Eigenaar' : ' · Lid'}
                  {member.joinedVia === 'domain' && (
                    <span className="mn-domain-badge">via domein</span>
                  )}
                </span>
              </div>
              <span className={`mn-role mn-role--${member.role}`}>
                {member.role === 'owner' ? 'Eigenaar' : 'Lid'}
              </span>
              {isOwner && member.role !== 'owner' && (
                <button
                  className="mn-remove-btn"
                  title="Verwijderen"
                  onClick={() => handleRemove(member.id)}
                >
                  <TrashIcon />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Domain-join banner */}
      {domain && (
        <div className="mn-domain-banner">
          <div className="mn-domain-banner-icon"><DomainIcon /></div>
          <div>
            <p className="mn-domain-banner-title">
              Auto domain-join actief voor @{domain}
            </p>
            <p className="mn-domain-banner-sub">
              Nieuwe gebruikers met dit domein sluiten automatisch aan.
            </p>
          </div>
        </div>
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

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

function DomainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5"
        stroke="currentColor" strokeWidth="1.2"/>
      <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="2.5" y1="5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.2" opacity=".5"/>
      <line x1="2.5" y1="11" x2="13.5" y2="11" stroke="currentColor" strokeWidth="1.2" opacity=".5"/>
    </svg>
  );
}