import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, Empty } from '../../src/components/ui';
import { Markdown } from '../../src/components/Markdown';
import { agents } from '../../src/api/endpoints';
import { theme } from '../../src/theme';
import type { ApprovalRow, QuestionRow, TaskRow } from '../../src/api/types';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = decodeURIComponent(String(id));
  const [turns, setTurns] = useState<TaskRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [answer, setAnswer] = useState('');
  const scrollRef = useRef<any>(null);

  const load = async () => {
    try {
      const res = await agents.turns(sessionId);
      setTurns(res.tasks || []);
      const inbox = await agents.inbox(sessionId);
      setApprovals(inbox.approvals || []);
      setQuestions(inbox.questions || []);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [sessionId]);

  const send = async () => {
    const prompt = text.trim();
    if (!prompt) return;
    setSending(true);
    setText('');
    try {
      await agents.send({ session_id: sessionId, prompt, agent_type: 'code', permission_mode: 'normal' });
      await load();
    } catch (e: any) {
      setTurns((t) => [...t, { task_id: `err_${Date.now()}`, prompt: '（发送失败）', state: 'failed', error: e.message }]);
    } finally {
      setSending(false);
    }
  };

  const running = turns.some((t) => t.state === 'running' || t.state === 'pending');

  return (
    <Screen>
      <Header title="Agent 会话" subtitle={running ? '运行中…' : sessionId} showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 12 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {approvals.map((a) => (
            <Card key={a.id} style={{ borderColor: theme.colors.warn }}>
              <Text style={styles.approveTitle}>需要审批：{a.tool || a.id}</Text>
              <Text style={styles.detail}>{a.detail}</Text>
              <View style={styles.actions}>
                <Button title="允许" onPress={async () => { await agents.approval({ id: a.id, executor_id: a.executor_id, allow: true }); load(); }} style={{ flex: 1 }} />
                <Button title="拒绝" variant="danger" onPress={async () => { await agents.approval({ id: a.id, executor_id: a.executor_id, allow: false }); load(); }} style={{ flex: 1 }} />
              </View>
            </Card>
          ))}

          {questions.map((q) => (
            <Card key={q.id} style={{ borderColor: theme.colors.primary }}>
              <Text style={styles.approveTitle}>提问</Text>
              <Text style={styles.detail}>{q.question || q.text}</Text>
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                placeholder="回答…"
                placeholderTextColor={theme.colors.textFaint}
                style={styles.input}
              />
              <Button title="提交回答" onPress={async () => { await agents.answer({ id: q.id, executor_id: q.executor_id, answer }); setAnswer(''); load(); }} />
            </Card>
          ))}

          {turns.length ? (
            turns.map((t) => (
              <View key={t.task_id} style={{ marginBottom: 14 }}>
                {t.prompt ? (
                  <View style={[styles.bubble, styles.user]}>
                    <Text style={styles.userText}>{t.prompt}</Text>
                  </View>
                ) : null}
                <View style={[styles.bubble, styles.bot]}>
                  {t.state === 'running' || t.state === 'pending' ? (
                    <View style={styles.rowCenter}>
                      <ActivityIndicator color={theme.colors.primary} size="small" />
                      <Text style={styles.dim}>运行中…</Text>
                    </View>
                  ) : t.error ? (
                    <Text style={styles.err}>{t.error}</Text>
                  ) : (
                    <Markdown text={t.result || '（无输出）'} />
                  )}
                </View>
              </View>
            ))
          ) : (
            <Empty text="发送一条指令开始" icon="terminal-outline" />
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="给 Agent 的指令…"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            multiline
          />
          <Pressable style={styles.send} onPress={send} disabled={sending || running}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-up" size={18} color={running ? theme.colors.textFaint : '#fff'} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  approveTitle: { color: theme.colors.warn, fontWeight: '700', marginBottom: 6 },
  detail: { color: theme.colors.text, fontSize: theme.font.small, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  bubble: { borderRadius: theme.radius.lg, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  user: { backgroundColor: theme.colors.user, alignSelf: 'flex-end', maxWidth: '90%', marginBottom: 6 },
  userText: { color: theme.colors.text },
  bot: { backgroundColor: theme.colors.assistant, maxWidth: '95%' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small },
  err: { color: theme.colors.danger, fontSize: theme.font.small },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bgAlt,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxHeight: 120,
  },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
});
