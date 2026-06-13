import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('GET /api/v1/health', () => {
  it('returns 200 with ok status', async () => {
    const app = createApp()

    const response = await request(app).get('/api/v1/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.message).toBe('FairShare API is running')
  })
})
