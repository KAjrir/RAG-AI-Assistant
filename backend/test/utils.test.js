import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { toJsonLine, hash, generateOTP, generateRandomToken, getExpirationDate, formatDate, formatTimeForUser, getUuid } from '../src/utils.js'

describe('utils', () => {
  test('toJsonLine produces one parseable NDJSON line', () => {
    const line = toJsonLine({ type: 'token', text: 'hoi\n' })
    assert.ok(line.endsWith('\n'))
    assert.equal(line.split('\n').length, 2)
    assert.deepEqual(JSON.parse(line), { type: 'token', text: 'hoi\n' })
  })

  test('hash is a deterministic sha256 hex digest', () => {
    assert.equal(hash('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    assert.notEqual(hash('abc'), hash('abd'))
  })

  test('generateOTP returns 6 digits', () => {
    for (let i = 0; i < 50; i++) assert.match(generateOTP(), /^\d{6}$/)
  })

  test('generateRandomToken returns 64 hex chars and is unique', () => {
    const a = generateRandomToken(), b = generateRandomToken()
    assert.match(a, /^[0-9a-f]{64}$/)
    assert.notEqual(a, b)
  })

  test('getExpirationDate adds the given number of minutes', () => {
    const before = Date.now()
    const diff = getExpirationDate(15).getTime() - before
    assert.ok(diff >= 15 * 60_000 && diff < 15 * 60_000 + 1000)
  })

  test('formatDate formats as dd-mm-yyyy with zero padding', () => {
    assert.equal(formatDate(new Date(2026, 0, 5)), '05-01-2026')
  })

  test('formatTimeForUser defaults to Amsterdam time and respects user timezone', () => {
    const date = '2026-07-01T12:00:00Z' // summer: Amsterdam is UTC+2
    assert.equal(formatTimeForUser(date), '14:00')
    assert.equal(formatTimeForUser(date, { timezone: 'UTC' }), '12:00')
  })

  test('getUuid returns a v4 UUID', () => {
    assert.match(getUuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})
