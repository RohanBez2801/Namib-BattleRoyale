import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { StatBadge } from '@/components/StatBadge';
import { BottomNav } from '@/components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ACHIEVEMENTS = [
  { icon: 'sword',          label: 'First Blood',     desc: 'Get your first kill',          check: (s: ReturnType<typeof useGame>['playerStats']) => s.kills >= 1 },
  { icon: 'trophy',         label: 'Champion',        desc: 'Win your first match',          check: (s: ReturnType<typeof useGame>['playerStats']) => s.wins >= 1 },
  { icon: 'target',         label: 'Sharpshooter',    desc: '10 kills in a single match',    check: (_s: ReturnType<typeof useGame>['playerStats']) => false },
  { icon: 'shield-check',   label: 'Survivor',        desc: 'Survive 10 minutes in a match', check: (s: ReturnType<typeof useGame>['playerStats']) => s.avgSurvivalMinutes >= 10 },
  { icon: 'medal',          label: 'Top 10',           desc: 'Finish in the top 10',          check: (s: ReturnType<typeof useGame>['playerStats']) => s.topTen >= 1 },
  { icon: 'run',            label: 'Veteran',          desc: 'Play 50 matches',               check: (s: ReturnType<typeof useGame>['playerStats']) => s.totalMatches >= 50 },
];

