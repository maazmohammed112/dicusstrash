import React from 'react';

interface HandDrawnCircleProps {
  children: React.ReactNode;
  className?: string;
  strokeColor?: string;
}

export const HandDrawnCircle: React.FC<HandDrawnCircleProps> = ({
  children,
  className = '',
  strokeColor = '#151515'
}) => {
  return (
    <span className={`relative inline-block ${className}`} style={{ position: 'relative', display: 'inline-block', padding: '2px 8px' }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <path
          d="M 6 20 C 6 8, 25 4, 52 4 C 80 4, 96 10, 96 22 C 96 32, 75 36, 48 36 C 20 36, 4 28, 4 20 C 4 15, 12 7, 24 6"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="180"
          strokeDashoffset="0"
          opacity="0.85"
        />
      </svg>
      {children}
    </span>
  );
};

export const HandDrawnArrow: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 32,
  color = '#151515',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 8 16 C 18 10, 32 14, 38 28 M 38 28 L 30 25 M 38 28 L 36 20"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
};

export const HandDrawnHeart: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 24,
  color = '#151515',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 20.2s-7-4.35-9.2-8.3C1.2 8.9 2.5 4.5 6.5 4.5c2.4 0 4.2 1.8 5.5 3.5 1.3-1.7 3.1-3.5 5.5-3.5 4 0 5.3 4.4 3.7 7.4-2.2 3.95-9.2 8.3-9.2 8.3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
};

// Text Pin marker as seen in Reference 2/3/4 ("Design Sprint is a way...")
export const HighlightMarkerPin: React.FC<{ position: 'start' | 'end' }> = ({ position }) => {
  if (position === 'start') {
    return (
      <span className="inline-block relative -top-1 mr-1.5" style={{ verticalAlign: 'middle' }}>
        <svg width="6" height="22" viewBox="0 0 6 22" fill="none">
          <circle cx="3" cy="3" r="3" fill="#151515" />
          <line x1="3" y1="3" x2="3" y2="22" stroke="#151515" strokeWidth="1.8" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-block relative -bottom-1 ml-1.5" style={{ verticalAlign: 'middle' }}>
      <svg width="6" height="22" viewBox="0 0 6 22" fill="none">
        <line x1="3" y1="0" x2="3" y2="19" stroke="#151515" strokeWidth="1.8" />
        <circle cx="3" cy="19" r="3" fill="#151515" />
      </svg>
    </span>
  );
};
