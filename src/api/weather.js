const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

export async function fetchWeather(city) {
  const API_KEY = import.meta.env.VITE_OWM_API_KEY
  if (!API_KEY) {
    throw new Error('Missing VITE_OWM_API_KEY in .env file')
  }

  const params = new URLSearchParams({
    q: city,
    appid: API_KEY,
    units: 'metric',
  })

  let response
  try {
    response = await fetch(`${BASE_URL}?${params}`)
  } catch {
    throw new Error('Network error — check your connection')
  }

  if (response.status === 404) {
    throw new Error(`City "${city}" not found`)
  }
  if (response.status === 401) {
    throw new Error('Invalid API key')
  }
  if (!response.ok) {
    throw new Error('Failed to fetch weather data')
  }

  const data = await response.json()

  return normalizeWeather(data)
}

function normalizeWeather(data) {
  return {
    city: data.name,
    country: data.sys.country,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    icon: data.weather[0].icon,
    iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
  }
}

export async function fetchWeatherByCoords(lat, lon) {
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
    response = await fetch(`${BASE_URL}?${params}`)
  } catch {
    throw new Error('Network error — check your connection')
  }

  if (response.status === 401) {
    throw new Error('Invalid API key')
  }
  if (!response.ok) {
    throw new Error('Failed to fetch weather data')
  }

  const data = await response.json()

  return normalizeWeather(data)
}