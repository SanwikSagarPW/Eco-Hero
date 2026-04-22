/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Building, GameState, Tile } from '../types';
import { BUILDING_DATA } from '../constants';

const ImageWithFallback = ({ src, fallbackSrc, alt, className }: { src: string, fallbackSrc: string, alt: string, className: string }) => {
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <img 
      src={error ? fallbackSrc : src} 
      onError={() => setError(true)}
      alt={alt}
      className={`${className} text-transparent`}
      style={{ color: 'transparent' }}
      referrerPolicy="no-referrer"
    />
  );
};

const TerrainTile = React.memo(({ 
  tile, 
  building, 
  onTileClick,
  getTerrainClasses,
  getTerrainStyle 
}: { 
  tile: Tile, 
  building?: Building, 
  onTileClick: (x: number, y: number) => void,
  getTerrainClasses: (type: Tile['type']) => string,
  getTerrainStyle: (type: Tile['type']) => React.CSSProperties
}) => {
  // Compute randoms once per tile to stop animation thrashing on game tick re-renders
  const waterDuration = React.useMemo(() => 2 + Math.random(), []);
  const airDelay = React.useMemo(() => Math.random(), []);
  const waterDelay = React.useMemo(() => Math.random(), []);
  const sparkleDelay = React.useMemo(() => Math.random(), []);

  return (
    <motion.div
      whileHover={{ translateZ: 10, scale: 1.05 }}
      className={`relative w-full aspect-square cursor-pointer rounded-sm ${getTerrainClasses(tile.type)}`}
      style={{ ...getTerrainStyle(tile.type), transformStyle: 'preserve-3d' }}
      onClick={() => onTileClick(tile.x, tile.y)}
    >
      {/* Water animation */}
      {tile.type === 'water' && (
        <motion.div 
          animate={{ opacity: [0.2, 0.5, 0.2] }} 
          transition={{ repeat: Infinity, duration: waterDuration }}
          className="absolute inset-0 bg-white/30"
        />
      )}

      {building && (() => {
        const bData = BUILDING_DATA[building.type as keyof typeof BUILDING_DATA];
        return (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ 
              // Exact inverse of the board's rotation to stand straight up
              transform: 'translateZ(20px) rotateZ(45deg) rotateX(-55deg)',
              transformOrigin: 'center center',
              transformStyle: 'flat'
            }}
          >
            {/* 3D PNG Icon with Fallback */}
            <ImageWithFallback 
              src={bData.image} 
              fallbackSrc={(bData as any).fallbackImage}
              alt={bData.label}
              className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            />
            
            {/* Visual Pollution/Cleaning Indicators */}
            {bData.pollutionImpact.air > 0 && (
              <motion.div 
                animate={{ y: [-5, -15], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: airDelay }}
                className="absolute -top-4 text-xs drop-shadow-md"
              >
                ☁️
              </motion.div>
            )}
            {bData.pollutionImpact.water > 0 && (
              <motion.div 
                animate={{ y: [0, -10], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: waterDelay }}
                className="absolute -bottom-2 right-0 text-xs drop-shadow-md"
              >
                🛢️
              </motion.div>
            )}
            {(bData.pollutionImpact.air < 0 || bData.pollutionImpact.water < 0 || bData.pollutionImpact.land < 0) && (
              <motion.div 
                animate={{ y: [0, -15], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 3, delay: sparkleDelay }}
                className="absolute -top-2 left-0 text-xs drop-shadow-md"
              >
                ✨
              </motion.div>
            )}
          </div>
        );
      })()}
    </motion.div>
  );
});

interface GameCanvasProps {
  state: GameState;
  onTileClick: (x: number, y: number) => void;
}

const getTerrainStyle = (type: Tile['type']): React.CSSProperties => {
  switch (type) {
    case 'grass': return { backgroundImage: 'url(/images/grass.png)', backgroundColor: '#34d399', backgroundSize: 'cover' };
    case 'water': return { backgroundImage: 'url(/images/water_texture.png)', backgroundColor: '#60a5fa', backgroundSize: 'cover' };
    case 'road': return { backgroundImage: 'url(/images/road.png)', backgroundColor: '#78716c', backgroundSize: 'cover' };
    default: return { backgroundColor: '#10b981' };
  }
};

const getTerrainClasses = (type: Tile['type']): string => {
  switch (type) {
    case 'grass': return 'shadow-[-2px_2px_0px_#047857,-4px_4px_0px_#064e3b]';
    case 'water': return 'shadow-[-2px_2px_0px_#1d4ed8,-4px_4px_0px_#1e3a8a]';
    case 'road': return 'shadow-[-2px_2px_0px_#44403c,-4px_4px_0px_#292524]';
    default: return '';
  }
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ state, onTileClick }) => {
  const { gridSize, terrain, buildings } = state;
  const [scale, setScale] = useState(1);
  const initialDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s - e.deltaY * 0.002, 0.5), 3));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      initialDistRef.current = dist;
      initialScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistRef.current !== null) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const newScale = initialScaleRef.current * (dist / initialDistRef.current);
      setScale(Math.min(Math.max(newScale, 0.5), 3));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistRef.current = null;
    }
  };

  const getBuildingAt = React.useCallback((x: number, y: number) => {
    return buildings.find(b => b.x === x && b.y === y);
  }, [buildings]);

  // Pollution visual effects
  const avgPollution = (state.pollution.air + state.pollution.water + state.pollution.land) / 3;
  const pollutionFactor = avgPollution / 100;
  
  const boardFilter = `sepia(${pollutionFactor * 50}%) brightness(${100 - pollutionFactor * 30}%) saturate(${100 - pollutionFactor * 20}%)`;

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ filter: boardFilter, transition: 'filter 1s ease', touchAction: 'none' }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <motion.div 
        className="grid gap-1 p-2 md:p-4 bg-amber-900/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-8 border-amber-900/60"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          transform: `scale(${scale}) rotateX(55deg) rotateZ(-45deg)`,
          transformStyle: 'preserve-3d',
          width: 'min(100%, 60vh, 500px)',
          aspectRatio: '1 / 1',
        }}
      >
        {terrain.map((tile) => {
          const building = getBuildingAt(tile.x, tile.y);
          return (
            <TerrainTile 
              key={`${tile.x}-${tile.y}`}
              tile={tile}
              building={building}
              onTileClick={onTileClick}
              getTerrainClasses={getTerrainClasses}
              getTerrainStyle={getTerrainStyle}
            />
          );
        })}
      </motion.div>
    </div>
  );
};
