import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function BottomNav({ active, insetBottom = 0 }: { active: string, insetBottom?: number }) {
  const router = useRouter();
  const NAV_ITEMS = [
    { key: 'lobby', label: 'Lobby', route: '/lobby', icon: 'crosshairs-gps' },
    { key: 'character', label: 'Character', route: '/character', icon: 'account-star' },
    { key: 'store', label: 'Store', route: '/store', icon: 'storefront' },
    { key: 'profile', label: 'Stats', route: '/profile', icon: 'chart-bar' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insetBottom, height: 60 + insetBottom }]}>
      {NAV_ITEMS.map((item) => (
        <Pressable 
          key={item.key} 
          onPress={() => router.replace(item.route as any)} 
          style={styles.item}
          hitSlop={15}
        >
          <MaterialCommunityIcons name={item.icon as any} size={24} color={active === item.key ? '#FF6B1A' : '#8B98B8'} />
          <Text style={{ color: active === item.key ? '#FF6B1A' : '#8B98B8', fontSize: 10 }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', backgroundColor: '#06080F', borderTopWidth: 1, borderColor: '#1E2A3D', zIndex: 9999 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});