import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App.jsx'
import { geocodeCity } from './api/geocode.js'
import { fetchWeatherByCoords } from './api/weather.js'
import { fetchForecast } from './api/forecast.js'

vi.mock('./api/geocode.js', () => ({
  geocodeCity: vi.fn(),
}))
vi.mock('./api/weather.js', () => ({
  fetchWeatherByCoords: vi.fn(),
}))
vi.mock('./api/forecast.js', () => ({
  fetchForecast: vi.fn(),
}))

const fullWeather = {
  city: 'London',
  country: 'GB',
  temp: 16,
  feelsLike: 14,
  description: 'scattered clouds',
  humidity: 72,
  windSpeed: 4.1,
  icon: '01d',
  iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
}

const searchFor = (city) => {
  fireEvent.change(screen.getByLabelText('City name'), {
    target: { value: city },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Search' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  fetchForecast.mockResolvedValue([])
})

describe('App loading and error screens', () => {
  it('shows loading while the weather request is pending', async () => {
    geocodeCity.mockResolvedValue([
      { name: 'London', state: null, country: 'GB', lat: 1, lon: 2 },
    ])
    fetchWeatherByCoords.mockReturnValue(new Promise(() => {}))

    render(<App />)
    searchFor('London')

    expect(await screen.findByRole('status')).toHaveTextContent('Loading...')
  })

  it('shows the error screen when geocoding fails', async () => {
    geocodeCity.mockRejectedValue(new Error('Network error — check your connection'))

    render(<App />)
    searchFor('Nowhere')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network error — check your connection',
    )
  })

  it('shows a not-found error when no cities match', async () => {
    geocodeCity.mockResolvedValue([])

    render(<App />)
    searchFor('Xyzabc')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No results found for "Xyzabc"',
    )
  })

  it('shows the error screen when the weather request fails', async () => {
    geocodeCity.mockResolvedValue([
      { name: 'London', state: null, country: 'GB', lat: 1, lon: 2 },
    ])
    fetchWeatherByCoords.mockRejectedValue(new Error('Failed to fetch weather data'))

    render(<App />)
    searchFor('London')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to fetch weather data',
    )
  })

  it('replaces loading with weather details on success', async () => {
    geocodeCity.mockResolvedValue([
      { name: 'London', state: null, country: 'GB', lat: 1, lon: 2 },
    ])
    fetchWeatherByCoords.mockResolvedValue(fullWeather)

    render(<App />)
    searchFor('London')

    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('saves successful searches to local storage', async () => {
    geocodeCity.mockResolvedValue([
      { name: 'London', state: null, country: 'GB', lat: 1, lon: 2 },
    ])
    fetchWeatherByCoords.mockResolvedValue(fullWeather)

    render(<App />)
    searchFor('London')
    await screen.findByRole('heading', { name: 'London, GB' })

    const stored = JSON.parse(localStorage.getItem('weather-app-recent-searches'))
    expect(stored[0]).toMatchObject({ name: 'London', country: 'GB', lat: 1, lon: 2 })
  })

  it('restores recent searches on mount and reloads when a chip is clicked', async () => {
    localStorage.setItem(
      'weather-app-recent-searches',
      JSON.stringify([{ name: 'Paris', state: null, country: 'FR', lat: 48.85, lon: 2.35 }]),
    )
    fetchWeatherByCoords.mockResolvedValue({ ...fullWeather, city: 'Paris', country: 'FR' })

    render(<App />)

    const chip = screen.getByRole('button', { name: 'Paris, FR' })
    fireEvent.click(chip)

    expect(fetchWeatherByCoords).toHaveBeenCalledWith(48.85, 2.35)
    expect(await screen.findByRole('heading', { name: 'Paris, FR' })).toBeInTheDocument()
  })

  it('toggles between light and dark mode and persists the choice', () => {
    render(<App />)
    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' })
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(toggle)

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('weather-app-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('restores a stored theme on mount', () => {
    localStorage.setItem('weather-app-theme', 'dark')

    render(<App />)

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
