/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PollutionType = 'air' | 'water' | 'land';
export type TerrainType = 'grass' | 'water' | 'road';

export interface Tile {
  x: number;
  y: number;
  type: TerrainType;
}

export interface PollutionState {
  air: number; // 0-100
  water: number; // 0-100
  land: number; // 0-100
}

export interface Resources {
  energy: number;
  money: number;
  materials: number;
}

export interface Building {
  id: string;
  type: 'factory' | 'solar' | 'recycling' | 'filter' | 'park' | 'clean' | 'house';
  x: number;
  y: number;
}

export interface GameState {
  pollution: PollutionState;
  health: number; // 0-100
  population: number;
  happiness: number; // 0-100
  resources: Resources;
  buildings: Building[];
  terrain: Tile[];
  gridSize: number;
  level: 'rural' | 'sub_urban' | 'urban' | 'capital';
  ecoPoints: number;
  time: number; // 0 (midnight) to 24 (next midnight)
  weather: 'clear' | 'rainy' | 'snowy';
}

export interface AIAdvice {
  message: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  impact: Partial<PollutionState> & { money?: number; health?: number };
  type: 'disaster' | 'opportunity' | 'alert';
}
