import { useState } from 'react';
import { useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api, BASE_URL } from '../../lib/api.js';
import '../../styles/mensen.css';

export default function Mensen() {
  const { slug } = useParams();
  const {
    members, invitations, currentMember,
    inviteMember, revokeInvite, updateMember, removeMember
  } = useWorkspace();

  const isAdmin = ['admin', 'owner'].includes(currentMember?.role);
  const isOwner = currentMember?.role === 'owner';

  const [showInvite, setShowInvite]           = useState(false);
  const [inviteTab, setInviteTab]             = useState('pending');
  const [allInvites, setAllInvites]           = useState([]);
  const [loadingAll, setLoadingAll]           = useState(false);
  const [email, setEmail]                     = useState('');
  const [role, setRole]                       = useState('member');
  const [busy, setBusy]                       = useState(false);
  const [error, setError]                     = useState(null);
  const [success, setSuccess]                 = useState(false);
  const [revoking, setRevoking]               = useState(null);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [savingRole, setSavingRole]           = useState(false);

  async function handleTabChange(tab) {
    setInviteTab(tab);
    if (tab === 'all' && allInvites.length === 0) {
      setLoadingAll(true);
      try {
        const res = await api.get(`/invitations/${slug}/workspace/pending?all=true`);
        setAllInvites(res.data.invites ?? []);
      } catch {}
      finally { setLoadingAll(false); }
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      await inviteMember(email, role);
      setEmail('');
      setRole('member');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(inviteId) {
    setRevoking(inviteId);
    try {
      await revokeInvite(inviteId);
      setAllInvites(prev =>
        prev.map(i => i.id === inviteId ? { ...i, status: 'revoked' } : i)
      );
    } catch {}
    finally { setRevoking(null); }
  }

  async function handleRemove(memberId) {
    if (!confirm('Weet je zeker dat je dit lid wilt verwijderen?')) return;
    await removeMember(memberId);
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return;
    setSavingRole(true);
    try {
      await updateMember(pendingRoleChange.memberId, pendingRoleChange.newRole)
    } catch (err) {
      console.error(err)
    } finally {
      setPendingRoleChange(null);
      setSavingRole(false);
    }
  }

  const statusLabel = {
    pending:  'Wacht op acceptatie',
    accepted: 'Geaccepteerd',
    expired:  'Verlopen',
    revoked:  'Ingetrokken',
  };

  const statusClass = {
    pending:  'mn-role--pending',
    accepted: 'mn-role--accepted',
    expired:  'mn-role--expired',
    revoked:  'mn-role--revoked',
  };

  return (
    <div className="mn-root">
      <header className="mn-header">
        <div>
          <h1 className="mn-title">Mensen</h1>
          <p className="mn-slug">w/{slug} · /mensen</p>
        </div>
        {isAdmin && (
          <button
            className="mn-btn-primary"
            onClick={() => { setShowInvite(v => !v); setError(null); setSuccess(false); }}
          >
            <PlusIcon /> Uitnodigen
          </button>
        )}
      </header>

      {/* Uitnodigingsformulier */}
      {isAdmin && showInvite && (
        <div className="mn-invite-box">
          <p className="mn-invite-title">Teamlid uitnodigen</p>
          <p className="mn-invite-sub">
            De uitgenodigde ontvangt een mail met een link om zich aan te sluiten.
          </p>
          <form className="mn-invite-form" onSubmit={handleInvite}>
            <input
              className="mn-input"
              type="email"
              placeholder="naam@bedrijf.nl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
            />
            {isOwner && (
              <select
                className="mn-input mn-select"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="member">Lid</option>
                <option value="admin">Beheerder</option>
              </select>
            )}
            <button type="submit" className="mn-btn-primary" disabled={busy}>
              {busy ? 'Versturen…' : 'Versturen'}
            </button>
            <button
              type="button"
              className="mn-btn-secondary"
              onClick={() => { setShowInvite(false); setError(null); setSuccess(false); }}
            >
              Sluiten
            </button>
          </form>
          {error   && <p className="mn-error">{error}</p>}
          {success && <p className="mn-success">Uitnodiging verstuurd!</p>}
        </div>
      )}

      {/* Uitnodigingen sectie */}
      {isAdmin && (
        <div className="mn-invites-section">
          <div className="mn-invites-header">
            <p className="mn-section-label" style={{ margin: 0 }}>Uitnodigingen</p>
            <div className="mn-tabs">
              <button
                className={`mn-tab ${inviteTab === 'pending' ? 'mn-tab--active' : ''}`}
                onClick={() => handleTabChange('pending')}
              >
                Openstaand
                {invitations.length > 0 && (
                  <span className="mn-tab-count">{invitations.length}</span>
                )}
              </button>
              <button
                className={`mn-tab ${inviteTab === 'all' ? 'mn-tab--active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                Alles
              </button>
            </div>
          </div>

          {inviteTab === 'pending' && (
            <>
              {invitations.length === 0 ? (
                <p className="mn-empty">Geen openstaande uitnodigingen.</p>
              ) : (
                <ul className="mn-list">
                  {invitations.map(invite => (
                    <li key={invite.id} className="mn-item">
                      <div className="mn-avatar mn-avatar--invite"><MailIcon /></div>
                      <div className="mn-info">
                        <span className="mn-name">{invite.email}</span>
                        <span className="mn-email">
                          Uitgenodigd als {invite.role === 'admin' ? 'Beheerder' : 'Lid'}
                          {' · '}
                          Verloopt {new Date(invite.expires_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                      <span className="mn-role mn-role--pending">Wacht op acceptatie</span>
                      <button
                        className="mn-remove-btn"
                        title="Intrekken"
                        onClick={() => handleRevoke(invite.id)}
                        disabled={revoking === invite.id}
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {inviteTab === 'all' && (
            <>
              {loadingAll ? (
                <p className="mn-empty">Laden…</p>
              ) : allInvites.length === 0 ? (
                <p className="mn-empty">Geen uitnodigingen gevonden.</p>
              ) : (
                <ul className="mn-list">
                  {allInvites.map(invite => (
                    <li key={invite.id} className="mn-item">
                      <div className="mn-avatar mn-avatar--invite"><MailIcon /></div>
                      <div className="mn-info">
                        <span className="mn-name">{invite.email}</span>
                        <span className="mn-email">
                          Uitgenodigd als {invite.role === 'admin' ? 'Beheerder' : 'Lid'}
                          {' · '}
                          {new Date(invite.created_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                      <span className={`mn-role ${statusClass[invite.status] ?? ''}`}>
                        {statusLabel[invite.status] ?? invite.status}
                      </span>
                      {invite.status === 'pending' && (
                        <button
                          className="mn-remove-btn"
                          title="Intrekken"
                          onClick={() => handleRevoke(invite.id)}
                          disabled={revoking === invite.id}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
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

          const roleLabel = member.role === 'owner'
            ? 'Eigenaar'
            : member.role === 'admin'
            ? 'Beheerder'
            : 'Lid';

          const hasPendingChange = pendingRoleChange?.memberId === member.id;

          return (
            <li key={member.id} className="mn-item">
              <div className="mn-avatar">
                {member.profile_picture_resource_url ? (
                  <img
                    src={`${BASE_URL}${member.profile_picture_resource_url}`}
                    alt={member.name}
                    className="mn-avatar-img"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="mn-info">
                <span className="mn-name">{member.name}</span>
                <span className="mn-email">{member.email}</span>
              </div>

              {isOwner && member.role !== 'owner' ? (
                <div className="mn-role-change">
                  <select
                    className="mn-role-select"
                    value={hasPendingChange ? pendingRoleChange.newRole : member.role}
                    onChange={e => setPendingRoleChange({
                      memberId: member.id,
                      newRole: e.target.value,
                      currentRole: member.role,
                    })}
                  >
                    <option value="member">Lid</option>
                    <option value="admin">Beheerder</option>
                  </select>
                  {hasPendingChange && (
                    <div className="mn-role-confirm">
                      <button
                        className="mn-role-confirm-btn mn-role-confirm-btn--yes"
                        onClick={confirmRoleChange}
                        disabled={savingRole}
                        title="Bevestigen"
                      >
                        <CheckIcon />
                      </button>
                      <button
                        className="mn-role-confirm-btn mn-role-confirm-btn--no"
                        onClick={() => setPendingRoleChange(null)}
                        title="Annuleren"
                      >
                        <CrossIcon />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span className={`mn-role mn-role--${member.role}`}>
                  {roleLabel}
                </span>
              )}

              {isAdmin && member.role !== 'owner' && (
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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}