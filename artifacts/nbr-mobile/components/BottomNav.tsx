import React from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

export type NavTab = 'lobby' | 'character' | 'store' | 'profile' | 'settings';

interface NavItem {
  key: NavTab;
  icon: string;
  label: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'lobby',     icon: 'crosshairs-gps', label: 'Lobby',     route: '/(game)/lobby' },
  { key: 'character', icon: 'account-star',   label: 'Character', route: '/(game)/character' },
  { key: 'store',     icon: 'storefront',     label: 'Store',     route: '/(game)/store' },
  { key: 'profile',   icon: 'chart-bar',      label: 'Stats',     route: '/(game)/profile' },
  { key: 'settings',  icon: 'cog',            label: 'Settings',  route: '/(game)/settings' },
];

interface BottomNavProps {
  active: NavTab;
  insetBottom: number;
}

export function BottomNav({ active, insetBottom }: BottomNavProps) {
  const colors = useColors();
  const bottomPad = Math.max(insetBottom, Platform.OS === 'web' ? 34 : 6);

  function go(item: NavItem) {
    if (item.key === active) return;
    Haptics.selectionAsync();
    router.replace(item.route as Parameters<typeof router.replace>[0]);
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomPad, backgroundColor: 'rgba(6,8,15,0.94)', borderTopColor: colors.border }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => go(item)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.iconWrap, isActive && { backgroundColor: 'rgba(255,107,26,0.15)', borderRadius: 10 }]}>
              <MaterialCommunityIcons
                name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                size={22}
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
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { padding: 5 },
  label: { fontSize: 10, fontWeight: '600' },
});
