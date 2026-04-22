/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PollutionState, Resources } from './types';

export const INITIAL_STATE: PollutionState = {
  air: 50,
  water: 50,
  land: 50,
};

export const INITIAL_RESOURCES: Resources = {
  energy: 50,
  money: 200,
  materials: 200,
};

export const BUILDING_DATA = {
  house: {
    cost: 30,
    energyGen: -0.4,
    moneyGen: 2.5,
    pollutionImpact: { air: 0.2, water: 0.2, land: 0.2 },
    happinessImpact: 0,
    populationCap: 10,
    label: 'City Block',
    description: 'Houses people. Uses Energy, pollutes a little.',
    image: '/images/house.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/House/3D/house_3d.png',
    color: 'from-orange-400 to-rose-600'
  },
  clean: {
    cost: 20,
    energyGen: -0.2,
    moneyGen: 0,
    pollutionImpact: { air: 0, water: 0, land: 0 },
    happinessImpact: 0.5,
    populationCap: 0,
    label: 'Clean Up',
    description: 'Instantly cleans pollution. Costs money & energy!',
    image: '/images/clean_up.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Broom/3D/broom_3d.png',
    color: 'from-sky-400 to-indigo-500'
  },
  factory: {
    cost: 150,
    energyGen: -2,
    moneyGen: 15,
    pollutionImpact: { air: 1.0, water: 0.5, land: 0.5 },
    happinessImpact: -2.5,
    populationCap: 0,
    label: 'Factory',
    description: 'Massive money! Massive pollution! Uses lots of energy.',
    image: '/images/factory.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Factory/3D/factory_3d.png',
    color: 'from-slate-500 to-slate-800'
  },
  solar: {
    cost: 100,
    energyGen: 3,
    moneyGen: 1,
    pollutionImpact: { air: -0.1, water: 0, land: 0 },
    happinessImpact: 0.2,
    populationCap: 0,
    label: 'Solar Plant',
    description: 'Generates clean energy. Slightly cleans air.',
    image: '/images/solar.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sun/3D/sun_3d.png',
    color: 'from-yellow-300 to-orange-500'
  },
  recycling: {
    cost: 120,
    energyGen: -0.6,
    moneyGen: 6,
    pollutionImpact: { air: 0, water: 0, land: -0.8 },
    happinessImpact: 0.5,
    populationCap: 0,
    label: 'Recycling',
    description: 'Cleans land pollution and generates money.',
    image: '/images/recycle.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Recycling%20symbol/3D/recycling_symbol_3d.png',
    color: 'from-emerald-400 to-teal-600'
  },
  filter: {
    cost: 80,
    energyGen: -0.8,
    moneyGen: 0,
    pollutionImpact: { air: 0, water: -0.8, land: 0 },
    happinessImpact: 0.2,
    populationCap: 0,
    label: 'Water Filter',
    description: 'Heavily cleans water pollution. Uses energy.',
    image: '/images/water.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Droplet/3D/droplet_3d.png',
    color: 'from-blue-400 to-cyan-600'
  },
  park: {
    cost: 60,
    energyGen: -0.2,
    moneyGen: -2,
    pollutionImpact: { air: -0.3, water: -0.3, land: -0.3 },
    happinessImpact: 3,
    populationCap: 0,
    label: 'Public Park',
    description: 'Cleans everything slowly. Boosts happiness! Costs upkeep.',
    image: '/images/park.png',
    fallbackImage: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Evergreen%20tree/3D/evergreen_tree_3d.png',
    color: 'from-green-400 to-emerald-600'
  },
};

export const getObjectives = (level: string) => {
  switch(level) {
    case 'rural': return { 
      pop: { target: 15, hint: 'Build City Blocks' }, 
      health: { target: 80, hint: 'Plant Parks' }, 
      money: { target: 100, hint: 'Wait for taxes' },
      energy: { target: 5, hint: 'Build Solar Plants' }
    };
    case 'sub_urban': return { 
      pop: { target: 30, hint: 'Build more City Blocks' }, 
      health: { target: 80, hint: 'Use Water Filters & Parks' }, 
      money: { target: 200, hint: 'Build a Factory (careful!)' },
      energy: { target: 10, hint: 'Build Solar Plants' }
    };
    case 'urban': return { 
      pop: { target: 50, hint: 'Dense City Blocks' }, 
      health: { target: 85, hint: 'Recycling & Filters needed' }, 
      money: { target: 500, hint: 'Factories & Recycling' },
      energy: { target: 25, hint: 'Many Solar Plants' }
    };
    case 'capital': return { 
      pop: { target: 100, hint: 'Massive Population' }, 
      health: { target: 90, hint: 'Perfect Eco-Balance' }, 
      money: { target: 1000, hint: 'Huge Economy' },
      energy: { target: 50, hint: 'Massive Power Grid' }
    };
    default: return { 
      pop: { target: 15, hint: 'Build City Blocks' }, 
      health: { target: 80, hint: 'Plant Parks' }, 
      money: { target: 100, hint: 'Wait for taxes' },
      energy: { target: 5, hint: 'Build Solar Plants' }
    };
  }
};

export const LEVEL_CONFIGS = {
  rural: {
    name: 'Rural Valley',
    initialPollution: { air: 5, water: 5, land: 5 },
  },
  sub_urban: {
    name: 'Suburban Sprawl',
    initialPollution: { air: 15, water: 10, land: 10 },
  },
  urban: {
    name: 'Urban Center',
    initialPollution: { air: 30, water: 25, land: 20 },
  },
  capital: {
    name: 'Eco Capital',
    initialPollution: { air: 40, water: 35, land: 30 },
  },
};
