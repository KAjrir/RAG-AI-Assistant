import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLE_HIERARCHY, ROLE_LABELS } from '../../lib/permissions.js';
import { BASE_URL } from '../../lib/api.js';
import { getErrorMessage } from '../../lib/utils.js';
import '../../styles/mensen.css';

export default function Mensen() {
  const { user } = useAuth();
  const toast    = useToast();
  const {
    workspace, members, invitations, can,
    inviteMembers, fetchAllInvitations, revokeInvite, updateMember, removeMember,
  } = useWorkspace();

  const [activeTab, setActiveTab]                 = useState('members');
  const [inviteTab, setInviteTab]                 = useState('pending');
  const [allInvites, setAllInvites]               = useState([]);
  const [allLoaded, setAllLoaded]                 = useState(false);
  const [loadingAll, setLoadingAll]               = useState(false);
  const [inviteRows, setInviteRows]               = useState([{ email: '', role: 'editor' }]);
  const [busy, setBusy]                           = useState(false);
  const [revoking, setRevoking]                   = useState(null);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [savingRole, setSavingRole]               = useState(false);
  const [openMenu, setOpenMenu]                   = useState(null);
  const [confirmDelete, setConfirmDelete]         = useState(null);
  const [deleting, setDeleting]                   = useState(false);

  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest('.mn-menu-wrapper')) setOpenMenu(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Escape sluit de verwijder-modal
  useEffect(() => {
    if (!confirmDelete) return;
    function onKey(e) {
      if (e.key === 'Escape' && !deleting) setConfirmDelete(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete, deleting]);

  function canManageMember(member) {
    if (member.id === user.id) return false;
    if (!can('members', 'update') && !can('members', 'delete')) return false;
    return ROLE_HIERARCHY[workspace?.role] > ROLE_HIERARCHY[member.role];
  }

  const assignableRoles = Object.keys(ROLE_HIERARCHY).filter(r =>
    r !== 'owner' &&
    ROLE_HIERARCHY[workspace?.role] > ROLE_HIERARCHY[r]
  );

  // ── Uitnodigingen ────────────────────────

  async function handleTabChange(tab) {
    setInviteTab(tab);
    if (tab !== 'all' || allLoaded) return;

    setLoadingAll(true);
    try {
      setAllInvites(await fetchAllInvitations());
      setAllLoaded(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Uitnodigingen ophalen is mislukt.'));
    } finally {
      setLoadingAll(false);
    }
  }

  function updateRow(index, field, value) {
    setInviteRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ));
  }

  function addRow() {
    setInviteRows(prev => [...prev, { email: '', role: 'editor' }]);
  }

  function removeRow(index) {
    setInviteRows(prev => prev.filter((_, i) => i !== index));
  }

  async function handleInvite(e) {
    e.preventDefault();
    const valid = inviteRows.filter(r => r.email.trim());
    if (!valid.length) return;

    setBusy(true);
    try {
      await inviteMembers(valid);
      setInviteRows([{ email: '', role: 'editor' }]);
      setAllLoaded(false); // "Alles" opnieuw ophalen bij volgende keer openen
      toast.success(
        valid.length === 1
          ? `Uitnodiging verstuurd naar ${valid[0].email.trim()}.`
          : `${valid.length} uitnodigingen verstuurd.`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Uitnodigen is mislukt.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(invite) {
    setRevoking(invite.id);
    try {
      await revokeInvite(invite.id);
      setAllInvites(prev =>
        prev.map(i => i.id === invite.id ? { ...i, status: 'revoked' } : i)
      );
      toast.success(`Uitnodiging voor ${invite.email} ingetrokken.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Intrekken is mislukt.'));
    } finally {
      setRevoking(null);
    }
  }

  // ── Leden ────────────────────────────────

  function handleRemove(member) {
    setOpenMenu(null);
    setConfirmDelete({ id: member.id, name: member.name });
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await removeMember(confirmDelete.id);
      toast.success(`${confirmDelete.name} is uit de workspace verwijderd.`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lid verwijderen is mislukt.'));
    } finally {
      setDeleting(false);
    }
  }

  function handleRoleSelect(member, newRole) {
    setOpenMenu(null);
    setPendingRoleChange({ memberId: member.id, name: member.name, newRole });
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return;
    const { memberId, name, newRole } = pendingRoleChange;

    setSavingRole(true);
    try {
      await updateMember(memberId, newRole);
      toast.success(`${name} is nu ${ROLE_LABELS[newRole] ?? newRole}.`);
      setPendingRoleChange(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Rol wijzigen is mislukt.'));
    } finally {
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
    pending:  'mn-badge--pending',
    accepted: 'mn-badge--accepted',
    expired:  'mn-badge--expired',
    revoked:  'mn-badge--revoked',
  };

  return (
    <div className="mn-root">
      <header className="mn-header">
        <div>
          <h1 className="mn-title">Mensen</h1>
          <p className="mn-slug">Beheer teamleden en uitnodigingen</p>
        </div>
      </header>

      {/* Uitnodigingsbox */}
      {can('invitations', 'create') && (
        <div className="mn-invite-box">
          <div className="mn-invite-box-header">
            <div>
              <p className="mn-invite-title">Teamleden uitnodigen</p>
              <p className="mn-invite-sub">
                Voeg nieuwe leden toe door hun e-mailadres en rol in te vullen.
              </p>
            </div>
          </div>

          <form onSubmit={handleInvite}>
            <div className="mn-invite-grid-header">
              <span>E-mailadres</span>
              <span>Rol</span>
            </div>

            {inviteRows.map((row, i) => (
              <div key={i} className="mn-invite-row">
                <input
                  className="mn-input"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={row.email}
                  onChange={e => updateRow(i, 'email', e.target.value)}
                  required={i === 0}
                />
                <div className="mn-role-select-wrapper">
                  <select
                    className="mn-role-select"
                    value={row.role}
                    onChange={e => updateRow(i, 'role', e.target.value)}
                  >
                    {assignableRoles.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
                {inviteRows.length > 1 && (
                  <button
                    type="button"
                    className="mn-icon-btn mn-icon-btn--remove"
                    onClick={() => removeRow(i)}
                    title="Rij verwijderen"
                  >
                    <CrossIcon />
                  </button>
                )}
              </div>
            ))}

            <div className="mn-invite-footer">
              <button type="button" className="mn-btn-add-more" onClick={addRow}>
                <PlusIcon /> Meer toevoegen
              </button>
              <div className="mn-invite-actions">
                <button type="submit" className="mn-btn-primary" disabled={busy}>
                  {busy ? 'Versturen…' : 'Versturen'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="mn-tabs-bar">
        <button
          className={`mn-tab ${activeTab === 'members' ? 'mn-tab--active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Teamleden
          <span className="mn-tab-count mn-tab-count--neutral">{members.length}</span>
        </button>
        {can('invitations', 'read') && (
          <button
            className={`mn-tab ${activeTab === 'invitations' ? 'mn-tab--active' : ''}`}
            onClick={() => setActiveTab('invitations')}
          >
            Uitnodigingen
            {invitations.length > 0 && (
              <span className="mn-tab-count">{invitations.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Teamleden tab */}
      {activeTab === 'members' && (
        <div className="mn-table">
          <div className="mn-table-header">
            <span>Naam</span>
            <span>Rol</span>
            <span></span>
          </div>
          <ul className="mn-list">
            {members.map(member => {
              const initials         = member.name?.split(' ').map(w => w[0]).join('').toUpperCase() ?? '?';
              const hasPendingChange = pendingRoleChange?.memberId === member.id;
              const canManage        = canManageMember(member);

              return (
                <li key={member.id} className="mn-item">
                  <div className="mn-item-user">
                    <div className="mn-avatar">
                      {member.profile_picture_resource_url ? (
                        <img
                          src={`${BASE_URL}${member.profile_picture_resource_url}`}
                          alt={member.name}
                          className="mn-avatar-img"
                        />
                      ) : initials}
                    </div>
                    <div className="mn-info">
                      <span className="mn-name">
                        {member.name}
                        {member.id === user.id && <span className="mn-you">jij</span>}
                      </span>
                      <span className="mn-meta">{member.email}</span>
                    </div>
                  </div>

                  <div className="mn-item-role">
                    {hasPendingChange ? (
                      <div className="mn-confirm-change">
                        <span className="mn-confirm-text">
                          Wijzigen naar <strong>{ROLE_LABELS[pendingRoleChange.newRole]}</strong>?
                        </span>
                        <button
                          className="mn-confirm-btn mn-confirm-btn--yes"
                          onClick={confirmRoleChange}
                          disabled={savingRole}
                        >
                          <CheckIcon /> {savingRole ? '…' : 'Ja'}
                        </button>
                        <button
                          className="mn-confirm-btn mn-confirm-btn--no"
                          onClick={() => setPendingRoleChange(null)}
                          disabled={savingRole}
                        >
                          Nee
                        </button>
                      </div>
                    ) : (
                      <span className={`mn-badge mn-badge--${member.role}`}>
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    )}
                  </div>

                  <div className="mn-item-actions">
                    {canManage && !hasPendingChange && (
                      <div className="mn-menu-wrapper">
                        <button
                          className="mn-icon-btn"
                          onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                          aria-label={`Acties voor ${member.name}`}
                        >
                          <DotsIcon />
                        </button>
                        {openMenu === member.id && (
                          <div className="mn-menu">
                            {can('members', 'update') && (
                              <>
                                <p className="mn-menu-label">Rol wijzigen</p>
                                {assignableRoles
                                  .filter(r => r !== member.role)
                                  .map(r => (
                                    <button
                                      key={r}
                                      className="mn-menu-item"
                                      onClick={() => handleRoleSelect(member, r)}
                                    >
                                      <span className={`mn-menu-dot mn-menu-dot--${r}`} />
                                      {ROLE_LABELS[r]}
                                    </button>
                                  ))
                                }
                                <div className="mn-menu-divider" />
                              </>
                            )}
                            {can('members', 'delete') && (
                              <button
                                className="mn-menu-item mn-menu-item--danger"
                                onClick={() => handleRemove(member)}
                              >
                                <TrashIcon /> Verwijderen
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Uitnodigingen tab */}
      {activeTab === 'invitations' && can('invitations', 'read') && (
        <div className="mn-table">
          <div className="mn-invites-sub-tabs">
            <button
              className={`mn-sub-tab ${inviteTab === 'pending' ? 'mn-sub-tab--active' : ''}`}
              onClick={() => handleTabChange('pending')}
            >
              Openstaand
              {invitations.length > 0 && <span className="mn-tab-count">{invitations.length}</span>}
            </button>
            <button
              className={`mn-sub-tab ${inviteTab === 'all' ? 'mn-sub-tab--active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              Alles
            </button>
          </div>

          {inviteTab === 'pending' && (
            invitations.length === 0 ? (
              <p className="mn-empty">Geen openstaande uitnodigingen.</p>
            ) : (
              <ul className="mn-list">
                {invitations.map(invite => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    meta={`Verloopt ${new Date(invite.expires_at).toLocaleDateString('nl-NL')}`}
                    badgeClass="mn-badge--pending"
                    badgeLabel="Wacht op acceptatie"
                    canRevoke={can('invitations', 'revoke')}
                    revoking={revoking === invite.id}
                    onRevoke={() => handleRevoke(invite)}
                  />
                ))}
              </ul>
            )
          )}

          {inviteTab === 'all' && (
            loadingAll ? <p className="mn-empty">Laden…</p> :
            allInvites.length === 0 ? <p className="mn-empty">Geen uitnodigingen gevonden.</p> : (
              <ul className="mn-list">
                {allInvites.map(invite => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    meta={new Date(invite.created_at).toLocaleDateString('nl-NL')}
                    badgeClass={statusClass[invite.status] ?? ''}
                    badgeLabel={statusLabel[invite.status] ?? invite.status}
                    canRevoke={invite.status === 'pending' && can('invitations', 'revoke')}
                    revoking={revoking === invite.id}
                    onRevoke={() => handleRevoke(invite)}
                  />
                ))}
              </ul>
            )
          )}
        </div>
      )}

      {/* Verwijder modal */}
      {confirmDelete && (
        <>
          <div className="mn-modal-backdrop" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="mn-modal" role="dialog" aria-modal="true" aria-labelledby="mn-delete-title">
            <div className="mn-modal-icon">
              <TrashIcon />
            </div>
            <div className="mn-modal-body">
              <h2 className="mn-modal-title" id="mn-delete-title">Lid verwijderen</h2>
              <p className="mn-modal-desc">
                Weet je zeker dat je <strong>{confirmDelete.name}</strong> wilt verwijderen uit deze workspace? Dit kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <div className="mn-modal-footer">
              <button
                className="mn-btn-secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Annuleren
              </button>
              <button className="mn-btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Verwijderen…' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InviteRow({ invite, meta, badgeClass, badgeLabel, canRevoke, revoking, onRevoke }) {
  return (
    <li className="mn-item">
      <div className="mn-item-user">
        <div className="mn-avatar mn-avatar--invite"><MailIcon /></div>
        <div className="mn-info">
          <span className="mn-name">{invite.email}</span>
          <span className="mn-meta">
            Uitgenodigd als {ROLE_LABELS[invite.role] ?? invite.role} · {meta}
          </span>
        </div>
      </div>
      <div className="mn-item-role">
        <span className={`mn-badge ${badgeClass}`}>{badgeLabel}</span>
      </div>
      <div className="mn-item-actions">
        {canRevoke && (
          <button
            className="mn-icon-btn mn-icon-btn--danger"
            title="Intrekken"
            onClick={onRevoke}
            disabled={revoking}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </li>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
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

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
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