import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Header, Scroll, Card, Button, Spinner, ErrorBanner } from '../../src/components/ui';
import { FieldEditor } from '../../src/components/FieldEditor';
import { settings as settingsApi } from '../../src/api/endpoints';
import { useProviders } from '../../src/store/providers';
import { theme } from '../../src/theme';
import type { SettingsSection } from '../../src/api/types';

export default function SettingsSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sectionId = decodeURIComponent(String(id));
  const [section, setSection] = useState<SettingsSection | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const allModelIds = useProviders((s) => s.allModelIds);
  const loadModels = useProviders((s) => s.loadModels);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await settingsApi.get(sectionId);
      setSection(res.section);
      setValues(res.values || res.section?.values || {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadModels();
  }, [sectionId]);

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.save(sectionId, values);
      Alert.alert('已保存', '设置已更新。');
    } catch (e: any) {
      Alert.alert('保存失败', e.message);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    try {
      await settingsApi.test(sectionId);
      Alert.alert('测试成功', '已获取到测试音频。');
    } catch (e: any) {
      Alert.alert('测试失败', e.message);
    }
  };

  return (
    <Screen>
      <Header title={section?.label || sectionId} subtitle={section?.description} showBack />
      <Scroll>
        <ErrorBanner message={error} onRetry={load} />
        {loading ? (
          <Spinner label="加载中…" />
        ) : section?.fields?.length ? (
          <>
            <Card>
              {section.fields.map((f) => (
                <FieldEditor
                  key={f.key}
                  field={f}
                  value={values[f.key]}
                  modelIds={allModelIds}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                />
              ))}
            </Card>
            <View style={styles.actions}>
              <Button title="保存" onPress={save} loading={saving} style={{ flex: 1 }} />
              {section.fields.some((f) => f.type === 'test') ? <Button title="测试" variant="subtle" onPress={test} /> : null}
            </View>
          </>
        ) : (
          <>
            <Card>
              <Text style={styles.dim}>该设置段没有可编辑字段。</Text>
            </Card>
            <Button title="测试" variant="subtle" onPress={test} />
          </>
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small },
});
