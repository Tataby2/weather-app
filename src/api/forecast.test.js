import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchForecast } from './forecast.js'

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
})

const makeItem = (dayOffset, hour, temp) => ({
  dt: Date.UTC(2026, 9, 7 + dayOffset, hour) / 1000,
  main: { temp, temp_min: temp - 2, temp_max: temp + 2 },
  weather: [{ description: 'light rain', icon: '10d' }],
})

const sampleBody = {
  city: { timezone: 0 },
  list: [
    makeItem(0, 6, 10),
    makeItem(0, 12, 14),
    makeItem(0, 18, 12),
    makeItem(1, 12, 15),
    makeItem(2, 12, 16),
    makeItem(3, 12, 17),
    makeItem(4, 12, 18),
    makeItem(5, 12, 19),
  ],
}

beforeEach(() => {
  vi.stubEnv('VITE_OWM_API_KEY', 'test-key-123')
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('fetchForecast', () => {
  it('groups 3-hour readings into at most 5 daily summaries', async () => {
    fetch.mockResolvedValue(jsonResponse(sampleBody))

    const days = await fetchForecast(48.85, 2.35)

    expect(days).toHaveLength(5)
    expect(days[0]).toMatchObject({
      date: '2026-10-07',
      day: 'Wed',
      tempMin: 8,
      tempMax: 16,
      description: 'light rain',
      icon: '10d',
    })
    expect(days[4].date).toBe('2026-10-11')
  })

  it('uses the city timezone when grouping days', async () => {
    const body = {
      city: { timezone: 3600 * 10 },
      list: [makeItem(0, 15, 11), makeItem(1, 15, 13)],
    }
    fetch.mockResolvedValue(jsonResponse(body))

    const days = await fetchForecast(1, 2)

    expect(days).toHaveLength(2)
    expect(days[0].date).toBe('2026-10-08')
    expect(days[1].date).toBe('2026-10-09')
  })

  it('throws network error when fetch rejects', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchForecast(1, 2)).rejects.toThrow('Network error')
  })
})
