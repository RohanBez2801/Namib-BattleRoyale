import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, Pressable, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGame, type MatchMode } from '@/context/GameContext';
import { BottomNav } from '@/components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const BOTTOM_NAV_HEIGHT = 56;

const MODES: { key: MatchMode; label: string; icon: string; count: string }[] = [
  { key: 'training', label: 'Training', icon: 'robot-outline', count: 'AI' },
  { key: 'solo',     label: 'Solo',     icon: 'account',       count: '20p' },
  { key: 'duo',      label: 'Duo',      icon: 'account-multiple', count: '40p' },
  { key: 'squad',    label: 'Squad',    icon: 'account-group', count: '60p' },
];

export default function LobbyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const { selectedMode, setSelectedMode, playerStats } = useGame();

  const playPulse   = useSharedValue(1);
  const titleY      = useSharedValue(24);
  const titleOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    titleY.value      = withSpring(0, { damping: 18, stiffness: 120 });
    titleOpacity.value = withTiming(1, { duration: 600 });
    statsOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    playPulse.value   = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const titleStyle  = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const pulseStyle  = useAnimatedStyle(() => ({ transform: [{ scale: playPulse.value }] }));
  const statsStyle  = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));

  function handlePlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/matchmaking');
  }

  function selectMode(mode: MatchMode) {
    Haptics.selectionAsync();
    setSelectedMode(mode);
  }

  const xpPct = Math.min(playerStats.xp / playerStats.xpToNextLevel, 1);
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero background */}
      <ImageBackground
        source={require('@/assets/images/nbr-splash.png')}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(6,8,15,0.25)', 'rgba(6,8,15,0.55)', 'rgba(6,8,15,1)']}
          locations={[0, 0.45, 0.88]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Player header bar */}
      <Animated.View style={[styles.playerBar, { paddingTop: insets.top + 10 }, statsStyle]}>
        <Pressable onPress={() => router.push('/(game)/profile')} style={styles.avatarWrap}>
          <LinearGradient colors={['#FF8C4A', '#FF6B1A']} style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.username?.charAt(0).toUpperCase() ?? 'P'}
            </Text>
          </LinearGradient>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{playerStats.level}</Text>
          </View>
        </Pressable>

        <View style={styles.playerMeta}>
          <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>
            {user?.username ?? 'Recruit'}
            {user?.isGuest ? <Text style={{ color: colors.mutedForeground, fontWeight: '400', fontSize: 12 }}> (Guest)</Text> : null}
          </Text>
          <View style={[styles.xpTrack, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={['#FF6B1A', '#F5A623']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${xpPct * 100}%` as any }]}
            />
          </View>
          <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
            {playerStats.xp} / {playerStats.xpToNextLevel} XP
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(game)/store')}
          style={[styles.coinBadge, { borderColor: 'rgba(245,166,35,0.3)', backgroundColor: 'rgba(245,166,35,0.1)' }]}
        >
          <MaterialCommunityIcons name="gold" size={14} color="#F5A623" />
          <Text style={[styles.coinText, { color: colors.foreground }]}>
            {playerStats.coins.toLocaleString()}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Main content: title + mode + play */}
      <View style={[styles.main, { paddingBottom: bottomPad + BOTTOM_NAV_HEIGHT + 16 }]}>
        {/* Title */}
        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={styles.titleMain}>NAMIB</Text>
          <Text style={styles.titleSub}>BATTLE ROYALE</Text>
          <View style={styles.titleRule} />
        </Animated.View>

        {/* Mode chips */}
        <View style={styles.modeRow}>
          {MODES.map(m => {
            const active = selectedMode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => selectMode(m.key)}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: active ? 'rgba(255,107,26,0.18)' : 'rgba(17,24,39,0.75)',
                    borderColor: active ? '#FF6B1A' : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={m.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={15}
                  color={active ? '#FF6B1A' : colors.mutedForeground}
                />
                <Text style={[styles.modeLabel, { color: active ? '#FF6B1A' : colors.mutedForeground }]}>
                  {m.label}
                </Text>
                <Text style={[styles.modeCount, { color: active ? '#F5A623' : colors.border }]}>
                  {m.count}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* PLAY button */}
        <Animated.View style={[styles.playWrap, pulseStyle]}>
          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => [styles.playPressable, { opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient
              colors={['#FF8C4A', '#FF6B1A', '#CC4D0E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.playBtn}
            >
              <MaterialCommunityIcons name="play" size={26} color="#FFFFFF" />
              <Text style={styles.playText}>PLAY NOW</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Map info */}
        <View style={styles.mapInfo}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.mapText, { color: colors.mutedForeground }]}>
            {'  '}Namib Desert Map
            {'  ·  '}
            {selectedMode === 'training' ? 'Training Mode' : `${MODES.find(m => m.key === selectedMode)?.count} players`}
          </Text>
        </View>
      </View>

      {/* Season pass strip */}
      <Animated.View style={[styles.seasonStrip, {
        bottom: bottomPad + BOTTOM_NAV_HEIGHT,
        borderTopColor: colors.border,
        backgroundColor: 'rgba(13,17,32,0.8)',
      }, statsStyle]}>
        <View style={styles.seasonLeft}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={14} color="#F5A623" />
          <Text style={[styles.seasonLabel, { color: colors.mutedForeground }]}>Season 1  ·  Week 1</Text>
        </View>
        <View style={[styles.seasonBar, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={['#F5A623', '#FF6B1A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.seasonFill, { width: '5%' }]}
          />
        </View>
        <Text style={[styles.seasonPct, { color: '#F5A623' }]}>5%</Text>
      </Animated.View>

      {/* Bottom nav */}
      <BottomNav active="lobby" insetBottom={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { opacity: 0.4 },

  playerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
    zIndex: 10,
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  levelBadge: {
    position: 'absolute', bottom: -3, right: -3,
    backgroundColor: '#F5A623', borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#06080F',
  },
  levelText: { fontSize: 9, fontWeight: '900', color: '#000' },

  playerMeta: { flex: 1, gap: 3 },
  playerName: { fontSize: 15, fontWeight: '700' },
  xpTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 2 },
  xpLabel: { fontSize: 9 },

  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  coinText: { fontSize: 13, fontWeight: '700' },

  main: {
    flex: 1, justifyContent: 'flex-end',
    paddingHorizontal: 20, gap: 18,
    zIndex: 5,
  },

  titleBlock: { alignItems: 'center', marginBottom: 4 },
  titleMain: {
    fontSize: 54, fontWeight: '900', color: '#FF6B1A', letterSpacing: 8,
    textShadowColor: 'rgba(255,107,26,0.55)',
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 28,
  },
  titleSub: { fontSize: 12, fontWeight: '700', color: '#F5A623', letterSpacing: 8, marginTop: -2 },
  titleRule: { width: 56, height: 2, backgroundColor: '#FF6B1A', marginTop: 10, borderRadius: 1 },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 11, borderWidth: 1, gap: 3,
  },
  modeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  modeCount: { fontSize: 9, fontWeight: '600' },

  playWrap: {
    shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 22, elevation: 12,
  },
  playPressable: { borderRadius: 16, overflow: 'hidden' },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, gap: 14,
  },
  playText: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4 },

  mapInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: -6 },
  mapText: { fontSize: 12 },

  seasonStrip: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  seasonLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 130 },
  seasonLabel: { fontSize: 11 },
  seasonBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  seasonFill: { height: '100%', borderRadius: 2 },
  seasonPct: { fontSize: 11, fontWeight: '700', width: 30, textAlign: 'right' },
});
