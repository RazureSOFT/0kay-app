import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Button, Spinner } from '../src/components/ui';
import { life } from '../src/api/endpoints';
import { theme } from '../src/theme';

function render(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export default function CompanionScreen() {
  const [snap, setSnap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setSnap(await life.companion());
    } catch {
      setSnap(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Header title="伙伴快照" showBack right={<Button title="刷新" variant="ghost" onPress={load} />} />
      <Scroll>
        {loading ? (
          <Spinner />
        ) : snap ? (
          Object.entries(snap).map(([k, v]) => (
            <Card key={k}>
              <Text style={styles.key}>{k}</Text>
              <Text style={styles.val}>{render(v)}</Text>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.val}>L.I.F.E 不可用。</Text>
          </Card>
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  key: { color: theme.colors.primary, fontSize: theme.font.small, fontWeight: '700', marginBottom: 6 },
  val: { color: theme.colors.text, fontSize: 12.5, fontFamily: 'monospace' },
});
