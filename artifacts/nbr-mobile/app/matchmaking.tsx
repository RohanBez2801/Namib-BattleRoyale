import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const TIPS = [
  'Land away from the flight path early to find loot in peace.',
  'Vehicles are loud — use them to reposition, not to sneak.',
  'The safe zone shrinks faster at the end. Keep moving.',
  'Prone position reduces your hitbox but slows movement.',
  'Armour degrades — swap helmets when you find a better one.',
  'Sound is your best radar. Use headphones when possible.',
  'Oryx can spot you from a distance — use dunes for cover.',
  'Energy Drinks heal slowly but don\'t stop while moving.',
];

const MODE_LABELS: Record<string, string> = {
  training: 'Training Mode',
  solo: 'Solo · 20 Players',
  duo: 'Duo · 40 Players',
  squad: 'Squad · 60 Players',
};

const MODE_TARGETS: Record<string, number> = {
  training: 1,
  solo: 20,
  duo: 40,
  squad: 60,
};

export default function MatchmakingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { selectedMode } = useGame();
  const [playerCount, setPlayerCount] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(Math.floor(Math.random() * TIPS.length));

  const spinAngle = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const tipOpacity = useSharedValue(1);

  const target = MODE_TARGETS[selectedMode] ?? 20;

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14 });
    spinAngle.value = withRepeat(
      withTiming(360, { duration: 2200, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  // Simulate players joining
    useEffect(() => {
    const interval = setInterval(() => {
      setPlayerCount(c => {
        const next = c + Math.floor(Math.random() * 4) + 1; // Faster joining
        
        // --- MATCH FOUND LOGIC ---
        if (next >= target) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Wait 1.5 seconds so the player sees "20/20", then DEPLOY
          setTimeout(() => {
            router.replace('/(game)/arena');
          }, 1500);
          
          return target;
        }
        return next;
      });
      setElapsed(e => e + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [target]);

  // Rotate tip every 8s
  useEffect(() => {
    const t = setInterval(() => {
      tipOpacity.value = withTiming(0, { duration: 400 }, () => {
        tipOpacity.value = withTiming(1, { duration: 400 });
      });
      setTipIndex(i => (i + 1) % TIPS.length);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinAngle.value}deg` }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tipStyle = useAnimatedStyle(() => ({ opacity: tipOpacity.value }));

  function handleCancel() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  }

  const elapsedStr = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;
  const progress = playerCount / target;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require('@/assets/images/nbr-splash.png')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.2 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(6,8,15,0.6)', 'rgba(6,8,15,0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Top: mode + elapsed */}
        <View style={styles.topRow}>
          <View style={[styles.modeBadge, { backgroundColor: 'rgba(255,107,26,0.15)', borderColor: 'rgba(255,107,26,0.3)' }]}>
            <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#FF6B1A" />
            <Text style={styles.modeBadgeText}>{MODE_LABELS[selectedMode]}</Text>
          </View>
          <Text style={[styles.elapsed, { color: colors.mutedForeground }]}>{elapsedStr}</Text>
        </View>

        {/* Animated search ring */}
        <Animated.View style={[styles.ringContainer, scaleStyle]}>
          <View style={[styles.ringOuter, { borderColor: colors.border }]}>
            <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
              <View style={[styles.ringArc, { borderColor: '#FF6B1A' }]} />
            </Animated.View>
            <View style={[styles.ringInner, { backgroundColor: 'rgba(255,107,26,0.1)' }]}>
              <MaterialCommunityIcons name="crosshairs-gps" size={40} color="#FF6B1A" />
            </View>
          </View>
        </Animated.View>

        {/* Status */}
        <View style={styles.statusBlock}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>Searching for Match</Text>
          <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
            Namib Desert Map · {selectedMode === 'training' ? 'AI Bots Ready' : 'Connecting players'}
          </Text>
        </View>

        {/* Player count */}
        <View style={[styles.countCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.countRow}>
            <MaterialCommunityIcons name="account-group" size={18} color="#FF6B1A" />
            <Text style={[styles.countText, { color: colors.foreground }]}>
              <Text style={{ color: '#FF6B1A', fontWeight: '900' }}>{playerCount}</Text>
              <Text style={{ color: colors.mutedForeground }}> / {target} players</Text>
            </Text>
          </View>
          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <LinearGradient
              colors={['#FF8C4A', '#FF6B1A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` as any }]}
            />
          </View>
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#F5A623" />
          <Animated.Text style={[styles.tipText, { color: colors.mutedForeground }, tipStyle]}>
            {TIPS[tipIndex]}
          </Animated.Text>
        </View>

        {/* Cancel */}
        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.mutedForeground} />
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>CANCEL</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', gap: 24 },

  topRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  modeBadgeText: { fontSize: 12, fontWeight: '700', color: '#FF6B1A' },
  elapsed: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },

  ringContainer: { marginTop: 16 },
  ringOuter: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  ringArc: {
    position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: 92, borderWidth: 3, borderColor: 'transparent',
    borderTopColor: '#FF6B1A',
  },
  ringInner: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
  },

  statusBlock: { alignItems: 'center', gap: 6 },
  statusTitle: { fontSize: 20, fontWeight: '800' },
  statusSub: { fontSize: 13, textAlign: 'center' },

  countCard: {
    width: '100%', padding: 16,
    borderRadius: 14, borderWidth: 1, gap: 10,
  },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countText: { fontSize: 16, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  tipCard: {
    width: '100%', flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12, borderWidth: 1, marginTop: 'auto',
  },
  cancelText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
