/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile, Building } from './types';

export function generateCityMap(size: number, level: string = 'rural'): { terrain: Tile[], buildings: Building[] } {
  const terrain: Tile[] = [];
  const buildings: Building[] = [];

  // Initialize grass
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      terrain.push({ x, y, type: 'grass' });
    }
  }

  if (level === 'rural') {
    // Rural: A simple river and a dirt road
    const riverX = Math.floor(size / 3);
    const roadY = Math.floor(size / 2);
    terrain.forEach(t => {
      if (t.x === riverX || t.x === riverX + 1) t.type = 'water';
      if (t.y === roadY && t.type !== 'water') t.type = 'road';
    });
    // Few buildings
    terrain.forEach(t => {
      if (t.type === 'grass' && t.y === roadY - 1 && Math.random() > 0.7) {
        buildings.push({ id: Math.random().toString(36).substr(2, 9), type: 'house', x: t.x, y: t.y });
      }
    });
  } else if (level === 'sub_urban') {
    // Sub-urban: Grid of roads, some water
    terrain.forEach(t => {
      if (t.x % 4 === 0 || t.y % 4 === 0) t.type = 'road';
      if (t.x > size - 3 && t.y > size - 3) t.type = 'water';
    });
    // More houses
    terrain.forEach(t => {
      if (t.type === 'grass' && Math.random() > 0.85) {
        buildings.push({ id: Math.random().toString(36).substr(2, 9), type: 'house', x: t.x, y: t.y });
      }
    });
  } else if (level === 'urban') {
    // Urban: Dense roads, central park
    const center = Math.floor(size / 2);
    terrain.forEach(t => {
      if (t.x % 3 === 0 || t.y % 3 === 0) t.type = 'road';
      // Central park area
      if (Math.abs(t.x - center) <= 1 && Math.abs(t.y - center) <= 1) t.type = 'grass';
    });
    // Dense buildings, some factories
    terrain.forEach(t => {
      if (t.type === 'grass' && Math.random() > 0.6 && !(Math.abs(t.x - center) <= 1 && Math.abs(t.y - center) <= 1)) {
        buildings.push({ id: Math.random().toString(36).substr(2, 9), type: Math.random() > 0.8 ? 'factory' : 'house', x: t.x, y: t.y });
      }
    });
  } else if (level === 'capital') {
    // Capital: Highly structured, central water feature
    const center = Math.floor(size / 2);
    terrain.forEach(t => {
      if (t.x === center || t.y === center || t.x === 1 || t.x === size - 2 || t.y === 1 || t.y === size - 2) t.type = 'road';
      if (Math.abs(t.x - center) <= 1 && Math.abs(t.y - center) <= 1) t.type = 'water';
    });
    // Lots of buildings, solar, recycling
    terrain.forEach(t => {
      if (t.type === 'grass' && Math.random() > 0.5) {
        const rand = Math.random();
        let type: Building['type'] = 'house';
        if (rand > 0.9) type = 'solar';
        else if (rand > 0.8) type = 'recycling';
        else if (rand > 0.7) type = 'factory';
        buildings.push({ id: Math.random().toString(36).substr(2, 9), type, x: t.x, y: t.y });
      }
    });
  } else {
    // Default fallback
    const roadY = Math.floor(size / 2);
    const roadX = Math.floor(size / 2);
    terrain.forEach(t => { if (t.y === roadY || t.x === roadX) t.type = 'road'; });
  }

  return { terrain, buildings };
}
