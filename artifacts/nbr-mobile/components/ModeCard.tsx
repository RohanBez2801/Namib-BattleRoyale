import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import type { MatchMode } from '@/context/GameContext';

interface ModeCardProps {
  mode: MatchMode;
  selected: boolean;
  onSelect: (mode: MatchMode) => void;
}

const MODE_META: Record<MatchMode, {
  label: string;
  icon: string;
  players: string;
  desc: string;
  queueTime: string;
  color: string;
}> = {
  training: {
    label: 'Training',
    icon: 'robot-outline',
    players: 'AI Bots',
    desc: 'Practice your skills against intelligent bots. No rank impact.',
    queueTime: 'Instant',
    color: '#22C55E',
  },
  solo: {
    label: 'Solo',
    icon: 'account',
    players: '20 Players',
    desc: 'Every soldier for themselves. Last one standing wins.',
    queueTime: '~30s',
    color: '#FF6B1A',
  },
  duo: {
    label: 'Duo',
    icon: 'account-multiple',
    players: '40 Players',
    desc: 'Team up with one partner. Revive your fallen ally.',
    queueTime: '~45s',
    color: '#3B82F6',
  },
  squad: {
    label: 'Squad',
    icon: 'account-group',
    players: '60 Players',
    desc: 'Four-person squads battle for supremacy across the desert.',
    queueTime: '~60s',
    color: '#A855F7',
  },
};

export function ModeCard({ mode, selected, onSelect }: ModeCardProps) {
  const colors = useColors();
  const meta = MODE_META[mode];

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(mode);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={selected
          ? [`${meta.color}22`, `${meta.color}11`]
          : ['#111827', '#0D1120']
        }
        style={[
          styles.cardInner,
          { borderColor: selected ? meta.color : colors.border },
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${meta.color}22` }]}>
          <MaterialCommunityIcons
            name={meta.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
            size={28}
            color={meta.color}
          />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={[styles.modeLabel, { color: colors.foreground }]}>{meta.label}</Text>
          <Text style={[styles.players, { color: meta.color }]}>{meta.players}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {meta.desc}
          </Text>
        </View>

        {/* Queue time */}
        <View style={[styles.queueBadge, { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}44` }]}>
          <MaterialCommunityIcons name="timer-outline" size={10} color={meta.color} />
          <Text style={[styles.queueText, { color: meta.color }]}>{meta.queueTime}</Text>
        </View>

        {/* Selected indicator */}
        {selected && (
          <View style={[styles.selectedDot, { backgroundColor: meta.color }]}>
            <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardInner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  modeLabel: { fontSize: 17, fontWeight: '800' },
  players: { fontSize: 12, fontWeight: '700' },
  desc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  queueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  queueText: { fontSize: 10, fontWeight: '700' },
  selectedDot: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
});
