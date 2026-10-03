import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen, Header, Scroll, Card, Button, Spinner, Empty } from '../src/components/ui';
import { life } from '../src/api/endpoints';
import { theme } from '../src/theme';
import type { MemoryRow } from '../src/api/types';

export default function MemoryScreen() {
  const [rows, setRows] = useState<MemoryRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const res = await life.memories(60, q);
      setRows(res.memories || []);
      setStats(res.stats || null);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = (id: string) =>
    Alert.alert('删除记忆', '确定删除这条记忆？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await life.companionAction('delete_memory', { id }).catch(() => {}); load(query); } },
    ]);

  return (
    <Screen>
      <Header title="记忆" showBack />
      <Scroll>
        {stats ? (
          <Card>
            <Text style={styles.stats}>
              共 {stats.total ?? rows.length} 条 · 短期 {stats.short_term ?? stats.shortTerm ?? '—'} · 长期 {stats.long_term ?? stats.longTerm ?? '—'}
            </Text>
          </Card>
        ) : null}

        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(query)}
          placeholder="搜索记忆…"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.search}
          returnKeyType="search"
        />
        <Button title="搜索" variant="subtle" onPress={() => load(query)} style={{ marginBottom: 12 }} />

        {loading ? (
          <Spinner />
        ) : rows.length ? (
          rows.map((m) => (
            <Card key={m.id}>
              <Text style={styles.text}>{m.text || m.content || JSON.stringify(m)}</Text>
              <View style={styles.meta}>
                <Text style={styles.dim}>
                  {m.tier || 'memory'} {typeof m.importance === 'number' ? `· 重要度 ${m.importance.toFixed(2)}` : ''}
                </Text>
                <Button title="删除" variant="ghost" onPress={() => remove(m.id)} />
              </View>
            </Card>
          ))
        ) : (
          <Empty text="暂无记忆" icon="library-outline" />
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { color: theme.colors.text, fontSize: theme.font.small },
  search: {
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  text: { color: theme.colors.text, fontSize: theme.font.body, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small },
});
