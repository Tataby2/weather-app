const FORECAST_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast'

export async function fetchForecast(lat, lon) {
  const API_KEY = import.meta.env.VITE_OWM_API_KEY
  if (!API_KEY) {
    throw new Error('Missing VITE_OWM_API_KEY in .env file')
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: API_KEY,
    units: 'metric',
  })

  let response
  try {
    response = await fetch(`${FORECAST_BASE_URL}?${params}`)
  } catch {
    throw new Error('Network error — check your connection')
  }

  if (response.status === 401) {
    throw new Error('Invalid API key')
  }
  if (!response.ok) {
    throw new Error('Failed to fetch forecast')
  }

  const data = await response.json()
  const offset = data.city.timezone
  const days = new Map()

  for (const item of data.list) {
    const local = new Date((item.dt + offset) * 1000)
    const key = local.toISOString().slice(0, 10)

    let day = days.get(key)
    if (!day) {
      day = { key, tempMin: Infinity, tempMax: -Infinity, noon: null, noonDiff: Infinity }
      days.set(key, day)
    }

    day.tempMin = Math.min(day.tempMin, item.main.temp_min)
    day.tempMax = Math.max(day.tempMax, item.main.temp_max)

    const diff = Math.abs(local.getUTCHours() - 12)
    if (diff < day.noonDiff) {
      day.noonDiff = diff
      day.noon = item
    }
  }

  return [...days.values()].slice(0, 5).map((day) => ({
    date: day.key,
    day: new Date(`${day.key}T00:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    }),
    temp: Math.round(day.noon.main.temp),
    tempMin: Math.round(day.tempMin),
    tempMax: Math.round(day.tempMax),
    feelsLike: Math.round(day.noon.main.feels_like),
    description: day.noon.weather[0].description,
    humidity: day.noon.main.humidity,
    windSpeed: day.noon.wind?.speed,
    icon: day.noon.weather[0].icon,
    iconUrl: `https://openweathermap.org/img/wn/${day.noon.weather[0].icon}@2x.png`,
  }))
}