function formatMinutes(mins: number) {
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function placementLabel(p: number) {
  if (p === 1) return '#1 🏆';
  if (p === 2) return '#2';
  if (p === 3) return '#3';
  return `#${p}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const { playerStats, recentMatches, isLoadingProfile, refreshProfile } = useGame();

  const kdRatio = playerStats.deaths === 0
    ? playerStats.kills.toFixed(1)
    : (playerStats.kills / playerStats.deaths).toFixed(2);

  const winRate = playerStats.totalMatches === 0
    ? '0.0%'
    : `${((playerStats.wins / playerStats.totalMatches) * 100).toFixed(1)}%`;

  const xpPct = Math.min(playerStats.xp / playerStats.xpToNextLevel, 1);

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
              <View style={styles.heroNameRow}>
                <Text style={[styles.heroName, { color: colors.foreground }]}>{user?.username ?? 'Recruit'}</Text>
                <Pressable onPress={refreshProfile} style={styles.refreshBtn}>
                  {isLoadingProfile
                    ? <ActivityIndicator size="small" color={colors.mutedForeground} />
                    : <MaterialCommunityIcons name="refresh" size={16} color={colors.mutedForeground} />
                  }
                </Pressable>
              </View>
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
                  <Text style={[styles.heroBadgeText, { color: '#22C55E' }]}>
                    {playerStats.totalMatches < 10 ? 'Recruit' : playerStats.wins < 5 ? 'Soldier' : 'Veteran'}
                  </Text>
                </View>
              </View>

              {/* XP bar */}
              <View style={styles.xpRow}>
                <View style={[styles.xpTrack, { backgroundColor: colors.muted }]}>
                  <LinearGradient
                    colors={['#FF8C4A', '#FF6B1A']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.xpFill, { width: `${xpPct * 100}%` as `${number}%` }]}
                  />
                </View>
                <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
                  {playerStats.xp}/{playerStats.xpToNextLevel} XP
                </Text>
              </View>
            </View>
          </View>

          {/* Currency row */}
          <View style={styles.currencyRow}>
            <View style={[styles.currencyChip, { backgroundColor: 'rgba(255,198,0,0.08)', borderColor: 'rgba(255,198,0,0.2)' }]}>
              <MaterialCommunityIcons name="bitcoin" size={18} color="#FFC600" />
              <Text style={[styles.currencyVal, { color: colors.foreground }]}>{playerStats.coins.toLocaleString()}</Text>
              <Text style={[styles.currencyLbl, { color: colors.mutedForeground }]}>Coins</Text>
            </View>
            <View style={[styles.currencyChip, { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }]}>
              <MaterialCommunityIcons name="diamond-stone" size={18} color="#8B5CF6" />
              <Text style={[styles.currencyVal, { color: colors.foreground }]}>{playerStats.premiumCurrency.toLocaleString()}</Text>
              <Text style={[styles.currencyLbl, { color: colors.mutedForeground }]}>Gems</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMBAT STATS</Text>
          <View style={styles.statsRow}>
            <StatBadge label="Matches"  value={String(playerStats.totalMatches)} />
            <StatBadge label="Wins"     value={String(playerStats.wins)} accent />
            <StatBadge label="Win Rate" value={winRate} />
          </View>
          <View style={styles.statsRow}>
            <StatBadge label="Kills"    value={String(playerStats.kills)} />
            <StatBadge label="K/D"      value={kdRatio} />
            <StatBadge label="Top 10"   value={String(playerStats.topTen)} />
          </View>
          <View style={styles.statsRow}>
            <StatBadge label="Best"     value={playerStats.bestPlacement > 0 ? `#${playerStats.bestPlacement}` : '—'} />
            <StatBadge label="Avg Time" value={playerStats.avgSurvivalMinutes > 0 ? formatMinutes(playerStats.avgSurvivalMinutes) : '—'} />
            <StatBadge label="Level"    value={String(playerStats.level)} accent />
          </View>
        </View>

        {/* Recent matches */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT MATCHES</Text>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {recentMatches.length} shown
            </Text>
          </View>

          {recentMatches.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name="controller-off" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Play your first match to see your history here
              </Text>
            </View>
          ) : (
            recentMatches.map((m) => {
              const isWin = m.placement === 1;
              const isTop10 = m.placement <= 10;
              const resultColor = isWin ? '#22C55E' : isTop10 ? '#F5A623' : colors.mutedForeground;
              return (
                <View key={m.id} style={[styles.matchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.matchPlacement, { backgroundColor: isWin ? 'rgba(34,197,94,0.15)' : 'rgba(139,152,184,0.1)' }]}>
                    <Text style={[styles.matchPlacementText, { color: resultColor }]}>
                      {placementLabel(m.placement)}
                    </Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Text style={[styles.matchMode, { color: colors.foreground }]}>
                      {m.mode.charAt(0).toUpperCase() + m.mode.slice(1)}
                    </Text>
                    <Text style={[styles.matchMeta, { color: colors.mutedForeground }]}>
                      {formatMinutes(m.survivalMinutes)} • {new Date(m.playedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.matchStats}>
                    <Text style={[styles.matchKills, { color: colors.foreground }]}>
                      <MaterialCommunityIcons name="skull" size={11} color={colors.mutedForeground} /> {m.kills}
                    </Text>
                    <Text style={[styles.matchXp, { color: '#F5A623' }]}>+{m.xpEarned} XP</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACHIEVEMENTS</Text>
          {ACHIEVEMENTS.map((a) => {
            const unlocked = a.check(playerStats);
            return (
              <View
                key={a.label}
                style={[
                  styles.achieveRow,
                  {
                    backgroundColor: unlocked ? 'rgba(245,166,35,0.06)' : colors.card,
                    borderColor: unlocked ? 'rgba(245,166,35,0.25)' : colors.border,
                  },
                ]}
              >
                <View style={[
                  styles.achieveIcon,
                  { backgroundColor: unlocked ? 'rgba(245,166,35,0.15)' : colors.muted },
                ]}>
                  <MaterialCommunityIcons
                    name={a.icon as never}
                    size={20}
                    color={unlocked ? '#F5A623' : colors.mutedForeground}
                  />
                </View>
                <View style={styles.achieveText}>
                  <Text style={[styles.achieveName, { color: unlocked ? colors.foreground : colors.mutedForeground }]}>
                    {a.label}
                  </Text>
                  <Text style={[styles.achieveDesc, { color: colors.mutedForeground }]}>{a.desc}</Text>
                </View>
                {unlocked && (
                  <MaterialCommunityIcons name="check-circle" size={18} color="#22C55E" />
                )}
              </View>
            );
          })}
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
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroName: { fontSize: 20, fontWeight: '800', flex: 1 },
  refreshBtn: { padding: 4 },
  heroMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '700' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 2 },
  xpText: { fontSize: 9, width: 72, textAlign: 'right' },

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

  matchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  matchPlacement: {
    width: 52, height: 40, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  matchPlacementText: { fontSize: 13, fontWeight: '800' },
  matchInfo: { flex: 1 },
  matchMode: { fontSize: 14, fontWeight: '700' },
  matchMeta: { fontSize: 11, marginTop: 2 },
  matchStats: { alignItems: 'flex-end', gap: 4 },
  matchKills: { fontSize: 13, fontWeight: '700' },
  matchXp: { fontSize: 11, fontWeight: '600' },

  achieveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  achieveIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  achieveText: { flex: 1 },
  achieveName: { fontSize: 14, fontWeight: '700' },
  achieveDesc: { fontSize: 12, marginTop: 1 },
});
