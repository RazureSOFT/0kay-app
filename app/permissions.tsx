import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Row, Button } from '../src/components/ui';
import { life } from '../src/api/endpoints';
import { theme } from '../src/theme';

const KEYS: { key: string; label: string; desc: string }[] = [
  { key: 'screen_watch', label: '屏幕观察', desc: '允许伙伴查看屏幕内容' },
  { key: 'computer_use', label: '计算机操作', desc: '允许直接控制鼠标键盘' },
  { key: 'report_agent_host', label: '上报主机状态', desc: '允许上报 CPU/内存等状态' },
];

export default function PermissionsScreen() {
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const load = () => life.permissions().then(setPerms).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const toggle = (k: string, v: boolean) => setPerms((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await life.setPermissions(perms);
      setPerms(res || perms);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="权限" showBack />
      <Scroll>
        <Card style={{ padding: 0 }}>
          {KEYS.map((k) => (
            <Row
              key={k.key}
              label={
                <View>
                  <Text style={styles.label}>{k.label}</Text>
                  <Text style={styles.desc}>{k.desc}</Text>
                </View>
              }
              value={<Switch value={!!perms[k.key]} onValueChange={(v) => toggle(k.key, v)} trackColor={{ true: theme.colors.primary, false: '#333' }} />}
            />
          ))}
        </Card>
        <Button title="保存" onPress={save} loading={saving} />
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.text, fontSize: theme.font.body },
  desc: { color: theme.colors.textFaint, fontSize: 12, marginTop: 2 },
});
