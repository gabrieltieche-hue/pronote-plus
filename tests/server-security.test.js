import assert from 'node:assert/strict'
import { once } from 'node:events'
import http from 'node:http'
import test from 'node:test'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-abcdefghijklmnopqrstuvwxyz'
process.env.ENCRYPTION_KEY = 'test-encryption-key-abcdefghijklmnopqrstuvwxyz'

const { default: app, __test } = await import('../server/index.js')

async function withServer(fn) {
  const server = http.createServer(app)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address()
  try {
    await fn(`http://127.0.0.1:${port}`)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

test('health endpoint returns status metadata', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/health`)
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.status, 'ok')
    assert.equal(body.version, '0.3.2')
  })
})

test('login rejects local/private Pronote URLs before contacting Pawnote', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'http://127.0.0.1:1',
        username: 'demo',
        password: 'demo',
        kind: 'student',
      }),
    })
    const body = await res.json()

    assert.equal(res.status, 400)
    assert.match(body.error, /URL Pronote invalide/)
  })
})

test('server encrypts stored Pronote passwords with AES-GCM payloads', () => {
  const secret = 'not-a-real-pronote-password'
  const encrypted = __test.encryptSecret(secret)

  assert.notEqual(encrypted.data, secret)
  assert.notEqual(JSON.stringify(encrypted), secret)
  assert.equal(__test.decryptSecret(encrypted), secret)
})

test('auth session cache stores encrypted passwords, not plaintext passwords', () => {
  const sid = __test.createAuthSession({
    url: 'https://demo.index-education.net/pronote',
    username: 'demo-user',
    password: 'demo-password',
    kind: 'student',
  }, { id: 'student-1' })

  const raw = __test.authSessions.get(sid)
  const hydrated = __test.getAuthSession(sid)

  assert.ok(raw.encryptedPassword)
  assert.equal(raw.password, undefined)
  assert.notEqual(JSON.stringify(raw), 'demo-password')
  assert.equal(hydrated.password, 'demo-password')
})
