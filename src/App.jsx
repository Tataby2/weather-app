import { useEffect, useRef, useState } from 'react'
import './App.css'
import WeatherCard from './components/WeatherCard.jsx'
import { geocodeCity } from './api/geocode.js'
import { fetchWeatherByCoords } from './api/weather.js'
import { fetchForecast } from './api/forecast.js'

const RECENTS_KEY = 'weather-app-recent-searches'
const THEME_KEY = 'weather-app-theme'
const MAX_RECENTS = 5

const readRecents = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

const readTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const samePlace = (a, b) =>
  Math.round(a.lat * 10000) === Math.round(b.lat * 10000) &&
  Math.round(a.lon * 10000) === Math.round(b.lon * 10000)

export default function App() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [matches, setMatches] = useState([])
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [recents, setRecents] = useState(readRecents)
  const [theme, setTheme] = useState(readTheme)
  const requestId = useRef(0)
  const suppressedQuery = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents))
  }, [recents])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2 || term === suppressedQuery.current) {
      setSuggestions([])
      return undefined
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(() => geocodeCity(term, { signal: controller.signal }))
        .then((results) => {
          if (!controller.signal.aborted && Array.isArray(results)) {
            setSuggestions(results)
          }
        })
        .catch(() => {})
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const clearSuggestions = () => setSuggestions([])

  const loadWeather = async (location) => {
    requestId.current += 1
    const id = requestId.current

    setStatus('loading')
    setError(null)
    setMatches([])

    try {
      const [current, daily] = await Promise.all([
        fetchWeatherByCoords(location.lat, location.lon),
        fetchForecast(location.lat, location.lon).catch(() => []),
      ])

      if (id !== requestId.current) return

      setWeather(current)
      setForecast(daily)
      setStatus('success')

      const entry = {
        name: location.name || current.city,
        state: location.state ?? null,
        country: location.country || current.country,
        lat: location.lat,
        lon: location.lon,
      }
      setRecents((prev) =>
        [entry, ...prev.filter((recent) => !samePlace(recent, entry))].slice(
          0,
          MAX_RECENTS,
        ),
      )
    } catch (err) {
      if (id !== requestId.current) return

      setWeather(null)
      setForecast([])
      setStatus('error')
      setError(err.message || 'Something went wrong while loading the weather')
    }
  }

  const runSearch = (term = query) => {
    const city = term.trim()
    if (!city) return

    suppressedQuery.current = city
    setSuggestions([])
    setQuery(city)
    setStatus('loading')
    setError(null)
    setMatches([])

    geocodeCity(city)
      .then((results) => {
        if (results.length === 0) {
          setStatus('error')
          setError(`No results found for "${city}"`)
        } else if (results.length === 1) {
          loadWeather(results[0])
        } else {
          setStatus('selecting')
          setMatches(results)
        }
      })
      .catch((err) => {
        setStatus('error')
        setError(err.message || 'Something went wrong while searching')
      })
  }

  const choosePlace = (place) => {
    suppressedQuery.current = place.name ?? ''
    if (place.name) setQuery(place.name)
    setSuggestions([])
    loadWeather(place)
  }

  const useLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Geolocation is not available in this browser')
      return
    }

    setStatus('loading')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        loadWeather({
          name: '',
          state: null,
          country: '',
          lat: latitude,
          lon: longitude,
        })
      },
      () => {
        setStatus('error')
        setError('Unable to determine your current location')
      },
    )
  }

  const toggleTheme = () =>
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  return (
    <main>
      <header className="app-header">
        <h1>Weather</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
          }
        >
          <span className={theme === 'light' ? 'active' : ''} aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </span>
          <span className={theme === 'dark' ? 'active' : ''} aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
        </button>
      </header>

      <WeatherCard
        query={query}
        onQueryChange={setQuery}
        suggestions={suggestions}
        onSelectSuggestion={choosePlace}
        onClearSuggestions={clearSuggestions}
        onSearch={runSearch}
        onUseLocation={useLocation}
        status={status}
        error={error}
        matches={matches}
        onSelectMatch={choosePlace}
        weather={weather}
        forecast={forecast}
        recents={recents}
        onSelectRecent={choosePlace}
        onRemoveRecent={(recent) =>
          setRecents((prev) => prev.filter((item) => !samePlace(item, recent)))
        }
      />
    </main>
  )
}