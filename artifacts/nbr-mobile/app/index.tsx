import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export default function RootIndex() {
  const { user, loading } = useAuth();
  const pulse = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => {
        if (user) {
          router.replace('/(game)/lobby');
        } else {
          router.replace('/auth/login');
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [user, loading]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: pulse.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <LinearGradient colors={['#06080F', '#0D1120', '#06080F']} style={styles.container}>
      <Animated.Text style={[styles.logo, logoStyle]}>NBR</Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>NAMIB BATTLE ROYALE</Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FF6B1A',
    letterSpacing: 6,
    textShadowColor: 'rgba(255,107,26,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5A623',
    letterSpacing: 7,
  },
});
