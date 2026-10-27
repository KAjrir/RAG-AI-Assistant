import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLANS } from '../src/config/plans.config.js'

const order = ['free', 'starter', 'pro']
const numericLimits = ['storage_mb', 'max_members', 'max_workspaces', 'max_tools', 'max_messages']
const asNumber = (v) => (v === null ? Infinity : v) // null means unlimited

test('every plan defines all limits', () => {
  for (const name of order) {
    for (const key of [...numericLimits, 'allowed_models']) assert.ok(key in PLANS[name], `${name}.${key}`)
  }
})

test('limits never decrease when upgrading free -> starter -> pro', () => {
  for (const key of numericLimits) {
    for (let i = 1; i < order.length; i++) {
      assert.ok(asNumber(PLANS[order[i]][key]) >= asNumber(PLANS[order[i - 1]][key]), `${order[i]}.${key}`)
    }
  }
})

test('each plan includes every model of the cheaper plans', () => {
  for (let i = 1; i < order.length; i++) {
    for (const model of PLANS[order[i - 1]].allowed_models) {
      assert.ok(PLANS[order[i]].allowed_models.includes(model), `${order[i]} missing ${model}`)
    }
  }
})

test('free plan is limited to a single member and workspace', () => {
  assert.equal(PLANS.free.max_members, 1)
  assert.equal(PLANS.free.max_workspaces, 1)
  assert.deepEqual(PLANS.free.allowed_models, ['gpt-4o-mini'])
})
