import React, { useMemo } from 'react';
import { GameState } from '../types';

export const WeatherOverlay: React.FC<{ weather: GameState['weather'] }> = ({ weather }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      top: `${Math.random() * -20}vh`, // Start slightly above
      animationDuration: weather === 'rainy' 
        ? `${0.6 + Math.random() * 0.4}s` // Fast rain
        : `${3 + Math.random() * 5}s`,   // Slow snow
      animationDelay: `-${Math.random() * 5}s`,
      opacity: weather === 'rainy' ? 0.3 + Math.random() * 0.5 : 0.5 + Math.random() * 0.5,
      size: weather === 'snowy' ? `${4 + Math.random() * 6}px` : undefined,
    }));
  }, [weather]);

  if (weather === 'clear') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={weather === 'rainy' ? 'rain-drop' : 'snow-flake'}
          style={{
            left: p.left,
            top: p.top,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            opacity: p.opacity,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
      
      {/* Subtle screen overlay to boost the weather feel */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${
        weather === 'rainy' ? 'bg-blue-900/10' : 'bg-white/10'
      }`} />
    </div>
  );
};
