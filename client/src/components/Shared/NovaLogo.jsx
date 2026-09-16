import React from 'react'

export default function NovaLogo({ size = 32, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    >
      <defs>
        <linearGradient id="novaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B7CFF" />
          <stop offset="50%" stopColor="#6D5EF5" />
          <stop offset="100%" stopColor="#5B5FEF" />
        </linearGradient>
        <filter id="novaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#5B5FEF" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect width="120" height="120" rx="30" fill="url(#novaGrad)" filter="url(#novaGlow)" />
      {/* Chat bubble silhouette */}
      <path
        d="M34 38C34 31.3726 39.3726 26 46 26H74C80.6274 26 86 31.3726 86 38V60C86 66.6274 80.6274 72 74 72H52L38 84V72H46C46 72 34 72 34 60V38Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Sparkle / 4-point Star Accent inside */}
      <path
        d="M60 40C60 46 64 50 70 50C64 50 60 54 60 60C60 54 56 50 50 50C56 50 60 46 60 40Z"
        fill="#5B5FEF"
      />
      <circle cx="44" cy="50" r="3.5" fill="#6D5EF5" />
    </svg>
  )
}
