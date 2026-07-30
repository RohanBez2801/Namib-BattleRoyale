import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, StatusBar } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useGame } from '@/context/GameContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const MAP_SIZE = 5000;

export default function ArenaScreen() {
  const { socketRef } = useGame();
  const worldX = useSharedValue(2500);
  const worldY = useSharedValue(2500);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const socket = socketRef?.current;
    if (socket) {
      socket.emit('enter_arena', { username: 'Player' });
      socket.on('world_update', (state) => setGameState(state));
    }
    return () => { socket?.off('world_update'); };
  }, []);

  const moveGesture = Gesture.Pan().onUpdate((e) => {
    worldX.value = Math.max(0, Math.min(MAP_SIZE, worldX.value + e.changeX * -2));
    worldY.value = Math.max(0, Math.min(MAP_SIZE, worldY.value + e.changeY * -2));
    socketRef?.current?.emit('player_move', { x: worldX.value, y: worldY.value });
  });

  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -worldX.value + width / 2 }, { translateY: -worldY.value + height / 2 }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Animated.View style={[styles.world, mapStyle]}>
        <View style={styles.sand} />
        {/* Landmarks */}
        <View style={{ position: 'absolute', left: 2600, top: 2400 }}>
          <MaterialCommunityIcons name="home-modern" size={60} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: 'white', fontSize: 10 }}>Sossusvlei Outpost</Text>
        </View>
      </Animated.View>
      <View style={styles.player}>
        <MaterialCommunityIcons name="navigation" size={32} color="#FF6B1A" />
      </View>
      <GestureDetector gesture={moveGesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080F' },
  world: { width: MAP_SIZE, height: MAP_SIZE },
  sand: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1A0F05', borderWidth: 2, borderColor: '#333' },
  player: { position: 'absolute', left: width/2 - 16, top: height/2 - 16, zIndex: 10 }
});