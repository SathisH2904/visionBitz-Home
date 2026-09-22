/**
 * TargetDart — the Digital Marketing icon in the approved design: a bullseye with a dart through it (lucide's `Target`
 * has no dart). Drawn like a lucide icon (24 × 24, currentColor stroke), so it takes the same props and is sized by CSS.
 */
export function TargetDart({ size = 24, strokeWidth = 2, ...rest }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4.2" />
      <circle cx="11" cy="13" r="0.8" fill="currentColor" />
      <path d="M11 13 20.4 3.6" />
      <path d="M16.4 3.4h4.2v4.2" />
    </svg>
  )
}

/**
 * BrowserDiv — the Web Design & Development icon in the approved design: a browser window (title bar with its dots) holding a
 * `<div>` tag. Drawn like a lucide icon (24 × 24, currentColor stroke).
 */
export function BrowserDiv({ size = 24, strokeWidth = 2, ...rest }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x="2.5" y="3.5" width="19" height="17" rx="3" />
      <path d="M2.5 8.5h19" />
      <path d="M6 6h.01M9 6h.01" />
      <path d="M8.6 12.6 6.4 14.7l2.2 2.1M15.4 12.6l2.2 2.1-2.2 2.1M13 12.2l-2 5.2" />
    </svg>
  )
}
