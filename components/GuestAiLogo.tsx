import React from 'react';

interface GuestAiLogoProps {
  size?: number; // Approximate width/height in pixels
  className?: string;
}

export const GuestAiLogo: React.FC<GuestAiLogoProps> = ({ size = 60, className = '' }) => {
  const graphicCenterY = 180;
  const graphicRadius = 160; 
  const viewBoxMinX = 0;
  // Adjusted Y to ensure entire pulsing disc and glow is visible if it expands slightly.
  // Original highest point of glow is 180 (center) - 158 (radius) = 22.
  // Giving a bit of padding.
  const viewBoxMinY = graphicCenterY - graphicRadius - 5; // 180 - 160 - 5 = 15
  const viewBoxWidth = 400;
  const viewBoxHeight = (graphicRadius + 5) * 2; // (160 + 5) * 2 = 330
  // Resulting viewBox: "0 15 400 330"

  return (
    <div className={`logo-container ${className}`} style={{ width: size, height: size * (viewBoxHeight / viewBoxWidth) }}>
        <svg 
            viewBox={`${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`}
            className="app-logo-svg"
            aria-label="GUEST AI Logo"
        >
            {/* Outer decorative circles (glows) */}
            <circle cx="200" cy="180" r="150" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
            <circle cx="200" cy="180" r="158" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>

            <g id="logo-disc-positioner" transform="translate(200, 180)">
                <g id="logo-disc-group-inner">
                    {/* Colored discs - original palette */}
                    <circle r="140" fill="#2A2A51"/> 
                    <circle r="130" fill="#3E3A6B"/> 
                    <circle r="120" fill="#524B85"/> 
                    <circle r="110" fill="#6B5EA0"/> 
                    <circle r="100" fill="#8471BB"/> 
                    <circle r="90"  fill="#A282C9"/> 
                    <circle r="80"  fill="#C093D6"/> 
                    <circle r="70"  fill="#DDA4E3"/> 
                    <circle r="60"  fill="#F2B6CD"/> 
                    <circle r="50"  fill="#FFC8B8"/> 
                </g>
            </g>
            
            <g id="logo-center-group" transform="translate(200, 180)">
                {/* Changed fill to brand-primary color */}
                <circle id="logo-center-circle" r="40" fill="#BB86FC" style={{pointerEvents: 'none'}}/>
                <g id="neural-icon" transform="scale(0.75)" style={{pointerEvents: 'none'}}> 
                    <path d="M0,0 L0,-10 M0,0 L8.66,5 M0,0 L-8.66,5" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                    <circle cx="0" cy="0" r="3.5" fill="#FFFFFF"/>
                    <circle cx="0" cy="-10" r="2.5" fill="#FFFFFF"/>
                    <circle cx="8.66" cy="5" r="2.5" fill="#FFFFFF"/>
                    <circle cx="-8.66" cy="5" r="2.5" fill="#FFFFFF"/>
                </g>
            </g>
        </svg>
    </div>
  );
};