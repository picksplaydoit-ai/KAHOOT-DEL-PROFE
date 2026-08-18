import React from 'react';

export const KAHOOT_COLORS = {
  A: '#e21b3c', // Triangle (Red)
  B: '#1368ce', // Diamond (Blue)
  C: '#d89e00', // Circle (Yellow/Amber)
  D: '#26890c', // Square (Green)
};

export const KahootShape = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'A': // Triangle
      return (
        <svg viewBox="0 0 32 32" className={className} fill="currentColor">
          <path d="M16 4L4 26h24L16 4z" />
        </svg>
      );
    case 'B': // Diamond
      return (
        <svg viewBox="0 0 32 32" className={className} fill="currentColor">
          <path d="M16 4l12 12-12 12L4 16 16 4z" />
        </svg>
      );
    case 'C': // Circle
      return (
        <svg viewBox="0 0 32 32" className={className} fill="currentColor">
          <circle cx="16" cy="16" r="12" />
        </svg>
      );
    case 'D': // Square
      return (
        <svg viewBox="0 0 32 32" className={className} fill="currentColor">
          <rect x="6" y="6" width="20" height="20" />
        </svg>
      );
    default:
      return null;
  }
};
