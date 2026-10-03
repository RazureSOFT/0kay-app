import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Markdown } from './Markdown';
import { theme } from '../theme';
import { emotionMood } from '../store/life';
import type { ChatMessage } from '../api/types';

function thinkText(t: any): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  if (t.raw) return String(t.raw);
  if (t.summary) return String(t.summary);
  const parts: string[] = [];
  if (t.intent) parts.push(`意图：${t.intent}`);
  if (t.strategy) parts.push(`策略：${t.strategy}`);
  return parts.join('\n') || JSON.stringify(t);
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const [showThink, setShowThink] = useState(false);
  const isUser = message.role === 'user';
  const mood = emotionMood(message.emotion);

  return (
    <View style={[styles.wrap, isUser ? styles.wrapUser : styles.wrapBot]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
        {!isUser && message.emotion ? (
          <View style={styles.meta}>
            <Text style={[styles.mood, { color: mood.color }]}>{mood.label}</Text>
            {typeof message.mentalEnergy === 'number' ? (
              <Text style={styles.energy}>能量 {Math.round(message.mentalEnergy)}%</Text>
            ) : null}
          </View>
        ) : null}

        {!isUser && message.thinkSummary ? (
          <Pressable onPress={() => setShowThink((v) => !v)} style={styles.thinkToggle}>
            <Ionicons name={showThink ? 'chevron-down' : 'chevron-forward'} size={14} color={theme.colors.textDim} />
            <Text style={styles.thinkLabel}>思考</Text>
          </Pressable>
        ) : null}
        {showThink && message.thinkSummary ? (
          <View style={styles.thinkBox}>
            <Text style={styles.thinkText}>{thinkText(message.thinkSummary)}</Text>
          </View>
        ) : null}

        {message.content ? <Markdown text={message.content} /> : null}
        {message.streaming && !message.content ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 4 }} /> : null}
        {message.streaming && message.content ? <Text style={styles.cursor}>▍</Text> : null}

        {message.files?.length ? (
          <View style={styles.files}>
            {message.files.map((f, i) => (
              <View key={i} style={styles.fileChip}>
                <Ionicons name="document-outline" size={13} color={theme.colors.textDim} />
                <Text style={styles.fileName} numberOfLines={1}>
                  {f.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {message.error ? (
          <View style={styles.err}>
            <Ionicons name="warning-outline" size={13} color={theme.colors.danger} />
            <Text style={styles.errText}>{message.error}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 5, maxWidth: '92%' },
  wrapUser: { alignSelf: 'flex-end' },
  wrapBot: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  user: { backgroundColor: theme.colors.user },
  bot: { backgroundColor: theme.colors.assistant },
  meta: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  mood: { fontSize: theme.font.tiny, fontWeight: '700' },
  energy: { fontSize: theme.font.tiny, color: theme.colors.textFaint },
  thinkToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  thinkLabel: { color: theme.colors.textDim, fontSize: theme.font.tiny },
  thinkBox: {
    backgroundColor: '#0a0f22',
    borderRadius: theme.radius.sm,
    padding: 8,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  thinkText: { color: theme.colors.textDim, fontSize: 12.5, fontStyle: 'italic' },
  cursor: { color: theme.colors.primary, fontSize: 15 },
  files: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00000033',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 180,
  },
  fileName: { color: theme.colors.textDim, fontSize: 12, flexShrink: 1 },
  err: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  errText: { color: theme.colors.danger, fontSize: 12, flex: 1 },
});
