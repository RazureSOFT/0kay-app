import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Row, Badge, Button, Spinner, ErrorBanner } from '../src/components/ui';
import { plugins as pluginsApi } from '../src/api/endpoints';
import { theme } from '../src/theme';
import type { PluginRow } from '../src/api/types';

export default function PluginsScreen() {
  const [rows, setRows] = useState<PluginRow[]>([]);
  const [installed, setInstalled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [list, pm] = await Promise.all([
        pluginsApi.list(),
        pluginsApi.pmInstalled().catch(() => ({ packages: [] })),
      ]);
      setRows(Array.isArray(list) ? list : []);
      const pkgs = (pm as any).packages || (pm as any).installed || [];
      setInstalled(Array.isArray(pkgs) ? pkgs : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (name: string, enabled: boolean) => {
    setRows((r) => r.map((x) => (x.name === name ? { ...x, disabled: !enabled } : x)));
    try {
      await pluginsApi.setEnabled(name, enabled);
    } catch (e: any) {
      Alert.alert('操作失败', e.message);
      load();
    }
  };

  const uninstall = (pkg: any) => {
    const name = pkg.name || pkg.package;
    Alert.alert('卸载组件', `确定卸载 ${name}？`, [
      { text: '取消', style: 'cancel' },
      { text: '卸载', style: 'destructive', onPress: async () => { await pluginsApi.pmUninstall(name).catch(() => {}); load(); } },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <Header title="插件" showBack />
        <Spinner />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="插件" showBack right={<Button title="刷新" variant="ghost" onPress={load} />} />
      <Scroll>
        <ErrorBanner message={error} onRetry={load} />
        <Text style={styles.section}>运行时插件</Text>
        <Card style={{ padding: 0 }}>
          {rows.map((r) => (
            <Row
              key={r.plugin_id || r.name}
              label={
                <View>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.dim}>{r.version || ''} {r.capabilities?.length ? '· ' + r.capabilities.join(', ') : ''}</Text>
                </View>
              }
              value={
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {r.status ? <Badge text={r.status.replace('PLUGIN_STATUS_', '')} color={r.status.includes('HEALTHY') ? theme.colors.success : theme.colors.textFaint} /> : null}
                  <Switch value={!r.disabled} onValueChange={(v) => toggle(r.name, v)} trackColor={{ true: theme.colors.primary, false: '#333' }} />
                </View>
              }
            />
          ))}
        </Card>

        <Text style={styles.section}>已安装组件（0kay-pm）</Text>
        <Card style={{ padding: 0 }}>
          {installed.length ? (
            installed.map((pkg, i) => (
              <Row
                key={pkg.name || i}
                label={pkg.name || pkg.package || String(i)}
                value={pkg.version || ''}
                onPress={() => uninstall(pkg)}
              />
            ))
          ) : (
            <Row label={<Text style={styles.dim}>无</Text>} />
          )}
        </Card>
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.colors.textDim, fontSize: theme.font.small, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  name: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '600' },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 2 },
});
