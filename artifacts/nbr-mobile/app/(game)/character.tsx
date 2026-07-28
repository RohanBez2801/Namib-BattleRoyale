import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BottomNav } from '@/components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Faction {
  id: string;
  name: string;
  region: string;
  color: string;
  initial: string;
}

const FACTIONS: Faction[] = [
  { id: 'ovambo',     name: 'Ovambo',     region: 'Northern Namibia',  color: '#E87722', initial: 'O' },
  { id: 'herero',     name: 'Herero',     region: 'Central Namibia',   color: '#C0392B', initial: 'H' },
  { id: 'himba',      name: 'Himba',      region: 'Kunene Region',     color: '#D35400', initial: 'H' },
  { id: 'damara',     name: 'Damara',     region: 'Erongo Region',     color: '#8E44AD', initial: 'D' },
  { id: 'nama',       name: 'Nama',       region: 'Southern Namibia',  color: '#2980B9', initial: 'N' },
  { id: 'san',        name: 'San',        region: 'Kalahari',          color: '#27AE60', initial: 'S' },
  { id: 'kavango',    name: 'Kavango',    region: 'Kavango Region',    color: '#16A085', initial: 'K' },
  { id: 'caprivian',  name: 'Caprivian',  region: 'Zambezi Region',    color: '#2471A3', initial: 'C' },
  { id: 'baster',     name: 'Baster',     region: 'Rehoboth',          color: '#BA4A00', initial: 'B' },
  { id: 'urban',      name: 'Urban Style',region: 'Windhoek City',     color: '#1ABC9C', initial: 'U' },
];

const OUTFIT_COLORS = ['#FF6B1A', '#F5A623', '#3B82F6', '#22C55E', '#A855F7', '#EF4444', '#06B6D4', '#F59E0B'];

const EMOTES = [
  { id: 'salute',   icon: 'hand-wave',           label: 'Salute' },
  { id: 'dance',    icon: 'music-note',           label: 'Dance' },
  { id: 'taunt',    icon: 'emoticon-wink-outline',label: 'Taunt' },
  { id: 'victory',  icon: 'trophy-outline',       label: 'Victory' },
];

