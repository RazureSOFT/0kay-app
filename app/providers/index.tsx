import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Scroll, Card, Row, Badge, Button, Empty, ErrorBanner } from '../../src/components/ui';
import { useProviders } from '../../src/store/providers';
import { theme } from '../../src/theme';

export default function ProvidersIndex() {
  const router = useRouter();
  const { providers, defaultProviderId, defaultModel, load, error } = useProviders();

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Header
        title="模型供应商"
        subtitle={defaultModel ? `默认模型：${defaultModel}` : undefined}
        showBack
        right={<Button title="新增" variant="ghost" onPress={() => router.push('/providers/new')} />}
      />
      <Scroll>
        <ErrorBanner message={error} onRetry={load} />
        {providers.length ? (
          providers.map((p) => (
            <Card key={p.id}>
              <Row
                style={{ borderBottomWidth: 0 }}
                label={
                  <View>
                    <Text style={styles.name}>{p.name || p.provider}</Text>
                    <Text style={styles.dim}>{p.base_url || '默认端点'}</Text>
                  </View>
                }
                value={
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {p.id === defaultProviderId ? <Badge text="默认" color={theme.colors.success} /> : null}
                    {p.enabled === false ? <Badge text="停用" color={theme.colors.textFaint} /> : null}
                  </View>
                }
                onPress={() => router.push(`/providers/${encodeURIComponent(p.id)}`)}
              />
              <Text style={styles.dim}>
                {p.api_key_masked || (p.api_key ? '已设置密钥' : '未设置密钥')} · {p.models?.length || 0} 个模型
              </Text>
            </Card>
          ))
        ) : (
          <Empty text="暂无供应商" icon="cloud-outline" />
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: theme.colors.text, fontSize: theme.font.body, fontWeight: '600' },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 4 },
});
