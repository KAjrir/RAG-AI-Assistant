import { test, describe, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { cache } from '../src/cache.js'

// cache.js only exports a singleton; reset it between tests
afterEach(() => { cache.cache.clear(); cache.size = 0; mock.timers.reset() })

describe('Cache', () => {
  test('returns a stored value and null for unknown keys', () => {
    cache.set('chat:1', 'hello')
    assert.equal(cache.get('chat:1'), 'hello')
    assert.equal(cache.get('missing'), null)
  })

  test('tracks size in UTF-8 bytes', () => {
    cache.set('a', 'abc')
    cache.set('b', 'é') // 2 bytes
    assert.equal(cache.size, 5)
  })

  test('expired entries return null and are removed on read', () => {
    mock.timers.enable({ apis: ['Date'], now: 0 })
    cache.set('k', 'value', 1000)
    mock.timers.tick(1001)
    assert.equal(cache.get('k'), null)
    assert.equal(cache.cache.has('k'), false)
    assert.equal(cache.size, 0)
  })

  test('cleanUp removes only expired entries and reports how many', () => {
    mock.timers.enable({ apis: ['Date'], now: 0 })
    cache.set('short', 'x', 100)
    cache.set('long', 'y', 10_000)
    mock.timers.tick(500)
    assert.equal(cache.cleanUp(), 1)
    assert.equal(cache.get('long'), 'y')
  })

  test('delete without a size argument keeps size consistent', { todo: 'known bug: chat.controller calls cache.delete(key) without size, which makes size NaN' }, () => {
    cache.set('k', 'abc')
    cache.delete('k')
    assert.equal(cache.size, 0)
  })

  test('overwriting a key does not double-count its size', { todo: 'known bug: set() adds the new size without subtracting the old one' }, () => {
    cache.set('k', 'abc')
    cache.set('k', 'abc')
    assert.equal(cache.size, 3)
  })
})
