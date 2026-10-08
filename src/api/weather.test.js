import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWeather } from './weather'

// Helper: build a fake Response object
const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
})

const sampleApiData = {
  name: 'London',
  sys: { country: 'GB' },
  main: { temp: 15.6, feels_like: 14.2, humidity: 72 },
  weather: [{ description: 'scattered clouds', icon: '03d' }],
  wind: { speed: 4.1 },
}

beforeEach(() => {
  vi.stubEnv('VITE_OWM_API_KEY', 'test-key-123')
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('fetchWeather', () => {
  it('returns normalized data on success', async () => {
    fetch.mockResolvedValue(jsonResponse(sampleApiData))

    const result = await fetchWeather('London')

    expect(result).toEqual({
      city: 'London',
      country: 'GB',
      temp: 16,           // 15.6 rounded
      feelsLike: 14,      // 14.2 rounded
      description: 'scattered clouds',
      humidity: 72,
      windSpeed: 4.1,
      icon: '03d',
      iconUrl: 'https://openweathermap.org/img/wn/03d@2x.png',
    })
  })

  it('calls the correct URL with query params', async () => {
    fetch.mockResolvedValue(jsonResponse(sampleApiData))

    await fetchWeather('New York')

    const url = fetch.mock.calls[0][0]
    expect(url).toContain('https://api.openweathermap.org/data/2.5/weather?')
    expect(url).toContain('q=New+York')
    expect(url).toContain('appid=test-key-123')
    expect(url).toContain('units=metric')
  })

  it('throws "City not found" on 404', async () => {
    fetch.mockResolvedValue(jsonResponse({}, 404))

    await expect(fetchWeather('Xyzabc')).rejects.toThrow('City "Xyzabc" not found')
  })

  it('throws "Invalid API key" on 401', async () => {
    fetch.mockResolvedValue(jsonResponse({}, 401))

    await expect(fetchWeather('London')).rejects.toThrow('Invalid API key')
  })

  it('throws generic error on other HTTP errors', async () => {
    fetch.mockResolvedValue(jsonResponse({}, 500))

    await expect(fetchWeather('London')).rejects.toThrow('Failed to fetch weather data')
  })

  it('throws network error when fetch rejects', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchWeather('London')).rejects.toThrow('Network error')
  })

  it('throws when API key is missing', async () => {
    vi.stubEnv('VITE_OWM_API_KEY', '')

    await expect(fetchWeather('London')).rejects.toThrow('Missing VITE_OWM_API_KEY')
  })
})