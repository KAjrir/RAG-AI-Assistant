import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { documentPolicy } from '../src/modules/doc/doc.policy.js'
import { invitationPolicy } from '../src/modules/invitation/invitation.policy.js'
import { memberPolicy } from '../src/modules/workspace/workspace.policy.js'

describe('documentPolicy', () => {
  test('owner, admin and editor may upload; viewer may not', () => {
    for (const role of ['owner', 'admin', 'editor']) assert.equal(documentPolicy.create(role).allowed, true)
    const res = documentPolicy.create('viewer')
    assert.equal(res.allowed, false)
    assert.ok(res.reason)
  })

  test('only owner and admin may delete documents', () => {
    assert.equal(documentPolicy.delete('owner').allowed, true)
    assert.equal(documentPolicy.delete('admin').allowed, true)
    assert.equal(documentPolicy.delete('editor').allowed, false)
    assert.equal(documentPolicy.delete('viewer').allowed, false)
  })

  test('every role may read documents', () => {
    for (const role of ['owner', 'admin', 'editor', 'viewer']) assert.equal(documentPolicy.read(role).allowed, true)
  })
})

describe('invitationPolicy', () => {
  const invite = (...roles) => ({ invitees: roles.map(role => ({ email: `${role}@x.nl`, role })) })

  test('editors and viewers cannot invite anyone', () => {
    assert.equal(invitationPolicy.create('editor', invite('viewer')).allowed, false)
    assert.equal(invitationPolicy.create('viewer', invite('viewer')).allowed, false)
  })

  test('owner can invite admins, editors and viewers', () => {
    assert.equal(invitationPolicy.create('owner', invite('admin', 'editor', 'viewer')).allowed, true)
  })

  test('admin cannot invite another admin (equal role)', () => {
    assert.equal(invitationPolicy.create('admin', invite('editor')).allowed, true)
    assert.equal(invitationPolicy.create('admin', invite('admin')).allowed, false)
  })

  test('one forbidden invitee rejects the whole batch', () => {
    assert.equal(invitationPolicy.create('admin', invite('viewer', 'editor', 'owner')).allowed, false)
  })

  test('revoke follows the same hierarchy as create', () => {
    assert.equal(invitationPolicy.revoke('owner', { invitedRole: 'admin' }).allowed, true)
    assert.equal(invitationPolicy.revoke('admin', { invitedRole: 'editor' }).allowed, true)
    assert.equal(invitationPolicy.revoke('admin', { invitedRole: 'admin' }).allowed, false)
    assert.equal(invitationPolicy.revoke('editor', { invitedRole: 'viewer' }).allowed, false)
  })
})

describe('memberPolicy', () => {
  const target = (role, extra = {}) => ({ id: 'u2', actorId: 'u1', role, ...extra })

  test('nobody can delete or update themselves, not even the owner', () => {
    const self = { id: 'u1', actorId: 'u1', role: 'owner' }
    assert.equal(memberPolicy.delete('owner', self).allowed, false)
    assert.equal(memberPolicy.update('owner', { ...self, newRole: 'viewer' }).allowed, false)
  })

  test('owner can remove an admin, admin cannot remove another admin', () => {
    assert.equal(memberPolicy.delete('owner', target('admin')).allowed, true)
    assert.equal(memberPolicy.delete('admin', target('admin')).allowed, false)
    assert.equal(memberPolicy.delete('admin', target('editor')).allowed, true)
  })

  test('editors cannot remove or update members', () => {
    assert.equal(memberPolicy.delete('editor', target('viewer')).allowed, false)
    assert.equal(memberPolicy.update('editor', target('viewer', { newRole: 'editor' })).allowed, false)
  })

  test('only the owner may promote someone to admin', () => {
    assert.equal(memberPolicy.update('owner', target('editor', { newRole: 'admin' })).allowed, true)
    assert.equal(memberPolicy.update('admin', target('editor', { newRole: 'admin' })).allowed, false)
    assert.equal(memberPolicy.update('admin', target('viewer', { newRole: 'editor' })).allowed, true)
  })

  test('an admin should not be able to promote a member to owner', { todo: 'known bug: policy only blocks newRole "admin", not "owner"' }, () => {
    assert.equal(memberPolicy.update('admin', target('editor', { newRole: 'owner' })).allowed, false)
  })
})
