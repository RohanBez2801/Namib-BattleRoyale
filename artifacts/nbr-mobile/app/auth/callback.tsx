/**
 * Auth callback screen — handles the email confirmation deep link from Supabase.
 *
 * Supabase appends the session tokens as URL hash fragments (#access_token=...&refresh_token=...).
 * Expo Router converts hash params into search params, so we read them from useLocalSearchParams.
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    async function handle() {
      const { access_token, refresh_token, error, error_description } = params;

      if (error) {
        console.warn('[AuthCallback] Supabase error:', error, error_description);
        router.replace('/auth/login');
        return;
      }

      if (supabase && access_token && refresh_token) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionErr) {
          console.warn('[AuthCallback] setSession error:', sessionErr.message);
          router.replace('/auth/login');
          return;
        }
      }

      // Navigate to lobby — AuthProvider's onAuthStateChange will pick up the session
      router.replace('/(game)/lobby');
    }

    handle();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#FF6B1A" size="large" />
      <Text style={styles.text}>Confirming your account…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#06080F',
    gap: 20,
  },
  text: {
    color: '#F5A623',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
