import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Row, Button, Badge } from '../src/components/ui';
import { system, plugins as pluginsApi } from '../src/api/endpoints';
import { theme } from '../src/theme';

const APP_VERSION = '0.1.0';

export default function AboutScreen() {
  const [health, setHealth] = useState<any>(null);
  const [update, setUpdate] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const loadHealth = () => system.health().then(setHealth).catch(() => setHealth(null));
  const check = () => pluginsApi.pmCheck().then(setUpdate).catch((e) => Alert.alert('检查失败', e.message));

  useEffect(() => {
    loadHealth();
    pluginsApi.updateStatus().then(setUpdateStatus).catch(() => {});
  }, []);

  const apply = (plugin: string, version?: string) =>
    Alert.alert('更新', `更新 ${plugin}${version ? ' @' + version : ''}？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '更新',
        onPress: async () => {
          setBusy(true);
          try {
            await pluginsApi.pmUpdate(plugin, version);
            Alert.alert('已开始更新', '可在状态中查看进度。');
          } catch (e: any) {
            Alert.alert('失败', e.message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <Screen>
      <Header title="关于与更新" showBack />
      <Scroll>
        <Card>
          <Text style={styles.app}>0KAY App</Text>
          <Text style={styles.dim}>版本 {APP_VERSION}</Text>
          <Text style={styles.dim}>React Native + Expo</Text>
        </Card>

        <Card>
          <Text style={styles.title}>Core 健康</Text>
          {health ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Badge text={health.status || 'ok'} color={health.status === 'ok' ? theme.colors.success : theme.colors.warn} />
              <Text style={styles.dim}>
                插件 {health.healthy}/{health.plugins} 健康
              </Text>
            </View>
          ) : (
            <Text style={styles.dim}>无法获取</Text>
          )}
          <Button title="刷新健康" variant="ghost" onPress={loadHealth} style={{ marginTop: 8 }} />
        </Card>

        <Card>
          <Text style={styles.title}>平台更新</Text>
          {update ? (
            <>
              <Row label="当前版本" value={update.current || '—'} style={{ borderBottomWidth: 0, paddingHorizontal: 0 }} />
              <Row label="最新版本" value={update.latest || '—'} style={{ borderBottomWidth: 0, paddingHorizontal: 0 }} />
              {update.has_update ? (
                <Button title={`更新到 ${update.latest}`} onPress={() => apply('core', update.latest)} loading={busy} style={{ marginTop: 8 }} />
              ) : (
                <Badge text="已是最新" color={theme.colors.success} />
              )}
              {update.notes ? <Text style={styles.notes}>{String(update.notes).slice(0, 400)}</Text> : null}
            </>
          ) : (
            <Button title="检查更新" variant="subtle" onPress={check} />
          )}
        </Card>

        {updateStatus ? (
          <Card>
            <Text style={styles.title}>最近更新状态</Text>
            <Text style={styles.dim}>{updateStatus.plugin} · {updateStatus.status}</Text>
            {updateStatus.log ? <Text style={styles.notes}>{String(updateStatus.log).slice(0, 500)}</Text> : null}
          </Card>
        ) : null}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  app: { color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800' },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 2 },
  title: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700', marginBottom: 8 },
  notes: { color: theme.colors.textFaint, fontSize: 12, marginTop: 8, lineHeight: 17 },
});
