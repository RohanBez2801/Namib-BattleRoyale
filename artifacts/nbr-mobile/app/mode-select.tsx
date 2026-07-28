import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame, type MatchMode } from '@/context/GameContext';
import { ModeCard } from '@/components/ModeCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ModeSelectScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { selectedMode, setSelectedMode } = useGame();

  function handleSelect(mode: MatchMode) {
    setSelectedMode(mode);
  }

  function handlePlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/matchmaking');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(6,8,15,0.0)', 'rgba(6,8,15,0.97)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FF6B1A" />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Select Mode</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Choose your battle</Text>
        </View>
      </View>

      {/* Mode cards */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {(['training', 'solo', 'duo', 'squad'] as MatchMode[]).map(mode => (
          <ModeCard
            key={mode}
            mode={mode}
            selected={selectedMode === mode}
            onSelect={handleSelect}
          />
        ))}
      </ScrollView>

      {/* Play button */}
      <View style={[styles.playBar, { paddingBottom: Math.max(insets.bottom, 16), borderTopColor: colors.border }]}>
        <Pressable
          onPress={handlePlay}
          style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <LinearGradient
            colors={['#FF8C4A', '#FF6B1A', '#CC4D0E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.playBtnInner}
          >
            <MaterialCommunityIcons name="play" size={22} color="#FFFFFF" />
            <Text style={styles.playBtnText}>PLAY NOW</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  playBar: {
    padding: 16, borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(6,8,15,0.97)',
  },
  playBtn: { borderRadius: 14, overflow: 'hidden' },
  playBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 12,
  },
  playBtnText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3 },
});
