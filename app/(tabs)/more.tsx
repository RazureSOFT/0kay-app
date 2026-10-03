import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Scroll, Card, Row } from '../../src/components/ui';
import { useServer } from '../../src/store/server';
import { theme } from '../../src/theme';

const ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { label: '扫码连接', icon: 'qr-code-outline', route: '/scan' },
  { label: '设置', icon: 'settings-outline', route: '/settings' },
  { label: '模型供应商', icon: 'cloud-outline', route: '/providers' },
  { label: '插件', icon: 'extension-puzzle-outline', route: '/plugins' },
  { label: '审批与提问', icon: 'checkmark-done-outline', route: '/inbox' },
  { label: '通知', icon: 'notifications-outline', route: '/notifications' },
  { label: '记忆', icon: 'library-outline', route: '/memory' },
  { label: '伙伴快照', icon: 'heart-outline', route: '/companion' },
  { label: '技能', icon: 'construct-outline', route: '/skills' },
  { label: '权限', icon: 'shield-outline', route: '/permissions' },
  { label: '用量', icon: 'stats-chart-outline', route: '/usage' },
  { label: '关于与更新', icon: 'information-circle-outline', route: '/about' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { baseUrl, coreId, token, disconnect } = useServer();

  return (
    <Screen>
      <Header title="更多" />
      <Scroll>
        <Card>
          <Text style={styles.name}>0KAY</Text>
          <Text style={styles.dim}>{baseUrl || '未连接'}</Text>
          {coreId ? <Text style={styles.dim}>Core: {coreId}</Text> : null}
          <Text style={styles.dim}>{token ? '已使用 Token 认证' : '未设置 Token（可信网络/回环）'}</Text>
        </Card>

        <Card style={{ padding: 0 }}>
          {ITEMS.map((it) => (
            <Row
              key={it.route}
              label={
                <View style={styles.rowLabel}>
                  <Ionicons name={it.icon} size={18} color={theme.colors.textDim} />
                  <Text style={styles.rowText}>{it.label}</Text>
                </View>
              }
              onPress={() => router.push(it.route as any)}
            />
          ))}
        </Card>

        <Row
          label={<Text style={{ color: theme.colors.danger, fontWeight: '600' }}>断开连接</Text>}
          onPress={() =>
            Alert.alert('断开连接', '将清除本地保存的 Token 与 PIN。', [
              { text: '取消', style: 'cancel' },
              {
                text: '断开',
                style: 'destructive',
                onPress: async () => {
                  await disconnect();
                  router.replace('/login');
                },
              },
            ])
          }
        />
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800' },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 2 },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { color: theme.colors.text, fontSize: theme.font.body },
});
