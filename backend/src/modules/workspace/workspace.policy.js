import { ROLE_HIERARCHY } from '../../config/permissions.js'

export const memberPolicy = {
  delete: (role, resource) => {
    if (resource.actorId === resource.id) {
      return { allowed: false, reason: 'Je kunt jezelf niet verwijderen' }
    }

    if (!['owner', 'admin'].includes(role)) {
      return { allowed: false, reason: 'Geen rechten om members te verwijderen' }
    }

    if (ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[resource.role]) {
      return { allowed: false, reason: `Een ${role} kan geen ${resource.role} verwijderen` }
    }

    return { allowed: true }
  },

  update: (role, resource) => {
    if (resource.actorId === resource.id) {
      return { allowed: false, reason: 'Je kunt jezelf niet aanpassen' }
    }

    if (!['owner', 'admin'].includes(role)) {
      return { allowed: false, reason: 'Geen rechten om members aan te passen' }
    }

    // Alleen owner mag admin- of owner-rol toewijzen
    if (['admin', 'owner'].includes(resource.newRole) && role !== 'owner') {
      return { allowed: false, reason: 'Alleen de owner mag admins of owners aanwijzen' }
    }

    // Hiërarchie check
    if (ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[resource.role]) {
      return { allowed: false, reason: `Een ${role} kan geen ${resource.role} aanpassen` }
    }

    return { allowed: true }
  },

}