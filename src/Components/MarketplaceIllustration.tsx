/**
 * Abstract, geometric illustration of the creator-economy marketplace —
 * category nodes orbiting a central "deal" node. Intentionally not
 * photographic: no licensed photo source or image-generation tool is
 * available in this environment, and using unlicensed photos of real
 * people to stand in for "creators" would misrepresent them.
 */
export default function MarketplaceIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="200" cy="200" r="150" stroke="url(#mi-ring)" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.5" />
      <circle cx="200" cy="200" r="100" stroke="url(#mi-ring)" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.35" />

      <circle cx="200" cy="200" r="46" fill="url(#mi-core)" />
      <path d="M186 200l9 9 19-19" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {[
        { x: 200, y: 50, color: "#EC4899" },
        { x: 329, y: 125, color: "#F59E0B" },
        { x: 329, y: 275, color: "#3B82F6" },
        { x: 200, y: 350, color: "#16A34A" },
        { x: 71, y: 275, color: "#5B4BFF" },
        { x: 71, y: 125, color: "#8B5CF6" },
      ].map((n, i) => (
        <g key={i}>
          <line x1="200" y1="200" x2={n.x} y2={n.y} stroke={n.color} strokeOpacity="0.25" strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y} r="22" fill={n.color} fillOpacity="0.15" />
          <circle cx={n.x} cy={n.y} r="12" fill={n.color} />
        </g>
      ))}

      <defs>
        <linearGradient id="mi-core" x1="154" y1="154" x2="246" y2="246" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B4BFF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="mi-ring" x1="50" y1="50" x2="350" y2="350" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B4BFF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
