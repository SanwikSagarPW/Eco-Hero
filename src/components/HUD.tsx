/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, AIAdvice, Building } from '../types';
import { BUILDING_DATA, getObjectives } from '../constants';
import { playSound } from '../utils/audio';
import { 
  Zap, DollarSign, Brain, CheckCircle2,
  Heart, Users, Smile, Sun, CloudRain, CloudSnow
} from 'lucide-react';

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
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};

interface HUDProps {
  state: GameState;
  advice: AIAdvice | null;
  selectedBuilding: Building['type'] | null;
  onSelectBuilding: (type: Building['type'] | null) => void;
}

export const HUD: React.FC<HUDProps> = ({ 
  state, 
  advice, 
  selectedBuilding, 
  onSelectBuilding
}) => {
  const moneyRate = state.buildings.reduce((acc, b) => acc + (BUILDING_DATA[b.type as keyof typeof BUILDING_DATA].moneyGen || 0), 0);
  const energyRate = state.buildings.reduce((acc, b) => acc + (BUILDING_DATA[b.type as keyof typeof BUILDING_DATA].energyGen || 0), 0);
  const objs = getObjectives(state.level);

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      
      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 p-2 flex flex-col gap-2 pointer-events-none z-50">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {/* Left: Level & Health & Happiness */}
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
            <div className="bg-indigo-600 text-white font-black px-2.5 py-1 rounded-full shadow-md border-2 border-indigo-400 text-xs">
              LVL {state.level === 'rural' ? 1 : state.level === 'sub_urban' ? 2 : state.level === 'urban' ? 3 : 4}
            </div>
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-sm border-2 border-white w-20 sm:w-24 md:w-28">
              <div className="flex justify-between items-center text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-700 mb-0.5 px-0.5">
                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-red-500" /> HEALTH</span>
                <span className="text-emerald-600">{Math.floor(state.health)}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${state.health > 50 ? 'bg-emerald-400' : state.health > 20 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  animate={{ width: `${state.health}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-sm border-2 border-white w-20 sm:w-24 md:w-28">
              <div className="flex justify-between items-center text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-700 mb-0.5 px-0.5">
                <span className="flex items-center gap-0.5"><Smile className="w-2.5 h-2.5 text-amber-500" /> HAPPY</span>
                <span className="text-sky-600">{Math.floor(state.happiness)}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${state.happiness > 50 ? 'bg-sky-400' : state.happiness > 20 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  animate={{ width: `${state.happiness}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Right: Resources & Population */}
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto landscape:pr-20">
            <WeatherBadge weather={state.weather} />
            <ResourceBadge icon={<Users className="w-3.5 h-3.5 text-indigo-500" />} value={Math.floor(state.population)} rate={0} color="border-indigo-200 text-indigo-700" hideRate />
            <ResourceBadge icon={<DollarSign className="w-3.5 h-3.5 text-yellow-500" />} value={Math.floor(state.resources.money)} rate={moneyRate} color="border-yellow-200 text-yellow-700" />
            <ResourceBadge icon={<Zap className="w-3.5 h-3.5 text-blue-500" />} value={Math.floor(state.resources.energy)} rate={energyRate} color="border-blue-200 text-blue-700" />
          </div>
        </div>
      </div>

      {/* LEFT SIDE PANELS */}
      <div className="absolute top-16 md:top-20 left-2 md:left-4 bottom-20 landscape:bottom-4 flex flex-col gap-2 pointer-events-none z-40 w-44 sm:w-48 md:w-56 justify-start overflow-y-auto hide-scrollbar pb-2">
        
        {/* OBJECTIVES PANEL */}
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border-2 border-indigo-200 shadow-sm shrink-0">
          <h3 className="text-[0.5625rem] md:text-[0.625rem] font-black text-indigo-800 uppercase mb-1.5 tracking-wider">Objectives</h3>
          <ul className="text-[0.5625rem] sm:text-[0.625rem] md:text-xs font-bold text-slate-600 space-y-2">
            <li className={`flex flex-col ${state.population >= objs.pop.target ? 'text-emerald-500 opacity-70' : ''}`}>
              <div className={`flex items-center gap-1.5 ${state.population >= objs.pop.target ? 'line-through' : ''}`}>
                <Users className="w-3 h-3" /> {objs.pop.target} Pop
              </div>
              {state.population < objs.pop.target && <span className="text-[0.5rem] text-indigo-500 ml-4.5 leading-tight">Hint: {objs.pop.hint}</span>}
            </li>
            <li className={`flex flex-col ${state.health >= objs.health.target ? 'text-emerald-500 opacity-70' : ''}`}>
              <div className={`flex items-center gap-1.5 ${state.health >= objs.health.target ? 'line-through' : ''}`}>
                <Heart className="w-3 h-3" /> {objs.health.target}% Health
              </div>
              {state.health < objs.health.target && <span className="text-[0.5rem] text-indigo-500 ml-4.5 leading-tight">Hint: {objs.health.hint}</span>}
            </li>
            <li className={`flex flex-col ${state.resources.money >= objs.money.target ? 'text-emerald-500 opacity-70' : ''}`}>
              <div className={`flex items-center gap-1.5 ${state.resources.money >= objs.money.target ? 'line-through' : ''}`}>
                <DollarSign className="w-3 h-3" /> ${objs.money.target}
              </div>
              {state.resources.money < objs.money.target && <span className="text-[0.5rem] text-indigo-500 ml-4.5 leading-tight">Hint: {objs.money.hint}</span>}
            </li>
            <li className={`flex flex-col ${state.resources.energy >= objs.energy.target ? 'text-emerald-500 opacity-70' : ''}`}>
              <div className={`flex items-center gap-1.5 ${state.resources.energy >= objs.energy.target ? 'line-through' : ''}`}>
                <Zap className="w-3 h-3" /> {objs.energy.target} Energy
              </div>
              {state.resources.energy < objs.energy.target && <span className="text-[0.5rem] text-indigo-500 ml-4.5 leading-tight">Hint: {objs.energy.hint}</span>}
            </li>
          </ul>
        </div>

        {/* AI Advisor */}
        <AnimatePresence>
          {advice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -50 }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md border-2 border-indigo-400 rounded-2xl p-2.5 shadow-xl shrink-0 hidden sm:block"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="bg-indigo-100 p-1 rounded-full">
                  <Brain className="w-3 h-3 text-indigo-500" />
                </div>
                <span className="text-[0.5625rem] font-black text-indigo-500 uppercase">Advisor</span>
              </div>
              <p className="text-[0.625rem] md:text-xs text-slate-700 font-bold leading-tight mb-1.5">"{advice.message}"</p>
              <p className="text-[0.5625rem] md:text-[0.625rem] text-indigo-700 bg-indigo-50 p-1.5 rounded-lg font-medium">{advice.suggestion}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT SIDE PANELS */}
      <div className="absolute top-16 md:top-20 right-2 md:right-4 landscape:right-28 flex flex-col gap-2 pointer-events-none z-40 w-36 sm:w-40 md:w-48 justify-start">
        {/* POLLUTION BREAKDOWN */}
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border-2 border-rose-200 shadow-sm shrink-0">
          <h3 className="text-[0.5625rem] md:text-[0.625rem] font-black text-rose-800 uppercase mb-1.5 tracking-wider">Pollution Levels</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[0.5625rem] font-bold text-slate-600 mb-0.5"><span>☁️ Air</span><span>{Math.floor(state.pollution.air)}%</span></div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-500" style={{ width: `${state.pollution.air}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-[0.5625rem] font-bold text-slate-600 mb-0.5"><span>💧 Water</span><span>{Math.floor(state.pollution.water)}%</span></div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${state.pollution.water}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-[0.5625rem] font-bold text-slate-600 mb-0.5"><span>🗑️ Land</span><span>{Math.floor(state.pollution.land)}%</span></div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-amber-700" style={{ width: `${state.pollution.land}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM / SIDE BAR: Build Menu */}
      <div className="absolute bottom-0 left-0 right-0 landscape:top-0 landscape:bottom-0 landscape:left-auto landscape:right-0 landscape:w-24 pointer-events-auto flex flex-col justify-end landscape:justify-center z-40">
        <div className="bg-white/90 backdrop-blur-xl border-t-2 landscape:border-t-0 landscape:border-l-2 border-white rounded-t-2xl landscape:rounded-t-none landscape:rounded-l-2xl p-1 md:p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] landscape:shadow-[-10px_0_40px_rgba(0,0,0,0.15)] landscape:h-full flex flex-col justify-center">
          <div className="flex gap-1 md:gap-2 overflow-visible landscape:overflow-y-auto landscape:hide-scrollbar landscape:flex-col landscape:h-full items-center justify-between landscape:justify-start w-full max-w-4xl mx-auto landscape:py-2">
            {(Object.keys(BUILDING_DATA) as Array<Building['type']>).map((type, index, arr) => (
                <button
                  key={type}
                  onClick={() => {
                    playSound('click');
                    onSelectBuilding(selectedBuilding === type ? null : type);
                  }}
                  className={`
                    relative group flex-1 landscape:flex-none landscape:w-full flex flex-col items-center justify-center p-0.5 rounded-lg transition-all h-14 sm:h-16 md:h-20 landscape:h-16 landscape:min-h-[4rem] border-2
                    ${selectedBuilding === type 
                      ? 'bg-indigo-50 border-indigo-400 scale-[1.02] shadow-md z-10' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:-translate-y-0.5'}
                  `}
                >
                  {/* Tooltip */}
                  <div className={`absolute bottom-full landscape:bottom-auto landscape:right-full landscape:top-1/2 landscape:-translate-y-1/2 landscape:mr-2 mb-2 w-40 sm:w-48 bg-slate-900/95 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border border-slate-700
                    ${index < 2 ? 'left-0 landscape:left-auto' : index > arr.length - 3 ? 'right-0 landscape:right-full' : 'left-1/2 -translate-x-1/2 landscape:left-auto landscape:translate-x-0'}
                    landscape:!top-1/2 landscape:!-translate-y-1/2 landscape:!bottom-auto landscape:!left-auto landscape:!right-full
                  `}>
                    <p className="font-bold text-indigo-300 mb-1 text-sm">{BUILDING_DATA[type].label}</p>
                    <p className="mb-2 text-slate-200 leading-tight text-xs">{BUILDING_DATA[type].description}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {BUILDING_DATA[type].moneyGen !== 0 && <span className={BUILDING_DATA[type].moneyGen > 0 ? 'text-emerald-300' : 'text-rose-300'}>$: {BUILDING_DATA[type].moneyGen > 0 ? '+' : ''}{BUILDING_DATA[type].moneyGen}</span>}
                      {BUILDING_DATA[type].energyGen !== 0 && <span className={BUILDING_DATA[type].energyGen > 0 ? 'text-blue-300' : 'text-rose-300'}>⚡: {BUILDING_DATA[type].energyGen > 0 ? '+' : ''}{BUILDING_DATA[type].energyGen}</span>}
                    </div>
                  </div>

                  <div className="text-center flex flex-col items-center justify-center h-full w-full">
                    {(() => {
                      const bData = BUILDING_DATA[type];
                      return (
                        <div className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 mb-0.5 rounded-full bg-gradient-to-br ${bData.color} shadow-sm border border-white transform transition-transform group-hover:scale-105`}>
                          <ImageWithFallback 
                            src={bData.image} 
                            fallbackSrc={(bData as any).fallbackImage} 
                            alt={bData.label} 
                            className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 object-contain" 
                          />
                        </div>
                      );
                    })()}
                    <span className="text-[8px] md:text-[9px] font-black text-slate-700 leading-tight block truncate w-full px-0.5">{BUILDING_DATA[type].label}</span>
                    <span className={`text-[8px] md:text-[9px] font-bold mt-0.5 px-1.5 rounded-full ${selectedBuilding === type ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      ${BUILDING_DATA[type].cost}
                    </span>
                  {/* ... */}
                  </div>
                </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherBadge = ({ weather }: { weather: GameState['weather'] }) => (
  <div className="bg-white/90 backdrop-blur-md border-2 rounded-full py-1 px-2 shadow-sm flex items-center gap-1 border-sky-200 text-sky-700">
    <div className="bg-white rounded-full p-0.5 shadow-sm">
      {weather === 'clear' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : weather === 'rainy' ? <CloudRain className="w-3.5 h-3.5 text-blue-500" /> : <CloudSnow className="w-3.5 h-3.5 text-slate-500" />}
    </div>
  </div>
);

const ResourceBadge = ({ icon, value, rate, color, hideRate }: { icon: React.ReactNode, value: number, rate: number, color: string, hideRate?: boolean }) => {
  // Format rate to 1 dec place if it's not a whole integer, otherwise show whole integer.
  const formattedRate = rate % 1 === 0 ? rate : rate.toFixed(1);

  return (
    <div className={`bg-white/90 backdrop-blur-md border-2 rounded-full py-1 px-2 shadow-sm flex items-center gap-1 ${color}`}>
      <div className="bg-white rounded-full p-0.5 shadow-sm">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xs md:text-sm font-black">{value}</span>
        {!hideRate && (
          <span className={`text-[0.5rem] md:text-[0.5625rem] font-black ${rate >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {rate >= 0 ? '+' : ''}{formattedRate}/s
          </span>
        )}
      </div>
    </div>
  );
};
