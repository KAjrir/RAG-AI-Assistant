import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ROLE_HIERARCHY, PERMISSIONS } from '../src/config/permissions.js'

const ROLES = ['owner', 'admin', 'editor', 'viewer']

describe('ROLE_HIERARCHY', () => {
  test('ranks roles owner > admin > editor > viewer', () => {
    const ranks = ROLES.map(r => ROLE_HIERARCHY[r])
    assert.deepEqual(ranks, [...ranks].sort((a, b) => b - a))
    assert.equal(new Set(ranks).size, ROLES.length)
  })
})

describe('PERMISSIONS matrix', () => {
  test('every role defines the same resources and actions', () => {
    const shape = (role) => Object.fromEntries(
      Object.entries(PERMISSIONS[role]).map(([res, acts]) => [res, Object.keys(acts).sort()])
    )
    for (const role of ROLES) assert.deepEqual(shape(role), shape('owner'), role)
  })

  test('owner is allowed every action on every resource', () => {
    for (const actions of Object.values(PERMISSIONS.owner)) {
      for (const allowed of Object.values(actions)) assert.equal(allowed, true)
    }
  })

  test('a higher role never has fewer permissions than a lower role', () => {
    for (let i = 0; i < ROLES.length - 1; i++) {
      const higher = PERMISSIONS[ROLES[i]], lower = PERMISSIONS[ROLES[i + 1]]
      for (const [res, actions] of Object.entries(lower)) {
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed) assert.equal(higher[res][action], true, `${ROLES[i]} ${res}.${action}`)
        }
      }
    }
  })

  test('only the owner can manage connections or delete the workspace', () => {
    for (const role of ['admin', 'editor', 'viewer']) {
      assert.equal(PERMISSIONS[role].connections.connect, false)
      assert.equal(PERMISSIONS[role].workspace.delete, false)
    }
  })

  test('viewers are read-only on documents and cannot see invitations', () => {
    assert.equal(PERMISSIONS.viewer.documents.read, true)
    assert.equal(PERMISSIONS.viewer.documents.create, false)
    assert.equal(PERMISSIONS.viewer.invitations.read, false)
  })
})
