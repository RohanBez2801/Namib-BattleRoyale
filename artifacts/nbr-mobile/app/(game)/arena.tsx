import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, StatusBar, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useGame } from '@/context/GameContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const MAP_SIZE = 5000;
const MINIMAP_SIZE = 120;

export default function ArenaScreen() {
  const { socketRef } = useGame();

  // Player World Position
  const worldX = useSharedValue(2500);
  const worldY = useSharedValue(2500);
  const offsetX = useSharedValue(2500);
  const offsetY = useSharedValue(2500);

  const [gameState, setGameState] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [nearbyLoot, setNearbyLoot] = useState<any>(null);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    socket.emit('enter_arena', { username: 'Rohan' });

    socket.on('world_update', (state: any) => {
      setGameState(state);
      // Check if player is standing near any loot
      if (state.loot) {
        const items = Object.values(state.loot);
        const closest = items.find((p: any) => {
          const dist = Math.sqrt(Math.pow(p.x - worldX.value, 2) + Math.pow(p.y - worldY.value, 2));
          return dist < 120; // 120 pixel pickup radius
        });
        setNearbyLoot(closest || null);
      }
    });

    socket.on('item_added', (item: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInventory(prev => [...prev, item]);
    });

    return () => {
      socket.off('world_update');
      socket.off('item_added');
    };
  }, [socketRef]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      offsetX.value = worldX.value;
      offsetY.value = worldY.value;
    })
    .onUpdate((e: any) => {
      worldX.value = Math.max(0, Math.min(MAP_SIZE, offsetX.value + (e.translationX * -1.8)));
      worldY.value = Math.max(0, Math.min(MAP_SIZE, offsetY.value + (e.translationY * -1.8)));
      socketRef?.current?.emit('player_move', { x: worldX.value, y: worldY.value });
    });

  // FIXED: Explicit casting to 'any' to satisfy the strict Transform Union type
  const mapStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: (-worldX.value + width / 2) },
        { translateY: (-worldY.value + height / 2) },
      ] as any,
    };
  });

  const miniPlayerStyle = useAnimatedStyle(() => {
    return {
      left: (worldX.value / MAP_SIZE) * MINIMAP_SIZE - 4,
      top: (worldY.value / MAP_SIZE) * MINIMAP_SIZE - 4,
    } as any;
  });

  const handlePickup = () => {
    if (nearbyLoot) {
      socketRef?.current?.emit('pickup_loot', nearbyLoot.id);
      setNearbyLoot(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* 1. WORLD LAYER */}
      <Animated.View style={[styles.world, mapStyle]}>
        <View style={styles.sandFloor}><GridLines /></View>

        {/* Render Loot Drops from Server */}
        {gameState?.loot && Object.entries(gameState.loot).map(([id, l]: any) => (
          <View key={id} style={[styles.loot, { left: l.x, top: l.y }]}>
            <MaterialCommunityIcons
              name={l.type === 'weapon' ? "pistol" : "shield-account"}
              size={30}
              color="#FFF"
            />
          </View>
        ))}

        <Landmark x={2600} y={2400} name="DUNE 45" icon="terrain" color="#CC4D0E" />
        <Landmark x={1500} y={1500} name="SHIPWRECK" icon="ship-wheel" color="#7F8C8D" />
      </Animated.View>

      {/* 2. PLAYER (Fixed Center) */}
      <View style={styles.playerWrapper}>
        <MaterialCommunityIcons name="navigation" size={36} color="#000" />
      </View>

      {/* 3. HUD LAYER */}
      <View style={styles.hud} pointerEvents="box-none">
        <View style={styles.minimap}>
          <View style={styles.minimapBg} />
          <Animated.View style={[styles.miniDot, miniPlayerStyle]} />
        </View>

        {/* Action Button: Pickup */}
        {nearbyLoot ? (
          <Pressable style={styles.pickupBtn} onPress={handlePickup}>
            <MaterialCommunityIcons name="hand-pointing-up" size={24} color="#FFF" />
            <Text style={styles.pickupText}>EQUIP {nearbyLoot.name.toUpperCase()}</Text>
          </Pressable>
        ) : null}

        {/* Inventory Slots */}
        <View style={styles.inventoryBar}>
          {inventory.map((item, i) => (
            <View key={i} style={styles.invSlot}>
              <MaterialCommunityIcons
                name={item.type === 'weapon' ? "pistol" : "shield-account"}
                size={20}
                color="#FF6B1A"
              />
            </View>
          ))}
          {/* Placeholder slots to keep layout consistent */}
          {[...Array(Math.max(0, 3 - inventory.length))].map((_, i) => (
            <View key={`empty-${i}`} style={styles.invSlot} />
          ))}
        </View>
      </View>

      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
    </View>
  );
}

function GridLines() {
  const lines = [];
  for (let i = 0; i <= MAP_SIZE; i += 500) {
    lines.push(<View key={`v-${i}`} style={[styles.gridV, { left: i }]} />);
    lines.push(<View key={`h-${i}`} style={[styles.gridH, { top: i }]} />);
  }
  return <>{lines}</>;
}

function Landmark({ x, y, name, icon, color }: any) {
  return (
    <View style={[styles.landmark, { left: x, top: y }]}>
      <MaterialCommunityIcons name={icon} size={50} color={color} />
      <Text style={styles.landmarkText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080F' },
  world: { width: MAP_SIZE, height: MAP_SIZE, position: 'absolute' },
  sandFloor: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E87722', borderWidth: 2, borderColor: '#333' },
  gridV: { position: 'absolute', width: 2, height: MAP_SIZE, backgroundColor: 'rgba(0,0,0,0.05)' },
  gridH: { position: 'absolute', height: 2, width: MAP_SIZE, backgroundColor: 'rgba(0,0,0,0.05)' },
  playerWrapper: { position: 'absolute', left: width / 2 - 18, top: height / 2 - 18, zIndex: 10, alignItems: 'center' },
  hud: { ...StyleSheet.absoluteFillObject, zIndex: 999, padding: 20, justifyContent: 'space-between' },
  minimap: { alignSelf: 'flex-end', width: MINIMAP_SIZE, height: MINIMAP_SIZE, borderRadius: 10, borderWidth: 2, borderColor: '#FF6B1A', overflow: 'hidden' },
  minimapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  miniDot: { position: 'absolute', width: 8, height: 8, backgroundColor: '#FF6B1A', borderRadius: 4, zIndex: 100 },
  loot: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 8, alignItems: 'center', justifyContent: 'center' },
  pickupBtn: { backgroundColor: '#FF6B1A', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', position: 'absolute', bottom: 120, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  pickupText: { color: 'white', fontWeight: '900', fontSize: 14 },
  inventoryBar: { flexDirection: 'row', gap: 12, alignSelf: 'center', marginBottom: 20 },
  invSlot: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  landmark: { position: 'absolute', alignItems: 'center' },
  landmarkText: { color: 'white', fontWeight: 'bold', fontSize: 12, textShadowColor: 'black', textShadowRadius: 3, marginTop: 4 },
});