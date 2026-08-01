import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, StatusBar, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { useGame } from '@/context/GameContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const MAP_SIZE = 5000;
const MINIMAP_SIZE = 120;
const MAX_KILL_FEED = 4;

// Weapon category → icon mapping
const WEAPON_ICONS: Record<string, string> = {
  oryx_striker: 'pistol',
  welwitschia_blaster: 'shotgun',
  sand_viper: 'pistol',
  skeleton_coast_rifle: 'telescope',
  bushmans_sidearm: 'pistol',
};

const CONSUMABLE_ICONS: Record<string, string> = {
  mopane_caterpillar: 'food-drumstick',
  elephant_bark_tea: 'cup',
  namibian_biltong: 'food-steak',
  small_shield_pot: 'shield-half-full',
};

interface KillFeedEntry {
  id: number;
  attacker: string;
  victim: string;
  weapon: string;
  attackerId?: string;
  timestamp: number;
}

// ============================================================
// MAIN ARENA SCREEN
// ============================================================
export default function ArenaScreen() {
  const { socketRef } = useGame();

  // Player World Position
  const worldX = useSharedValue(2500);
  const worldY = useSharedValue(2500);
  const offsetX = useSharedValue(2500);
  const offsetY = useSharedValue(2500);
  const heading = useSharedValue(0); // Radians — direction player faces

  // Game state from server
  const [gameState, setGameState] = useState<any>(null);
  const [matchPhase, setMatchPhase] = useState<string>('WAITING');

  // Player stats
  const [hp, setHp] = useState(100);
  const [shield, setShield] = useState(0);
  const [overshield, setOvershield] = useState(50);
  const [kills, setKills] = useState(0);
  const [inventory, setInventory] = useState<any[]>([null, null, null, null, null]);
  const [equippedSlot, setEquippedSlot] = useState(0);

  // HUD state
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [nearbyLoot, setNearbyLoot] = useState<any>(null);
  const [nearbyDeathBox, setNearbyDeathBox] = useState<any>(null);
  const [isOnBus, setIsOnBus] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [altitude, setAltitude] = useState(0);
  const [aliveCount, setAliveCount] = useState(0);

  // Consumable channeling
  const [channeling, setChanneling] = useState<{ name: string; useTimeMs: number; startTime: number } | null>(null);

  // Victory / Elimination
  const [matchResult, setMatchResult] = useState<any>(null);
  const [elimination, setElimination] = useState<any>(null);

  // Damage flash
  const damageFlash = useSharedValue(0);
  const killFeedIdRef = useRef(0);

  // ============================================================
  // SOCKET LISTENERS
  // ============================================================
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    socket.emit('enter_arena', { username: 'Rohan' });

    socket.on('world_update', (state: any) => {
      setGameState(state);

      if (state.match) {
        setMatchPhase(state.match.phase);
        setAliveCount(state.match.aliveCount);
      }

      // Update own player state from world update
      const me = state.players?.[socket.id];
      if (me) {
        setHp(me.health);
        setShield(me.shield);
        setOvershield(me.overshield);
        setKills(me.kills);
        setInventory(me.inventory);
        setEquippedSlot(me.equippedSlot);
        setIsOnBus(me.onBus);
        setIsDropping(me.isDropping);
        setAltitude(me.altitude);
      }

      // Nearby loot check
      if (state.loot && me?.hasLanded) {
        const items = Object.values(state.loot);
        const closest = items.find((p: any) => {
          const d = Math.sqrt((p.x - worldX.value) ** 2 + (p.y - worldY.value) ** 2);
          return d < 120;
        });
        setNearbyLoot((closest as any) || null);
      } else {
        setNearbyLoot(null);
      }

      // Nearby death box check
      if (state.deathBoxes && me?.hasLanded) {
        const boxes = Object.values(state.deathBoxes);
        const closest = boxes.find((b: any) => {
          const d = Math.sqrt((b.x - worldX.value) ** 2 + (b.y - worldY.value) ** 2);
          return d < 120;
        });
        setNearbyDeathBox((closest as any) || null);
      } else {
        setNearbyDeathBox(null);
      }
    });

    socket.on('match_phase', (data: any) => {
      setMatchPhase(data.phase);
    });

    socket.on('player_damaged', (data: any) => {
      if (data.id === socket.id) {
        setHp(data.health);
        setShield(data.shield);
        setOvershield(data.overshield);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // Damage flash
        damageFlash.value = withSequence(
          withTiming(0.6, { duration: 100 }),
          withTiming(0, { duration: 300 }),
        );
      }
    });

    socket.on('kill_feed', (data: any) => {
      const entry: KillFeedEntry = {
        id: killFeedIdRef.current++,
        attacker: data.attacker,
        victim: data.victim,
        weapon: data.weapon,
        attackerId: data.attackerId,
        timestamp: Date.now(),
      };
      setKillFeed(prev => [entry, ...prev].slice(0, MAX_KILL_FEED));
    });

    socket.on('player_eliminated', (data: any) => {
      if (data.eliminatedId === socket.id) {
        setElimination({ placement: data.placement || '?' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    });

    socket.on('victory_royale', (data: any) => {
      if (data.winnerId === socket.id) {
        setMatchResult(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (!elimination) {
        // Spectator sees winner
        setMatchResult(data);
      }
    });

    socket.on('inventory_update', (data: any) => {
      setInventory(data.inventory);
      setEquippedSlot(data.equippedSlot);
    });

    socket.on('consumable_started', (data: any) => {
      setChanneling({ name: data.name, useTimeMs: data.useTimeMs, startTime: Date.now() });
    });

    socket.on('consumable_complete', (data: any) => {
      if (data.id === socket.id) {
        setChanneling(null);
        setHp(data.health);
        setShield(data.shield);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    socket.on('consumable_interrupted', (data: any) => {
      if (data.id === socket.id) {
        setChanneling(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    });

    // Auto-clear old kill feed entries
    const feedTimer = setInterval(() => {
      setKillFeed(prev => prev.filter(e => Date.now() - e.timestamp < 6000));
    }, 1000);

    return () => {
      socket.off('world_update');
      socket.off('match_phase');
      socket.off('player_damaged');
      socket.off('kill_feed');
      socket.off('player_eliminated');
      socket.off('victory_royale');
      socket.off('inventory_update');
      socket.off('consumable_started');
      socket.off('consumable_complete');
      socket.off('consumable_interrupted');
      clearInterval(feedTimer);
    };
  }, [socketRef]);

  // ============================================================
  // GESTURES & ACTIONS
  // ============================================================
  const gesture = Gesture.Pan()
    .onBegin(() => {
      offsetX.value = worldX.value;
      offsetY.value = worldY.value;
    })
    .onUpdate((e: any) => {
      worldX.value = Math.max(0, Math.min(MAP_SIZE, offsetX.value + (e.translationX * -1.8)));
      worldY.value = Math.max(0, Math.min(MAP_SIZE, offsetY.value + (e.translationY * -1.8)));

      // Compute heading from velocity (atan2 gives angle from movement delta)
      if (Math.abs(e.velocityX) > 10 || Math.abs(e.velocityY) > 10) {
        heading.value = Math.atan2(-e.velocityX, e.velocityY); // negate X because world moves inversely
      }

      socketRef?.current?.emit('player_move', { x: worldX.value, y: worldY.value, heading: heading.value });
    });

  const mapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (-worldX.value + width / 2) },
      { translateY: (-worldY.value + height / 2) },
    ] as any,
  }));

  const miniPlayerStyle = useAnimatedStyle(() => ({
    left: (worldX.value / MAP_SIZE) * MINIMAP_SIZE - 4,
    top: (worldY.value / MAP_SIZE) * MINIMAP_SIZE - 4,
  } as any));

  const playerRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${heading.value}rad` }] as any,
  }));

  const damageOverlayStyle = useAnimatedStyle(() => ({
    opacity: damageFlash.value,
  }));

  const fireWeapon = useCallback(() => {
    socketRef?.current?.emit('fire_weapon', { targetX: worldX.value, targetY: worldY.value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [socketRef]);

  const jumpFromBus = useCallback(() => {
    socketRef?.current?.emit('jump_from_bus');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [socketRef]);

  const handlePickup = useCallback(() => {
    if (nearbyLoot) {
      socketRef?.current?.emit('pickup_loot', nearbyLoot.id);
      setNearbyLoot(null);
    }
  }, [nearbyLoot, socketRef]);

  const swapWeapon = useCallback((slot: number) => {
    socketRef?.current?.emit('swap_weapon', slot);
    setEquippedSlot(slot);
    Haptics.selectionAsync();
  }, [socketRef]);

  const useConsumable = useCallback(() => {
    // Find first consumable in inventory
    const slot = inventory.findIndex(i => i?.type === 'consumable');
    if (slot !== -1) {
      socketRef?.current?.emit('use_consumable', slot);
    }
  }, [inventory, socketRef]);

  const handleLootDeathBox = useCallback(() => {
    if (nearbyDeathBox && nearbyDeathBox.items?.length > 0) {
      socketRef?.current?.emit('loot_deathbox', { boxId: nearbyDeathBox.id, itemIndex: 0 });
    }
  }, [nearbyDeathBox, socketRef]);

  const returnToLobby = useCallback(() => {
    router.replace('/(game)/lobby');
  }, []);

  const mySocketId = socketRef?.current?.id;
  const hasConsumable = inventory.some((i: any) => i?.type === 'consumable');

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* ====== WORLD LAYER ====== */}
      <Animated.View style={[styles.world, mapStyle]}>
        <View style={styles.sandFloor}><GridLines /></View>

        {/* Storm circle (safe zone ring) */}
        {gameState?.match?.storm && (
          <View style={[styles.stormCircle, {
            left: gameState.match.storm.x - gameState.match.storm.currentRadius,
            top: gameState.match.storm.y - gameState.match.storm.currentRadius,
            width: gameState.match.storm.currentRadius * 2,
            height: gameState.match.storm.currentRadius * 2,
            borderRadius: gameState.match.storm.currentRadius,
          }]} />
        )}

        {/* Loot Drops (with glimmer pulse) */}
        {gameState?.loot && Object.entries(gameState.loot).map(([id, l]: any) => (
          <LootDrop key={id} item={l} />
        ))}

        {/* Death Boxes */}
        {gameState?.deathBoxes && Object.entries(gameState.deathBoxes).map(([id, b]: any) => (
          <View key={id} style={[styles.deathBox, { left: b.x - 18, top: b.y - 18 }]}>
            <MaterialCommunityIcons name="treasure-chest" size={36} color="#FFD700" />
            <Text style={styles.deathBoxLabel}>{b.username}</Text>
          </View>
        ))}

        {/* Other Players */}
        {gameState?.players && Object.entries(gameState.players).map(([id, p]: any) => {
          if (id === mySocketId || !p.alive || !p.hasLanded) return null;
          return (
            <View key={id} style={[styles.otherPlayer, { left: p.x - 16, top: p.y - 28 }]}>
              <Text style={styles.otherPlayerName}>{p.username}</Text>
              <MaterialCommunityIcons name="account" size={32} color="#E74C3C" />
              {/* Mini health bar */}
              <View style={styles.otherPlayerHpBar}>
                <View style={[styles.otherPlayerHpFill, { width: `${p.health}%` }]} />
              </View>
            </View>
          );
        })}

        {/* POI Landmarks */}
        <Landmark x={2600} y={2400} name="DUNE 45" icon="terrain" color="#CC4D0E" />
        <Landmark x={1500} y={1500} name="SKELETON COAST" icon="ship-wheel" color="#7F8C8D" />
        <Landmark x={3500} y={1200} name="DEADVLEI" icon="tree" color="#8B6914" />
        <Landmark x={800}  y={3000} name="FISH RIVER" icon="waves" color="#2196F3" />
        <Landmark x={4200} y={2800} name="SOSSUSVLEI" icon="water" color="#00BCD4" />
        <Landmark x={2000} y={4200} name="ETOSHA" icon="binoculars" color="#4CAF50" />
        <Landmark x={3800} y={3800} name="KOLMANSKOP" icon="home-city" color="#795548" />
        <Landmark x={1200} y={800}  name="SPITZKOPPE" icon="image-filter-hdr" color="#607D8B" />
      </Animated.View>

      {/* ====== PLAYER (Fixed Center) ====== */}
      {!isOnBus && !isDropping && (
        <Animated.View style={[styles.playerWrapper, playerRotationStyle]}>
          <MaterialCommunityIcons name="navigation" size={36} color="#000" />
        </Animated.View>
      )}

      {/* ====== DAMAGE FLASH OVERLAY ====== */}
      <Animated.View style={[styles.damageOverlay, damageOverlayStyle]} pointerEvents="none" />

      {/* ====== BUS PHASE OVERLAY ====== */}
      {matchPhase === 'BUS_PHASE' && isOnBus && (
        <View style={styles.busOverlay}>
          <View style={styles.busHeader}>
            <MaterialCommunityIcons name="helicopter" size={28} color="#FF6B1A" />
            <Text style={styles.busTitle}>DESERT HORNET</Text>
          </View>
          <Text style={styles.busSubtitle}>Choose your drop zone</Text>

          {/* Mini Map with bus path */}
          <View style={styles.busMap}>
            <View style={styles.busMapBg}>
              {/* POI dots */}
              {[
                { x: 2600, y: 2400, c: '#CC4D0E' }, { x: 1500, y: 1500, c: '#7F8C8D' },
                { x: 3500, y: 1200, c: '#8B6914' }, { x: 800, y: 3000, c: '#2196F3' },
                { x: 4200, y: 2800, c: '#00BCD4' }, { x: 2000, y: 4200, c: '#4CAF50' },
                { x: 3800, y: 3800, c: '#795548' }, { x: 1200, y: 800, c: '#607D8B' },
              ].map((poi, i) => (
                <View key={i} style={[styles.busPoi, {
                  left: (poi.x / MAP_SIZE) * 200 - 4,
                  top: (poi.y / MAP_SIZE) * 200 - 4,
                  backgroundColor: poi.c,
                }]} />
              ))}

              {/* Bus path line (simplified) */}
              {gameState?.match?.bus && (
                <View style={[styles.busIcon, {
                  left: (gameState.match.bus.startX + (gameState.match.bus.endX - gameState.match.bus.startX) * gameState.match.bus.progress) / MAP_SIZE * 200 - 10,
                  top: (gameState.match.bus.startY + (gameState.match.bus.endY - gameState.match.bus.startY) * gameState.match.bus.progress) / MAP_SIZE * 200 - 10,
                }]}>
                  <MaterialCommunityIcons name="helicopter" size={20} color="#FF6B1A" />
                </View>
              )}
            </View>
          </View>

          <Text style={styles.busPlayers}>{aliveCount} players aboard</Text>

          <Pressable style={styles.jumpButton} onPress={jumpFromBus}>
            <MaterialCommunityIcons name="parachute" size={28} color="#FFF" />
            <Text style={styles.jumpText}>JUMP</Text>
          </Pressable>
        </View>
      )}

      {/* ====== DROP PHASE OVERLAY ====== */}
      {isDropping && (
        <View style={styles.dropOverlay}>
          <View style={styles.altitudeContainer}>
            <Text style={styles.altLabel}>ALT</Text>
            <View style={styles.altBar}>
              <View style={[styles.altFill, { height: `${(altitude / 1000) * 100}%` }]} />
            </View>
            <Text style={styles.altValue}>{Math.round(altitude)}m</Text>
          </View>
          <Text style={styles.dropText}>DEPLOYING...</Text>
        </View>
      )}

      {/* ====== ACTIVE HUD ====== */}
      {!isOnBus && !isDropping && matchPhase !== 'FINISHED' && (
        <View style={styles.hud} pointerEvents="box-none">

          {/* TOP BAR: Alive count + Kills + Storm info */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons name="account-group" size={14} color="#FFF" />
                <Text style={styles.statText}>{aliveCount}</Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(255,107,26,0.3)' }]}>
                <MaterialCommunityIcons name="skull-crossbones" size={14} color="#FF6B1A" />
                <Text style={[styles.statText, { color: '#FF6B1A' }]}>{kills}</Text>
              </View>
            </View>

            {/* Minimap */}
            <View style={styles.minimap}>
              <View style={styles.minimapBg}>
                {/* Storm circle on minimap */}
                {gameState?.match?.storm && (() => {
                  const s = gameState.match.storm;
                  const scale = MINIMAP_SIZE / MAP_SIZE;
                  const r = s.currentRadius * scale;
                  return (
                    <View style={[styles.minimapStorm, {
                      left: s.x * scale - r,
                      top: s.y * scale - r,
                      width: r * 2, height: r * 2, borderRadius: r,
                    }]} />
                  );
                })()}
              </View>
              <Animated.View style={[styles.miniDot, miniPlayerStyle]} />
            </View>
          </View>

          {/* KILL FEED (below top bar, right side) */}
          <View style={styles.killFeed}>
            {killFeed.map((entry) => (
              <View key={entry.id} style={styles.killFeedEntry}>
                <Text style={styles.killFeedText} numberOfLines={1}>
                  <Text style={{ color: entry.attackerId === mySocketId ? '#FF6B1A' : '#DDD', fontWeight: '800' }}>
                    {entry.attacker}
                  </Text>
                  <Text style={{ color: '#666' }}> [{entry.weapon}] </Text>
                  <Text style={{ color: entry.attackerId === mySocketId ? '#FF6B1A' : '#AAA' }}>
                    {entry.victim}
                  </Text>
                </Text>
              </View>
            ))}
          </View>

          {/* STATUS BARS (bottom-left) */}
          <View style={styles.statusBars} pointerEvents="none">
            {/* Over-shield (Cyan) */}
            <View style={styles.barRow}>
              <View style={styles.barContainer}>
                <View style={[styles.overshieldFill, { width: `${(overshield / 50) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{Math.round(overshield)}</Text>
            </View>
            {/* Shield (Blue) */}
            <View style={styles.barRow}>
              <View style={styles.barContainer}>
                <View style={[styles.shieldFill, { width: `${shield}%` }]} />
              </View>
              <Text style={styles.barValue}>{Math.round(shield)}</Text>
            </View>
            {/* Health (Green) */}
            <View style={styles.barRow}>
              <View style={styles.barContainer}>
                <View style={[styles.healthFill, { width: `${hp}%` }]} />
              </View>
              <Text style={styles.barValue}>{Math.round(hp)}</Text>
            </View>
          </View>

          {/* 5-SLOT WEAPON BAR (bottom-center) */}
          <View style={styles.weaponBar}>
            {inventory.map((item: any, i: number) => (
              <Pressable
                key={i}
                style={[
                  styles.weaponSlot,
                  equippedSlot === i && styles.equippedSlot,
                  item && { borderColor: item.color },
                ]}
                onPress={() => swapWeapon(i)}
              >
                {item ? (
                  <>
                    <MaterialCommunityIcons
                      name={(item.type === 'consumable'
                        ? (CONSUMABLE_ICONS[item.consumableId] || 'medical-bag')
                        : (WEAPON_ICONS[item.weaponId] || 'pistol')) as any}
                      size={18}
                      color={item.color || '#FFF'}
                    />
                    <Text style={styles.weaponSlotLabel} numberOfLines={1}>
                      {item.name.split(' ').pop()}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.emptySlotNum}>{i + 1}</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* CONSUMABLE BUTTON (above fire button, right side) */}
          {hasConsumable && !channeling && (
            <Pressable style={styles.consumableBtn} onPress={useConsumable}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#22C55E" />
            </Pressable>
          )}

          {/* CHANNELING INDICATOR */}
          {channeling && (
            <View style={styles.channelingBar}>
              <Text style={styles.channelingText}>Using {channeling.name}...</Text>
              <ChannelProgress startTime={channeling.startTime} duration={channeling.useTimeMs} />
            </View>
          )}

          {/* ACTION BUTTONS */}
          {nearbyLoot && (
            <Pressable style={styles.pickupBtn} onPress={handlePickup}>
              <MaterialCommunityIcons name="hand-pointing-up" size={20} color="#FFF" />
              <Text style={styles.pickupText}>{nearbyLoot.name.toUpperCase()}</Text>
            </Pressable>
          )}

          {nearbyDeathBox && !nearbyLoot && (
            <Pressable style={[styles.pickupBtn, { backgroundColor: '#B8860B' }]} onPress={handleLootDeathBox}>
              <MaterialCommunityIcons name="treasure-chest" size={20} color="#FFF" />
              <Text style={styles.pickupText}>LOOT {nearbyDeathBox.username.toUpperCase()}</Text>
            </Pressable>
          )}

          {/* FIRE BUTTON */}
          <Pressable style={styles.fireButton} onPressIn={fireWeapon}>
            <MaterialCommunityIcons name="target" size={42} color="#FFF" />
          </Pressable>
        </View>
      )}

      {/* ====== VICTORY / ELIMINATION OVERLAY ====== */}
      {(matchResult || elimination) && (
        <View style={styles.resultOverlay}>
          {matchResult && matchResult.winnerId === mySocketId ? (
            <>
              <Text style={styles.victoryEmoji}>🏆</Text>
              <Text style={styles.victoryTitle}>VICTORY ROYALE</Text>
              <Text style={styles.victorySubtitle}>Champion of the Namib</Text>
              <View style={styles.resultStats}>
                <ResultStat label="Eliminations" value={matchResult.kills} />
                <ResultStat label="Damage" value={matchResult.damageDealt} />
                <ResultStat label="Survived" value={`${matchResult.survivalTimeSec}s`} />
              </View>
            </>
          ) : elimination ? (
            <>
              <Text style={styles.eliminatedTitle}>ELIMINATED</Text>
              <Text style={styles.eliminatedPlacement}>#{elimination.placement}</Text>
              <View style={styles.resultStats}>
                <ResultStat label="Eliminations" value={kills} />
              </View>
            </>
          ) : matchResult ? (
            <>
              <Text style={styles.victoryEmoji}>🏆</Text>
              <Text style={styles.victoryTitle}>{matchResult.username} WINS</Text>
              <Text style={styles.victorySubtitle}>with {matchResult.kills} eliminations</Text>
            </>
          ) : null}

          <Pressable style={styles.lobbyButton} onPress={returnToLobby}>
            <Text style={styles.lobbyButtonText}>RETURN TO LOBBY</Text>
          </Pressable>
        </View>
      )}

      {/* ====== GESTURE LAYER ====== */}
      {!isOnBus && !matchResult && !elimination && (
        <GestureDetector gesture={gesture}>
          <View style={StyleSheet.absoluteFill} />
        </GestureDetector>
      )}
    </View>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function GridLines() {
  const lines = [];
  for (let i = 0; i <= MAP_SIZE; i += 500) {
    lines.push(<View key={`v-${i}`} style={[styles.gridV, { left: i }]} />);
    lines.push(<View key={`h-${i}`} style={[styles.gridH, { top: i }]} />);
  }
  return <>{lines}</>;
}

function LootDrop({ item }: { item: any }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
      true,
    );
  }, []);

  const glimmerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }] as any,
    opacity: 0.6 + (pulse.value - 0.85) * (0.4 / 0.3), // maps 0.85-1.15 → 0.6-1.0
  }));

  return (
    <Animated.View
      style={[styles.loot, { left: item.x - 15, top: item.y - 15, borderColor: item.color }, glimmerStyle]}
    >
      <MaterialCommunityIcons
        name={item.type === 'consumable' ? 'medical-bag' : 'pistol'}
        size={24}
        color={item.color}
      />
    </Animated.View>
  );
}

