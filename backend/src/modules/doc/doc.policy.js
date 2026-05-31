export const documentPolicy = {

  create: (role) => {
    if (['owner', 'admin', 'editor'].includes(role)) {
      return { allowed: true }
    }

    return { allowed: false, reason: 'Viewers mogen geen documenten uploaden' }
  },

  read: (role) => {
    return { allowed: true }
  },

  delete: (role) => {
    if (['owner', 'admin'].includes(role)) {
      return { allowed: true }
    }

    return { allowed: false, reason: 'Alleen admins en owners mogen documenten verwijderen' }
  },

}