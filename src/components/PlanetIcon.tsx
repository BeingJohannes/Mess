import React from 'react';

interface PlanetIconProps {
  className?: string;
}

export function PlanetIcon({ className = "w-5 h-5" }: PlanetIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Radial gradient for 3D sphere effect */}
        <radialGradient id="planetGradient" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e5e5e5" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </radialGradient>
        
        {/* Shadow gradient */}
        <radialGradient id="shadowGradient" cx="65%" cy="65%">
          <stop offset="0%" stopColor="#808080" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#404040" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      
      {/* Black background circle */}
      <circle cx="12" cy="12" r="11" fill="#000000" />
      
      {/* Outer orbit ring 1 */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="10" 
        ry="3.5" 
        stroke="#ffffff" 
        strokeWidth="0.4" 
        fill="none"
        opacity="0.4"
        transform="rotate(-25 12 12)"
      />
      
      {/* Outer orbit ring 2 */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="9" 
        ry="3" 
        stroke="#ffffff" 
        strokeWidth="0.4" 
        fill="none"
        opacity="0.5"
        transform="rotate(15 12 12)"
      />
      
      {/* Mid orbit ring */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="8" 
        ry="2.8" 
        stroke="#ffffff" 
        strokeWidth="0.5" 
        fill="none"
        opacity="0.6"
        transform="rotate(-10 12 12)"
      />
      
      {/* Inner orbit ring */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="7.2" 
        ry="2.5" 
        stroke="#ffffff" 
        strokeWidth="0.6" 
        fill="none"
        opacity="0.7"
        transform="rotate(30 12 12)"
      />
      
      {/* Shadow overlay on planet */}
      <circle 
        cx="12" 
        cy="12" 
        r="4" 
        fill="url(#shadowGradient)"
      />
      
      {/* Main 3D planet sphere */}
      <circle 
        cx="12" 
        cy="12" 
        r="4" 
        fill="url(#planetGradient)"
      />
      
      {/* Highlight shine */}
      <circle 
        cx="10.5" 
        cy="10.5" 
        r="1.5" 
        fill="#ffffff"
        opacity="0.8"
      />
      
      {/* Small craters for detail */}
      <circle cx="13" cy="11.5" r="0.5" fill="#c0c0c0" opacity="0.6" />
      <circle cx="11.5" cy="13" r="0.4" fill="#c0c0c0" opacity="0.5" />
      <circle cx="13.5" cy="13" r="0.3" fill="#c0c0c0" opacity="0.4" />
    </svg>
  );
}