export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [selectedFaction, setSelectedFaction] = useState('ovambo');
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeTab, setActiveTab] = useState<'origin' | 'outfit' | 'emotes'>('origin');

  const faction = FACTIONS.find(f => f.id === selectedFaction) ?? FACTIONS[0];

  function selectFaction(id: string) {
    Haptics.selectionAsync();
    setSelectedFaction(id);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Character</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: 'rgba(255,107,26,0.15)', borderColor: 'rgba(255,107,26,0.4)' }]}>
          <Text style={styles.saveBtnText}>SAVE</Text>
        </Pressable>
      </View>

      {/* Character preview */}
      <View style={styles.preview}>
        <LinearGradient
          colors={[`${faction.color}33`, `${faction.color}11`, 'transparent']}
          style={styles.previewGrad}
        />
        <View style={[styles.avatarLarge, { backgroundColor: `${OUTFIT_COLORS[selectedColor]}22`, borderColor: OUTFIT_COLORS[selectedColor] }]}>
          <Text style={[styles.avatarLargeText, { color: OUTFIT_COLORS[selectedColor] }]}>
            {faction.initial}
          </Text>
        </View>
        <Text style={[styles.previewName, { color: colors.foreground }]}>{faction.name}</Text>
        <Text style={[styles.previewRegion, { color: colors.mutedForeground }]}>{faction.region}</Text>
        <View style={[styles.previewBadge, { backgroundColor: `${faction.color}22`, borderColor: `${faction.color}44` }]}>
          <Text style={[styles.previewBadgeText, { color: faction.color }]}>Origin Background</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['origin', 'outfit', 'emotes'] as const).map(tab => (
          <Pressable
            key={tab}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            style={[styles.tab, activeTab === tab && { borderBottomColor: '#FF6B1A', borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? '#FF6B1A' : colors.mutedForeground }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 8) + 70 + 56 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'origin' && (
          <View style={styles.factionGrid}>
            {FACTIONS.map(f => (
              <Pressable
                key={f.id}
                onPress={() => selectFaction(f.id)}
                style={[
                  styles.factionCard,
                  {
                    backgroundColor: selectedFaction === f.id ? `${f.color}18` : colors.card,
                    borderColor: selectedFaction === f.id ? f.color : colors.border,
                  },
                ]}
              >
                <View style={[styles.factionIcon, { backgroundColor: `${f.color}22` }]}>
                  <Text style={[styles.factionInitial, { color: f.color }]}>{f.initial}</Text>
                </View>
                <Text style={[styles.factionName, { color: colors.foreground }]} numberOfLines={1}>{f.name}</Text>
                <Text style={[styles.factionRegion, { color: colors.mutedForeground }]} numberOfLines={1}>{f.region}</Text>
                {selectedFaction === f.id && (
                  <View style={[styles.factionCheck, { backgroundColor: f.color }]}>
                    <MaterialCommunityIcons name="check" size={10} color="#FFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'outfit' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OUTFIT COLOUR</Text>
            <View style={styles.colorRow}>
              {OUTFIT_COLORS.map((c, i) => (
                <Pressable
                  key={c}
                  onPress={() => { Haptics.selectionAsync(); setSelectedColor(i); }}
                  style={[styles.colorSwatch, {
                    backgroundColor: c,
                    borderWidth: selectedColor === i ? 3 : 0,
                    borderColor: '#FFFFFF',
                    transform: [{ scale: selectedColor === i ? 1.15 : 1 }],
                  }]}
                />
              ))}
            </View>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>COSMETICS</Text>
            {['Outfits', 'Headgear', 'Back Bling', 'Accessories'].map(cat => (
              <View key={cat} style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.mutedForeground} />
                <View>
                  <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>{cat}</Text>
                  <Text style={[styles.comingSoonSub, { color: colors.mutedForeground }]}>Unlockable in Season 1</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'emotes' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>EMOTES</Text>
            <View style={styles.emoteGrid}>
              {EMOTES.map(e => (
                <Pressable
                  key={e.id}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={[styles.emoteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons
                    name={e.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={28}
                    color="#FF6B1A"
                  />
                  <Text style={[styles.emoteLabel, { color: colors.foreground }]}>{e.label}</Text>
                </Pressable>
              ))}
              {[...Array(4)].map((_, i) => (
                <View key={`locked_${i}`} style={[styles.emoteCard, styles.emoteCardLocked, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="lock-outline" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.emoteLabel, { color: colors.mutedForeground }]}>Locked</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <BottomNav active="character" insetBottom={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  saveBtnText: { fontSize: 12, fontWeight: '800', color: '#FF6B1A', letterSpacing: 1 },

  preview: {
    alignItems: 'center', paddingVertical: 24,
    position: 'relative', overflow: 'hidden',
  },
  previewGrad: { ...StyleSheet.absoluteFillObject },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, marginBottom: 12,
  },
  avatarLargeText: { fontSize: 42, fontWeight: '900' },
  previewName: { fontSize: 20, fontWeight: '800' },
  previewRegion: { fontSize: 13, marginTop: 2 },
  previewBadge: {
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  previewBadgeText: { fontSize: 12, fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  tabContent: { flex: 1 },

  factionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factionCard: {
    width: '47%', padding: 14, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 6, position: 'relative',
  },
  factionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  factionInitial: { fontSize: 20, fontWeight: '800' },
  factionName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  factionRegion: { fontSize: 10, textAlign: 'center' },
  factionCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },

  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },

  comingSoon: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10,
  },
  comingSoonTitle: { fontSize: 14, fontWeight: '700' },
  comingSoonSub: { fontSize: 11, marginTop: 1 },

  emoteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emoteCard: {
    width: '47%', padding: 18, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  emoteCardLocked: { opacity: 0.5 },
  emoteLabel: { fontSize: 13, fontWeight: '600' },
});
