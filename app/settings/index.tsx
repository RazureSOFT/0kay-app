import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Scroll, Card, Row, Button, Empty } from '../../src/components/ui';
import { useSettings } from '../../src/store/settings';
import { theme } from '../../src/theme';

export default function SettingsIndex() {
  const router = useRouter();
  const { sections, load, loading } = useSettings();

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Header title="设置" showBack />
      <Scroll>
        <Card style={{ padding: 0 }}>
          <Row label="模型供应商" onPress={() => router.push('/providers')} />
          <Row label="权限" onPress={() => router.push('/permissions')} />
          <Row label="插件" onPress={() => router.push('/plugins')} />
          <Row label="关于与更新" onPress={() => router.push('/about')} />
        </Card>

        <Text style={styles.section}>插件设置段</Text>
        {sections.length ? (
          <Card style={{ padding: 0 }}>
            {sections.map((s) => (
              <Row
                key={s.id}
                label={s.label || s.id}
                value={s.plugin_name || ''}
                onPress={() => router.push(`/settings/${encodeURIComponent(s.id)}`)}
              />
            ))}
          </Card>
        ) : (
          <Empty text={loading ? '加载中…' : '暂无设置段'} icon="settings-outline" />
        )}

        <Button title="刷新设置段" variant="ghost" onPress={load} />
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.colors.textDim, fontSize: theme.font.small, fontWeight: '700', marginBottom: 8, marginTop: 8 },
});
