import React from 'react';

interface MessLogoProps {
  size?: number;
}

export function MessLogo({ size = 48 }: MessLogoProps) {
  return (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Radial gradient for 3D sphere effect */}
        <radialGradient id="planetGradient" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#e0e0e0" />
        </radialGradient>
      </defs>
      
      {/* Back orbits (behind planet) */}
      
      {/* Orbit ring 1 - Horizontal (back half) */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="10" 
        ry="2.5" 
        stroke="#000000" 
        strokeWidth="1" 
        fill="none"
        transform="rotate(0 12 12)"
        clipPath="url(#backClip)"
      />
      
      {/* Orbit ring 2 - Diagonal right (back half) */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="10" 
        ry="2.5" 
        stroke="#000000" 
        strokeWidth="1" 
        fill="none"
        transform="rotate(35 12 12)"
        clipPath="url(#backClip)"
      />
      
      {/* Orbit ring 3 - Vertical (back half) */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="2.5" 
        ry="10" 
        stroke="#000000" 
        strokeWidth="1" 
        fill="none"
        transform="rotate(0 12 12)"
        clipPath="url(#backClip)"
      />
      
      {/* Main 3D planet sphere with gradient */}
      <circle 
        cx="12" 
        cy="12" 
        r="4.5" 
        fill="url(#planetGradient)"
      />
      
      {/* Thick black outline around planet */}
      <circle 
        cx="12" 
        cy="12" 
        r="4.5" 
        stroke="#000000"
        strokeWidth="1.8"
        fill="none"
      />
      
      {/* Bright highlight shine for 3D effect */}
      <circle 
        cx="10.5" 
        cy="10.5" 
        r="1.3" 
        fill="#ffffff"
        opacity="0.9"
      />
      
      {/* Smaller secondary highlight */}
      <circle 
        cx="10" 
        cy="11" 
        r="0.6" 
        fill="#ffffff"
        opacity="0.6"
      />
      
      {/* Surface detail craters */}
      <circle cx="13.2" cy="11.5" r="0.4" fill="#d0d0d0" opacity="0.5" />
      <circle cx="11.5" cy="13.5" r="0.35" fill="#d0d0d0" opacity="0.4" />
      <circle cx="13.8" cy="13.2" r="0.3" fill="#d0d0d0" opacity="0.35" />
      
      {/* Front orbits (in front of planet) */}
      
      {/* Orbit ring 1 - Horizontal (front half) */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="10" 
        ry="2.5" 
        stroke="#000000" 
        strokeWidth="1.2" 
        fill="none"
        transform="rotate(0 12 12)"
        strokeDasharray="0 31.4 62.8"
      />
      
      {/* Orbit ring 2 - Diagonal right (front half) */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="10" 
        ry="2.5" 
        stroke="#000000" 
        strokeWidth="1.2" 
        fill="none"
        transform="rotate(35 12 12)"
        strokeDasharray="0 31.4 62.8"
      />
      
      {/* Orbit ring 3 - Vertical (front half) */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="2.5" 
        ry="10" 
        stroke="#000000" 
        strokeWidth="1.2" 
        fill="none"
        transform="rotate(0 12 12)"
        strokeDasharray="0 31.4 62.8"
      />
      
      {/* Orbit ring 4 - Diagonal left */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="10" 
        ry="2.5" 
        stroke="#000000" 
        strokeWidth="1.1" 
        fill="none"
        transform="rotate(-35 12 12)"
      />
      
      {/* Orbit ring 5 - Angled vertical */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="2.5" 
        ry="10" 
        stroke="#000000" 
        strokeWidth="1.1" 
        fill="none"
        transform="rotate(60 12 12)"
      />
    </svg>
  );
}
