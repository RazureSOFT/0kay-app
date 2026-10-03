import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLife, emotionMood } from '../store/life';
import { theme } from '../theme';
import { Card } from './ui';

function Bar({ label, value, color, min = 0, max = 1 }: { label: string; value: number; color: string; min?: number; max?: number }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barVal}>{value.toFixed(2)}</Text>
    </View>
  );
}

export function StatusPanel() {
  const { state, isConnected } = useLife();
  const e = state.emotion;
  const mood = emotionMood(e, state.isSleeping);
  const energy = state.mentalEnergy ?? 100;

  return (
    <View>
      <Card>
        <View style={styles.head}>
          <Text style={styles.title}>状态</Text>
          <View style={[styles.dot, { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }]} />
          <Text style={styles.conn}>{isConnected ? '已连接' : '离线'}</Text>
        </View>
        <View style={styles.moodWrap}>
          <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          {state.isSleeping ? <Text style={styles.sleep}>休眠中</Text> : null}
        </View>
        <Bar label="精神能量" value={energy} min={0} max={100} color={theme.colors.primary} />
        {e ? (
          <>
            <Bar label="好感 (valence)" value={e.valence} min={-1} max={1} color={theme.colors.success} />
            <Bar label="唤醒 (arousal)" value={e.arousal} color={theme.colors.warn} />
            <Bar label="连接 (connection)" value={e.connection} color={theme.colors.accent} />
            <Bar label="烦躁 (irritation)" value={e.irritation} color={theme.colors.danger} />
          </>
        ) : null}
      </Card>

      <View style={styles.grid}>
        <Stat label="在线 Agent" value={`${state.onlineAgents ?? 0}/${state.totalAgents ?? 0}`} />
        <Stat label="插件" value={`${state.healthyPlugins ?? 0}/${state.pluginCount ?? 0}`} />
        <Stat label="进行中任务" value={String(state.activeTasks?.length ?? 0)} />
        <Stat label="来源" value={state.source || 'core'} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  title: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  conn: { color: theme.colors.textDim, fontSize: theme.font.small },
  moodWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  moodLabel: { fontSize: 22, fontWeight: '800' },
  sleep: { color: theme.colors.textFaint, fontSize: theme.font.small },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  barLabel: { color: theme.colors.textDim, fontSize: 12, width: 128 },
  track: { flex: 1, height: 7, backgroundColor: theme.colors.bgAlt, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  barVal: { color: theme.colors.textFaint, fontSize: 11, width: 38, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 12,
  },
  statVal: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 2 },
});
