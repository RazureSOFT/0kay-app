import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Header, Scroll, Card, Button, Input, Spinner } from '../../src/components/ui';
import { FieldEditor } from '../../src/components/FieldEditor';
import { providers as providersApi } from '../../src/api/endpoints';
import { useProviders } from '../../src/store/providers';
import { theme } from '../../src/theme';
import type { Provider } from '../../src/api/types';

const PRESETS = ['openai', 'anthropic', 'deepseek', 'kimi', 'xai', 'custom'];

function modelIds(models: any[] | undefined): string[] {
  return (models || []).map((m) => (typeof m === 'string' ? m : m.id)).filter(Boolean);
}

export default function ProviderEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const store = useProviders();
  const [p, setP] = useState<Provider>({ id: '', provider: 'openai', name: '', base_url: '', api_key: '', models: [], disabled_models: [], enabled: true, format: '' });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [source, setSource] = useState('');

  useEffect(() => {
    if (isNew) return;
    (async () => {
      if (!store.providers.length) await store.load();
      const found = useProviders.getState().providers.find((x) => x.id === id);
      if (found) setP({ ...found, api_key: '' });
      setLoading(false);
    })();
  }, [id]);

  const set = (patch: Partial<Provider>) => setP((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await store.upsert({ ...p, id: p.id || undefined as any });
      Alert.alert('已保存');
      router.back();
    } catch (e: any) {
      Alert.alert('保存失败', e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('删除供应商', '确定删除？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await store.remove(p.id); router.back(); } },
    ]);
  };

  const fetchModels = async () => {
    setFetching(true);
    try {
      const res = await providersApi.fetchModels({ id: p.id || undefined, provider: p.provider, base_url: p.base_url, api_key: p.api_key || undefined, format: p.format || undefined });
      set({ models: modelIds(res.models) });
      setSource(res.source || '');
      if (res.error) Alert.alert('提示', `使用 ${res.source} 列表：${res.error}`);
    } catch (e: any) {
      Alert.alert('获取失败', e.message);
    } finally {
      setFetching(false);
    }
  };

  const toggleModel = (m: string) => {
    const disabled = new Set(p.disabled_models || []);
    if (disabled.has(m)) disabled.delete(m);
    else disabled.add(m);
    set({ disabled_models: [...disabled] });
  };

  if (loading) {
    return (
      <Screen>
        <Header title="供应商" showBack />
        <Spinner />
      </Screen>
    );
  }

  const models = modelIds(p.models);

  return (
    <Screen>
      <Header title={isNew ? '新增供应商' : p.name || p.provider} showBack />
      <Scroll>
        <Card>
          <Text style={styles.label}>预设</Text>
          <View style={styles.presets}>
            {PRESETS.map((pre) => (
              <Pressable key={pre} onPress={() => set({ provider: pre })} style={[styles.preset, p.provider === pre && styles.presetActive]}>
                <Text style={[styles.presetText, p.provider === pre && { color: '#fff' }]}>{pre}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Input label="名称" value={p.name || ''} onChangeText={(v) => set({ name: v })} placeholder="显示名称" />
          <Input label="Base URL" value={p.base_url || ''} onChangeText={(v) => set({ base_url: v })} autoCapitalize="none" placeholder="https://api.openai.com/v1" />
          <Input label="API Key" value={p.api_key || ''} onChangeText={(v) => set({ api_key: v })} secureTextEntry placeholder={p.api_key_masked || '留空则保留已存密钥'} />
          <FieldEditor
            field={{ key: 'format', label: '协议格式', type: 'select', options: [ { value: '', label: '自动' }, { value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' } ] }}
            value={p.format || ''}
            modelIds={[]}
            onChange={(v) => set({ format: v })}
          />
          <FieldEditor
            field={{ key: 'default_model', label: '默认模型', type: 'model' }}
            value={p.default_model || ''}
            modelIds={models}
            onChange={(v) => set({ default_model: v })}
          />
          <View style={styles.boolRow}>
            <Text style={styles.label}>启用</Text>
            <Switch value={p.enabled !== false} onValueChange={(v) => set({ enabled: v })} trackColor={{ true: theme.colors.primary, false: '#333' }} />
          </View>
          <Button title={fetching ? '获取中…' : '获取模型列表'} variant="subtle" onPress={fetchModels} loading={fetching} />
          {source ? <Text style={styles.dim}>来源：{source}</Text> : null}
        </Card>

        {models.length ? (
          <Card>
            <Text style={styles.label}>模型（点击启用/停用）</Text>
            {models.map((m) => {
              const disabled = (p.disabled_models || []).includes(m);
              return (
                <Pressable key={m} style={styles.modelRow} onPress={() => toggleModel(m)}>
                  <Text style={[styles.modelText, disabled && { color: theme.colors.textFaint, textDecorationLine: 'line-through' }]}>{m}</Text>
                  {p.default_model === m ? <Text style={styles.defaultTag}>默认</Text> : null}
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        <Button title="保存" onPress={save} loading={saving} />
        {!isNew ? <Button title="删除" variant="danger" onPress={remove} style={{ marginTop: 10 }} /> : null}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.text, fontSize: theme.font.body, marginBottom: 8 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.radius.pill, backgroundColor: theme.colors.bgAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  presetActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  presetText: { color: theme.colors.textDim, fontSize: theme.font.small },
  boolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 8 },
  modelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  modelText: { color: theme.colors.text, fontSize: theme.font.small, flex: 1 },
  defaultTag: { color: theme.colors.success, fontSize: 11, fontWeight: '700' },
});
