
import React, { useEffect, useRef } from 'react';

interface AnimatedSendButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export const AnimatedSendButton: React.FC<AnimatedSendButtonProps> = ({ onClick, disabled }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const waveContainerRef = useRef<SVGGElement>(null);
  const isAnimatingRef = useRef(false); 

  useEffect(() => {
    const handleWaveAnimation = () => {
      if (!waveContainerRef.current || isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      const waveColors = ['#BB86FC', '#A282C9', '#8471BB', '#6B5EA0']; 
      const waveCount = 3;
      const waveDuration = 900; 
      const maxRadius = 45; 
      const startRadius = 18; 
      const staggerDelay = 100;

      for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
          if (!waveContainerRef.current) return;
          const wave = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          wave.setAttribute('cx', '0');
          wave.setAttribute('cy', '0');
          wave.setAttribute('r', String(startRadius));
          wave.setAttribute('fill', waveColors[i % waveColors.length]);
          wave.setAttribute('fill-opacity', '0.7');
          wave.style.pointerEvents = 'none';

          waveContainerRef.current.appendChild(wave);

          let animationStartTime = 0;
          function animateSingleWave(timestamp: number) {
            if (!animationStartTime) animationStartTime = timestamp;
            const elapsed = timestamp - animationStartTime;
            const progress = Math.min(elapsed / waveDuration, 1);

            const currentRadius = startRadius + (maxRadius - startRadius) * progress;
            const currentOpacity = 0.7 * (1 - Math.pow(progress, 2.5));

            wave.setAttribute('r', String(currentRadius));
            wave.setAttribute('fill-opacity', String(currentOpacity));

            if (progress < 1) {
              requestAnimationFrame(animateSingleWave);
            } else {
              wave.remove();
              if (waveContainerRef.current && waveContainerRef.current.children.length === 0) {
                isAnimatingRef.current = false; 
              }
            }
          }
          requestAnimationFrame(animateSingleWave);
        }, i * staggerDelay);
      }
      setTimeout(() => {
          if (isAnimatingRef.current && waveContainerRef.current && waveContainerRef.current.children.length === 0) {
              isAnimatingRef.current = false;
          }
      }, waveDuration + waveCount * staggerDelay + 200);
    };
    
    (svgRef.current as any_HackForExposingMethodDirectlyIfNecessary) = { triggerAnimation: handleWaveAnimation };

    return () => {
      if (waveContainerRef.current) {
        waveContainerRef.current.innerHTML = ''; 
      }
      isAnimatingRef.current = false;
    };
  }, []);

  const handleClick = () => {
    if (!disabled) {
      const animator = (svgRef.current as any_HackForExposingMethodDirectlyIfNecessary);
      if (animator && animator.triggerAnimation) {
          animator.triggerAnimation();
      }
      onClick(); 
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`p-2.5 rounded-full font-semibold shadow-md focus:outline-none transition-all 
                  ${disabled ? 'opacity-50 cursor-not-allowed bg-brand-surface-light' : 'bg-brand-primary text-white hover:bg-brand-primary-variant focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-surface-dark active:scale-95'}`}
      aria-label="Send message"
    >
      <div className="send-button-svg-wrapper" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg ref={svgRef} viewBox="0 0 50 50" width="20" height="20" overflow="visible"> {/* Ensure overflow visible for pulse */}
          <g transform="translate(25, 25)"> 
            <g ref={waveContainerRef} id="wave-container-send-btn"></g>
            {/* The #logo-center-circle-send-btn is removed. The HTML button's background serves as the base. */}
            {/* The pulse animation will be applied to #neural-icon-send-btn via CSS */}
            <g id="neural-icon-send-btn" transform="scale(0.45)">
              <path d="M0,0 L0,-10 M0,0 L8.66,5 M0,0 L-8.66,5" stroke="#FFFFFF" strokeWidth="2.5" fill="none"/>
              <circle cx="0" cy="0" r="4" fill="#FFFFFF"/> 
              <circle cx="0" cy="-10" r="3" fill="#FFFFFF"/>
              <circle cx="8.66" cy="5" r="3" fill="#FFFFFF"/>
              <circle cx="-8.66" cy="5" r="3" fill="#FFFFFF"/>
            </g>
          </g>
        </svg>
      </div>
    </button>
  );
};

interface any_HackForExposingMethodDirectlyIfNecessary {
    triggerAnimation?: () => void;
}