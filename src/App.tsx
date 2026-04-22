/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, AIAdvice, Building, GameEvent } from './types';
import { INITIAL_STATE, INITIAL_RESOURCES, BUILDING_DATA, LEVEL_CONFIGS, getObjectives } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { WeatherOverlay } from './components/WeatherOverlay';
import { GameTips } from './components/GameTips';
import { playSound } from './utils/audio';
import { AlertCircle, X, Trophy, Skull, Activity, Users, DollarSign } from 'lucide-react';
import { generateCityMap } from './utils';

// Fallback advice generator
function getFallbackAdvice(state: GameState): AIAdvice {
  const avgPollution = (state.pollution.air + state.pollution.water + state.pollution.land) / 3;
  
  if (state.health < 30) {
    return {
      message: "Health is critical! Focus on reducing pollution.",
      suggestion: "Build more parks and use the clean-up tool.",
      priority: "high"
    };
  }
  
  if (state.happiness < 35) {
    return {
      message: "Citizens are unhappy!",
      suggestion: "Check energy levels and reduce pollution.",
      priority: "high"
    };
  }
  
  if (avgPollution > 60) {
    return {
      message: "Pollution levels are too high!",
      suggestion: "Build water filters and parks to clean the environment.",
      priority: "high"
    };
  }
  
  if (state.resources.energy < 10) {
    return {
      message: "Energy shortage detected!",
      suggestion: "Build more solar plants for clean energy.",
      priority: "medium"
    };
  }
  
  if (state.resources.money < 500) {
    return {
      message: "Budget is running low.",
      suggestion: "Build city blocks or factories to increase income.",
      priority: "medium"
    };
  }
  
  return {
    message: "Keep up the good work, Eco Hero!",
    suggestion: "Continue balancing growth with sustainability.",
    priority: "low"
  };
}

// Fallback event generator
function generateFallbackEvent(state: GameState): GameEvent {
  const events: GameEvent[] = [
    {
      id: "event-1",
      title: "Sudden Storm",
      description: "A heavy storm has reduced air pollution but damaged infrastructure.",
      impact: { air: -15, water: 5, money: -300 },
      type: "disaster"
    },
    {
      id: "event-2",
      title: "Community Clean-Up",
      description: "Citizens organized a clean-up drive! Pollution decreased.",
      impact: { air: -10, water: -10, land: -10, health: 5 },
      type: "opportunity"
    },
    {
      id: "event-3",
      title: "Solar Subsidy",
      description: "Government offers incentives for green energy!",
      impact: { money: 500 },
      type: "opportunity"
    },
    {
      id: "event-4",
      title: "Heat Wave",
      description: "Extreme temperatures increase energy demand and air pollution.",
      impact: { air: 15, health: -8 },
      type: "alert"
    },
    {
      id: "event-5",
      title: "Factory Spill",
      description: "A nearby factory spilled chemicals into the water supply.",
      impact: { water: 20, health: -10 },
      type: "disaster"
    },
    {
      id: "event-6",
      title: "Green Innovation",
      description: "New eco-friendly technology reduces pollution citywide!",
      impact: { air: -12, water: -8, land: -8 },
      type: "opportunity"
    }
  ];
  
  return events[Math.floor(Math.random() * events.length)];
}

