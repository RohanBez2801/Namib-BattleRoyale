/**
 * GameContext — client-side game state for the current session.
 * Profile and stats are fetched from the API server and cached in AsyncStorage.
 * Guest players get a local UUID that persists across app restarts.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nbrApi, type NBRProfile, type NBRPlayerStats, type NBRMatchHistory } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export type MatchMode = 'training' | 'solo' | 'duo' | 'squad';

// Shape exposed to UI — mirrors API types but always non-null for display
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
  recentMatches: NBRMatchHistory[];
  isInMatchmaking: boolean;
  setIsInMatchmaking: (v: boolean) => void;
  profileId: string | null;
  isLoadingProfile: boolean;
  refreshProfile: () => Promise<void>;
  recordMatchResult: (result: {
    matchId: string;
    mode: string;
    placement: number;
    kills?: number;
    damageDealt?: number;
    survivalMinutes?: number;
    coinsEarned?: number;
    xpEarned?: number;
  }) => Promise<void>;
}

const DEFAULT_STATS: PlayerStats = {
  level: 1,
  xp: 0,
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

const PROFILE_ID_KEY = '@nbr_profile_id_v1';

const GameContext = createContext<GameContextValue | null>(null);

function profileToStats(p: NBRProfile, s: NBRPlayerStats | null): PlayerStats {
  return {
    level: p.level,
    xp: p.xp,
    xpToNextLevel: p.xpToNextLevel,
    coins: p.coins,
    premiumCurrency: p.premiumCurrency,
    totalMatches: s?.totalMatches ?? 0,
    wins: s?.wins ?? 0,
    kills: s?.kills ?? 0,
    deaths: s?.deaths ?? 0,
    topTen: s?.topTen ?? 0,
    bestPlacement: s?.bestPlacement ?? 0,
    avgSurvivalMinutes: s?.avgSurvivalMinutes ?? 0,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<MatchMode>('solo');
  const [playerStats, setPlayerStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [recentMatches, setRecentMatches] = useState<NBRMatchHistory[]>([]);
  const [isInMatchmaking, setIsInMatchmaking] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const getIdentity = useCallback(async (id?: string | null) => {
    const pid = id ?? profileId;
    if (!pid && !user) return null;
    return {
      profileId: pid ?? undefined,
      supabaseId: (!user?.isGuest && user?.id) ? user.id : undefined,
      username: user?.username,
      email: user?.email || undefined,
    };
  }, [user, profileId]);

  const refreshProfile = useCallback(async () => {
    try {
      const storedId = await AsyncStorage.getItem(PROFILE_ID_KEY);
      const identity = await getIdentity(storedId);
      if (!identity) return;

      const { profile, stats } = await nbrApi.getProfile(identity);

      // Persist the server-assigned UUID for subsequent calls
      if (profile.id !== storedId) {
        await AsyncStorage.setItem(PROFILE_ID_KEY, profile.id);
      }
      setProfileId(profile.id);
      setPlayerStats(profileToStats(profile, stats));

      // Fetch match history separately
      const { matches } = await nbrApi.getMatchHistory({ profileId: profile.id }, 10);
      setRecentMatches(matches);
    } catch (err) {
      console.warn('[GameContext] refreshProfile error:', err);
      // Fall back to defaults — API may not be reachable
    }
  }, [getIdentity]);

  // Fetch profile whenever the authenticated user changes
  useEffect(() => {
    if (user === null) {
      // Logged out — keep defaults but don't clear persisted UUID yet
      setIsLoadingProfile(false);
      return;
    }
    setIsLoadingProfile(true);
    refreshProfile().finally(() => setIsLoadingProfile(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const recordMatchResult = useCallback(async (result: Parameters<GameContextValue['recordMatchResult']>[0]) => {
    if (!profileId) return;
    try {
      const { stats, profile } = await nbrApi.recordMatch({ profileId }, result);
      setPlayerStats(profileToStats(profile, stats));
      // Prepend new match to local list
      const { matches } = await nbrApi.getMatchHistory({ profileId }, 10);
      setRecentMatches(matches);
    } catch (err) {
      console.warn('[GameContext] recordMatch error:', err);
    }
  }, [profileId]);

  return (
    <GameContext.Provider value={{
      selectedMode,
      setSelectedMode,
      playerStats,
      recentMatches,
      isInMatchmaking,
      setIsInMatchmaking,
      profileId,
      isLoadingProfile,
      refreshProfile,
      recordMatchResult,
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
