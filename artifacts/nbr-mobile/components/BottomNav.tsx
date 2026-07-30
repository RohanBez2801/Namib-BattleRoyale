import React from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

export type NavTab = 'lobby' | 'character' | 'store' | 'profile' | 'settings';

interface NavItem {
  key: NavTab;
  icon: string;
  label: string;
  route: any; // Using any to bypass strict route typing during dev
}

const NAV_ITEMS: NavItem[] = [
  { key: 'lobby',     icon: 'crosshairs-gps', label: 'Lobby',     route: '/lobby' },
  { key: 'character', icon: 'account-star',   label: 'Character', route: '/character' },
  { key: 'store',     icon: 'storefront',     label: 'Store',     route: '/store' },
  { key: 'profile',   icon: 'chart-bar',      label: 'Stats',     route: '/profile' },
  { key: 'settings',  icon: 'cog',            label: 'Settings',  route: '/settings' },
];

export function BottomNav({ active, insetBottom }: { active: NavTab; insetBottom?: number }) {
  const colors = useColors();
  const router = useRouter();
  const bottomPad = Math.max(insetBottom || 0, Platform.OS === 'web' ? 34 : 10);

  function go(item: NavItem) {
    if (item.key === active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(item.route);
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomPad, backgroundColor: '#06080F', borderTopColor: colors.border }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => go(item)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={15}
          >
            <View style={[styles.iconWrap, isActive && { backgroundColor: 'rgba(255,107,26,0.15)', borderRadius: 10 }]}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={isActive ? '#FF6B1A' : colors.mutedForeground}
              />
            </View>
            <Text style={[styles.label, { color: isActive ? '#FF6B1A' : colors.mutedForeground }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', borderTopWidth: 1, paddingTop: 8, zIndex: 999
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { padding: 6 },
  label: { fontSize: 10, fontWeight: '700' },
});