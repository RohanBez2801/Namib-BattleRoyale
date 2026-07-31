import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, StatusBar } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useGame } from '@/context/GameContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const MAP_SIZE = 5000;
const MINIMAP_SIZE = 110;

export default function ArenaScreen() {
  const { socketRef } = useGame();
  const worldX = useSharedValue(2500);
  const worldY = useSharedValue(2500);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    socketRef?.current?.emit('enter_arena', { username: 'Rohan' });
    socketRef?.current?.on('world_update', (state: any) => setGameState(state));
    return () => { socketRef?.current?.off('world_update'); };
  }, [socketRef]);

  const gesture = Gesture.Pan().onUpdate((e: any) => {
    worldX.value = Math.max(0, Math.min(MAP_SIZE, worldX.value + e.changeX * -1.8));
    worldY.value = Math.max(0, Math.min(MAP_SIZE, worldY.value + e.changeY * -1.8));
    socketRef?.current?.emit('player_move', { x: worldX.value, y: worldY.value });
  });

  // FIXED: Explicit transform objects to clear the TypeScript error
  const mapStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: -worldX.value + width / 2 },
        { translateY: -worldY.value + height / 2 },
      ] as const,
    };
  });

  const miniPlayerStyle = useAnimatedStyle(() => {
    return {
      left: (worldX.value / MAP_SIZE) * MINIMAP_SIZE - 2,
      top: (worldY.value / MAP_SIZE) * MINIMAP_SIZE - 2,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <Animated.View style={[styles.world, mapStyle]}>
        <View style={styles.sandBase} />
        
        {/* Landmarks */}
        <View style={[styles.landmark, { left: 2600, top: 2400 }]}>
          <MaterialCommunityIcons name="terrain" size={50} color="orange" />
          <Text style={styles.landmarkText}>Dune 45</Text>
        </View>
        
        {/* Storm Circle */}
        {gameState && (
          <View style={[styles.storm, {
            left: gameState.storm.x - gameState.storm.radius,
            top: gameState.storm.y - gameState.storm.radius,
            width: gameState.storm.radius * 2,
            height: gameState.storm.radius * 2,
            borderRadius: gameState.storm.radius,
          }]} />
        )}
      </Animated.View>

      {/* PLAYER CENTERED */}
      <View style={styles.player}>
        <MaterialCommunityIcons name="navigation" size={35} color="#FF6B1A" />
      </View>

      {/* HUD Layer */}
      <View style={styles.hudContainer} pointerEvents="none">
        <View style={styles.minimap}>
           <Animated.View style={[styles.miniPlayer, miniPlayerStyle]} />
        </View>
        <View style={styles.healthBar}>
           <View style={styles.healthFill} />
        </View>
      </View>

      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}/>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  world: { width: MAP_SIZE, height: MAP_SIZE, position: 'absolute' },
  sandBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#120A04', borderWidth: 2, borderColor: '#1e1e1e' },
  player: { position: 'absolute', left: width/2 - 17, top: height/2 - 17, zIndex: 10, alignItems: 'center' },
  hudContainer: { ...StyleSheet.absoluteFillObject, zIndex: 999, padding: 30, alignItems: 'flex-end' },
  minimap: { width: MINIMAP_SIZE, height: MINIMAP_SIZE, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, borderWidth: 1, borderColor: '#444', overflow: 'hidden' },
  miniPlayer: { position: 'absolute', width: 4, height: 4, backgroundColor: '#FF6B1A', borderRadius: 2 },
  healthBar: { width: 200, height: 10, backgroundColor: '#333', borderRadius: 5, position: 'absolute', bottom: 50, alignSelf: 'center', overflow: 'hidden' },
  healthFill: { width: '100%', height: '100%', backgroundColor: '#EF4444' },
  landmark: { position: 'absolute', alignItems: 'center' },
  landmarkText: { color: 'white', fontWeight: 'bold', fontSize: 12 }, // FIXED: Added proper text style
  storm: { position: 'absolute', borderWidth: 3, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
});