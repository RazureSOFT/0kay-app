import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Scroll, Card, Row, Button, Badge, Empty } from '../../src/components/ui';
import { useTasks } from '../../src/store/tasks';
import { theme } from '../../src/theme';
import type { TaskRow } from '../../src/api/types';

function stateColor(state?: string) {
  switch (state) {
    case 'running':
      return theme.colors.primary;
    case 'done':
      return theme.colors.success;
    case 'failed':
      return theme.colors.danger;
    case 'cancelled':
      return theme.colors.textFaint;
    default:
      return theme.colors.warn;
  }
}

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, sessions, loadTasks, loadSessions, cancel, createSession } = useTasks();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadTasks();
    loadSessions();
    const t = setInterval(() => {
      loadTasks();
      loadSessions();
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const onCreate = async () => {
    const id = await createSession(title.trim() || `会话 ${new Date().toLocaleString()}`);
    setCreating(false);
    setTitle('');
    if (id) router.push(`/session/${encodeURIComponent(id)}`);
  };

  return (
    <Screen>
      <Header
        title="任务与会话"
        right={<Button title="新建" variant="ghost" onPress={() => setCreating((v) => !v)} />}
      />
      <Scroll>
        {creating ? (
          <Card>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="会话标题"
              placeholderTextColor={theme.colors.textFaint}
              style={styles.input}
              autoFocus
            />
            <Button title="创建并打开" onPress={onCreate} icon="add" />
          </Card>
        ) : null}

        <Text style={styles.section}>Agent 会话</Text>
        <Card>
          {sessions.length ? (
            sessions.map((s) => (
              <Row
                key={s.task_id}
                label={s.prompt || s.title || s.task_id}
                value={s.state || 'idle'}
                onPress={() => router.push(`/session/${encodeURIComponent(s.task_id)}`)}
              />
            ))
          ) : (
            <Text style={styles.dim}>暂无会话</Text>
          )}
        </Card>

        <Text style={styles.section}>任务</Text>
        {tasks.length ? (
          tasks.map((t: TaskRow) => (
            <Card key={t.task_id}>
              <View style={styles.taskHead}>
                <Text style={styles.taskTitle} numberOfLines={2}>
                  {t.prompt || t.kind || t.task_id}
                </Text>
                <Badge text={t.state || 'pending'} color={stateColor(t.state)} />
              </View>
              {t.kind ? <Text style={styles.dim}>{t.kind}</Text> : null}
              {t.error ? <Text style={styles.err}>{t.error}</Text> : null}
              {t.state === 'running' || t.state === 'pending' ? (
                <Pressable style={styles.cancel} onPress={() => cancel(t.task_id)}>
                  <Text style={styles.cancelText}>取消任务</Text>
                </Pressable>
              ) : null}
            </Card>
          ))
        ) : (
          <Empty text="暂无任务" icon="list-outline" />
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.colors.textDim, fontSize: theme.font.small, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  taskHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  taskTitle: { color: theme.colors.text, fontSize: theme.font.body, flex: 1, fontWeight: '600' },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 4 },
  err: { color: theme.colors.danger, fontSize: theme.font.small, marginTop: 4 },
  cancel: { alignSelf: 'flex-start', marginTop: 8 },
  cancelText: { color: theme.colors.danger, fontSize: theme.font.small, fontWeight: '600' },
});
