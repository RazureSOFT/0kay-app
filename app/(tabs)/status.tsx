import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Row, Button, Badge } from '../../src/components/ui';
import { StatusPanel } from '../../src/components/StatusPanel';
import { useLife } from '../../src/store/life';
import { useTasks } from '../../src/store/tasks';
import { life } from '../../src/api/endpoints';
import { theme } from '../../src/theme';

const PERMS: { key: string; label: string }[] = [
  { key: 'screen_watch', label: '屏幕观察' },
  { key: 'computer_use', label: '计算机操作' },
  { key: 'report_agent_host', label: '上报主机状态' },
];

export default function StatusScreen() {
  const refresh = useLife((s) => s.refresh);
  const { agentRows, loadAgents } = useTasks();
  const [perms, setPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refresh();
    loadAgents();
    life.permissions().then(setPerms).catch(() => {});
  }, []);

  const toggle = async (key: string, value: boolean) => {
    const next = { ...perms, [key]: value };
    setPerms(next);
    try {
      await life.setPermissions(next);
    } catch {
      setPerms(perms);
    }
  };

  return (
    <Screen>
      <Header title="状态" right={<Button title="刷新" variant="ghost" onPress={() => { refresh(); loadAgents(); }} />} />
      <Scroll>
        <StatusPanel />

        <Card>
          <Text style={styles.cardTitle}>权限</Text>
          {PERMS.map((p) => (
            <Row
              key={p.key}
              label={p.label}
              value={<Switch value={!!perms[p.key]} onValueChange={(v) => toggle(p.key, v)} trackColor={{ true: theme.colors.primary, false: '#333' }} />}
            />
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Agents</Text>
          {agentRows.length ? (
            agentRows.map((a) => (
              <Row
                key={a.plugin_id || a.name}
                label={a.name}
                value={
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {a.version ? <Text style={styles.dim}>{a.version}</Text> : null}
                    <Badge text={a.status || 'unknown'} color={a.status === 'PLUGIN_STATUS_HEALTHY' ? theme.colors.success : theme.colors.warn} />
                  </View>
                }
              />
            ))
          ) : (
            <Text style={styles.dim}>暂无 Agent</Text>
          )}
        </Card>
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700', marginBottom: 6 },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small },
});