function Landmark({ x, y, name, icon, color }: any) {
  return (
    <View style={[styles.landmark, { left: x - 25, top: y - 25 }]}>
      <MaterialCommunityIcons name={icon} size={50} color={color} />
      <Text style={styles.landmarkText}>{name}</Text>
    </View>
  );
}

function ResultStat({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.resultStatItem}>
      <Text style={styles.resultStatValue}>{value}</Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
    </View>
  );
}

function ChannelProgress({ startTime, duration }: { startTime: number; duration: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(1, elapsed / duration));
    }, 50);
    return () => clearInterval(interval);
  }, [startTime, duration]);

  return (
    <View style={styles.channelTrack}>
      <View style={[styles.channelFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080F' },

  // World
  world: { width: MAP_SIZE, height: MAP_SIZE, position: 'absolute' },
  sandFloor: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E87722', borderWidth: 2, borderColor: '#333' },
  gridV: { position: 'absolute', width: 2, height: MAP_SIZE, backgroundColor: 'rgba(0,0,0,0.05)' },
  gridH: { position: 'absolute', height: 2, width: MAP_SIZE, backgroundColor: 'rgba(0,0,0,0.05)' },
  stormCircle: { position: 'absolute', borderWidth: 4, borderColor: 'rgba(0,150,255,0.5)', backgroundColor: 'transparent' },
  playerWrapper: { position: 'absolute', left: width / 2 - 18, top: height / 2 - 18, zIndex: 10, alignItems: 'center' },
  loot: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  deathBox: { position: 'absolute', alignItems: 'center' },
  deathBoxLabel: { color: '#FFD700', fontSize: 9, fontWeight: '700', marginTop: 2 },
  otherPlayer: { position: 'absolute', alignItems: 'center' },
  otherPlayerName: { color: '#FFF', fontSize: 9, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 3 },
  otherPlayerHpBar: { width: 30, height: 3, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  otherPlayerHpFill: { height: '100%', backgroundColor: '#22C55E' },
  landmark: { position: 'absolute', alignItems: 'center' },
  landmarkText: { color: 'white', fontWeight: 'bold', fontSize: 11, textShadowColor: 'black', textShadowRadius: 4, marginTop: 4, letterSpacing: 1 },

  // Damage overlay
  damageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,0,0,0.3)', zIndex: 50 },

  // Bus Phase
  busOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,8,15,0.92)', zIndex: 1000, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 30 },
  busHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busTitle: { color: '#FF6B1A', fontSize: 26, fontWeight: '900', letterSpacing: 3 },
  busSubtitle: { color: '#9CA3AF', fontSize: 14 },
  busMap: { width: 220, height: 220, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#FF6B1A' },
  busMapBg: { width: 200, height: 200, margin: 8, backgroundColor: 'rgba(232,119,34,0.3)', position: 'relative' },
  busPoi: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  busIcon: { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  busPlayers: { color: '#9CA3AF', fontSize: 13 },
  jumpButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FF6B1A', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 16, marginTop: 8 },
  jumpText: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 4 },

  // Drop Phase
  dropOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 900, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 30 },
  altitudeContainer: { alignItems: 'center', gap: 6 },
  altLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  altBar: { width: 12, height: 180, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  altFill: { width: '100%', backgroundColor: '#22D3EE', borderRadius: 6 },
  altValue: { color: '#22D3EE', fontSize: 16, fontWeight: '800' },
  dropText: { color: '#FFF', fontSize: 14, fontWeight: '700', position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', letterSpacing: 3 },

  // HUD
  hud: { ...StyleSheet.absoluteFillObject, zIndex: 999, padding: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topBarLeft: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Minimap
  minimap: { width: MINIMAP_SIZE, height: MINIMAP_SIZE, borderRadius: 10, borderWidth: 2, borderColor: '#FF6B1A', overflow: 'hidden' },
  minimapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  minimapStorm: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(0,150,255,0.6)', backgroundColor: 'transparent' },
  miniDot: { position: 'absolute', width: 8, height: 8, backgroundColor: '#FF6B1A', borderRadius: 4, zIndex: 100 },

  // Kill Feed
  killFeed: { position: 'absolute', top: MINIMAP_SIZE + 24, right: 12, gap: 3, alignItems: 'flex-end' },
  killFeedEntry: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, maxWidth: 220 },
  killFeedText: { fontSize: 11 },

  // Status Bars
  statusBars: { position: 'absolute', bottom: 55, left: 12, gap: 3 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barContainer: { width: 120, height: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 5, overflow: 'hidden' },
  overshieldFill: { height: '100%', backgroundColor: '#22D3EE' },
  shieldFill: { height: '100%', backgroundColor: '#3B82F6' },
  healthFill: { height: '100%', backgroundColor: '#22C55E' },
  barValue: { color: '#FFF', fontSize: 10, fontWeight: '700', width: 24, textAlign: 'right' },

  // Weapon Bar
  weaponBar: { position: 'absolute', bottom: 10, left: width / 2 - 135, flexDirection: 'row', gap: 5 },
  weaponSlot: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, borderWidth: 2, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  equippedSlot: { borderColor: '#FF6B1A', backgroundColor: 'rgba(255,107,26,0.15)' },
  weaponSlotLabel: { color: '#CCC', fontSize: 7, fontWeight: '700', marginTop: 1 },
  emptySlotNum: { color: '#555', fontSize: 14, fontWeight: '700' },

  // Context Buttons
  consumableBtn: { position: 'absolute', bottom: 150, right: 22, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(34,197,94,0.25)', borderWidth: 2, borderColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  channelingBar: { position: 'absolute', bottom: 100, left: width / 2 - 80, width: 160, alignItems: 'center', gap: 4 },
  channelingText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  channelTrack: { width: '100%', height: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden' },
  channelFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 3 },
  pickupBtn: { backgroundColor: '#FF6B1A', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', position: 'absolute', bottom: 75, left: width / 2 - 80, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  pickupText: { color: 'white', fontWeight: '900', fontSize: 11 },

  // Fire Button
  fireButton: { position: 'absolute', bottom: 40, right: 20, width: 90, height: 90, backgroundColor: 'rgba(255,107,26,0.7)', borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },

  // Result Overlay
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,8,15,0.93)', zIndex: 2000, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  victoryEmoji: { fontSize: 64 },
  victoryTitle: { color: '#FFD700', fontSize: 32, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  victorySubtitle: { color: '#9CA3AF', fontSize: 15, marginBottom: 16 },
  eliminatedTitle: { color: '#E74C3C', fontSize: 34, fontWeight: '900', letterSpacing: 4 },
  eliminatedPlacement: { color: '#FFF', fontSize: 60, fontWeight: '900' },
  resultStats: { flexDirection: 'row', gap: 24, marginTop: 10, marginBottom: 20 },
  resultStatItem: { alignItems: 'center', gap: 4 },
  resultStatValue: { color: '#FF6B1A', fontSize: 28, fontWeight: '900' },
  resultStatLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  lobbyButton: { backgroundColor: '#FF6B1A', paddingVertical: 16, paddingHorizontal: 44, borderRadius: 14, marginTop: 10 },
  lobbyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});