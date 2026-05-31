// invitations/invitation.policy.js
import { ROLE_HIERARCHY } from '../../config/permissions.js';

export const invitationPolicy = {

  create: (role, resource) => {
    if (!['owner', 'admin'].includes(role)) {
      return { allowed: false, reason: 'Alleen admins en owners mogen uitnodigen' }
    }

    // Admin mag geen admins uitnodigen
    const hasForbidden = resource.invitees.some(
      invitee => ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[invitee.role]
    )

    if (hasForbidden) {
      return { allowed: false, reason: 'Je kunt geen leden uitnodigen met een hogere of gelijke rol' }
    }

    return { allowed: true }
  },

  revoke: (role, resource) => {
    if (!['owner', 'admin'].includes(role)) {
      return { allowed: false, reason: 'Geen rechten om uitnodigingen in te trekken' }
    }

    // Hiërarchie check op de rol waarvoor uitgenodigd is
    if (ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[resource.invitedRole]) {
      return { allowed: false, reason: `Een ${role} kan geen ${resource.invitedRole} uitnodiging intrekken` }
    }

    return { allowed: true }
  },

}