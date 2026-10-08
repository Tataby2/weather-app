import { useState } from 'react'
import SearchBar from './SearchBar.jsx'
import WeatherIcon from './WeatherIcon.jsx'

const celsiusToFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32)

export default function WeatherCard({
  query,
  onQueryChange,
  suggestions,
  onSelectSuggestion,
  onClearSuggestions,
  onSearch,
  onUseLocation,
  status,
  error,
  matches,
  onSelectMatch,
  weather,
  forecast = [],
  recents = [],
  onSelectRecent,
  onRemoveRecent,
}) {
  const [unit, setUnit] = useState('c')

  const toDisplayUnit = (celsius) =>
    unit === 'f' ? celsiusToFahrenheit(celsius) : celsius

  const displayTemp = weather ? toDisplayUnit(weather.temp) : null
  const displayFeelsLike = weather ? toDisplayUnit(weather.feelsLike) : null

  return (
    <section className="weather-card">
      <SearchBar
        query={query}
        onQueryChange={onQueryChange}
        suggestions={suggestions}
        onSelectSuggestion={onSelectSuggestion}
        onClearSuggestions={onClearSuggestions}
        onSearch={onSearch}
        onUseLocation={onUseLocation}
      />

      {recents.length > 0 && (
        <div className="recent-searches">
          <span className="recent-label">Recent:</span>
          {recents.map((recent) => (
            <div key={`${Math.round(recent.lat * 10000)}-${Math.round(recent.lon * 10000)}`} className="recent-item">
              <button
                type="button"
                className="recent-chip"
                onClick={() => onSelectRecent(recent)}
                disabled={status === 'loading'}
              >
                {recent.name}, {recent.country}
              </button>
              <button
                type="button"
                className="recent-remove"
                aria-label={`Remove ${recent.name}, ${recent.country}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveRecent(recent)
                }}
                disabled={status === 'loading'}
                title="Remove from recent searches"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {status === 'idle' && (
        <p className="hint">Search for a city to see the weather.</p>
      )}

      {status === 'loading' && (
        <p className="status" role="status">
          Loading...
        </p>
      )}

      {status === 'error' && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {status === 'selecting' && (
        <div className="city-select">
          <p>Multiple matches found — choose one:</p>
          <ul>
            {matches.map((match) => (
              <li key={`${match.name}-${match.country}-${match.state ?? ''}`}>
                <button type="button" onClick={() => onSelectMatch(match)}>
                  {match.name}
                  {match.state ? `, ${match.state}` : ''} ({match.country})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'success' && weather && (
        <div className="weather-info">
          <h2>
            {weather.city}, {weather.country}
          </h2>
          <WeatherIcon
            icon={weather.icon}
            iconUrl={weather.iconUrl}
            alt={weather.description}
            size={150}
          />
          <div className="temp-row">
            <p className="temp">
              {displayTemp}°{unit.toUpperCase()}
            </p>
            <button
              type="button"
              className="unit-toggle"
              onClick={() => setUnit((u) => (u === 'c' ? 'f' : 'c'))}
              aria-label="Switch temperature unit"
            >
              <span className={unit === 'f' ? 'active' : ''}>°F</span>
              <span className={unit === 'c' ? 'active' : ''}>°C</span>
            </button>
          </div>
          <p className="desc">{weather.description}</p>
          <dl>
            <div>
              <dt>Feels like</dt>
              <dd>
                {displayFeelsLike}°{unit.toUpperCase()}
              </dd>
            </div>
            <div>
              <dt>Humidity</dt>
              <dd>{weather.humidity}%</dd>
            </div>
            <div>
              <dt>Wind speed</dt>
              <dd>{weather.windSpeed} m/s</dd>
            </div>
          </dl>
        </div>
      )}

      {status === 'success' && forecast.length > 0 && (
        <div className="forecast">
          <h3>5-Day Forecast</h3>
          <ul>
            {forecast.map((day) => (
              <li key={day.date} className="forecast-day">
                <div className="f-head">
                  <span className="f-day">{day.day}</span>
                  <WeatherIcon
                    icon={day.icon}
                    iconUrl={day.iconUrl}
                    alt={day.description}
                    size={48}
                  />
                </div>
                <p className="f-temp">
                  {toDisplayUnit(day.temp)}°{unit.toUpperCase()}
                </p>
                <p className="f-desc">{day.description}</p>
                <dl>
                  <div>
                    <dt>Feels like</dt>
                    <dd>
                      {toDisplayUnit(day.feelsLike)}°{unit.toUpperCase()}
                    </dd>
                  </div>
                  <div>
                    <dt>Humidity</dt>
                    <dd>{day.humidity}%</dd>
                  </div>
                  <div>
                    <dt>Wind speed</dt>
                    <dd>{day.windSpeed} m/s</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