export default function App() {
  const [screen, setScreen] = useState<'home' | 'how-to' | 'game' | 'game-over' | 'level-complete'>('home');
  const [lossReason, setLossReason] = useState('');
  const [gameState, setGameState] = useState<GameState>(() => {
    const { terrain, buildings } = generateCityMap(10, 'rural');
    return {
      pollution: { ...INITIAL_STATE },
      health: 50,
      population: 0,
      happiness: 50,
      resources: { ...INITIAL_RESOURCES },
      buildings,
      terrain,
      gridSize: 10,
      level: 'rural',
      ecoPoints: 0,
      time: 12,
      weather: 'clear',
    };
  });

  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building['type'] | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);

  // Game Loop: Update pollution and health
  useEffect(() => {
    if (screen !== 'game') return;

    const timer = setInterval(() => {
      setGameState(prev => {
        // Update Time & Weather
        let newTime = prev.time + 0.5; // Progress time (5x faster)
        if (newTime >= 24) newTime = 0;
        
        let newWeather = prev.weather;
        if (Math.random() < 0.03) { // 3% chance per second to change (6x faster)
          const weathers: GameState['weather'][] = ['clear', 'rainy', 'snowy'];
          newWeather = weathers[Math.floor(Math.random() * weathers.length)];
        }

        const newPollution = { ...prev.pollution };
        let healthChange = 0;
        let moneyDelta = 0;
        let energyDelta = 0;
        let happinessDelta = 0;
        let maxPopulation = 0;

        const isNight = newTime < 6 || newTime > 20;

        // Impact from buildings
        prev.buildings.forEach(b => {
          const data = BUILDING_DATA[b.type as keyof typeof BUILDING_DATA];
          
          // Solar efficiency at night
          let solarEfficiency = 1;
          if (b.type === 'solar') {
            if (isNight) solarEfficiency = 0;
            else if (newWeather === 'rainy') solarEfficiency = 0.5;
            else if (newWeather === 'snowy') solarEfficiency = 0.8;
          }

          // Pollution impact modified by weather (reduced eco system speed)
          let pollutionMultiplier = 0.15; // heavily reduced
          if (newWeather === 'rainy') pollutionMultiplier = 0.05; // Rain cleans air
          
          newPollution.air = Math.min(100, Math.max(0, newPollution.air + data.pollutionImpact.air * pollutionMultiplier));
          newPollution.water = Math.min(100, Math.max(0, newPollution.water + data.pollutionImpact.water * pollutionMultiplier));
          newPollution.land = Math.min(100, Math.max(0, newPollution.land + data.pollutionImpact.land * pollutionMultiplier));
          
          moneyDelta += data.moneyGen || 0;
          energyDelta += (data.energyGen || 0) * (b.type === 'solar' ? solarEfficiency : 1);
          happinessDelta += data.happinessImpact || 0;
          maxPopulation += data.populationCap || 0;
        });

        // Base pollution increase (slower by 5x)
        newPollution.air = Math.min(100, Math.max(0, newPollution.air + 0.01));
        newPollution.water = Math.min(100, Math.max(0, newPollution.water + 0.01));
        newPollution.land = Math.min(100, Math.max(0, newPollution.land + 0.01));

        // Health calculation (slower eco reactions)
        const avgPollution = (newPollution.air + newPollution.water + newPollution.land) / 3;
        healthChange = (40 - avgPollution) * 0.02; // Health drops/recovers 4x slower
        const newHealth = Math.min(100, Math.max(0, prev.health + healthChange));

        // Happiness calculation
        const pollutionPenalty = avgPollution > 40 ? (avgPollution - 40) * 0.4 : 0; 
        const energyPenalty = prev.resources.energy <= 0 ? 25 : 0; 
        let targetHappiness = 50 + happinessDelta - pollutionPenalty - energyPenalty;
        targetHappiness = Math.min(100, Math.max(0, targetHappiness));
        const newHappiness = prev.happiness + (targetHappiness - prev.happiness) * 0.01; // Slower transition

        // Population calculation (slower growth/shrink)
        let newPopulation = prev.population;
        if (newHappiness > 40 && newPopulation < maxPopulation) {
          newPopulation += Math.max(1, Math.floor((maxPopulation - newPopulation) * 0.01));
        } else if (newHappiness < 30 && newPopulation > 0) {
          newPopulation -= Math.max(1, Math.floor(newPopulation * 0.01));
        }
        newPopulation = Math.min(maxPopulation, Math.max(0, newPopulation));

        return {
          ...prev,
          pollution: newPollution,
          health: newHealth,
          happiness: newHappiness,
          population: newPopulation,
          resources: {
            ...prev.resources,
            money: prev.resources.money + moneyDelta,
            energy: Math.max(0, prev.resources.energy + energyDelta)
          },
          time: newTime,
          weather: newWeather,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  // Win/Loss Condition Loop
  useEffect(() => {
    if (screen !== 'game') return;

    if (gameState.health <= 0) {
      setLossReason("Pollution destroyed the ecosystem!");
      setScreen('game-over');
      playSound('lose');
    } else if (gameState.happiness <= 0) {
      setLossReason("The citizens were too unhappy and left!");
      setScreen('game-over');
      playSound('lose');
    } else {
      const objs = getObjectives(gameState.level);
      if (
        gameState.health >= objs.health.target && 
        gameState.population >= objs.pop.target && 
        gameState.resources.money >= objs.money.target &&
        gameState.resources.energy >= objs.energy.target
      ) {
        setScreen('level-complete');
        playSound('win');
      }
    }
  }, [gameState.health, gameState.happiness, gameState.population, gameState.resources.money, gameState.resources.energy, gameState.level, screen]);

  // Use a ref to keep the latest gamestate for intervals without resetting them
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Advice Loop (using fallback)
  useEffect(() => {
    if (screen !== 'game') return;

    const fetchAdvice = () => {
      const newAdvice = getFallbackAdvice(gameStateRef.current);
      setAdvice(newAdvice);
    };

    fetchAdvice();
    const timer = setInterval(fetchAdvice, 60000); // Every 60 seconds
    return () => clearInterval(timer);
  }, [screen]);

  // Random Event Loop (using fallback)
  useEffect(() => {
    if (screen !== 'game') return;

    const timer = setInterval(() => {
      if (Math.random() > 0.5 && !activeEvent) {
        const event = generateFallbackEvent(gameStateRef.current);
        playSound('event');
        setActiveEvent(event);
        
        // Apply immediate impact
        setGameState(prev => ({
          ...prev,
          pollution: {
            air: Math.min(100, Math.max(0, prev.pollution.air + (event.impact.air || 0))),
            water: Math.min(100, Math.max(0, prev.pollution.water + (event.impact.water || 0))),
            land: Math.min(100, Math.max(0, prev.pollution.land + (event.impact.land || 0))),
          },
          resources: {
            ...prev.resources,
            money: prev.resources.money + (event.impact.money || 0)
          },
          health: Math.min(100, Math.max(0, prev.health + (event.impact.health || 0)))
        }));
      }
    }, 90000); // Check for events every 90 seconds

    return () => clearInterval(timer);
  }, [screen, activeEvent]); // Run independently of rapid gameState updates

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!selectedBuilding) return;

    const currentState = gameStateRef.current;
    const buildingData = BUILDING_DATA[selectedBuilding];
    
    if (currentState.resources.money < buildingData.cost) {
      playSound('error');
      return;
    }

    if (selectedBuilding === 'clean') {
      playSound('clean');
      setGameState(prev => ({
        ...prev,
        pollution: {
          air: Math.max(0, prev.pollution.air - 7.5),
          water: Math.max(0, prev.pollution.water - 7.5),
          land: Math.max(0, prev.pollution.land - 7.5),
        },
        resources: {
          ...prev.resources,
          money: prev.resources.money - buildingData.cost
        }
      }));
      // Keep clean tool selected for easy spamming
      return;
    }

    // Check if tile is occupied by a building
    if (currentState.buildings.some(b => b.x === x && b.y === y)) {
      playSound('error');
      return;
    }

    // Check terrain constraints
    const tile = currentState.terrain.find(t => t.x === x && t.y === y);
    if (tile?.type === 'water') {
      playSound('error');
      return; // Cannot build on water
    }

    playSound('build');
    const newBuilding: Building = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedBuilding,
      x,
      y
    };

    setGameState(prev => ({
      ...prev,
      buildings: [...prev.buildings, newBuilding],
      resources: {
        ...prev.resources,
        money: prev.resources.money - buildingData.cost
      }
    }));

    setSelectedBuilding(null);
  }, [selectedBuilding]);

  const handleNextLevel = () => {
    playSound('click');
    const levels: Array<GameState['level']> = ['rural', 'sub_urban', 'urban', 'capital'];
    const currentIndex = levels.indexOf(gameState.level);
    const nextLevel = levels[(currentIndex + 1) % levels.length];
    const { terrain, buildings } = generateCityMap(10, nextLevel);

    setGameState(prev => ({
      ...prev,
      level: nextLevel,
      pollution: { ...LEVEL_CONFIGS[nextLevel].initialPollution },
      health: 50,
      population: 0,
      happiness: 50,
      buildings,
      terrain,
      resources: {
        ...prev.resources,
        money: prev.resources.money + 2000 // Bonus for level completion
      }
    }));
    setScreen('game');
    setAdvice(null);
  };

  const handleRestart = () => {
    playSound('click');
    const { terrain, buildings } = generateCityMap(10, 'rural');
    setGameState({
      pollution: { ...INITIAL_STATE },
      health: 50,
      population: 0,
      happiness: 50,
      resources: { ...INITIAL_RESOURCES },
      buildings,
      terrain,
      gridSize: 10,
      level: 'rural',
      ecoPoints: 0,
    });
    setScreen('game');
    setAdvice(null);
  };

  // Determine dynamic skybox based on time and weather
  let skyGradient = 'from-sky-400 via-sky-300 to-sky-200'; // Day
  let isNight = false;
  
  if (gameState.time >= 19 || gameState.time <= 5) {
    skyGradient = 'from-slate-900 via-indigo-950 to-slate-800';
    isNight = true;
  } else if (gameState.time > 5 && gameState.time <= 7) {
    skyGradient = 'from-orange-400 via-rose-300 to-sky-200'; // Dawn
  } else if (gameState.time >= 17 && gameState.time < 19) {
    skyGradient = 'from-indigo-400 via-purple-300 to-orange-200'; // Dusk
  }
  
  // Weather overrides for daytime
  if (!isNight && gameState.weather === 'rainy') {
    skyGradient = 'from-slate-500 via-slate-400 to-slate-300';
  } else if (!isNight && gameState.weather === 'snowy') {
    skyGradient = 'from-slate-300 via-slate-200 to-slate-100';
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-b ${skyGradient} transition-colors duration-1000 font-sans ${isNight ? 'text-slate-200' : 'text-slate-800'} selection:bg-indigo-500 selection:text-white overflow-hidden`}>
      {/* Fun Background decoration (Skybox) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sun / Moon */}
        <div className={`absolute top-10 right-10 md:right-20 w-32 h-32 md:w-48 md:h-48 rounded-full blur-2xl transition-all duration-1000 ${
          isNight ? 'bg-indigo-200 opacity-60 scale-75' : 
          gameState.weather !== 'clear' ? 'bg-yellow-50 opacity-20' : 'bg-yellow-100 opacity-80'
        }`}></div>
        
        {/* Clouds */}
        <motion.div 
          animate={{ x: ['-20vw', '120vw'] }} 
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className={`absolute top-[10%] w-48 h-16 rounded-full blur-md transition-colors duration-1000 ${isNight ? 'bg-indigo-900/40' : 'bg-white/80'}`} 
        />
        <motion.div 
          animate={{ x: ['-20vw', '120vw'] }} 
          transition={{ repeat: Infinity, duration: 55, ease: "linear", delay: 15 }}
          className={`absolute top-[25%] w-64 h-20 rounded-full blur-lg transition-colors duration-1000 ${isNight ? 'bg-indigo-800/30' : 'bg-white/70'}`} 
        />
        <motion.div 
          animate={{ x: ['120vw', '-20vw'] }} 
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
          className={`absolute bottom-[40%] w-40 h-14 rounded-full blur-sm transition-colors duration-1000 ${isNight ? 'bg-slate-800/50' : 'bg-white/60'}`} 
        />
      </div>

      <WeatherOverlay weather={gameState.weather} />

      {screen === 'home' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] mb-12 text-center leading-tight"
          >
            Eco Hero<br/>Simulator
          </motion.h1>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playSound('click'); setScreen('game'); }} 
            className="bg-emerald-500 text-white text-3xl font-black py-4 px-16 rounded-full shadow-[0_10px_0_#047857] hover:translate-y-1 hover:shadow-[0_5px_0_#047857] transition-all mb-6 uppercase tracking-widest border-4 border-white"
          >
            PLAY
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playSound('click'); setScreen('how-to'); }} 
            className="bg-amber-400 text-amber-900 text-xl font-black py-3 px-10 rounded-full shadow-[0_8px_0_#b45309] hover:translate-y-1 hover:shadow-[0_4px_0_#b45309] transition-all border-4 border-white"
          >
            How to Play
          </motion.button>
        </div>
      )}

      {screen === 'how-to' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center p-4 overflow-y-auto hide-scrollbar">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-2xl w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl mt-4 md:mt-8 mb-8 border-8 border-white/50"
          >
            <h2 className="text-3xl md:text-4xl font-black text-indigo-500 mb-6 text-center uppercase tracking-widest">How to Play!</h2>
            
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                <div className="text-4xl md:text-5xl drop-shadow-md mt-1">🏠</div>
                <div>
                  <h3 className="font-black text-lg text-slate-800">1. Grow Your City</h3>
                  <p className="text-slate-600 font-medium text-sm md:text-base">Build <b>City Blocks</b> to increase your population. More people means more tax money, but they need energy and clean air!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                <div className="text-4xl md:text-5xl drop-shadow-md mt-1">⚡</div>
                <div>
                  <h3 className="font-black text-lg text-slate-800">2. Power & Industry</h3>
                  <p className="text-slate-600 font-medium text-sm md:text-base"><b>Factories</b> make lots of money but create heavy pollution. <b>Solar Plants</b> provide clean energy. If energy hits 0, your citizens will become very unhappy!</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                <div className="text-4xl md:text-5xl drop-shadow-md mt-1">🌲</div>
                <div>
                  <h3 className="font-black text-lg text-slate-800">3. Keep It Green</h3>
                  <p className="text-slate-600 font-medium text-sm md:text-base">Pollution lowers Eco Health and Happiness. Build <b>Parks</b>, <b>Water Filters</b>, and use the <b>Clean Up</b> tool to fight pollution and keep everyone smiling.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                <div className="text-4xl md:text-5xl drop-shadow-md mt-1">⭐</div>
                <div>
                  <h3 className="font-black text-lg text-slate-800">4. Win the Level</h3>
                  <p className="text-slate-600 font-medium text-sm md:text-base">Complete the <b>Objectives</b> shown on the left side of the screen (Population, Health, and Money) to advance. If Health or Happiness drops to 0%, it's Game Over!</p>
                </div>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playSound('click'); setScreen('home'); }} 
              className="mt-8 w-full bg-indigo-500 text-white text-2xl font-black py-4 rounded-2xl shadow-[0_8px_0_#3730a3] hover:translate-y-1 hover:shadow-[0_4px_0_#3730a3] transition-all uppercase tracking-widest border-4 border-indigo-400"
            >
              Got it!
            </motion.button>
          </motion.div>
        </div>
      )}

      {screen === 'game' && (
        <>
          <main className="relative w-full h-full flex items-center justify-center p-2 md:p-4">
            <div className="w-full h-full max-w-4xl relative z-10 flex items-center justify-center">
              <GameCanvas state={gameState} onTileClick={handleTileClick} />
            </div>
            
            <HUD 
              state={gameState} 
              advice={advice} 
              selectedBuilding={selectedBuilding}
              onSelectBuilding={setSelectedBuilding}
            />

            <GameTips gameState={gameState} selectedBuilding={selectedBuilding} />
          </main>

          {/* Event Modal */}

          <AnimatePresence>
            {activeEvent && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.8, y: 50, rotate: -2 }}
                  animate={{ scale: 1, y: 0, rotate: 0 }}
                  className="bg-white border-8 border-indigo-400 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
                >
                  <button 
                    onClick={() => setActiveEvent(null)}
                    className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-400 text-white border-4 border-white p-2 rounded-full transition-transform hover:scale-110 shadow-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-2xl ${activeEvent.type === 'disaster' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-800">{activeEvent.title}</h2>
                  </div>
                  
                  <p className="text-slate-600 font-medium leading-relaxed mb-6 text-sm md:text-base">{activeEvent.description}</p>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border-4 border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Impact Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(activeEvent.impact).map(([key, val]) => {
                        const value = val as number;
                        const isGood = (key === 'money' || key === 'health') ? value > 0 : value < 0;
                        return (
                          <div key={key} className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                            <span className="text-xs font-bold capitalize text-slate-500">{key}</span>
                            <span className={`text-sm font-black ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>
                              {value > 0 ? `+${value}` : value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveEvent(null)}
                    className="w-full mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 rounded-2xl transition-transform hover:scale-105 shadow-lg shadow-indigo-500/30 uppercase tracking-widest text-lg border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1"
                  >
                    Got it!
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {screen === 'game-over' && (
        <div className="relative z-50 w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-900/95 backdrop-blur-md overflow-y-auto hide-scrollbar">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm sm:max-w-md w-full my-auto py-4">
            <div className="text-5xl md:text-7xl mb-2 md:mb-4">
              <Skull className="w-16 h-16 md:w-24 md:h-24 mx-auto text-rose-500" />
            </div>
            <h1 className="text-3xl md:text-6xl font-black text-rose-500 mb-2 md:mb-4 uppercase tracking-widest drop-shadow-lg">Game Over</h1>
            <p className="text-base md:text-xl text-white font-bold mb-4 md:mb-8">{lossReason}</p>
            
            <div className="bg-slate-800 rounded-2xl md:rounded-3xl p-3 md:p-6 mb-4 md:mb-8 border-4 border-slate-700">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest mb-2 md:mb-4 text-sm">Final Stats</h3>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="bg-slate-700 p-2 md:p-4 rounded-2xl flex flex-col items-center">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-400 mb-2" />
                  <span className="text-base md:text-2xl font-black text-white">{gameState.population}</span>
                  <span className="text-[8px] md:text-xs text-slate-400 uppercase font-bold">Population</span>
                </div>
                <div className="bg-slate-700 p-2 md:p-4 rounded-2xl flex flex-col items-center">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 mb-2" />
                  <span className="text-base md:text-2xl font-black text-white">{Math.round(gameState.health)}%</span>
                  <span className="text-[8px] md:text-xs text-slate-400 uppercase font-bold">Health</span>
                </div>
              </div>
            </div>

            <button onClick={handleRestart} className="w-full bg-rose-500 text-white text-lg md:text-2xl font-black py-3 md:py-4 px-6 md:px-12 rounded-full shadow-[0_6px_0_#9f1239] hover:translate-y-1 hover:shadow-[0_3px_0_#9f1239] transition-all uppercase tracking-widest border-4 border-white">
              Try Again
            </button>
          </motion.div>
        </div>
      )}

      {screen === 'level-complete' && (
        <div className="relative z-50 w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-emerald-900/95 backdrop-blur-md overflow-y-auto hide-scrollbar">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm sm:max-w-md w-full my-auto py-4">
            <div className="text-5xl md:text-7xl mb-2 md:mb-4">
              <Trophy className="w-16 h-16 md:w-24 md:h-24 mx-auto text-yellow-400" />
            </div>
            <h1 className="text-3xl md:text-6xl font-black text-emerald-400 mb-2 md:mb-4 uppercase tracking-widest drop-shadow-lg">Level Complete!</h1>
            <p className="text-base md:text-xl text-white font-bold mb-4 md:mb-8">You successfully balanced the ecosystem and grew the city!</p>
            
            <div className="bg-emerald-800 rounded-2xl md:rounded-3xl p-3 md:p-6 mb-4 md:mb-8 border-4 border-emerald-700">
              <h3 className="text-emerald-300 font-bold uppercase tracking-widest mb-2 md:mb-4 text-sm">Level Stats</h3>
              <div className="grid grid-cols-3 gap-1 md:gap-3">
                <div className="bg-emerald-700 p-2 md:p-3 rounded-2xl flex flex-col items-center">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-300 mb-1" />
                  <span className="text-base md:text-xl font-black text-white">{gameState.population}</span>
                  <span className="text-[8px] md:text-[10px] text-emerald-300 uppercase font-bold">Pop</span>
                </div>
                <div className="bg-emerald-700 p-2 md:p-3 rounded-2xl flex flex-col items-center">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-300 mb-1" />
                  <span className="text-base md:text-xl font-black text-white">{Math.round(gameState.health)}%</span>
                  <span className="text-[8px] md:text-[10px] text-emerald-300 uppercase font-bold">Health</span>
                </div>
                <div className="bg-emerald-700 p-2 md:p-3 rounded-2xl flex flex-col items-center">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 mb-1" />
                  <span className="text-base md:text-xl font-black text-white">{gameState.resources.money}</span>
                  <span className="text-[8px] md:text-[10px] text-emerald-300 uppercase font-bold">Money</span>
                </div>
              </div>
            </div>

            <button onClick={handleNextLevel} className="w-full bg-emerald-500 text-white text-lg md:text-2xl font-black py-3 md:py-4 px-6 md:px-12 rounded-full shadow-[0_6px_0_#047857] hover:translate-y-1 hover:shadow-[0_3px_0_#047857] transition-all uppercase tracking-widest border-4 border-white">
              Next Level
            </button>
          </motion.div>
        </div>
      )}
      
      {screen === 'game' && (
        <div className={`fixed inset-0 pointer-events-none z-20 transition-colors duration-1000 ${
          isNight ? 'bg-indigo-950/30' : 'bg-transparent'
        }`} />
      )}

    </div>
  );
}
