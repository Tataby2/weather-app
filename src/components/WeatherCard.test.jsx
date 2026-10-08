import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import WeatherCard from './WeatherCard.jsx'

const baseProps = {
  query: '',
  onQueryChange: vi.fn(),
  suggestions: [],
  onSelectSuggestion: vi.fn(),
  onClearSuggestions: vi.fn(),
  onSearch: vi.fn(),
  onUseLocation: vi.fn(),
  status: 'idle',
  error: null,
  matches: [],
  onSelectMatch: vi.fn(),
  weather: null,
}

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

const renderCard = (overrides = {}) =>
  render(<WeatherCard {...baseProps} {...overrides} />)

describe('WeatherCard screens', () => {
  it('shows the idle hint before any search', () => {
    renderCard()
    expect(
      screen.getByText('Search for a city to see the weather.'),
    ).toBeInTheDocument()
  })

  it('shows the loading screen while status is loading', () => {
    renderCard({ status: 'loading' })
    expect(screen.getByRole('status')).toHaveTextContent('Loading...')
  })

  it('shows the error message on the error screen', () => {
    renderCard({ status: 'error', error: 'City "Xyz" not found' })
    expect(screen.getByRole('alert')).toHaveTextContent('City "Xyz" not found')
  })

  it('shows selection buttons for ambiguous cities', () => {
    const matches = [
      { name: 'Springfield', state: 'Illinois', country: 'US', lat: 1, lon: 2 },
      { name: 'Springfield', state: null, country: 'GB', lat: 3, lon: 4 },
    ]
    const onSelectMatch = vi.fn()

    renderCard({ status: 'selecting', matches, onSelectMatch })

    const btn = screen.getByRole('button', { name: /Springfield, Illinois/ })
    fireEvent.click(btn)
    expect(onSelectMatch).toHaveBeenCalledWith(matches[0])
    expect(screen.getByRole('button', { name: /Springfield \(GB\)/ })).toBeInTheDocument()
  })

  it('shows full weather details on success', () => {
    renderCard({ status: 'success', weather: fullWeather })

    expect(screen.getByRole('heading', { name: 'London, GB' })).toBeInTheDocument()
    expect(screen.getByText('16°C')).toBeInTheDocument()
    expect(screen.getByText('scattered clouds')).toBeInTheDocument()
    expect(screen.getByText('14°C')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('4.1 m/s')).toBeInTheDocument()
  })

  it('converts to Fahrenheit when the unit button is clicked', () => {
    renderCard({ status: 'success', weather: fullWeather })

    fireEvent.click(screen.getByRole('button', { name: 'Switch temperature unit' }))

    expect(screen.getByText('61°F')).toBeInTheDocument()
    expect(screen.getByText('57°F')).toBeInTheDocument()
  })

  it('calls onQueryChange while typing and onSearch on submit', () => {
    const onQueryChange = vi.fn()
    const onSearch = vi.fn()
    const { rerender } = renderCard({ query: '', onQueryChange, onSearch })

    fireEvent.change(screen.getByLabelText('City name'), {
      target: { value: 'Paris' },
    })
    expect(onQueryChange).toHaveBeenCalledWith('Paris')

    rerender(
      <WeatherCard
        {...baseProps}
        query="Paris"
        onQueryChange={onQueryChange}
        onSearch={onSearch}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSearch).toHaveBeenCalledWith('Paris')
  })
})
