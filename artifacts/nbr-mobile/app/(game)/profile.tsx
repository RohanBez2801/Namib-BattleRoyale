import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { StatBadge } from '@/components/StatBadge';
import { BottomNav } from '@/components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecentMatch {
  placement: string;
  kills: number;
  mode: string;
  duration: string;
  map: string;
  result: 'win' | 'loss' | 'top10';
}

const PLACEHOLDER_MATCHES: RecentMatch[] = [
  { placement: '#1', kills: 0, mode: 'Solo', duration: '0:00', map: 'Desert Map', result: 'win' },
];

const ACHIEVEMENTS = [
  { icon: 'sword',          label: 'First Blood',    desc: 'Get your first kill',    unlocked: false },
  { icon: 'trophy',         label: 'Champion',       desc: 'Win your first match',   unlocked: false },
  { icon: 'car',            label: 'Road Warrior',   desc: 'Travel 1km in a vehicle',unlocked: false },
  { icon: 'target',         label: 'Sharpshooter',   desc: '5 kills with a sniper',  unlocked: false },
  { icon: 'shield-check',   label: 'Survivor',       desc: 'Survive 10 minutes',     unlocked: false },
  { icon: 'run',            label: 'Sprint Champion',desc: 'Sprint 500m in one match',unlocked: false },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const { playerStats } = useGame();

  const kdRatio = playerStats.deaths === 0
    ? playerStats.kills.toFixed(1)
    : (playerStats.kills / playerStats.deaths).toFixed(2);

  const winRate = playerStats.totalMatches === 0
    ? '0.0'
    : ((playerStats.wins / playerStats.totalMatches) * 100).toFixed(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 8) + 56 + 16 }}
      >
        {/* Hero card */}
        <LinearGradient colors={['#0D1120', '#111827']} style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <View style={styles.heroInner}>
            <LinearGradient colors={['#FF8C4A', '#FF6B1A']} style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>
                {user?.username?.charAt(0).toUpperCase() ?? 'P'}
              </Text>
            </LinearGradient>

            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: colors.foreground }]}>{user?.username ?? 'Recruit'}</Text>
              <View style={styles.heroMeta}>
                {user?.isGuest && (
                  <View style={[styles.heroBadge, { backgroundColor: 'rgba(139,152,184,0.15)', borderColor: colors.border }]}>
                    <Text style={[styles.heroBadgeText, { color: colors.mutedForeground }]}>Guest</Text>
                  </View>
                )}
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(245,166,35,0.15)', borderColor: 'rgba(245,166,35,0.3)' }]}>
                  <MaterialCommunityIcons name="star" size={10} color="#F5A623" />
                  <Text style={[styles.heroBadgeText, { color: '#F5A623' }]}>Lv. {playerStats.level}</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' }]}>
                  <Text style={[styles.heroBadgeText, { color: '#22C55E' }]}>Recruit Rank</Text>
                </View>
              </View>

              {/* XP bar */}
              <View style={styles.xpRow}>
                <View style={[styles.xpTrack, { backgroundColor: colors.border }]}>
                  <LinearGradient
                    colors={['#FF6B1A', '#F5A623']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.xpFill, { width: `${(playerStats.xp / playerStats.xpToNextLevel) * 100}%` as any }]}
                  />
                </View>
                <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
                  {playerStats.xp}/{playerStats.xpToNextLevel}
                </Text>
              </View>
            </View>
          </View>

          {/* Currency row */}
          <View style={styles.currencyRow}>
            <View style={[styles.currencyChip, { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: 'rgba(245,166,35,0.25)' }]}>
              <MaterialCommunityIcons name="gold" size={14} color="#F5A623" />
              <Text style={[styles.currencyVal, { color: '#F5A623' }]}>{playerStats.coins.toLocaleString()}</Text>
              <Text style={[styles.currencyLbl, { color: colors.mutedForeground }]}>Coins</Text>
            </View>
            <View style={[styles.currencyChip, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)' }]}>
              <MaterialCommunityIcons name="diamond-stone" size={14} color="#3B82F6" />
              <Text style={[styles.currencyVal, { color: '#3B82F6' }]}>{playerStats.premiumCurrency}</Text>
              <Text style={[styles.currencyLbl, { color: colors.mutedForeground }]}>Gems</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMBAT STATS</Text>
          <View style={styles.statsRow}>
            <StatBadge label="K/D Ratio" value={kdRatio} accent />
            <StatBadge label="Kills" value={playerStats.kills} />
            <StatBadge label="Deaths" value={playerStats.deaths} />
          </View>
          <View style={styles.statsRow}>
            <StatBadge label="Matches" value={playerStats.totalMatches} />
            <StatBadge label="Wins" value={playerStats.wins} accent />
            <StatBadge label="Win Rate" value={`${winRate}%`} />
          </View>
          <View style={styles.statsRow}>
            <StatBadge label="Top 10" value={playerStats.topTen} />
            <StatBadge label="Best Place" value={playerStats.bestPlacement === 0 ? '—' : `#${playerStats.bestPlacement}`} />
            <StatBadge label="Avg Survive" value={`${playerStats.avgSurvivalMinutes}m`} />
          </View>
        </View>

        {/* Recent matches */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT MATCHES</Text>
          {playerStats.totalMatches === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="map-search-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Play your first match to start building your history
              </Text>
            </View>
          ) : null}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACHIEVEMENTS</Text>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>0 / {ACHIEVEMENTS.length}</Text>
          </View>
          {ACHIEVEMENTS.map(a => (
            <View
              key={a.label}
              style={[styles.achieveRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: a.unlocked ? 1 : 0.6 }]}
            >
              <View style={[styles.achieveIcon, { backgroundColor: a.unlocked ? 'rgba(255,107,26,0.15)' : 'rgba(139,152,184,0.1)' }]}>
                <MaterialCommunityIcons
                  name={a.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={22}
                  color={a.unlocked ? '#FF6B1A' : colors.mutedForeground}
                />
              </View>
              <View style={styles.achieveText}>
                <Text style={[styles.achieveName, { color: colors.foreground }]}>{a.label}</Text>
                <Text style={[styles.achieveDesc, { color: colors.mutedForeground }]}>{a.desc}</Text>
              </View>
              <MaterialCommunityIcons
                name={a.unlocked ? 'check-circle' : 'lock-outline'}
                size={18}
                color={a.unlocked ? '#22C55E' : colors.mutedForeground}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="profile" insetBottom={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: { padding: 20, paddingBottom: 16, gap: 16 },
  heroInner: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  heroAvatarText: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontSize: 20, fontWeight: '800' },
  heroMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '700' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 2 },
  xpText: { fontSize: 9, width: 52, textAlign: 'right' },

  currencyRow: { flexDirection: 'row', gap: 10 },
  currencyChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  currencyVal: { fontSize: 14, fontWeight: '800', flex: 1 },
  currencyLbl: { fontSize: 10 },

  section: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionCount: { fontSize: 11 },

  statsRow: { flexDirection: 'row', gap: 10 },

  emptyBox: {
    borderWidth: 1, borderRadius: 14, padding: 28,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  achieveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  achieveIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  achieveText: { flex: 1 },
  achieveName: { fontSize: 14, fontWeight: '700' },
  achieveDesc: { fontSize: 12, marginTop: 1 },
});
