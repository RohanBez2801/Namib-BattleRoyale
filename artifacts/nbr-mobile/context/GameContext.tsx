/**
 * GameContext — client-side game state for the current session.
 * Match data, player stats, and UI preferences live here.
 * Persistent stats will sync with Supabase in later milestones.
 */

import React, { createContext, useContext, useState } from 'react';

export type MatchMode = 'training' | 'solo' | 'duo' | 'squad';

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalMatches: number;
  wins: number;
  kills: number;
  deaths: number;
  topTen: number;
  coins: number;
  premiumCurrency: number;
  bestPlacement: number;
  avgSurvivalMinutes: number;
}

export interface GameContextValue {
  selectedMode: MatchMode;
  setSelectedMode: (mode: MatchMode) => void;
  playerStats: PlayerStats;
  isInMatchmaking: boolean;
  setIsInMatchmaking: (v: boolean) => void;
}

const DEFAULT_STATS: PlayerStats = {
  level: 1,
  xp: 320,
  xpToNextLevel: 1000,
  totalMatches: 0,
  wins: 0,
  kills: 0,
  deaths: 0,
  topTen: 0,
  coins: 500,
  premiumCurrency: 0,
  bestPlacement: 0,
  avgSurvivalMinutes: 0,
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [selectedMode, setSelectedMode] = useState<MatchMode>('solo');
  const [playerStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [isInMatchmaking, setIsInMatchmaking] = useState(false);

  return (
    <GameContext.Provider value={{
      selectedMode,
      setSelectedMode,
      playerStats,
      isInMatchmaking,
      setIsInMatchmaking,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
