import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen, Header, Scroll, Card, Row, Button, Input, Spinner, Empty } from '../src/components/ui';
import { skills as skillsApi } from '../src/api/endpoints';
import { theme } from '../src/theme';

export default function SkillsScreen() {
  const [list, setList] = useState<any[]>([]);
  const [dir, setDir] = useState('');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await skillsApi.list();
      setList(res.result?.skills || []);
      setDir(res.result?.dir || '');
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!name.trim() || !content.trim()) return;
    try {
      await skillsApi.save(name.trim(), content);
      setEditing(false);
      setName('');
      setContent('');
      load();
    } catch (e: any) {
      Alert.alert('保存失败', e.message);
    }
  };

  const remove = (n: string) =>
    Alert.alert('删除技能', `删除 ${n}？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await skillsApi.remove(n).catch(() => {}); load(); } },
    ]);

  return (
    <Screen>
      <Header title="技能" subtitle={dir} showBack right={<Button title={editing ? '取消' : '新建'} variant="ghost" onPress={() => setEditing((v) => !v)} />} />
      <Scroll>
        {editing ? (
          <Card>
            <Input label="名称" value={name} onChangeText={setName} placeholder="skill-name" autoCapitalize="none" />
            <Text style={styles.label}>内容（Markdown）</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={'# skill-name\ntags: a b c\n\n一句话描述\n\n1. 步骤…'}
              placeholderTextColor={theme.colors.textFaint}
              style={styles.textarea}
              multiline
            />
            <Button title="保存技能" onPress={save} />
          </Card>
        ) : null}

        {loading ? (
          <Spinner />
        ) : list.length ? (
          <Card style={{ padding: 0 }}>
            {list.map((s, i) => {
              const n = s.name || s.id || `skill_${i}`;
              return (
                <Row
                  key={n}
                  label={n}
                  value={s.description || s.tags?.join?.(', ') || ''}
                  right={<Button title="删除" variant="ghost" onPress={() => remove(n)} />}
                />
              );
            })}
          </Card>
        ) : (
          <Empty text="暂无技能" icon="construct-outline" />
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.textDim, fontSize: theme.font.small, marginBottom: 6 },
  textarea: {
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: 12,
    minHeight: 160,
    textAlignVertical: 'top',
    marginBottom: 12,
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
