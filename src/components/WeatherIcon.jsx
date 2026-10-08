export default function WeatherIcon({ icon, iconUrl, alt, size = 100 }) {
  if (icon === '01n') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={alt}
      >
        <defs>
          <mask id="moon-cutout">
            <rect width="100" height="100" fill="#fff" />
            <circle cx="68" cy="42" r="24" fill="#000" />
          </mask>
        </defs>

        <circle
          cx="52"
          cy="54"
          r="26"
          fill="#f5a623"
          mask="url(#moon-cutout)"
        />

        <path
          d="M24 21 L26.5 27.5 L33 30 L26.5 32.5 L24 39 L21.5 32.5 L15 30 L21.5 27.5 Z"
          fill="#f5a623"
        />
        <path
          d="M80 68 L81.7 72.3 L86 74 L81.7 75.7 L80 80 L78.3 75.7 L74 74 L78.3 72.3 Z"
          fill="#f5a623"
        />
        <path
          d="M78 18 L79.1 20.9 L82 22 L79.1 23.1 L78 26 L76.9 23.1 L74 22 L76.9 20.9 Z"
          fill="#f5a623"
        />
      </svg>
    )
  }

  return <img src={iconUrl} alt={alt} width={size} height={size} />
}
