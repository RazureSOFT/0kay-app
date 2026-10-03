import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen, Header, Scroll, Card, Button, Spinner, Empty } from '../src/components/ui';
import { agents } from '../src/api/endpoints';
import { theme } from '../src/theme';
import type { ApprovalRow, QuestionRow } from '../src/api/types';

export default function InboxScreen() {
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const res = await agents.inbox();
      setApprovals(res.approvals || []);
      setQuestions(res.questions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <Screen>
      <Header title="审批与提问" showBack right={<Button title="刷新" variant="ghost" onPress={load} />} />
      <Scroll>
        {loading ? (
          <Spinner />
        ) : !approvals.length && !questions.length ? (
          <Empty text="暂无待处理项" icon="checkmark-done-outline" />
        ) : null}

        {approvals.map((a) => (
          <Card key={a.id} style={{ borderColor: theme.colors.warn }}>
            <Text style={styles.tool}>需要审批 · {a.tool || a.id}</Text>
            <Text style={styles.detail}>{a.detail}</Text>
            <View style={styles.actions}>
              <Button title="允许" style={{ flex: 1 }} onPress={async () => { await agents.approval({ id: a.id, executor_id: a.executor_id, allow: true }).catch(() => {}); load(); }} />
              <Button title="拒绝" variant="danger" style={{ flex: 1 }} onPress={async () => { await agents.approval({ id: a.id, executor_id: a.executor_id, allow: false }).catch(() => {}); load(); }} />
            </View>
          </Card>
        ))}

        {questions.map((q) => (
          <Card key={q.id} style={{ borderColor: theme.colors.primary }}>
            <Text style={styles.tool}>Agent 提问</Text>
            <Text style={styles.detail}>{q.question || q.text}</Text>
            <TextInput
              value={answers[q.id] || ''}
              onChangeText={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
              placeholder="输入回答…"
              placeholderTextColor={theme.colors.textFaint}
              style={styles.input}
              multiline
            />
            <Button
              title="提交"
              onPress={async () => {
                await agents.answer({ id: q.id, executor_id: q.executor_id, answer: answers[q.id] || '' }).catch(() => {});
                setAnswers((p) => ({ ...p, [q.id]: '' }));
                load();
              }}
            />
          </Card>
        ))}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tool: { color: theme.colors.warn, fontWeight: '700', marginBottom: 6 },
  detail: { color: theme.colors.text, fontSize: theme.font.small, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    padding: 10,
    minHeight: 60,
    marginBottom: 10,
  },
});
