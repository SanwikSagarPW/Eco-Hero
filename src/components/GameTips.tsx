import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Building } from '../types';
import { BUILDING_DATA, getObjectives } from '../constants';
import { Info } from 'lucide-react';

export const GameTips: React.FC<{ gameState: GameState, selectedBuilding: Building['type'] | null }> = ({ gameState, selectedBuilding }) => {
  const [currentTip, setCurrentTip] = useState<string>('');

  useEffect(() => {
    // Evaluate priority of tips
    let tip = '';
    const moneyRate = gameState.buildings.reduce((acc, b) => acc + (BUILDING_DATA[b.type as keyof typeof BUILDING_DATA].moneyGen || 0), 0);
    const energyRate = gameState.buildings.reduce((acc, b) => acc + (BUILDING_DATA[b.type as keyof typeof BUILDING_DATA].energyGen || 0), 0);

    if (selectedBuilding) {
       tip = `Place your ${BUILDING_DATA[selectedBuilding].label} on the grid!`;
    } else if (gameState.resources.energy <= 0 && energyRate <= 0) {
       tip = '⚡ POWER OUTAGE! Build Solar Plants to restore power!';
    } else if (gameState.health < 30) {
       tip = '🏥 Health is Critical! Build Parks and clean up pollution!';
    } else if (gameState.resources.money < 20 && moneyRate <= 0 && gameState.buildings.length < 5) {
       tip = '💰 Place City Blocks early to start generating tax money!';
    } else if (gameState.pollution.air > 60 || gameState.pollution.water > 60 || gameState.pollution.land > 60) {
       tip = '⚠️ High Pollution! Build Filters, Parks, or Recycling Centers.';
    } else if (gameState.happiness < 40) {
       tip = '😠 Citizens are unhappy. Reduce pollution to bring them back!';
    } else if (gameState.resources.money < 30 && moneyRate <= 0) {
       tip = '💸 You are running out of money! Build more City Blocks or Factories.';
    } else {
       // Default to objectives
       const objs = getObjectives(gameState.level);
       const popDiff = objs.pop.target - gameState.population;
       const moneyDiff = objs.money.target - gameState.resources.money;
       
       if (popDiff > 0) {
          tip = `📈 Objective: Reach ${objs.pop.target} population. (${objs.pop.hint})`;
       } else if (moneyDiff > 0) {
          tip = `💵 Objective: Save $${objs.money.target}. (${objs.money.hint})`;
       } else {
          tip = '🌟 Keep balancing the ecosystem to level up!';
       }
    }

    setCurrentTip(tip);
  }, [gameState, selectedBuilding]);

  return (
    <div className="absolute bottom-20 md:bottom-24 landscape:bottom-4 landscape:left-1/2 left-1/2 transform -translate-x-1/2 w-[90%] max-w-lg pointer-events-none z-50 flex justify-center">
      <AnimatePresence mode="wait">
        {currentTip && (
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-indigo-950/90 backdrop-blur-md text-white px-5 py-3 rounded-full border border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center gap-3 text-xs md:text-sm font-bold text-center"
          >
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
            <span>{currentTip}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
