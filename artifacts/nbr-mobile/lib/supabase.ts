/**
 * Supabase client for NBR.
 *
 * Returns null when EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY
 * are not set. All consumers must handle the null case — the app falls back
 * to guest mode with AsyncStorage persistence.
 *
 * To enable Supabase auth, add the following Replit Secrets:
 *   SUPABASE_URL     → your Supabase project URL
 *   SUPABASE_ANON_KEY → your Supabase anon/public key
 *
 * The dev script in package.json maps these to EXPO_PUBLIC_ prefixed vars
 * that Expo bundles into the client at Metro build time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          storage: AsyncStorage as any,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
