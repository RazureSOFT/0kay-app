import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Row, Button, Spinner } from '../src/components/ui';
import { usage as usageApi } from '../src/api/endpoints';
import { theme } from '../src/theme';
import type { Usage } from '../src/api/types';

export default function UsageScreen() {
  const [data, setData] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setData(await usageApi.get());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const clear = () =>
    Alert.alert('清空用量', '确定清空所有用量统计？', [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: async () => { const r = await usageApi.clear().catch(() => null); if (r) setData(r.usage); } },
    ]);

  const byModel = Object.entries(data?.by_model || {}).sort((a, b) => (b[1] as number) - (a[1] as number));
  const byDay = Object.entries(data?.by_day || {}).sort((a, b) => String(b[0]).localeCompare(String(a[0]))).slice(0, 14);
  const maxDay = Math.max(1, ...byDay.map(([, v]) => v as number));

  return (
    <Screen>
      <Header title="用量" showBack right={<Button title="清空" variant="ghost" onPress={clear} />} />
      <Scroll>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Card>
              <Text style={styles.total}>{(data?.total_tokens ?? 0).toLocaleString()}</Text>
              <Text style={styles.dim}>累计 tokens</Text>
            </Card>

            <Card>
              <Text style={styles.title}>按模型</Text>
              {byModel.length ? (
                byModel.map(([m, v]) => (
                  <Row key={m} label={m} value={(v as number).toLocaleString()} />
                ))
              ) : (
                <Text style={styles.dim}>暂无数据</Text>
              )}
            </Card>

            <Card>
              <Text style={styles.title}>按天</Text>
              {byDay.length ? (
                byDay.map(([d, v]) => (
                  <View key={d} style={styles.dayRow}>
                    <Text style={styles.dayLabel}>{d}</Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${((v as number) / maxDay) * 100}%` }]} />
                    </View>
                    <Text style={styles.dayVal}>{(v as number).toLocaleString()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.dim}>暂无数据</Text>
              )}
            </Card>
          </>
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { color: theme.colors.text, fontSize: 34, fontWeight: '900' },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 4 },
  title: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700', marginBottom: 6 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  dayLabel: { color: theme.colors.textDim, fontSize: 11, width: 84 },
  track: { flex: 1, height: 7, backgroundColor: theme.colors.bgAlt, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: theme.colors.primary, borderRadius: 4 },
  dayVal: { color: theme.colors.textFaint, fontSize: 11, width: 54, textAlign: 'right' },
});
