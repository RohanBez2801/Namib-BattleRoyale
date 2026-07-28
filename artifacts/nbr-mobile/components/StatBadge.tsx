import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StatBadgeProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatBadge({ label, value, sub, accent }: StatBadgeProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: accent ? 'rgba(255,107,26,0.3)' : colors.border }]}>
      <Text style={[styles.value, { color: accent ? '#FF6B1A' : colors.foreground }]}>{value}</Text>
      {sub ? <Text style={[styles.sub, { color: colors.accent }]}>{sub}</Text> : null}
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  value: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 11, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '500' },
});
