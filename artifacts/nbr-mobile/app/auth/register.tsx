import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp, signInAsGuest } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const hasSupabase = !!process.env.EXPO_PUBLIC_SUPABASE_URL;

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Fill in all fields.');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Too short', 'Username must be at least 3 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
      Alert.alert(
        'Account Created',
        'Check your email to confirm your account, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
      );
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signInAsGuest();
    router.replace('/(game)/lobby');
  }

  return (
    <LinearGradient colors={['#06080F', '#0D1120']} style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FF6B1A" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Join the fight for Namibia</Text>
          </View>
        </View>

        <View style={styles.form}>
          {hasSupabase ? (
            <>
              {[
                { icon: 'account-outline', placeholder: 'Username (min 3 chars)', value: username, onChange: setUsername, keyboardType: 'default' as const, autoCapitalize: 'none' as const },
                { icon: 'email-outline', placeholder: 'Email address', value: email, onChange: setEmail, keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
              ].map(({ icon, placeholder, value, onChange, keyboardType, autoCapitalize }) => (
                <View key={placeholder} style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
                  <MaterialCommunityIcons name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={value}
                    onChangeText={onChange}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={false}
                  />
                </View>
              ))}

              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass(v => !v)}>
                  <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
                <MaterialCommunityIcons name="lock-check-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showPass}
                />
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
              >
                <LinearGradient colors={['#FF8C4A', '#FF6B1A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryGrad}>
                  <Text style={styles.primaryText}>{loading ? 'CREATING…' : 'CREATE ACCOUNT'}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.back()} style={styles.linkRow}>
                <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
                  Already have an account?{'  '}
                  <Text style={{ color: '#FF6B1A', fontWeight: '700' }}>Sign In</Text>
                </Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            </>
          ) : null}

          <Pressable
            onPress={handleGuest}
            style={({ pressed }) => [styles.guestBtn, { borderColor: 'rgba(245,166,35,0.35)', opacity: pressed ? 0.8 : 1 }]}
          >
            <MaterialCommunityIcons name="ghost-outline" size={20} color="#F5A623" />
            <Text style={styles.guestText}>PLAY AS GUEST</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: 28 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { padding: 4 },
  headerText: { gap: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#F0E6D2' },
  sub: { fontSize: 13 },

  form: { gap: 14 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  primaryBtn: { borderRadius: 12, overflow: 'hidden' },
  primaryGrad: { paddingVertical: 16, alignItems: 'center' },
  primaryText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },

  linkRow: { alignItems: 'center', paddingVertical: 2 },
  linkText: { fontSize: 14 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerLabel: { fontSize: 12 },

  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(245,166,35,0.07)',
  },
  guestText: { fontSize: 15, fontWeight: '800', color: '#F5A623', letterSpacing: 2 },
});
