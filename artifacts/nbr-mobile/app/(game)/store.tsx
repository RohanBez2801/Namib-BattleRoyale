import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { BottomNav } from '@/components/BottomNav';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type StoreTab = 'featured' | 'outfits' | 'weapons' | 'emotes';

const FEATURED_ITEMS = [
  { id: '1', name: 'Desert Ranger',     category: 'Outfit',       rarity: 'Epic',      price: 800,   color: '#A855F7', icon: 'account-cowboy-hat' },
  { id: '2', name: 'Oryx Warrior',      category: 'Outfit',       rarity: 'Legendary', price: 1200,  color: '#F5A623', icon: 'account-star' },
  { id: '3', name: 'Dune Camo',         category: 'Weapon Skin',  rarity: 'Rare',      price: 400,   color: '#3B82F6', icon: 'pistol' },
  { id: '4', name: 'Victory Dance',     category: 'Emote',        rarity: 'Uncommon',  price: 200,   color: '#22C55E', icon: 'music-note' },
  { id: '5', name: 'Savannah Spirit',   category: 'Outfit',       rarity: 'Legendary', price: 1500,  color: '#FF6B1A', icon: 'account-star-outline' },
  { id: '6', name: 'NBR Champion Pack', category: 'Bundle',       rarity: 'Epic',      price: 2000,  color: '#EF4444', icon: 'package-variant' },
];

const RARITY_COLORS: Record<string, string> = {
  Common: '#9CA3AF',
  Uncommon: '#22C55E',
  Rare: '#3B82F6',
  Epic: '#A855F7',
  Legendary: '#F5A623',
};

const TABS: { key: StoreTab; label: string; icon: string }[] = [
  { key: 'featured', label: 'Featured', icon: 'star-outline' },
  { key: 'outfits',  label: 'Outfits',  icon: 'tshirt-crew-outline' },
  { key: 'weapons',  label: 'Weapons',  icon: 'pistol' },
  { key: 'emotes',   label: 'Emotes',   icon: 'emoticon-happy-outline' },
];

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { playerStats } = useGame();
  const [activeTab, setActiveTab] = useState<StoreTab>('featured');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#0D1120', '#06080F']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Store</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Season 1</Text>
          </View>
          <View style={styles.currencies}>
            <View style={[styles.currChip, { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: 'rgba(245,166,35,0.3)' }]}>
              <MaterialCommunityIcons name="gold" size={14} color="#F5A623" />
              <Text style={[styles.currValue, { color: '#F5A623' }]}>{playerStats.coins.toLocaleString()}</Text>
            </View>
            <View style={[styles.currChip, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)' }]}>
              <MaterialCommunityIcons name="diamond-stone" size={14} color="#3B82F6" />
              <Text style={[styles.currValue, { color: '#3B82F6' }]}>{playerStats.premiumCurrency}</Text>
            </View>
          </View>
        </View>

        {/* Daily refresh */}
        <View style={[styles.refreshBanner, { backgroundColor: 'rgba(255,107,26,0.1)', borderColor: 'rgba(255,107,26,0.25)' }]}>
          <MaterialCommunityIcons name="refresh" size={14} color="#FF6B1A" />
          <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>
            Daily shop refreshes in{'  '}
            <Text style={{ color: '#FF6B1A', fontWeight: '700' }}>18:42:07</Text>
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.key); }}
            style={[styles.tab, activeTab === tab.key && { borderBottomWidth: 2, borderBottomColor: '#FF6B1A' }]}
          >
            <MaterialCommunityIcons
              name={tab.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
              size={16}
              color={activeTab === tab.key ? '#FF6B1A' : colors.mutedForeground}
            />
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? '#FF6B1A' : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.grid, { paddingBottom: Math.max(insets.bottom, 8) + 56 + 16 }]}
      >
        {activeTab === 'featured' ? (
          FEATURED_ITEMS.map(item => (
            <Pressable
              key={item.id}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={({ pressed }) => [styles.itemCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={[`${item.color}22`, `${item.color}08`]}
                style={[styles.itemCardInner, { borderColor: `${item.color}33` }]}
              >
                {/* Rarity stripe */}
                <View style={[styles.rarityStripe, { backgroundColor: RARITY_COLORS[item.rarity] }]} />

                <View style={[styles.itemIcon, { backgroundColor: `${item.color}22` }]}>
                  <MaterialCommunityIcons
                    name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={36}
                    color={item.color}
                  />
                </View>

                <View style={styles.itemMeta}>
                  <Text style={[styles.itemCategory, { color: colors.mutedForeground }]}>{item.category}</Text>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[item.rarity]}22` }]}>
                    <Text style={[styles.rarityText, { color: RARITY_COLORS[item.rarity] }]}>{item.rarity}</Text>
                  </View>
                </View>

                <View style={[styles.priceTag, { backgroundColor: 'rgba(245,166,35,0.15)' }]}>
                  <MaterialCommunityIcons name="gold" size={12} color="#F5A623" />
                  <Text style={styles.priceText}>{item.price.toLocaleString()}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptySection, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="store-clock-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Coming Soon</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              More items arrive with each season update
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav active="store" insetBottom={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { padding: 20, paddingBottom: 14, gap: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 1 },

  currencies: { flexDirection: 'row', gap: 8 },
  currChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  currValue: { fontSize: 13, fontWeight: '700' },

  refreshBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  refreshText: { fontSize: 12 },

  tabs: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12,
  },
  tabLabel: { fontSize: 12, fontWeight: '700' },

  grid: { padding: 16, gap: 12 },

  itemCard: {},
  itemCardInner: {
    borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    gap: 14, padding: 14, overflow: 'hidden',
    position: 'relative',
  },
  rarityStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  itemIcon: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemMeta: { flex: 1, gap: 3 },
  itemCategory: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  itemName: { fontSize: 15, fontWeight: '800' },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  rarityText: { fontSize: 10, fontWeight: '700' },
  priceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  priceText: { fontSize: 13, fontWeight: '800', color: '#F5A623' },

  emptySection: {
    borderWidth: 1, borderRadius: 16, padding: 40,
    alignItems: 'center', gap: 10, marginTop: 20,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
