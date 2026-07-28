import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  Alert, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const { signIn, signInAsGuest } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const hasSupabase = !!process.env.EXPO_PUBLIC_SUPABASE_URL;

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(game)/lobby');
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message ?? 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGuestLoading(true);
    await signInAsGuest();
    router.replace('/(game)/lobby');
    setGuestLoading(false);
  }

  return (
    <LinearGradient colors={['#06080F', '#0D1120']} style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <Text style={styles.logoText}>NBR</Text>
          <Text style={styles.logoSub}>NAMIB BATTLE ROYALE</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Namibia's Arena. Your Legend.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {hasSupabase ? (
            <>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <MaterialCommunityIcons name="email-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass(v => !v)}>
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
              >
                <LinearGradient
                  colors={['#FF8C4A', '#FF6B1A']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGrad}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'SIGNING IN…' : 'SIGN IN'}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => router.push('/auth/register')}
                style={styles.linkRow}
              >
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
                  No account?{'  '}
                  <Text style={{ color: '#FF6B1A', fontWeight: '700' }}>Register here</Text>
                </Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            </>
          ) : null}

          {/* Guest button — always available */}
          <Pressable
            onPress={handleGuest}
            disabled={guestLoading}
            style={({ pressed }) => [
              styles.guestBtn,
              { borderColor: 'rgba(245,166,35,0.35)', opacity: pressed || guestLoading ? 0.8 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="ghost-outline" size={20} color="#F5A623" />
            <Text style={styles.guestBtnText}>{guestLoading ? 'ENTERING…' : 'PLAY AS GUEST'}</Text>
          </Pressable>

          {!hasSupabase && (
            <View style={[styles.noticeBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                Add{' '}
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>SUPABASE_URL</Text>
                {' '}and{' '}
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>SUPABASE_ANON_KEY</Text>
                {' '}as Replit Secrets to enable account login and cloud saves.
              </Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollViewCompat>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'space-between' },

  logoBlock: { alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  logoText: {
    fontSize: 76, fontWeight: '900', color: '#FF6B1A', letterSpacing: 5, lineHeight: 84,
    textShadowColor: 'rgba(255,107,26,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
  },
  logoSub: { fontSize: 12, fontWeight: '700', color: '#F5A623', letterSpacing: 6, marginTop: -8 },
  tagline: { fontSize: 14, marginTop: 14, fontStyle: 'italic' },

  form: { gap: 14 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  primaryBtn: { borderRadius: 12, overflow: 'hidden' },
  primaryBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },

  linkRow: { alignItems: 'center', paddingVertical: 2 },
  linkText: { fontSize: 14 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12 },

  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(245,166,35,0.07)',
  },
  guestBtnText: { fontSize: 15, fontWeight: '800', color: '#F5A623', letterSpacing: 2 },

  noticeBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
