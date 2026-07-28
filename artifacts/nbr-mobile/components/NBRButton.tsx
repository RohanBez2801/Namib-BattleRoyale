import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface NBRButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function NBRButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: NBRButtonProps) {
  const colors = useColors();

  function handlePress() {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { opacity: (pressed || disabled || loading) ? 0.75 : 1 },
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#FF8C4A', '#FF6B1A', '#CC4D0E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.label, styles.primaryLabel]}>{label}</Text>
            </>
          )}
        </LinearGradient>
      ) : (
        <View style={[
          styles.inner,
          isSecondary && { backgroundColor: colors.secondary },
          isGhost && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
          isDanger && { backgroundColor: colors.destructive },
        ]}>
          {loading ? (
            <ActivityIndicator color={isPrimary ? '#FFFFFF' : colors.foreground} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[
                styles.label,
                isGhost && { color: colors.mutedForeground },
                isDanger && { color: '#FFFFFF' },
                isSecondary && { color: '#FFFFFF' },
              ]}>
                {label}
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, overflow: 'hidden' },
  fullWidth: { width: '100%' },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    gap: 8,
  },
  label: { fontSize: 15, fontWeight: '800', letterSpacing: 1.5, color: '#FFFFFF' },
  primaryLabel: { color: '#FFFFFF' },
});
