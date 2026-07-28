import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Quality = 'low' | 'medium' | 'high';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, signOut } = useAuth();

  const [quality, setQuality] = useState<Quality>('medium');
  const [masterVolume, setMasterVolume] = useState<'off' | 'low' | 'medium' | 'high'>('high');
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [hapticOn, setHapticOn] = useState(true);
  const [showFps, setShowFps] = useState(false);
  const [autoSprint, setAutoSprint] = useState(false);
  const [colorblindMode, setColorblindMode] = useState(false);

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ],
    );
  }

  function setQualityOption(q: Quality) {
    Haptics.selectionAsync();
    setQuality(q);
  }

  function setVolume(v: typeof masterVolume) {
    Haptics.selectionAsync();
    setMasterVolume(v);
  }

  const QUALITY_OPTIONS: Quality[] = ['low', 'medium', 'high'];
  const VOLUME_OPTIONS: (typeof masterVolume)[] = ['off', 'low', 'medium', 'high'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#0D1120', '#06080F']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 8) + 56 + 20 }}
      >
        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.accountRow}>
              <LinearGradient colors={['#FF8C4A', '#FF6B1A']} style={styles.accountAvatar}>
                <Text style={styles.accountInitial}>{user?.username?.charAt(0).toUpperCase() ?? 'P'}</Text>
              </LinearGradient>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: colors.foreground }]}>{user?.username ?? 'Player'}</Text>
                <Text style={[styles.accountType, { color: colors.mutedForeground }]}>
                  {user?.isGuest ? 'Guest Account' : user?.email ?? 'Connected'}
                </Text>
              </View>
              {user?.isGuest && (
                <Pressable
                  onPress={() => router.replace('/auth/register')}
                  style={[styles.upgradeBtn, { backgroundColor: 'rgba(255,107,26,0.15)', borderColor: 'rgba(255,107,26,0.35)' }]}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Graphics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GRAPHICS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.optionLabel, { color: colors.foreground }]}>Quality</Text>
            <View style={styles.optionRow}>
              {QUALITY_OPTIONS.map(q => (
                <Pressable
                  key={q}
                  onPress={() => setQualityOption(q)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: quality === q ? 'rgba(255,107,26,0.18)' : 'transparent',
                      borderColor: quality === q ? '#FF6B1A' : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionChipText, { color: quality === q ? '#FF6B1A' : colors.mutedForeground }]}>
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow
              label="Show FPS Counter"
              value={showFps}
              onToggle={() => { Haptics.selectionAsync(); setShowFps(v => !v); }}
              colors={colors}
            />
          </View>
        </View>

        {/* Audio */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>AUDIO</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.optionLabel, { color: colors.foreground }]}>Master Volume</Text>
            <View style={styles.optionRow}>
              {VOLUME_OPTIONS.map(v => (
                <Pressable
                  key={v}
                  onPress={() => setVolume(v)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: masterVolume === v ? 'rgba(255,107,26,0.18)' : 'transparent',
                      borderColor: masterVolume === v ? '#FF6B1A' : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionChipText, { color: masterVolume === v ? '#FF6B1A' : colors.mutedForeground }]}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Background Music" value={musicOn} onToggle={() => { Haptics.selectionAsync(); setMusicOn(v => !v); }} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Sound Effects" value={sfxOn} onToggle={() => { Haptics.selectionAsync(); setSfxOn(v => !v); }} colors={colors} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CONTROLS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ToggleRow label="Haptic Feedback" value={hapticOn} onToggle={() => { Haptics.selectionAsync(); setHapticOn(v => !v); }} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Auto Sprint" value={autoSprint} onToggle={() => { Haptics.selectionAsync(); setAutoSprint(v => !v); }} colors={colors} />
          </View>
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCESSIBILITY</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ToggleRow label="Colourblind Mode" value={colorblindMode} onToggle={() => { Haptics.selectionAsync(); setColorblindMode(v => !v); }} colors={colors} />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: 'Version', value: '1.0.0-alpha' },
              { label: 'Build', value: 'Milestone 1' },
              { label: 'Region', value: 'Namibia (Africa)' },
            ].map(({ label, value }) => (
              <React.Fragment key={label}>
                <View style={styles.aboutRow}>
                  <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>{label}</Text>
                  <Text style={[styles.aboutValue, { color: colors.foreground }]}>{value}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomNav active="settings" insetBottom={insets.bottom} />
    </View>
  );
}

function ToggleRow({
  label, value, onToggle, colors,
}: { label: string; value: boolean; onToggle: () => void; colors: ReturnType<typeof import('@/hooks/useColors').useColors> }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: 'rgba(255,107,26,0.4)' }}
        thumbColor={value ? '#FF6B1A' : colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },

  section: { padding: 20, paddingBottom: 0, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },

  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  accountAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  accountInitial: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '700' },
  accountType: { fontSize: 12, marginTop: 1 },
  upgradeBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: '#FF6B1A' },

  optionLabel: { fontSize: 14, fontWeight: '600', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  optionChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
  },
  optionChipText: { fontSize: 12, fontWeight: '700' },

  divider: { height: StyleSheet.hairlineWidth },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleLabel: { fontSize: 14 },

  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  aboutLabel: { fontSize: 13 },
  aboutValue: { fontSize: 13, fontWeight: '600' },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 12, borderWidth: 1,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
