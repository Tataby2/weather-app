export default function SearchBar({
  query,
  onQueryChange,
  suggestions,
  onSelectSuggestion,
  onClearSuggestions,
  onSearch,
  onUseLocation,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onBlur={onClearSuggestions}
        placeholder="Search for a city"
        aria-label="City name"
        autoComplete="off"
      />
      <button type="submit">Search</button>
      <button
        type="button"
        className="location-btn"
        onClick={onUseLocation}
        title="Use my current location"
        aria-label="Use my current location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>

      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li key={`${s.name}-${s.country}-${s.state ?? ''}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectSuggestion(s)}
              >
                <span className="s-city">{s.name}</span>
                {s.state && <span className="s-state">{s.state}</span>}
                <span className="s-country">{s.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
