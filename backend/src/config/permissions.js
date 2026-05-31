export const ROLE_HIERARCHY = {
    owner:  4,
    admin:  3,
    editor: 2,
    viewer: 1,
}


export const PERMISSIONS = {
  owner: {
    connections: { read: true,  connect: true, toggle: true, delete: true  },
    documents:   { read: true,  create: true,               delete: true  },
    members:     { read: true,  update: true,               delete: true  },
    invitations: { read: true,  create: true,               revoke: true  },
    workspace:   { read: true,  update: true,               delete: true  },
  },
  admin: {
    connections: { read: true,  connect: false, toggle: false, delete: false },
    documents:   { read: true,  create: true,                 delete: true  },
    members:     { read: true,  update: true,                 delete: true  },
    invitations: { read: true,  create: true,                 revoke: true  },
    workspace:   { read: true,  update: true,                 delete: false },
  },
  editor: {
    connections: { read: true,  connect: false, toggle: false, delete: false },
    documents:   { read: true,  create: true,                 delete: false },
    members:     { read: true,  update: false,                delete: false },
    invitations: { read: false, create: false,                revoke: false },
    workspace:   { read: true,  update: false,                delete: false },
  },
  viewer: {
    connections: { read: true,  connect: false, toggle: false, delete: false },
    documents:   { read: true,  create: false,                delete: false },
    members:     { read: true,  update: false,                delete: false },
    invitations: { read: false, create: false,                revoke: false },
    workspace:   { read: true,  update: false,                delete: false },
  },
}

const ROLE_LABELS = {
  owner:  'Eigenaar',
  admin:  'Beheerder',
  editor: 'Editor',
  viewer: 'Kijker',
}