import React from 'react';
import './AnimatedLogo.css';

interface AnimatedLogoProps {
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function AnimatedLogo({ onClick, style }: AnimatedLogoProps) {
  return (
    <div className="animated-logo-wrapper logo" onClick={onClick} style={style}>
      <div className="animated-logo-scene">
        <div className="animated-logo-box">
          <div className="al-face al-front"></div>
          <div className="al-face al-back"></div>
          <div className="al-face al-right"></div>
          <div className="al-face al-left"></div>
          <div className="al-face al-top"></div>
          <div className="al-face al-bottom"></div>
          
          <div className="al-inside">
            <span className="al-glow">KLD</span>
          </div>
        </div>

        {/* SVG Hand */}
        <svg 
          className="al-hand-svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#57534e" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      </div>
      <span className="animated-logo-text">KEYLINE DESIGN</span>
    </div>
  );
}
