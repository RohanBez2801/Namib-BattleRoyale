/**
 * AuthContext — handles both Supabase Auth (when configured) and
 * guest mode via AsyncStorage (always available as fallback).
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export interface NBRUser {
  id: string;
  email: string;
  username: string;
  isGuest: boolean;
}

interface AuthContextValue {
  user: NBRUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_KEY = '@nbr_guest_user_v1';

function makeGuestUser(): NBRUser {
  const suffix = Date.now().toString().slice(-4) + Math.random().toString(36).slice(2, 5).toUpperCase();
  return { id: `guest_${suffix}`, email: '', username: `Recruit_${suffix}`, isGuest: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NBRUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listenerSet = useRef(false);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(sessionToUser(session.user));
        } else {
          await loadGuest();
        }
        if (!listenerSet.current) {
          listenerSet.current = true;
          supabase.auth.onAuthStateChange((_event, sess) => {
            if (sess?.user) {
              setUser(sessionToUser(sess.user));
            } else {
              setUser(null);
            }
          });
        }
      } else {
        await loadGuest();
      }
    } catch (e) {
      console.warn('[NBR Auth] init error:', e);
    } finally {
      setLoading(false);
    }
  }

  function sessionToUser(u: { id: string; email?: string; user_metadata?: { username?: string } }): NBRUser {
    return {
      id: u.id,
      email: u.email ?? '',
      username: u.user_metadata?.username ?? u.email?.split('@')[0] ?? 'Player',
      isGuest: false,
    };
  }

  async function loadGuest() {
    const stored = await AsyncStorage.getItem(GUEST_KEY);
    if (stored) setUser(JSON.parse(stored));
  }

  async function signIn(email: string, password: string) {
    setError(null);
    if (!supabase) throw new Error('Supabase not configured. Use guest mode or add your Supabase credentials.');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); throw err; }
  }

  async function signUp(email: string, password: string, username: string) {
    setError(null);
    if (!supabase) throw new Error('Supabase not configured.');
    // emailRedirectTo tells Supabase where to send the user after they click
    // the confirmation link. Using Linking.createURL() gives the correct
    // exp:// URL in Expo Go and the custom scheme in production builds.
    const emailRedirectTo = Linking.createURL('auth/callback');
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo },
    });
    if (err) { setError(err.message); throw err; }
  }

  async function signInAsGuest() {
    setError(null);
    const guest = makeGuestUser();
    await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    setUser(guest);
  }

  async function signOut() {
    if (supabase && !user?.isGuest) {
      await supabase.auth.signOut().catch(() => null);
    }
    await AsyncStorage.removeItem(GUEST_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
