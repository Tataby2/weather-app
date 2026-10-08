const GEO_BASE_URL = 'https://api.openweathermap.org/geo/1.0/direct'

export async function geocodeCity(city, { signal } = {}) {
  const API_KEY = import.meta.env.VITE_OWM_API_KEY
  if (!API_KEY) {
    throw new Error('Missing VITE_OWM_API_KEY in .env file')
  }

  const params = new URLSearchParams({
    q: city,
    limit: '5',
    appid: API_KEY,
  })

  let response
  try {
    response = await fetch(`${GEO_BASE_URL}?${params}`, { signal })
  } catch {
    throw new Error('Network error — check your connection')
  }

  if (!response.ok) {
    throw new Error('Failed to search for city')
  }

  const data = await response.json()

  return data.map((place) => ({
    name: place.name,
    state: place.state ?? null,
    country: place.country,
    lat: place.lat,
    lon: place.lon,
  }))
}